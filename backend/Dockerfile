FROM python:3.9-slim

# Install required system packages
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the Whisper models (tiny and large-v3)
RUN python3 -c "\
import whisper;\
whisper.load_model('tiny');\
whisper.load_model('large-v3');"

# Copy the application code
COPY . /app

# Set working directory
WORKDIR /app

# Command to run the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
