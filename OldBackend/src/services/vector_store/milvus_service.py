import logging
from typing import Dict, List, Optional, Any
from pymilvus import (
    connections,
    utility,
    Collection,
    CollectionSchema,
    FieldSchema,
    DataType,
)
from sentence_transformers import SentenceTransformer
import time
from datetime import datetime
import random
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MilvusService:
    def __init__(self):
        """Initialize the Milvus service"""
        self.host = "localhost"
        self.port = 19530
        self.collection_name = "resumes"
        self.dim = 384  # Dimension of the sentence-transformer model
        self.is_connected = False
        self.collection = None
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Connect to Milvus
        if self.connect():
            logger.info(f"Successfully connected to Milvus at {self.host}:{self.port}")
            if self.init_collection():
                logger.info(f"Successfully connected to collection {self.collection_name}")
    
    def connect(self) -> bool:
        """Connect to Milvus server"""
        try:
            connections.connect(
                alias="default",
                host=self.host,
                port=self.port
            )
            self.is_connected = True
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            self.is_connected = False
            return False
    
    def drop_collection(self) -> bool:
        """Drop the collection if it exists"""
        try:
            if utility.has_collection(self.collection_name):
                utility.drop_collection(self.collection_name)
                logger.info(f"Successfully dropped collection {self.collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to drop collection: {e}")
            return False

    def init_collection(self) -> bool:
        """Initialize the collection with the required schema"""
        try:
            # Drop existing collection if it exists
            self.drop_collection()

            # Define field length limits
            MAX_SHORT_TEXT = 1000  # For short fields like name, email, phone
            MAX_MEDIUM_TEXT = 5000  # For file paths and other medium length fields
            MAX_LONG_TEXT = 50000  # For education, experience, skills

            # Create collection
            fields = [
                FieldSchema(name="resume_id", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT, is_primary=True),
                FieldSchema(name="full_name", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="email", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="phone", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=MAX_MEDIUM_TEXT),
                FieldSchema(name="skills", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="education", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="work_experience", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384)
            ]

            schema = CollectionSchema(fields=fields, description="Resume collection")
            self.collection = Collection(name=self.collection_name, schema=schema)

            # Create index
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            self.collection.create_index(field_name="embedding", index_params=index_params)
            self.collection.load()
            logger.info(f"Successfully created collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            raise

    def _truncate_field(self, value: str, max_length: int) -> str:
        """Truncate a string field to ensure it doesn't exceed max_length"""
        if isinstance(value, str) and len(value) > max_length:
            return value[:max_length-3] + "..."
        return value

    def _prepare_data_for_insert(self, data: dict) -> dict:
        """Prepare data for insertion by ensuring all fields are properly formatted and truncated"""
        MAX_SHORT_TEXT = 1000
        MAX_MEDIUM_TEXT = 5000
        MAX_LONG_TEXT = 50000

        # Convert all fields to strings and truncate if necessary
        prepared_data = {
            "resume_id": self._truncate_field(str(data.get("resume_id", "")), MAX_SHORT_TEXT),
            "full_name": self._truncate_field(str(data.get("full_name", "")), MAX_SHORT_TEXT),
            "email": self._truncate_field(str(data.get("email", "")), MAX_SHORT_TEXT),
            "phone": self._truncate_field(str(data.get("phone", "")), MAX_SHORT_TEXT),
            "file_path": self._truncate_field(str(data.get("file_path", "")), MAX_MEDIUM_TEXT),
        }

        # Handle complex fields that need to be JSON serialized
        try:
            skills = data.get("skills", [])
            if isinstance(skills, list):
                # If skills are Pydantic models, extract name attribute
                skills_str = json.dumps([
                    s.name if hasattr(s, 'name') else str(s)
                    for s in skills
                ])
            else:
                skills_str = json.dumps(skills)
            prepared_data["skills"] = self._truncate_field(skills_str, MAX_LONG_TEXT)

            # Handle education and work experience
            for field in ["education", "work_experience"]:
                field_data = data.get(field, [])
                if isinstance(field_data, list):
                    # Convert all nested objects to dictionaries
                    field_str = json.dumps([
                        item.dict() if hasattr(item, 'dict') else item
                        for item in field_data
                    ])
                else:
                    field_str = json.dumps(field_data)
                prepared_data[field] = self._truncate_field(field_str, MAX_LONG_TEXT)

            # Handle embedding
            if "embedding" in data:
                prepared_data["embedding"] = data["embedding"]

            return prepared_data
        except Exception as e:
            logger.error(f"Error preparing data for insert: {e}")
            raise

    def insert_resume(self, resume_data: dict):
        """Insert a resume into the collection"""
        try:
            # Prepare data for insertion
            data = self._prepare_data_for_insert(resume_data)
            
            # Insert the data
            self.collection.insert([data])
            logger.info(f"Successfully inserted resume {data['resume_id']}")
        except Exception as e:
            logger.error(f"Failed to insert resume: {e}")
            raise
    
    def ensure_connection(self) -> bool:
        """Ensure connection to Milvus and collection is ready"""
        if self.is_connected and self.collection is not None:
            return True
        
        if self.connect():
            try:
                if not utility.has_collection(self.collection_name):
                    if not self.init_collection():
                        return False
                
                self.collection = Collection(self.collection_name)
                self.collection.load()
                return True
            except Exception as e:
                logger.error(f"Failed to initialize collection: {e}")
                self.is_connected = False
                return False
        return False
    
    def list_all_resumes(self) -> List[Dict]:
        """List all resumes in the collection"""
        try:
            if not self.ensure_connection():
                return []
            
            # Query all resumes
            results = self.collection.query(
                expr="resume_id != ''",
                output_fields=[
                    "resume_id", "full_name", "email", "phone",
                    "experience_years", "skills", "last_position",
                    "education", "file_path", "created_at"
                ]
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to list resumes: {e}")
            return []

milvus_service = MilvusService() 