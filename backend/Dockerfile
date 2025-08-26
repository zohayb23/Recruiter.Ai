FROM python:3.9-slim

WORKDIR /app

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create necessary directories
RUN mkdir -p /app/uploads/resumes

# Default command
CMD exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8804}