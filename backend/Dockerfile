FROM python:3.9-slim

# Install necessary packages
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the base Whisper model
RUN python -c "import whisper; whisper.load_model('base', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('base.en', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('medium.en', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('large-v3', download_root='/app/whisper_models')"

# Copy the main application code
COPY main.py /app/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "600", "--workers", "4"]
