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
    
    def init_collection(self) -> bool:
        """Initialize the collection with the required schema if it doesn't exist"""
        try:
            # Define field length limits
            MAX_SHORT_TEXT = 1000  # For short fields like name, email, phone
            MAX_MEDIUM_TEXT = 5000  # For file paths and other medium length fields
            MAX_LONG_TEXT = 50000  # For education, experience, skills

            # Check if collection exists
            if utility.has_collection(self.collection_name):
                # Drop the existing collection to recreate with updated schema
                utility.drop_collection(self.collection_name)
                logger.info(f"Dropped existing collection {self.collection_name}")

            # Create collection with new schema
            fields = [
                FieldSchema(name="resume_id", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT, is_primary=True),
                FieldSchema(name="full_name", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="email", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="phone", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="linkedin", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="github", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="website", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=MAX_MEDIUM_TEXT),
                FieldSchema(name="skills", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="education", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="work_experience", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384)
            ]
            
            schema = CollectionSchema(
                fields=fields,
                description="Resume collection",
                enable_dynamic_field=True  # Enable dynamic fields to allow additional fields
            )
            self.collection = Collection(name=self.collection_name, schema=schema)
            
            # Create index
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            self.collection.create_index(field_name="embedding", index_params=index_params)
            self.collection.load()
            logger.info(f"Successfully created new collection {self.collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing collection: {e}")
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
            "linkedin": self._truncate_field(str(data.get("linkedin", "")), MAX_SHORT_TEXT),
            "github": self._truncate_field(str(data.get("github", "")), MAX_SHORT_TEXT),
            "website": self._truncate_field(str(data.get("website", "")), MAX_SHORT_TEXT),
            "file_path": self._truncate_field(str(data.get("file_path", "")), MAX_MEDIUM_TEXT),
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Handle complex fields that need to be JSON serialized
        try:
            # Handle skills
            skills = data.get("skills", [])
            if isinstance(skills, list):
                # If skills are Pydantic models, extract name and category
                skills_data = [
                    {"name": s.name, "category": s.category} if hasattr(s, 'name') else s
                    for s in skills
                ]
                skills_str = json.dumps(skills_data)
            else:
                skills_str = json.dumps(skills)
            prepared_data["skills"] = self._truncate_field(skills_str, MAX_LONG_TEXT)

            # Handle education
            education = data.get("education", [])
            if isinstance(education, list):
                # Convert all nested objects to dictionaries
                education_data = [
                    {
                        "degree": e.degree,
                        "institution": e.institution,
                        "start_date": e.start_date,
                        "end_date": e.end_date
                    } if hasattr(e, 'dict') else e
                    for e in education
                ]
                education_str = json.dumps(education_data)
            else:
                education_str = json.dumps(education)
            prepared_data["education"] = self._truncate_field(education_str, MAX_LONG_TEXT)

            # Handle work experience
            work_experience = data.get("work_experience", [])
            if isinstance(work_experience, list):
                # Convert all nested objects to dictionaries
                experience_data = [
                    {
                        "title": w.title,
                        "company": w.company,
                        "start_date": w.start_date,
                        "end_date": w.end_date,
                        "description": w.description,
                        "technologies": w.technologies
                    } if hasattr(w, 'dict') else w
                    for w in work_experience
                ]
                experience_str = json.dumps(experience_data)
            else:
                experience_str = json.dumps(work_experience)
            prepared_data["work_experience"] = self._truncate_field(experience_str, MAX_LONG_TEXT)

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
            
            # Query all resumes with all fields
            results = self.collection.query(
                expr="resume_id != ''",
                output_fields=[
                    "resume_id", "full_name", "email", "phone",
                    "linkedin", "github", "website", "file_path",
                    "skills", "education", "work_experience",
                    "created_at"
                ]
            )
            
            # Parse JSON strings back to objects
            for result in results:
                if "skills" in result:
                    try:
                        result["skills"] = json.loads(result["skills"])
                    except:
                        result["skills"] = []
                
                if "education" in result:
                    try:
                        result["education"] = json.loads(result["education"])
                    except:
                        result["education"] = []
                
                if "work_experience" in result:
                    try:
                        result["work_experience"] = json.loads(result["work_experience"])
                    except:
                        result["work_experience"] = []
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to list resumes: {e}")
            return []

milvus_service = MilvusService() 