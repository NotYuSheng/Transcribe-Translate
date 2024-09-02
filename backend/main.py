from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os
import subprocess
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("base")

def save_file(file: UploadFile) -> str:
    # Extract the file extension from the uploaded file's original filename
    ext = file.filename.split('.')[-1]
    # Construct a filename with the correct extension
    filename = f"temp.{ext}"
    # Save the uploaded file to the local file system
    with open(filename, "wb") as f:
        f.write(file.file.read())
    # Return the filename for further processing
    return filename

def extract_audio(video_file: str) -> str:
    audio_file = "audio.wav"
    command = f"ffmpeg -i {video_file} -vn -acodec pcm_s16le -ar 44100 -ac 2 {audio_file}"
    subprocess.run(command, shell=True)
    return audio_file

@app.post("/transcribe/")
async def transcribe(file: UploadFile = File(...), language: Optional[str] = Form(None)):
    filename = save_file(file)
    if filename.endswith(('.mp4', '.mkv', '.avi')):
        audio_file = extract_audio(filename)
    else:
        audio_file = filename
    result = model.transcribe(audio_file, language=language)
    os.remove(filename)
    os.remove(audio_file)
    return {"transcription": result["text"]}

@app.post("/translate/")
async def translate(
    file: UploadFile = File(...),
    source_language: Optional[str] = Form(None),
    target_language: str = Form("en")
):
    filename = save_file(file)
    if filename.endswith(('.mp4', '.mkv', '.avi')):
        audio_file = extract_audio(filename)
    else:
        audio_file = filename
    result = model.transcribe(audio_file, task="translate", language=source_language)
    os.remove(filename)
    os.remove(audio_file)
    return {"translation": result["text"]}
