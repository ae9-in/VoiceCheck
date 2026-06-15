#!/bin/bash
# Activates venv and starts the transcription service
cd "$(dirname "$0")"
source venv/bin/activate
uvicorn main:app --reload --port 8001
