import os
# Limit multi-threading libraries to 1 thread to prevent OOM/CPU throttling hang in containers
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

# Model path definitions
project_dir = os.path.dirname(os.path.abspath(__file__))

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

        # Check if pre-downloaded model is available
        whisper_path = os.path.join(project_dir, "models", "whisper-tiny")
        if os.path.exists(whisper_path) and os.listdir(whisper_path):
            model_size_or_path = whisper_path
            print(f"[Model] Using pre-downloaded Whisper model at: {whisper_path}")
        else:
            model_size_or_path = model_size
            print(f"[Model] Using online Whisper model: {model_size}")

        cpu_threads = int(os.getenv("WHISPER_CPU_THREADS", "1"))
        print(f"[Model] Loading Whisper '{model_size_or_path}' on '{device}' ({compute_type}) with {cpu_threads} threads...")
        _log_memory("before-whisper")
        try:
            from faster_whisper import WhisperModel
            models["whisper"] = WhisperModel(
                model_size_or_path, 
                device=device, 
                compute_type=compute_type,
                cpu_threads=cpu_threads
            )
            _log_memory("after-whisper")
            print(f"[Model] Whisper '{model_size_or_path}' loaded OK")
        except MemoryError as e:
            _model_load_error = f"Out of memory loading Whisper '{model_size_or_path}': {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
        except Exception as e:
            _model_load_error = f"Failed to load Whisper '{model_size_or_path}': {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
    return models["whisper"]

def get_onnx_embedding_model():
    """Lazily load the ONNX session and tokenizer."""
    global _model_load_error
    if "embedding_onnx" not in models or "tokenizer" not in models:
        embed_path = os.path.join(project_dir, "models", "all-MiniLM-L6-v2")
        onnx_path = os.path.join(embed_path, "onnx", "model.onnx")
        
        if not os.path.exists(onnx_path):
            raise FileNotFoundError(f"ONNX model file not found at {onnx_path}")
            
        print("[Model] Loading ONNX embedding model...")
        _log_memory("before-onnx-embedding")
        try:
            import onnxruntime as ort
            from tokenizers import Tokenizer
            
            # Load tokenizer
            tokenizer = Tokenizer.from_file(os.path.join(embed_path, "tokenizer.json"))
            tokenizer.enable_truncation(max_length=512)
            
            # Configure single thread for ONNX Runtime to prevent thread contention
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = 1
            opts.inter_op_num_threads = 1
            
            # Load ONNX session
            session = ort.InferenceSession(onnx_path, sess_options=opts, providers=["CPUExecutionProvider"])
            
            models["tokenizer"] = tokenizer
            models["embedding_onnx"] = session
            _log_memory("after-onnx-embedding")
            print("[Model] ONNX embedding model loaded successfully")
        except Exception as e:
            _model_load_error = f"Failed to load ONNX embedding model: {e}"
            print(f"[ERROR] {_model_load_error}")
            raise HTTPException(status_code=503, detail=_model_load_error)
            
    return models["tokenizer"], models["embedding_onnx"]

def run_transcription(audio_path: str, language: Optional[str]):
    """Scoped helper function to load and execute Whisper transcription.
    Local variables will go out of scope immediately when this returns."""
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

    segments, info = whisper_model.transcribe(
        audio_path,
        language=whisper_lang,
        beam_size=5,
        vad_filter=True
    )
    segment_list = list(segments)
    return segment_list, info

def run_embedding(text: str) -> list[float]:
    """Scoped helper function to load and execute sentence embedding using ONNX Runtime.
    Local variables will go out of scope immediately when this returns."""
    tokenizer, session = get_onnx_embedding_model()
    
    # Encode text
    encoded = tokenizer.encode(text)
    input_ids = np.array([encoded.ids], dtype=np.int64)
    attention_mask = np.array([encoded.attention_mask], dtype=np.int64)
    token_type_ids = np.array([encoded.type_ids], dtype=np.int64)
    
    # Run session
    outputs = session.run(None, {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "token_type_ids": token_type_ids
    })
    
    token_embeddings = outputs[0]
    
    # Mean Pooling - Take attention mask into account for correct averaging
    input_mask_expanded = np.expand_dims(attention_mask, -1)
    sum_embeddings = np.sum(token_embeddings * input_mask_expanded, 1)
    sum_mask = np.clip(input_mask_expanded.sum(1), a_min=1e-9, a_max=None)
    embedding = sum_embeddings / sum_mask
    
    # Normalize
    norm = np.linalg.norm(embedding, ord=2, axis=-1, keepdims=True)
    normalized_embedding = embedding / np.maximum(norm, 1e-12)
    return normalized_embedding[0].tolist()

def run_similarity(textA: str, textB: str) -> float:
    """Scoped helper function to load and execute sentence similarity comparison.
    Local variables will go out of scope immediately when this returns."""
    embA = run_embedding(textA)
    embB = run_embedding(textB)
    score = float(np.dot(embA, embB))
    return score

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
        total_mb, _ = get_system_memory_info()
        if total_mb < 1000:
            print("[Warmup] Low-memory environment detected (<1GB RAM) — skipping pre-loading warmup to preserve memory.")
            return
    except Exception:
        pass

    try:
        get_whisper_model()
    except Exception as e:
        print(f"[Warmup] Whisper load failed: {e}")
        return  # Don't attempt embedding if Whisper already OOM'd
    try:
        get_onnx_embedding_model()
    except Exception as e:
        print(f"[Warmup] ONNX Embedding load failed: {e}")

@app.get("/status", response_model=HealthResponse)
async def status(background_tasks: BackgroundTasks):
    whisper_loaded = "whisper" in models
    embedding_loaded = "embedding_onnx" in models
    models_loaded = whisper_loaded and embedding_loaded

    try:
        total_mb, _ = get_system_memory_info()
        is_low_mem = total_mb < 1000
    except Exception:
        is_low_mem = False

    # Only schedule background warm-up when no models are loaded at all
    # and we are NOT in a low-memory environment (where we skip pre-loading).
    if not is_low_mem and not whisper_loaded and not embedding_loaded and _model_load_error is None:
        background_tasks.add_task(load_models_if_needed)

    whisper_model_size = os.getenv("WHISPER_MODEL_SIZE", "tiny")
    embedding_model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    if is_low_mem:
        status_str = "error" if _model_load_error else "ok"
        whisper_status = "error" if _model_load_error else "ready (on-demand)"
        embedding_status = "error" if _model_load_error else "ready (on-demand)"
    else:
        status_str = "ok" if models_loaded else ("error" if _model_load_error else "loading")
        whisper_status = whisper_model_size if whisper_loaded else ("error" if _model_load_error else "loading")
        embedding_status = embedding_model_name if embedding_loaded else ("error" if _model_load_error else "loading")

    return HealthResponse(
        status=status_str,
        whisperModel=whisper_status,
        embeddingModel=embedding_status
    )

@app.get("/diagnose")
async def diagnose():
    import os
    import time
    import wave
    import tempfile
    
    project_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(project_dir, "models")
    
    whisper_path = os.path.join(models_dir, "whisper-tiny")
    embed_path = os.path.join(models_dir, "all-MiniLM-L6-v2")
    
    whisper_exists = os.path.exists(whisper_path)
    whisper_files = os.listdir(whisper_path) if whisper_exists else []
    
    embed_exists = os.path.exists(embed_path)
    embed_files = os.listdir(embed_path) if embed_exists else []
    
    whisper_load_ms = None
    whisper_test_ms = None
    whisper_test_result = None
    whisper_error = None
    
    embed_load_ms = None
    embed_test_ms = None
    embed_error = None
    
    # Try loading and testing Whisper
    if whisper_exists:
        whisper_model = None
        try:
            t0 = time.time()
            from faster_whisper import WhisperModel
            whisper_model = WhisperModel(whisper_path, device="cpu", compute_type="int8", cpu_threads=1)
            whisper_load_ms = int((time.time() - t0) * 1000)
            
            # Create a 1-second silent WAV file to test inference
            t1 = time.time()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
                temp_wav_path = f.name
                with wave.open(temp_wav_path, "wb") as wav:
                    wav.setnchannels(1)
                    wav.setsampwidth(2)
                    wav.setframerate(16000)
                    wav.writeframes(b"\x00" * 32000)
            
            try:
                segments, info = whisper_model.transcribe(temp_wav_path, beam_size=1)
                segment_list = list(segments)
                whisper_test_result = f"OK (transcribed {len(segment_list)} segments)"
            finally:
                if os.path.exists(temp_wav_path):
                    os.remove(temp_wav_path)
                    
            whisper_test_ms = int((time.time() - t1) * 1000)
        except Exception as e:
            whisper_error = str(e)
        finally:
            if whisper_model is not None:
                del whisper_model
            gc.collect()
            
    # Try loading and testing embedding using ONNX Runtime
    if embed_exists:
        session = None
        tokenizer = None
        try:
            t0 = time.time()
            import onnxruntime as ort
            from tokenizers import Tokenizer
            
            onnx_file_path = os.path.join(embed_path, "onnx", "model.onnx")
            tokenizer = Tokenizer.from_file(os.path.join(embed_path, "tokenizer.json"))
            tokenizer.enable_truncation(max_length=512)
            
            # Set single thread
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = 1
            opts.inter_op_num_threads = 1
            
            session = ort.InferenceSession(onnx_file_path, sess_options=opts, providers=["CPUExecutionProvider"])
            embed_load_ms = int((time.time() - t0) * 1000)
            
            t1 = time.time()
            encoded = tokenizer.encode("hello world")
            input_ids = np.array([encoded.ids], dtype=np.int64)
            attention_mask = np.array([encoded.attention_mask], dtype=np.int64)
            token_type_ids = np.array([encoded.type_ids], dtype=np.int64)
            
            outputs = session.run(None, {
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "token_type_ids": token_type_ids
            })
            
            token_embeddings = outputs[0]
            input_mask_expanded = np.expand_dims(attention_mask, -1)
            sum_embeddings = np.sum(token_embeddings * input_mask_expanded, 1)
            sum_mask = np.clip(input_mask_expanded.sum(1), a_min=1e-9, a_max=None)
            embedding = sum_embeddings / sum_mask
            norm = np.linalg.norm(embedding, ord=2, axis=-1, keepdims=True)
            normalized_embedding = embedding / np.maximum(norm, 1e-12)
            
            embed_test_ms = int((time.time() - t1) * 1000)
        except Exception as e:
            embed_error = str(e)
        finally:
            if session is not None:
                del session
            if tokenizer is not None:
                del tokenizer
            gc.collect()
            
    total_mb, avail_mb = get_system_memory_info()
    
    return {
        "project_dir": project_dir,
        "models_dir": models_dir,
        "whisper": {
            "exists": whisper_exists,
            "files": whisper_files,
            "load_ms": whisper_load_ms,
            "test_ms": whisper_test_ms,
            "test_result": whisper_test_result,
            "error": whisper_error
        },
        "embedding": {
            "exists": embed_exists,
            "files": embed_files,
            "load_ms": embed_load_ms,
            "test_ms": embed_test_ms,
            "error": embed_error
        },
        "memory": {
            "total_mb": total_mb,
            "avail_mb": avail_mb
        },
        "python_version": sys.version
    }

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
        try:
            segment_list, info = run_transcription(temp_path, language)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
        finally:
            # Unload Whisper model in low-memory container to make space for embedding model
            try:
                total_mb, _ = get_system_memory_info()
                if total_mb < 1000:
                    models.pop("whisper", None)
                    gc.collect()
                    print("[Model] Unloaded Whisper model to free memory")
            except Exception as ex:
                print(f"Error unloading Whisper: {ex}")

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
        
    try:
        embedding_list = run_embedding(text)
    finally:
        # Unload embedding model in low-memory container to free memory
        try:
            total_mb, _ = get_system_memory_info()
            if total_mb < 1000:
                models.pop("embedding_onnx", None)
                models.pop("tokenizer", None)
                gc.collect()
                print("[Model] Unloaded ONNX embedding model to free memory")
        except Exception:
            pass
        
    response = EmbeddingResponse(
        embedding=embedding_list,
        dimensions=len(embedding_list),
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
        
    try:
        score = run_similarity(textA, textB)
    finally:
        # Unload embedding model in low-memory container to free memory
        try:
            total_mb, _ = get_system_memory_info()
            if total_mb < 1000:
                models.pop("embedding_onnx", None)
                models.pop("tokenizer", None)
                gc.collect()
                print("[Model] Unloaded ONNX embedding model to free memory")
        except Exception:
            pass
    
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
    # Run the full transcribe logic (transcribe handles loading and unloading Whisper)
    trans_response = await transcribe(file, language)
    
    embedding_list = None
    if trans_response.transcript:
        try:
            embedding_list = run_embedding(trans_response.transcript)
        finally:
            # Unload embedding model in low-memory container to free memory
            try:
                total_mb, _ = get_system_memory_info()
                if total_mb < 1000:
                    models.pop("embedding_onnx", None)
                    models.pop("tokenizer", None)
                    gc.collect()
                    print("[Model] Unloaded ONNX embedding model to free memory")
            except Exception:
                pass
        
    response_data = trans_response.model_dump()
    response_data["embedding"] = embedding_list
    gc.collect()
    return response_data

