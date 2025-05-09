import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import json
from pathlib import Path

class ResumeEmbeddingProcessor:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        
    def load_data(self, csv_path):
        """Load resume data from CSV file"""
        self.df = pd.read_csv(csv_path)
        return self.df
    
    def preprocess_text(self, text):
        """Basic text preprocessing"""
        if isinstance(text, str):
            # Remove extra whitespace and convert to lowercase
            return ' '.join(text.lower().split())
        return ''
    
    def generate_embeddings(self, text_column):
        """Generate embeddings for the specified text column"""
        # Preprocess the text
        processed_texts = self.df[text_column].apply(self.preprocess_text)
        
        # Generate embeddings
        embeddings = self.model.encode(
            processed_texts.tolist(),
            batch_size=32,
            show_progress_bar=True,
            convert_to_tensor=True
        )
        
        return embeddings
    
    def save_embeddings(self, embeddings, output_path):
        """Save embeddings to disk"""
        # Convert embeddings to numpy array if they're torch tensors
        if isinstance(embeddings, torch.Tensor):
            embeddings = embeddings.cpu().numpy()
            
        # Create output directory if it doesn't exist
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Save embeddings
        np.save(output_path, embeddings)
        
    def process_resumes(self, csv_path, output_path, text_column='Resume'):
        """Main processing pipeline"""
        print("Loading data...")
        self.load_data(csv_path)
        
        print("Generating embeddings...")
        embeddings = self.generate_embeddings(text_column)
        
        print("Saving embeddings...")
        self.save_embeddings(embeddings, output_path)
        
        return embeddings

if __name__ == "__main__":
    processor = ResumeEmbeddingProcessor()
    embeddings = processor.process_resumes(
        csv_path='UpdatedResumeDataSet.csv',
        output_path='data/embeddings/resume_embeddings.npy'
    ) 