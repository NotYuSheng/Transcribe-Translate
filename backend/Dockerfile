FROM python:3.9-slim

# Install necessary packages
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the tiny Whisper model
RUN python -c "import whisper; whisper.load_model('tiny')"

# Download the large-v3 Whisper model
# RUN python -c "import whisper; whisper.load_model('large-v3')"

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
