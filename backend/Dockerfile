FROM python:3.9-slim

# Install necessary packages
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the base, base.en, and large Whisper models to the volume
RUN python -c "import whisper; whisper.load_model('base', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('base.en', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('large-v3', download_root='/app/whisper_models')"

# Copy only main.py into the container
COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
