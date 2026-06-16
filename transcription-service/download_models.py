import os
import sys

project_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(project_dir, "models")
os.makedirs(models_dir, exist_ok=True)

print("Pre-downloading models for deployment...")
print(f"Target models directory: {models_dir}")

try:
    from faster_whisper import download_model
    whisper_out = os.path.join(models_dir, "whisper-tiny")
    print(f"Downloading Whisper tiny model to {whisper_out}...")
    # This downloads the model files and saves them to the output_dir
    download_model("tiny", output_dir=whisper_out)
    print("Whisper tiny model downloaded successfully.")
except Exception as e:
    print(f"Error downloading Whisper model: {e}")
    sys.exit(1)

try:
    from sentence_transformers import SentenceTransformer
    embed_out = os.path.join(models_dir, "all-MiniLM-L6-v2")
    print(f"Downloading sentence-transformers model to {embed_out}...")
    # Load model from HF and save it to the output folder
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    model.save(embed_out)
    print("Sentence-transformers model downloaded successfully.")
except Exception as e:
    print(f"Error downloading embedding model: {e}")
    sys.exit(1)

print("All models pre-downloaded successfully!")
