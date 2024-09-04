from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import torch
import os

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

# Check if GPU is available
device = "cuda" if torch.cuda.is_available() else "cpu"

def get_available_models() -> list:
    """Returns the list of available models in the directory."""
    try:
        models = [d for d in os.listdir(WHISPER_MODELS_DIR) if os.path.isdir(os.path.join(WHISPER_MODELS_DIR, d))]
        return models
    except Exception as e:
        print(f"Error while fetching models: {e}")
        return []

def load_model(model_name: str):
    """Load the model dynamically from the specified directory."""
    try:
        model_path = os.path.join(WHISPER_MODELS_DIR, model_name)
        if os.path.exists(model_path):
            model = whisper.load_model(model_name, download_root=WHISPER_MODELS_DIR).to(device)
            return model
        else:
            raise ValueError(f"Model {model_name} not found in {WHISPER_MODELS_DIR}.")
    except Exception as e:
        print(f"Error while loading model: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading model {model_name}: {str(e)}")

def save_file(file: UploadFile) -> str:
    """Save the uploaded file to the local system."""
    ext = file.filename.split('.')[-1]
    filename = f"temp.{ext}"
    with open(filename, "wb") as f:
        f.write(file.file.read())
    return filename

def extract_audio(video_file: str) -> str:
    """Extract audio from a video file using ffmpeg."""
    audio_file = "audio.wav"
    if not video_file.endswith(('.mp4', '.mkv', '.avi')):
        raise RuntimeError(f"Invalid file type for audio extraction: {video_file}")
    command = f"ffmpeg -i {video_file} -vn -acodec pcm_s16le -ar 44100 -ac 2 {audio_file}"
    os.system(command)
    return audio_file

def detect_language(audio_file: str, model) -> str:
    """Detect the language of the audio using the Whisper model."""
    result = model.transcribe(audio_file, language=None, task="detect-language")
    return result['language']

@app.get("/models/")
async def list_models():
    """List the available models in the whisper_models directory."""
    models = get_available_models()
    return {"models": models}

@app.post("/transcribe/")
async def transcribe(
    file: UploadFile = File(...),
    selected_model: str = Form("base"),  # Changed from model_name to selected_model
    language: str = Form(None)
):
    """Transcribe an audio or video file."""
    try:
        # Load the model dynamically
        model = load_model(selected_model)  # Using selected_model here
        filename = save_file(file)
        
        # If it's a video, extract the audio
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename
        
        # Detect the language if not provided
        if not language:
            language = detect_language(audio_file, model)

        result = model.transcribe(audio_file, language=language)

        # Include timestamps in the transcription
        segments = result['segments']
        transcription_with_timestamps = [
            {"text": segment['text'], "start": segment['start'], "end": segment['end']}
            for segment in segments
        ]

        os.remove(filename)
        os.remove(audio_file)
        return {
            "detected_language": language,
            "transcription": transcription_with_timestamps
        }
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/translate/")
async def translate(
    file: UploadFile = File(...),
    selected_model: str = Form("base"),  # Changed from model_name to selected_model
    source_language: str = Form(None),
    target_language: str = Form("en")
):
    """Translate an audio or video file."""
    try:
        # Load the model dynamically
        model = load_model(selected_model)  # Using selected_model here
        filename = save_file(file)

        # If it's a video, extract the audio
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename

        # Detect the source language if not provided
        if not source_language:
            source_language = detect_language(audio_file, model)

        result = model.transcribe(audio_file, task="translate", language=source_language)

        # Include timestamps in the translation
        segments = result['segments']
        translation_with_timestamps = [
            {"text": segment['text'], "start": segment['start'], "end": segment['end']}
            for segment in segments
        ]

        os.remove(filename)
        os.remove(audio_file)
        return {
            "detected_language": source_language,
            "translation": translation_with_timestamps
        }
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
