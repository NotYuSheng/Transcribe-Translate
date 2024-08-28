from fastapi import FastAPI, UploadFile, File
import whisper

app = FastAPI()

# Load the large-v3 Whisper model
model = whisper.load_model("large-v3")

@app.post("/transcribe/")
async def transcribe(file: UploadFile = File(...)):
    audio = await file.read()
    with open("audio.wav", "wb") as f:
        f.write(audio)
    result = model.transcribe("audio.wav")
    return {"transcription": result["text"]}

@app.post("/translate/")
async def translate(file: UploadFile = File(...), target_language: str = "en"):
    audio = await file.read()
    with open("audio.wav", "wb") as f:
        f.write(audio)
    result = model.transcribe("audio.wav", task="translate", language=target_language)
    return {"translation": result["text"]}
