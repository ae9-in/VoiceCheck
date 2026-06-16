import os
import sys
import time
import tempfile
import gc
import numpy as np
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables first
load_dotenv()

from faster_whisper import WhisperModel
from sentence_transformers import SentenceTransformer
from models.schemas import (
    TranscriptionResponse,
    EmbeddingResponse,
    SimilarityRequest,
    SimilarityResponse,
    HealthResponse
)

# Tracks the last model-load error so endpoints return 503 instead of crashing
_model_load_error: str | None = None

# Global model containers
models = {}

# Language code mapping to frontend display names
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
}

def get_system_memory_info():
    """Return total and available memory in MB, respecting cgroup limits if present."""
    import psutil
    
    # Defaults from psutil (host level)
    total_mb = psutil.virtual_memory().total / 1024 / 1024
    avail_mb = psutil.virtual_memory().available / 1024 / 1024
    
    # Check cgroup limits (container level)
    cgroup_limit = None
    cgroup_usage = None
    
    # cgroups v2
    try:
        if os.path.exists("/sys/fs/cgroup/memory.max"):
            with open("/sys/fs/cgroup/memory.max", "r") as f:
                val = f.read().strip()
                if val != "max":
                    cgroup_limit = int(val)
        if os.path.exists("/sys/fs/cgroup/memory.current"):
            with open("/sys/fs/cgroup/memory.current", "r") as f:
                cgroup_usage = int(f.read().strip())
    except Exception:
        pass
        
    # cgroups v1
    if cgroup_limit is None:
        try:
            if os.path.exists("/sys/fs/cgroup/memory/memory.limit_in_bytes"):
                with open("/sys/fs/cgroup/memory/memory.limit_in_bytes", "r") as f:
                    cgroup_limit = int(f.read().strip())
            if os.path.exists("/sys/fs/cgroup/memory/memory.usage_in_bytes"):
                with open("/sys/fs/cgroup/memory/memory.usage_in_bytes", "r") as f:
                    cgroup_usage = int(f.read().strip())
        except Exception:
            pass
            
    # Ignore limit if it's unreasonably large (e.g. > 100GB, which usually means no limit)
    if cgroup_limit is not None and cgroup_limit < 100 * 1024 * 1024 * 1024:
        cgroup_limit_mb = cgroup_limit / 1024 / 1024
        # If cgroup limit is lower than host total, use cgroup limit
        if cgroup_limit_mb < total_mb:
            total_mb = cgroup_limit_mb
            if cgroup_usage is not None:
                cgroup_usage_mb = cgroup_usage / 1024 / 1024
                avail_mb = max(0.0, total_mb - cgroup_usage_mb)
                
    return total_mb, avail_mb

def _log_memory(label: str):
    """Print current process RSS memory and available system RAM to Render logs for debugging."""
    try:
        import psutil
        proc = psutil.Process(os.getpid())
        rss = proc.memory_info().rss / 1024 / 1024
        _, avail = get_system_memory_info()
        print(f"[Memory/{label}] RSS={rss:.0f}MB  available={avail:.0f}MB")
    except Exception:
        pass

def get_whisper_model():
    global _model_load_error
    if "whisper" not in models:
        model_size = os.getenv("WHISPER_MODEL_SIZE", "tiny")
        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

        # Memory-aware safety guard: Render free tier has 512MB total.
        # Whisper 'small' needs ~500MB alone. If total system/cgroup RAM is under 1GB,
        # we must force 'tiny' (~75MB) to avoid OOM kills.
        try:
            total_mb, avail_mb = get_system_memory_info()
            if total_mb < 1000 and model_size not in ("tiny", "base"):
                print(f"[Model] WARNING: Total container RAM limit is only {total_mb:.0f}MB — "
                      f"forcing Whisper size to 'tiny' (requested '{model_size}') to avoid OOM.")
                model_size = "tiny"
            elif model_size != "tiny" and avail_mb < 400:
                print(f"[Model] WARNING: Only {avail_mb:.0f}MB RAM available — "
                      f"downgrading Whisper from '{model_size}' to 'tiny' to avoid OOM.")
                model_size = "tiny"
        except Exception:
            pass

        print(f"[Model] Loading Whisper '{model_size}' on '{device}' ({compute_type})...")
        _log_memory("before-whisper")
        try:
            models["whisper"] = WhisperModel(model_size, device=device, compute_type=compute_type)
            _log_memory("after-whisper")
            print(f"[Model] Whisper '{model_size}' loaded OK")
        except MemoryError as e:
            _model_load_error = f"Out of memory loading Whisper '{model_size}': {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
        except Exception as e:
            _model_load_error = f"Failed to load Whisper '{model_size}': {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
    return models["whisper"]

def get_embedding_model():
    global _model_load_error
    if "embedding" not in models:
        embedding_model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        print(f"[Model] Loading embedding model '{embedding_model_name}'...")
        _log_memory("before-embedding")
        try:
            models["embedding"] = SentenceTransformer(embedding_model_name)
            _log_memory("after-embedding")
            print(f"[Model] Embedding model '{embedding_model_name}' loaded OK")
        except MemoryError as e:
            _model_load_error = f"Out of memory loading embedding model '{embedding_model_name}': {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
        except Exception as e:
            _model_load_error = f"Failed to load embedding model '{embedding_model_name}': {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
    return models["embedding"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Print memory diagnostics to help diagnose 502s on Render free tier
    try:
        import psutil
        proc = psutil.Process(os.getpid())
        mem_mb = proc.memory_info().rss / 1024 / 1024
        print(f"[Startup] Python {sys.version}")
        print(f"[Startup] Memory at boot: {mem_mb:.1f} MB")
        total_mb, avail_mb = get_system_memory_info()
        print(f"[Startup] System RAM: {total_mb:.0f} MB total, {avail_mb:.0f} MB available")
    except ImportError:
        print("[Startup] psutil not available — skipping memory diagnostics")
    print("[Startup] FastAPI ready. Models will be loaded lazily on demand.")
    yield
    # Shutdown: Clear models
    models.clear()

app = FastAPI(title="VoiceCheck Transcription Service", lifespan=lifespan)

# CORS configuration
# These origins are ALWAYS allowed regardless of the CORS_ORIGINS env var.
# This prevents a stale env var on Render from locking out the production frontend.
_CORS_ALWAYS_ALLOWED = {
    "http://localhost:5173",
    "http://localhost:5174",
    "https://voice-check-rose.vercel.app",
}
# Merge with any extra origins specified in the env var
_cors_env = os.getenv("CORS_ORIGINS", "")
_cors_extra = {o.strip() for o in _cors_env.split(",") if o.strip()}
cors_origins = sorted(_CORS_ALWAYS_ALLOWED | _cors_extra)
print(f"[CORS] Allowed origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_models_if_needed():
    """Called as a BackgroundTask from /status — loads models safely.
    Errors are caught and logged; the process is NOT killed on failure."""
    try:
        get_whisper_model()
    except Exception as e:
        print(f"[Warmup] Whisper load failed: {e}")
        return  # Don't attempt embedding if Whisper already OOM'd
    try:
        get_embedding_model()
    except Exception as e:
        print(f"[Warmup] Embedding load failed: {e}")

@app.get("/status", response_model=HealthResponse)
async def status(background_tasks: BackgroundTasks):
    whisper_loaded = "whisper" in models
    embedding_loaded = "embedding" in models
    models_loaded = whisper_loaded and embedding_loaded

    # Only schedule background warm-up when no models are loaded at all.
    # Avoid re-triggering on every UptimeRobot ping once loading is in progress.
    if not whisper_loaded and not embedding_loaded and _model_load_error is None:
        background_tasks.add_task(load_models_if_needed)

    whisper_model_size = os.getenv("WHISPER_MODEL_SIZE", "tiny")
    embedding_model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    status_str = "ok" if models_loaded else ("error" if _model_load_error else "loading")
    return HealthResponse(
        status=status_str,
        whisperModel=whisper_model_size if whisper_loaded else ("error" if _model_load_error else "loading"),
        embeddingModel=embedding_model_name if embedding_loaded else ("error" if _model_load_error else "loading")
    )

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Query(None)
):
    if _model_load_error:
        raise HTTPException(status_code=503, detail=f"Transcription service unavailable: {_model_load_error}")
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Invalid or empty audio file")
        
    start_time = time.time()
    
    # Read file content to check if it's empty
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Invalid or empty audio file")
        
    # Write content to a temp file
    temp_suffix = os.path.splitext(file.filename)[1] or ".tmp"
    with tempfile.NamedTemporaryFile(delete=False, suffix=temp_suffix) as temp_file:
        temp_path = temp_file.name
        temp_file.write(content)
        
    try:
        whisper_model = get_whisper_model()
            
        whisper_lang = None
        if language:
            lang_lower = language.lower()
            if lang_lower == "english":
                whisper_lang = "en"
            elif lang_lower == "hindi":
                whisper_lang = "hi"
            elif lang_lower == "tamil":
                whisper_lang = "ta"
            elif lang_lower == "telugu":
                whisper_lang = "te"
            elif lang_lower == "kannada":
                whisper_lang = "kn"
            else:
                whisper_lang = lang_lower[:2]

        try:
            segments, info = whisper_model.transcribe(
                temp_path,
                language=whisper_lang,
                beam_size=5,
                vad_filter=True
            )
            segment_list = list(segments)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

        if not segment_list:
            processing_time = int((time.time() - start_time) * 1000)
            return TranscriptionResponse(
                transcript="",
                language=info.language if info else "unknown",
                languageName="Other" if not info else LANGUAGE_NAMES.get(info.language, f"Other ({info.language})"),
                confidence=0.0,
                duration=info.duration if info else 0.0,
                wordCount=0,
                processingTimeMs=processing_time
            )

        transcript_text = " ".join([seg.text.strip() for seg in segment_list]).strip()
        
        if not transcript_text:
            processing_time = int((time.time() - start_time) * 1000)
            return TranscriptionResponse(
                transcript="",
                language=info.language if info else "unknown",
                languageName="Other" if not info else LANGUAGE_NAMES.get(info.language, f"Other ({info.language})"),
                confidence=0.0,
                duration=info.duration if info else 0.0,
                wordCount=0,
                processingTimeMs=processing_time
            )

        # Average logprobs to calculate confidence
        logprobs = [seg.avg_logprob for seg in segment_list if seg.avg_logprob is not None]
        if logprobs:
            avg_logprob = sum(logprobs) / len(logprobs)
            # Map typical avg_logprob range to [0.0, 1.0]
            confidence = max(0.0, min(1.0, 1.0 + (avg_logprob / 5.0)))
        else:
            confidence = 1.0
            
        confidence = round(confidence, 2)
        
        detected_lang = info.language if info else "en"
        lang_name = LANGUAGE_NAMES.get(detected_lang, f"Other ({detected_lang})")
        
        word_count = len(transcript_text.split())
        processing_time = int((time.time() - start_time) * 1000)
        
        return TranscriptionResponse(
            transcript=transcript_text,
            language=detected_lang,
            languageName=lang_name,
            confidence=confidence,
            duration=info.duration if info else 0.0,
            wordCount=word_count,
            processingTimeMs=processing_time
        )
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error removing temp file {temp_path}: {e}")
        gc.collect()

@app.post("/embed", response_model=EmbeddingResponse)
async def embed(body: dict):
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    embedding_model = get_embedding_model()
    embedding = embedding_model.encode(text, normalize_embeddings=True)
    
    response = EmbeddingResponse(
        embedding=embedding.tolist(),
        dimensions=len(embedding),
        model=os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    )
    gc.collect()
    return response

@app.post("/similarity", response_model=SimilarityResponse)
async def similarity(request: SimilarityRequest):
    textA = request.textA.strip()
    textB = request.textB.strip()
    
    if not textA or not textB:
        raise HTTPException(status_code=400, detail="Texts cannot be empty")
        
    embedding_model = get_embedding_model()
    embeddings = embedding_model.encode([textA, textB], normalize_embeddings=True)
    
    # cosine similarity is the dot product of the unit-length vectors
    score = float(np.dot(embeddings[0], embeddings[1]))
    
    threshold_str = os.getenv("REPEATED_CONTENT_THRESHOLD", "0.92")
    try:
        threshold = float(threshold_str)
    except ValueError:
        threshold = 0.92
        
    is_repeated = score > threshold
    
    response = SimilarityResponse(
        similarityScore=round(score, 4),
        isRepeatedContent=is_repeated
    )
    gc.collect()
    return response

@app.post("/process")
async def process(
    file: UploadFile = File(...),
    language: Optional[str] = Query(None)
):
    # Run the full transcribe logic
    trans_response = await transcribe(file, language)
    
    embedding_list = None
    if trans_response.transcript:
        embedding_model = get_embedding_model()
        embedding = embedding_model.encode(trans_response.transcript, normalize_embeddings=True)
        embedding_list = embedding.tolist()
        
    response_data = trans_response.model_dump()
    response_data["embedding"] = embedding_list
    gc.collect()
    return response_data
