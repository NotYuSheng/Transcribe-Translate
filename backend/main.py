from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model on GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("base", device=device)

def save_file(file: UploadFile) -> str:
    ext = file.filename.split('.')[-1]
    filename = f"temp.{ext}"
    with open(filename, "wb") as f:
        f.write(file.file.read())
    return filename

def extract_audio(video_file: str) -> str:
    audio_file = "audio.wav"
    command = f"ffmpeg -i {video_file} -vn -acodec pcm_s16le -ar 44100 -ac 2 {audio_file}"
    subprocess.run(command, shell=True, check=True)
    return audio_file

@app.post("/transcribe/")
async def transcribe(file: UploadFile = File(...), language: Optional[str] = Form(None)):
    try:
        filename = save_file(file)
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename
        result = model.transcribe(audio_file, language=language)

        # Include timestamps
        segments = result['segments']
        transcription_with_timestamps = [
            {"text": segment['text'], "start": segment['start'], "end": segment['end']}
            for segment in segments
        ]

        os.remove(filename)
        os.remove(audio_file)
        return {"transcription": transcription_with_timestamps}
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/translate/")
async def translate(
    file: UploadFile = File(...),
    source_language: Optional[str] = Form(None),
    target_language: str = Form("en")
):
    try:
        filename = save_file(file)
        if filename.endswith(('.mp4', '.mkv', '.avi')):
            audio_file = extract_audio(filename)
        else:
            audio_file = filename
        result = model.transcribe(audio_file, task="translate", language=source_language)

        # Include timestamps
        segments = result['segments']
        translation_with_timestamps = [
            {"text": segment['text'], "start": segment['start'], "end": segment['end']}
            for segment in segments
        ]

        os.remove(filename)
        os.remove(audio_file)
        return {"translation": translation_with_timestamps}
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
