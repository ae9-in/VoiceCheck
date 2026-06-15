from pydantic import BaseModel
from typing import Optional, List

class TranscriptionResponse(BaseModel):
    transcript: str
    language: str              # ISO code, e.g. "en", "hi", "ta"
    languageName: str           # Human readable, e.g. "English"
    confidence: float           # 0.0 - 1.0
    duration: float             # seconds
    wordCount: int
    processingTimeMs: int

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    model: str

class SimilarityRequest(BaseModel):
    textA: str
    textB: str

class SimilarityResponse(BaseModel):
    similarityScore: float      # 0.0 - 1.0
    isRepeatedContent: bool      # true if score > threshold

class HealthResponse(BaseModel):
    status: str
    whisperModel: str
    embeddingModel: str
