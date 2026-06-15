import os
import time
import tempfile
import numpy as np
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load Whisper model
    model_size = os.getenv("WHISPER_MODEL_SIZE", "small")
    device = os.getenv("WHISPER_DEVICE", "cpu")
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    
    print(f"Loading Whisper model '{model_size}' on '{device}' with compute type '{compute_type}'...")
    models["whisper"] = WhisperModel(model_size, device=device, compute_type=compute_type)
    
    # Load SentenceTransformer model
    embedding_model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/LaBSE")
    print(f"Loading Embedding model '{embedding_model_name}'...")
    models["embedding"] = SentenceTransformer(embedding_model_name)
    
    yield
    # Shutdown: Clear models
    models.clear()

app = FastAPI(title="VoiceCheck Transcription Service", lifespan=lifespan)

# CORS configuration
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health():
    if "whisper" not in models or "embedding" not in models:
        raise HTTPException(status_code=503, detail="Models not loaded yet")
    return HealthResponse(
        status="ok",
        whisperModel=os.getenv("WHISPER_MODEL_SIZE", "small"),
        embeddingModel=os.getenv("EMBEDDING_MODEL", "sentence-transformers/LaBSE")
    )

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Query(None)
):
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
        whisper_model = models.get("whisper")
        if not whisper_model:
            raise HTTPException(status_code=503, detail="Whisper model not loaded")
            
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

@app.post("/embed", response_model=EmbeddingResponse)
async def embed(body: dict):
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    embedding_model = models.get("embedding")
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Embedding model not loaded")
        
    embedding = embedding_model.encode(text, normalize_embeddings=True)
    
    return EmbeddingResponse(
        embedding=embedding.tolist(),
        dimensions=len(embedding),
        model=os.getenv("EMBEDDING_MODEL", "sentence-transformers/LaBSE")
    )

@app.post("/similarity", response_model=SimilarityResponse)
async def similarity(request: SimilarityRequest):
    textA = request.textA.strip()
    textB = request.textB.strip()
    
    if not textA or not textB:
        raise HTTPException(status_code=400, detail="Texts cannot be empty")
        
    embedding_model = models.get("embedding")
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Embedding model not loaded")
        
    embeddings = embedding_model.encode([textA, textB], normalize_embeddings=True)
    
    # cosine similarity is the dot product of the unit-length vectors
    score = float(np.dot(embeddings[0], embeddings[1]))
    
    threshold_str = os.getenv("REPEATED_CONTENT_THRESHOLD", "0.92")
    try:
        threshold = float(threshold_str)
    except ValueError:
        threshold = 0.92
        
    is_repeated = score > threshold
    
    return SimilarityResponse(
        similarityScore=round(score, 4),
        isRepeatedContent=is_repeated
    )

@app.post("/process")
async def process(
    file: UploadFile = File(...),
    language: Optional[str] = Query(None)
):
    # Run the full transcribe logic
    trans_response = await transcribe(file, language)
    
    embedding_list = None
    if trans_response.transcript:
        embedding_model = models.get("embedding")
        if not embedding_model:
            raise HTTPException(status_code=503, detail="Embedding model not loaded")
        embedding = embedding_model.encode(trans_response.transcript, normalize_embeddings=True)
        embedding_list = embedding.tolist()
        
    response_data = trans_response.model_dump()
    response_data["embedding"] = embedding_list
    return response_data
