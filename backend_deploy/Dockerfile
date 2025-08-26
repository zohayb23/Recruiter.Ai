FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all Python files and necessary directories
COPY *.py .
COPY src/ ./src/
COPY data/ ./data/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Create necessary directories
RUN mkdir -p /app/models /app/data/embeddings /app/uploads/resumes

# Set environment variables
ENV PYTHONPATH=/app
ENV MODEL_PATH=/app/models
ENV DATA_PATH=/app/data
ENV PORT=8804

# Default command for Cloud Run
CMD exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT} --workers 1