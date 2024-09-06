# Stage 1: Build stage
FROM python:3.9-slim as builder

# Install necessary packages for building the application
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the base Whisper model
RUN python -c "import whisper; whisper.load_model('base', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('base.en', download_root='/app/whisper_models')"
RUN python -c "import whisper; whisper.load_model('large-v3', download_root='/app/whisper_models')"

# Stage 2: Runtime stage
FROM python:3.9-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg

WORKDIR /app

# Copy only the necessary runtime files from the builder stage
COPY --from=builder /app /app

# Copy the main application code
COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
