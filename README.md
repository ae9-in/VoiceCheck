# VoiceCheck Portal

VoiceCheck is a web portal for uploading, transcribing, and running duplicate and similarity checks on candidate voice verification recordings.

---

## Cloudinary Setup

1. **Create an Account**: Create a free account at [cloudinary.com](https://cloudinary.com).
2. **Add Upload Preset**:
   - Log in to your Cloudinary console.
   - Go to **Settings** (gear icon) → **Upload** → **Upload presets** → **Add upload preset**.
3. **Configure the Preset**:
   - **Upload preset name**: Enter a name (e.g., `voicecheck_unsigned`).
   - **Signing Mode**: Set to **Unsigned**.
   - **Folder**: Set to `voicecheck/recordings`.
   - **Resource type**: Set to **Auto** or **Video** (Cloudinary treats audio files as video resources).
   - **Allowed formats**: Specify `mp3, wav, m4a, aac` under allowed formats to prevent non-audio uploads.
   - Click **Save**.
4. **Retrieve Credentials**:
   - Copy your **Cloud Name** (visible on the main dashboard home tab).
   - Copy the exact **Upload Preset Name** you just created.
5. **Configure Environment variables**:
   - Copy `.env.example` to `.env` if you haven't already:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in your Cloudinary values:
     ```env
     VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
     VITE_CLOUDINARY_UPLOAD_PRESET=your_actual_preset_name
     VITE_CLOUDINARY_FOLDER=voicecheck/recordings
     VITE_MAX_FILE_SIZE_MB=50
     ```
6. **Restart Development Servers**:
   - Stop and restart your development server to load the new environment variables:
     ```bash
     npm run dev
     ```

> [!NOTE]
> This integration uses **unsigned uploads**, which are secure for client-side execution since they don't expose your Cloudinary API Secret to the browser. However, they allow anyone who knows the preset name to post assets. It is highly recommended to configure strict file sizes and allowed format constraints directly inside the Cloudinary dashboard preset to protect your account.

---

## Transcription Service Setup

This project includes a self-hosted transcription microservice using `faster-whisper` (speech-to-text) and `LaBSE` (multilingual embeddings for similarity detection). It runs as a separate Python process alongside the React dev server.

### Prerequisites (ffmpeg)

The transcription microservice requires `ffmpeg` to be installed on the host machine to decode audio files. 

- **macOS**:
  ```bash
  brew install ffmpeg
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update && sudo apt install -y ffmpeg
  ```
- **Windows**:
  - Install via `winget`:
    ```powershell
    winget install Gnu.FFmpeg
    ```
  - Or install via `chocolatey`:
    ```powershell
    choco install ffmpeg
    ```

### One-time setup

```bash
cd transcription-service
python -m venv venv

# Activate the virtual environment:
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
cp .env.example .env
```

First run of the service will download model weights (~1-2GB total for Whisper "small" + LaBSE) — this happens once and is cached in your system's Hugging Face cache folder (`~/.cache/huggingface`), so subsequent starts are fast.

### Running the service

**Option A — manually, in a separate terminal:**

```bash
cd transcription-service
source venv/bin/activate         # Mac/Linux, or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8001
```

**Option B — using the helper script:**

```bash
./transcription-service/run.sh   # Mac/Linux (conceptually needs chmod +x)
transcription-service\run.bat    # Windows
```

**Option C — run frontend + transcription service together from project root:**

```bash
npm run dev:all
```

*(Note: Option C requires the venv to already be activated in your terminal before running this command, since `concurrently` inherits the current shell environment.)*

The service runs at http://localhost:8001.

### Frontend configuration

Ensure your `.env` (project root) contains:

```env
VITE_TRANSCRIPTION_API_URL=http://localhost:8001
```

### Notes

- **Hardware**: "small" Whisper model runs fine on CPU but is slower for longer recordings. If you have GPU access, set `WHISPER_MODEL_SIZE=large-v3-turbo` and `WHISPER_DEVICE=cuda` in `transcription-service/.env`, and install a CUDA-enabled PyTorch build first.
- **Graceful Degradation**: The app gracefully degrades if this service is offline — recordings still upload to Cloudinary, but transcription, language detection, and repeated-content detection are skipped until the service is reachable.
- **Audio Fingerprinting**: Audio fingerprinting (Level 2 / Near Duplicate detection) is NOT covered by this service — that remains a simulated/mock step pending a separate audio fingerprinting integration.

