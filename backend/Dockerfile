FROM python:3.9-slim

# Install necessary packages
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set the environment variable for the Whisper model directory
ENV WHISPER_MODELS_DIR=/app/whisper_models

# Download the base, base.en, and large Whisper models to the volume
RUN python -c "import whisper; whisper.load_model('base', download_root='$WHISPER_MODELS_DIR')"
RUN python -c "import whisper; whisper.load_model('base.en', download_root='$WHISPER_MODELS_DIR')"
RUN python -c "import whisper; whisper.load_model('large', download_root='$WHISPER_MODELS_DIR')"

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
