FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY src/ ./src/
COPY UpdatedResumeDataSet.csv ./data/

# Create necessary directories
RUN mkdir -p /app/models /app/data/embeddings

# Set environment variables
ENV PYTHONPATH=/app
ENV MODEL_PATH=/app/models
ENV DATA_PATH=/app/data

# Run the embedding processor
CMD ["python", "src/embedding_processor.py"] 