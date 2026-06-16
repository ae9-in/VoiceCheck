import os
import sys

print("Pre-downloading models for deployment...")

# Force cache directories to be inside the project folder so they are baked into the build slug
project_dir = os.path.dirname(os.path.abspath(__file__))
cache_dir = os.path.join(project_dir, ".cache", "huggingface")
os.environ["HF_HOME"] = cache_dir

print(f"Using cache directory: {cache_dir}")

try:
    from faster_whisper import WhisperModel
    print("Downloading Whisper tiny model...")
    # This downloads the model files and saves them to the HF_HOME cache
    WhisperModel("tiny", device="cpu", compute_type="int8")
    print("Whisper tiny model downloaded successfully.")
except Exception as e:
    print(f"Error downloading Whisper model: {e}")
    sys.exit(1)

try:
    from sentence_transformers import SentenceTransformer
    print("Downloading sentence-transformers model...")
    # This downloads the model files and saves them to the HF_HOME cache
    SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("Sentence-transformers model downloaded successfully.")
except Exception as e:
    print(f"Error downloading embedding model: {e}")
    sys.exit(1)

print("All models pre-downloaded successfully!")
