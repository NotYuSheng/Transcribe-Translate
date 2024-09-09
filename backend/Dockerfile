FROM python:3.9-slim

# Install necessary packages
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory in the container
WORKDIR /app

# Copy requirements.txt and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the base Whisper model
RUN python -c "import whisper; whisper.load_model('base', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('base.en', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('large-v3', download_root='/app/whisper_models')"

# Copy the main application code
COPY main.py /app/

# Expose port
EXPOSE 8000

# Use Gunicorn with Uvicorn workers
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
