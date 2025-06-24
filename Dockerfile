FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all Python files and necessary directories
COPY *.py .
COPY src/ ./src/
COPY data/ ./data/
COPY csv_resumes/ ./csv_resumes/
COPY docx_resumes/ ./docx_resumes/
COPY pdf_resumes/ ./pdf_resumes/

# Create necessary directories
RUN mkdir -p /app/models /app/data/embeddings

# Set environment variables
ENV PYTHONPATH=/app
ENV MODEL_PATH=/app/models
ENV DATA_PATH=/app/data

# Default command (can be overridden in docker-compose)
CMD ["python", "ai_match_score.py"] 