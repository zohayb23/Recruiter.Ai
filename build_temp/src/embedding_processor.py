import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
from google.cloud import storage
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
import asyncio
from typing import AsyncIterator, Dict, Any
import aiohttp
import json
import uuid

class ResumeEmbeddingProcessor:
    def __init__(self, model_name='all-MiniLM-L6-v2', milvus_host='localhost', milvus_port='19530',
                 gcs_bucket_name=None):
        self.model = SentenceTransformer(model_name)
        self.milvus_host = milvus_host
        self.milvus_port = milvus_port
        self.collection_name = "resume_embeddings"
        self.gcs_bucket_name = gcs_bucket_name
        self.storage_client = storage.Client() if gcs_bucket_name else None
        self._connect_milvus()
        self._create_collection_if_not_exists()
        
    async def process_resume_stream(self, resume_stream: AsyncIterator[Dict[str, Any]]):
        """Process resumes as they come in from the stream"""
        batch = []
        batch_size = 32  # Adjust based on memory constraints
        
        async for resume in resume_stream:
            # Extract text from resume dict
            text = resume.get('text', '')
            if not text:
                continue
                
            # Preprocess
            processed_text = self.preprocess_text(text)
            batch.append({
                'text': processed_text,
                'metadata': resume.get('metadata', {})
            })
            
            if len(batch) >= batch_size:
                await self._process_batch(batch)
                batch = []
                
        # Process remaining items
        if batch:
            await self._process_batch(batch)
    
    async def _process_batch(self, batch):
        """Process a batch of resumes"""
        texts = [item['text'] for item in batch]
        metadata = [item['metadata'] for item in batch]
        
        # Generate embeddings
        embeddings = self.model.encode(
            texts,
            batch_size=len(texts),
            show_progress_bar=False,
            convert_to_tensor=True
        )
        
        # Store in Milvus
        self.insert_to_milvus(embeddings, metadata)
        
        # Store metadata in GCS if configured
        if self.storage_client:
            await self._store_metadata_gcs(metadata)
    
    async def _store_metadata_gcs(self, metadata_batch):
        """Store metadata in Google Cloud Storage"""
        if not self.gcs_bucket_name:
            return
            
        bucket = self.storage_client.bucket(self.gcs_bucket_name)
        for meta in metadata_batch:
            blob_name = f"metadata/{meta.get('id', str(uuid.uuid4()))}.json"
            blob = bucket.blob(blob_name)
            blob.upload_from_string(
                json.dumps(meta),
                content_type='application/json'
            )

    def insert_to_milvus(self, embeddings, metadata):
        """Insert embeddings and metadata into Milvus"""
        col = Collection(self.collection_name)
        data = [
            embeddings.tolist(),
            [m.get('source', '') for m in metadata],
            [m.get('id', '') for m in metadata],
            [m.get('title', '') for m in metadata],
            [json.dumps(m) for m in metadata],  # Store full metadata as JSON
        ]
        col.insert(data)
        
    def _create_collection_if_not_exists(self):
        """Create Milvus collection with updated schema"""
        if self.collection_name in utility.list_collections():
            return
            
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384),
            FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="resume_id", dtype=DataType.VARCHAR, max_length=128),
            FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=256),
            FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535),
        ]
        schema = CollectionSchema(fields, description="Resume Embeddings")
        Collection(self.collection_name, schema)
        
    def preprocess_text(self, text):
        """Basic text preprocessing"""
        if isinstance(text, str):
            return ' '.join(text.lower().split())
        return ''

    async def process_api_stream(self, api_url: str, api_key: str, params: Dict[str, Any] = None):
        """Process resumes directly from an API stream"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                api_url,
                headers={'Authorization': f'Bearer {api_key}'},
                params=params
            ) as response:
                async for resume in response.content:
                    try:
                        resume_data = json.loads(resume)
                        await self.process_resume_stream([resume_data])
                    except json.JSONDecodeError:
                        continue  # Skip invalid JSON

    def _connect_milvus(self):
        connections.connect("default", host=self.milvus_host, port=self.milvus_port)

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
                                data.append({
                                    'source': 'csv',
                                    'filename': f"{filename}_{idx+1}",  # Add resume number to filename
                                    'text': row['Resume'],
                                    'name': row['Name'] if 'Name' in row and not pd.isna(row['Name']) else f"Resume #{idx+1}"
                                })
            elif os.path.isfile(csv_path):
                df = pd.read_csv(csv_path)
                if 'Resume' in df.columns:
                    for idx, row in df.iterrows():
                        data.append({
                            'source': 'csv',
                            'filename': f"{os.path.basename(csv_path)}_{idx+1}",  # Add resume number to filename
                            'text': row['Resume'],
                            'name': row['Name'] if 'Name' in row and not pd.isna(row['Name']) else f"Resume #{idx+1}"
                        })
        if pdf_dir:
            for filename in os.listdir(pdf_dir):
                if filename.lower().endswith('.pdf'):
                    pdf_path = os.path.join(pdf_dir, filename)
                    text = self.extract_text_from_pdf(pdf_path)
                    data.append({'source': 'pdf', 'filename': filename, 'text': text, 'name': ''})
        if docx_dir:
            for filename in os.listdir(docx_dir):
                if filename.lower().endswith('.docx'):
                    docx_path = os.path.join(docx_dir, filename)
                    text = self.extract_text_from_docx(docx_path)
                    data.append({'source': 'docx', 'filename': filename, 'text': text, 'name': ''})
        self.data = data
        print(f"[DEBUG] Loaded {len(data)} resumes.")
        return data
    
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