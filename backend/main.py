from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper
import torch
import os
import subprocess

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

def generate_srt_file(transcription, filename="subtitles.srt"):
    """Generate an SRT file from transcription segments."""
    with open(filename, 'w') as f:
        for i, segment in enumerate(transcription):
            start = format_time(segment['start'])
            end = format_time(segment['end'])
            text = segment['text']
            f.write(f"{i + 1}\n{start} --> {end}\n{text}\n\n")
    return filename

def format_time(seconds: float) -> str:
    """Format time in seconds to SRT timestamp format (hh:mm:ss,ms)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

def add_subtitles_to_video(video_file: str, subtitle_file: str, output_file: str) -> str:
    """Overlay subtitles onto the video using FFmpeg."""
    command = f"ffmpeg -i {video_file} -vf subtitles={subtitle_file} {output_file}"
    subprocess.run(command, shell=True, check=True)
    return output_file

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

        # Generate SRT file
        srt_file = generate_srt_file(transcription_with_timestamps)

        # Add subtitles to video if it's a video file
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            output_file = f"subtitled_{filename}"
            add_subtitles_to_video(filename, srt_file, output_file)

        os.remove(filename)
        os.remove(audio_file)
        return {
            "detected_language": language,
            "transcription": transcription_with_timestamps,
            "subtitle_file": srt_file,
            "video_with_subtitles": output_file if filename.endswith(('.mp4', '.mkv', '.avi')) else None
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

        # Generate SRT file for the translation
        srt_file = generate_srt_file(translation_with_timestamps, filename="translated_subtitles.srt")

        # Add subtitles to video if it's a video file
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            output_file = f"translated_subtitled_{filename}"
            add_subtitles_to_video(filename, srt_file, output_file)

        os.remove(filename)
        os.remove(audio_file)
        return {
            "detected_language": source_language,
            "translation": translation_with_timestamps,
            "subtitle_file": srt_file,
            "video_with_subtitles": output_file if filename.endswith(('.mp4', '.mkv', '.avi')) else None
        }
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
