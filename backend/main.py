from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models = {
    "tiny": whisper.load_model("tiny"),
    "large-v3": whisper.load_model("large-v3")
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
    model_name: str = Form("tiny"),
    source_language: Optional[str] = Form(None),
    target_language: str = Form("en")
):
    try:
        model = models.get(model_name, models["tiny"])
        filename = save_file(file)
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename
        result = model.transcribe(audio_file, task="translate", language=source_language)
        os.remove(filename)
        os.remove(audio_file)
        return {"translation": result["text"]}
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
