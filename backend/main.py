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

# Load models on GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
models = {
    "base": whisper.load_model("base", download_root="/app/whisper_models").to(device),
    "base.en": whisper.load_model("base.en", download_root="/app/whisper_models").to(device),
    "large": whisper.load_model("large", download_root="/app/whisper_models").to(device)
}

def save_file(file: UploadFile) -> str:
    ext = file.filename.split('.')[-1]
    filename = f"temp.{ext}"
    with open(filename, "wb") as f:
        f.write(file.file.read())
    return filename

def extract_audio(video_file: str) -> str:
    audio_file = "audio.wav"
    if not video_file.endswith(('.mp4', '.mkv', '.avi')):
        raise RuntimeError(f"Invalid file type for audio extraction: {video_file}")
    command = f"ffmpeg -i {video_file} -vn -acodec pcm_s16le -ar 44100 -ac 2 {audio_file}"
    os.system(command)
    return audio_file

def detect_language(audio_file: str, model) -> str:
    result = model.transcribe(audio_file, language=None, task="detect-language")
    return result['language']

@app.post("/transcribe/")
async def transcribe(
    file: UploadFile = File(...),
    model_name: str = Form("base"),
    language: str = Form(None)
):
    try:
        model = models.get(model_name, models["base"])
        filename = save_file(file)
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename
        
        # Detect the language if not provided
        if not language:
            language = detect_language(audio_file, model)

        result = model.transcribe(audio_file, language=language)

        # Include timestamps
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
    model_name: str = Form("base"),
    source_language: str = Form(None),
    target_language: str = Form("en")
):
    try:
        model = models.get(model_name, models["base"])
        filename = save_file(file)
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename

        # Detect the source language if not provided
        if not source_language:
            source_language = detect_language(audio_file, model)

        result = model.transcribe(audio_file, task="translate", language=source_language)

        # Include timestamps
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
