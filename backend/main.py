from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import torch
import os
import ffmpeg
import numpy as np
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable for the model directory
WHISPER_MODELS_DIR = "/app/whisper_models"
device = "cuda" if torch.cuda.is_available() else "cpu"

def get_available_models() -> list:
    """Returns the list of available Whisper models (as .pt files) in the directory."""
    try:
        all_items = os.listdir(WHISPER_MODELS_DIR)
        models = [item.replace('.pt', '') for item in all_items if item.endswith('.pt')]
        return models
    except Exception as e:
        print(f"Error while fetching models: {e}")
        return []

def load_audio_from_memory(audio_bytes: BytesIO) -> np.ndarray:
    """Loads audio from BytesIO into a NumPy array using ffmpeg."""
    try:
        audio_bytes.seek(0)  # Rewind the file-like object to the beginning
        if audio_bytes.getbuffer().nbytes == 0:
            raise ValueError("Uploaded file is empty.")
        
        process = (
            ffmpeg.input('pipe:0')
            .output('pipe:1', format='wav', acodec='pcm_s16le', ac=1, ar='16000')
            .run_async(pipe_stdin=True, pipe_stdout=True, pipe_stderr=True)
        )

        out, err = process.communicate(input=audio_bytes.read())
        if process.returncode != 0:
            print(f"FFmpeg error: {err}")
            raise HTTPException(status_code=500, detail="Error decoding audio with ffmpeg.")

        # Ensure correct conversion to np.int16 to match the 16-bit PCM audio format
        audio_data = np.frombuffer(out, dtype=np.int16).astype(np.float32) / 32768.0
        return audio_data
    except Exception as e:
        print(f"Error decoding audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error decoding audio: {e}")

@app.get("/api/models/")
async def list_models():
    """List the available models in the whisper_models directory."""
    return {"models": get_available_models()}

@app.post("/api/transcribe/")
async def transcribe(
    file: UploadFile = File(...),
    whisper_model_name: str = Form("base"),
    language: str = Form(None)
):
    """Transcribe an audio or video file with auto language detection if no language is provided."""
    try:
        # Load the model dynamically
        model = whisper.load_model(whisper_model_name, download_root=WHISPER_MODELS_DIR).to(device)

        # Read the uploaded file into memory
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupt.")
        
        audio_file = BytesIO(file_bytes)

        # Load the audio into a NumPy array
        audio_data = load_audio_from_memory(audio_file)

        # If language is None or empty, don't pass the language, let Whisper auto-detect
        transcribe_options = {"language": language} if language else {}

        # Transcribe the audio
        result = model.transcribe(audio_data, **transcribe_options)

        # Include timestamps in the transcription
        segments = result['segments']
        transcription_with_timestamps = [
            {"text": segment['text'], "start": segment['start'], "end": segment['end']}
            for segment in segments
        ]
        
        return {
            "detected_language": result["language"],
            "transcription": transcription_with_timestamps
        }
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/api/translate/")
async def translate(
    file: UploadFile = File(...),
    whisper_model_name: str = Form("base"),
    source_language: str = Form(None),
    target_language: str = Form("en")
):
    """Translate an audio or video file with auto language detection if no source language is provided."""
    try:
        model = whisper.load_model(whisper_model_name, download_root=WHISPER_MODELS_DIR).to(device)

        # Read the uploaded file into memory
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupt.")
        
        audio_file = BytesIO(file_bytes)

        # Load the audio into a NumPy array
        audio_data = load_audio_from_memory(audio_file)

        # If source_language is None or empty, don't pass the language, let Whisper auto-detect
        transcribe_options = {"task": "translate", "language": source_language} if source_language else {"task": "translate"}

        # Perform translation
        result = model.transcribe(audio_data, **transcribe_options)
        
        segments = result['segments']
        translation_with_timestamps = [
            {"text": segment['text'], "start": segment['start'], "end": segment['end']}
            for segment in segments
        ]
        
        return {
            "detected_language": result["language"],
            "translation": translation_with_timestamps
        }
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
