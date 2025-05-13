import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import json
from pathlib import Path
import pdfplumber
import os
import docx

class ResumeEmbeddingProcessor:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from a PDF file using pdfplumber."""
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    
    def extract_text_from_docx(self, docx_path):
        """Extract text from a DOCX file using python-docx."""
        doc = docx.Document(docx_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    
    def load_data(self, csv_path=None, pdf_dir=None, docx_dir=None):
        """
        Load resume data from a CSV file, a directory of PDFs, or a directory of DOCX files.
        If multiple are provided, combine them.
        """
        data = []
        if csv_path:
            df = pd.read_csv(csv_path)
            if 'Resume' in df.columns:
                for idx, row in df.iterrows():
                    data.append({'source': 'csv', 'filename': None, 'text': row['Resume']})
        if pdf_dir:
            for filename in os.listdir(pdf_dir):
                if filename.lower().endswith('.pdf'):
                    pdf_path = os.path.join(pdf_dir, filename)
                    text = self.extract_text_from_pdf(pdf_path)
                    data.append({'source': 'pdf', 'filename': filename, 'text': text})
        if docx_dir:
            for filename in os.listdir(docx_dir):
                if filename.lower().endswith('.docx'):
                    docx_path = os.path.join(docx_dir, filename)
                    text = self.extract_text_from_docx(docx_path)
                    data.append({'source': 'docx', 'filename': filename, 'text': text})
        self.data = data
        return data
    
    def preprocess_text(self, text):
        """Basic text preprocessing"""
        if isinstance(text, str):
            # Remove extra whitespace and convert to lowercase
            return ' '.join(text.lower().split())
        return ''
    
    def generate_embeddings(self):
        """Generate embeddings for the loaded data"""
        processed_texts = [self.preprocess_text(item['text']) for item in self.data]
        embeddings = self.model.encode(
            processed_texts,
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
        
    def process_resumes(self, csv_path=None, pdf_dir=None, docx_dir=None, output_path='data/embeddings/resume_embeddings.npy'):
        """Main processing pipeline"""
        print("Loading data...")
        self.load_data(csv_path, pdf_dir, docx_dir)
        
        print("Generating embeddings...")
        embeddings = self.generate_embeddings()
        
        print("Saving embeddings...")
        self.save_embeddings(embeddings, output_path)
        
        return embeddings

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Resume Embedding Processor")
    parser.add_argument('--csv', type=str, default=None, help='Path to CSV file with resumes')
    parser.add_argument('--pdf_dir', type=str, default=None, help='Directory containing PDF resumes')
    parser.add_argument('--docx_dir', type=str, default=None, help='Directory containing DOCX resumes')
    parser.add_argument('--output', type=str, default='data/embeddings/resume_embeddings.npy', help='Output path for embeddings')
    args = parser.parse_args()

    processor = ResumeEmbeddingProcessor()
    processor.process_resumes(csv_path=args.csv, pdf_dir=args.pdf_dir, docx_dir=args.docx_dir, output_path=args.output) 