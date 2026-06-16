import os
import sys

project_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(project_dir, "models")
os.makedirs(models_dir, exist_ok=True)

print("Pre-downloading models for deployment via huggingface_hub...")
print(f"Target models directory: {models_dir}")

try:
    from huggingface_hub import snapshot_download
except ImportError:
    print("Error: huggingface_hub is not installed. Please run pip install first.")
    sys.exit(1)

try:
    whisper_out = os.path.join(models_dir, "whisper-tiny")
    print(f"Downloading Whisper tiny model to {whisper_out}...")
    snapshot_download(
        repo_id="Systran/faster-whisper-tiny", 
        local_dir=whisper_out
    )
    print("Whisper tiny model downloaded successfully.")
except Exception as e:
    print(f"Error downloading Whisper model: {e}")
    sys.exit(1)

try:
    embed_out = os.path.join(models_dir, "all-MiniLM-L6-v2")
    print(f"Downloading sentence-transformers model to {embed_out}...")
    snapshot_download(
        repo_id="sentence-transformers/all-MiniLM-L6-v2", 
        local_dir=embed_out
    )
    print("Sentence-transformers model downloaded successfully.")
except Exception as e:
    print(f"Error downloading embedding model: {e}")
    sys.exit(1)

print("All models pre-downloaded successfully!")
