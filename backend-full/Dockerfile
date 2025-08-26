FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy models
RUN python -m spacy download en_core_web_lg

# Copy source code
COPY src/ ./src/

# Create directories
RUN mkdir -p /app/uploads/resumes

# Use the main app
CMD exec uvicorn src.main:app --host 0.0.0.0 --port 8804