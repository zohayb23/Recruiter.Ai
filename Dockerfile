FROM python:3.9-slim

WORKDIR /app

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create necessary directories
RUN mkdir -p /app/uploads/resumes

# Default command - use $PORT environment variable
CMD exec uvicorn src.main:app --host 0.0.0.0 --port 8804