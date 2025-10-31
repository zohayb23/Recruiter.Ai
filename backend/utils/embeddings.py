from typing import List
import os
import openai
from ..config.settings import settings

# Initialize OpenAI
openai.api_key = settings.OPENAI_API_KEY

def get_embedding(text: str) -> List[float]:
    """Generate embedding for text using OpenAI API - OPTIMIZED VERSION"""
    try:
        if not openai.api_key:
            print("⚠️ No OpenAI API key, using fallback embedding")
            # Fallback to hash-based embedding with correct dimension
            hash_val = hash(text) % (2**32)
            embedding = []
            for i in range(1536):
                val = ((hash_val + i) % 1000) / 1000.0
                embedding.append(val)
            return embedding
        
        # Optimize text for embedding - use key information only
        optimized_text = text[:4000]  # Reduced from 8000 for faster processing
        
        # Use OpenAI API for real embeddings with timeout
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=optimized_text,
            timeout=20  # Add timeout for faster failure detection
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        # Fallback to hash-based embedding with correct dimension
        hash_val = hash(text) % (2**32)
        embedding = []
        for i in range(1536):
            val = ((hash_val + i) % 1000) / 1000.0
            embedding.append(val)
        return embedding

