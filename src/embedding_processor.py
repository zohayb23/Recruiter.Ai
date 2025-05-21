import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import json
from pathlib import Path
import pdfplumber
import os
import docx
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility

class ResumeEmbeddingProcessor:
    def __init__(self, model_name='all-MiniLM-L6-v2', milvus_host='localhost', milvus_port='19530'):
        self.model = SentenceTransformer(model_name)
        self.milvus_host = milvus_host
        self.milvus_port = milvus_port
        self.collection_name = "resume_embeddings"
        self._connect_milvus()
        # Drop the collection if it exists so we can create it with the new schema
        if self.collection_name in utility.list_collections():
            print(f"[INFO] Dropping existing collection '{self.collection_name}' to update schema.")
            utility.drop_collection(self.collection_name)
        self._create_collection_if_not_exists()
        
    def _connect_milvus(self):
        connections.connect("default", host=self.milvus_host, port=self.milvus_port)

    def _create_collection_if_not_exists(self):
        if self.collection_name in utility.list_collections():
            return
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384),
            FieldSchema(name="filename", dtype=DataType.VARCHAR, max_length=256),
            FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=16),
        ]
        schema = CollectionSchema(fields, description="Resume Embeddings")
        Collection(self.collection_name, schema)

    def insert_to_milvus(self, embeddings, metadata):
        col = Collection(self.collection_name)
        data = [
            embeddings.tolist(),
            [m.get('filename', '') for m in metadata],
            [m.get('source', '') for m in metadata],
        ]
        print(f"[DEBUG] Inserting {len(embeddings)} embeddings into Milvus...")
        result = col.insert(data)
        print(f"[DEBUG] Milvus insert result: {result}")

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
            if os.path.isdir(csv_path):
                for filename in os.listdir(csv_path):
                    if filename.lower().endswith('.csv'):
                        file_path = os.path.join(csv_path, filename)
                        df = pd.read_csv(file_path)
                        if 'Resume' in df.columns:
                            for idx, row in df.iterrows():
                                data.append({'source': 'csv', 'filename': filename, 'text': row['Resume']})
            elif os.path.isfile(csv_path):
                df = pd.read_csv(csv_path)
                if 'Resume' in df.columns:
                    for idx, row in df.iterrows():
                        data.append({'source': 'csv', 'filename': f"{os.path.basename(csv_path)}_{idx}", 'text': row['Resume']})
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
        print(f"[DEBUG] Loaded {len(data)} resumes.")
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
        print(f"[DEBUG] Embeddings shape: {embeddings.shape}")
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
        
    def create_embedding_index(self):
        col = Collection(self.collection_name)
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        print("[DEBUG] Creating index on 'embedding' field...")
        col.create_index(field_name="embedding", index_params=index_params)
        print("[DEBUG] Index created!")

    def process_resumes(self, csv_path=None, pdf_dir=None, docx_dir=None, output_path='data/embeddings/resume_embeddings.npy'):
        """Main processing pipeline"""
        print("Loading data...")
        self.load_data(csv_path, pdf_dir, docx_dir)
        
        print("Generating embeddings...")
        embeddings = self.generate_embeddings()
        
        print("Saving embeddings...")
        self.save_embeddings(embeddings, output_path)
        
        print("Inserting embeddings into Milvus...")
        self.insert_to_milvus(embeddings, self.data)
        
        print("Creating index on embedding field...")
        self.create_embedding_index()
        
        return embeddings

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Resume Embedding Processor")
    parser.add_argument('--csv', type=str, default='csv_resumes', help='Path to CSV file or directory with resumes (default: ./csv_resumes)')
    parser.add_argument('--pdf_dir', type=str, default='pdf_resumes', help='Directory containing PDF resumes (default: ./pdf_resumes)')
    parser.add_argument('--docx_dir', type=str, default='docx_resumes', help='Directory containing DOCX resumes (default: ./docx_resumes)')
    parser.add_argument('--output', type=str, default='data/embeddings/resume_embeddings.npy', help='Output path for embeddings')
    args = parser.parse_args()

    processor = ResumeEmbeddingProcessor()
    processor.process_resumes(csv_path=args.csv, pdf_dir=args.pdf_dir, docx_dir=args.docx_dir, output_path=args.output) 