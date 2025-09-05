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
import os
import warnings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MilvusService:
    def __init__(self):
        """Initialize the Milvus service"""
        self.host = os.getenv("MILVUS_HOST", "localhost")
        self.port = int(os.getenv("MILVUS_PORT", "19530"))
        self.collection_name = "resumes"
        self.dim = 384  # Dimension of the sentence-transformer model
        self.is_connected = False
        self.collection = None
        # Cache the model locally and suppress initialization messages
        cache_folder = os.path.join(os.path.dirname(__file__), "../../../models/sentence_transformer")
        os.makedirs(cache_folder, exist_ok=True)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
            self.model = SentenceTransformer('all-MiniLM-L6-v2', cache_folder=cache_folder)
        
        # Connect to Milvus
        if self.connect():
            logger.info(f"Successfully connected to Milvus at {self.host}:{self.port}")
            if self.init_collection():
                logger.info(f"Successfully connected to collection {self.collection_name}")
        else:
            logger.warning("Failed to connect to Milvus - running in offline mode")
            self.is_connected = False
    
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
        """Initialize the collection with the required schema"""
        try:
            # If collection exists, just load it
            if utility.has_collection(self.collection_name):
                self.collection = Collection(self.collection_name)
                self.collection.load()
                logger.info(f"Using existing collection {self.collection_name}")
                return True

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
                FieldSchema(name="linkedin", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="github", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="website", dtype=DataType.VARCHAR, max_length=MAX_SHORT_TEXT),
                FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=MAX_MEDIUM_TEXT),
                FieldSchema(name="skills", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="education", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="work_experience", dtype=DataType.VARCHAR, max_length=MAX_LONG_TEXT),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384)
            ]

            schema = CollectionSchema(fields=fields, description="Resume collection", enable_dynamic_field=True)
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
            return True
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
            "linkedin": self._truncate_field(str(data.get("linkedin", "")), MAX_SHORT_TEXT),
            "github": self._truncate_field(str(data.get("github", "")), MAX_SHORT_TEXT),
            "website": self._truncate_field(str(data.get("website", "")), MAX_SHORT_TEXT),
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

    async def insert_resume(self, resume_data: dict):
        """Insert a resume into the collection"""
        try:
            # Ensure connection is active
            if not self.ensure_connection():
                raise Exception("Failed to connect to Milvus")

            # Prepare data for insertion
            data = self._prepare_data_for_insert(resume_data)
            
            # Insert the data
            result = self.collection.insert([data])
            self.collection.flush()  # Ensure data is persisted
            logger.info(f"Successfully inserted resume {data['resume_id']}")
            return result
        except Exception as e:
            error_msg = f"Failed to insert resume: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
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
                    "skills", "education", "work_experience",
                    "file_path"
                ]
            )
            
            # Parse JSON strings back to objects
            for result in results:
                for field in ["skills", "education", "work_experience"]:
                    if field in result and isinstance(result[field], str):
                        try:
                            result[field] = json.loads(result[field])
                        except:
                            result[field] = []
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to list resumes: {e}")
            return []

    async def get_resume(self, resume_id: str) -> Optional[Dict]:
        """Get a specific resume by ID"""
        try:
            if not self.ensure_connection():
                return None
            
            # Query specific resume
            results = self.collection.query(
                expr=f"resume_id == '{resume_id}'",
                output_fields=["*"]
            )
            
            if not results:
                return None
            
            result = results[0]
            
            # Parse JSON strings back to objects
            for field in ["skills", "education", "work_experience"]:
                if field in result and isinstance(result[field], str):
                    try:
                        result[field] = json.loads(result[field])
                    except:
                        result[field] = []
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get resume {resume_id}: {e}")
            return None

    async def get_all_resumes(self) -> List[Dict]:
        """Get all resumes (async version of list_all_resumes)"""
        return self.list_all_resumes()

milvus_service = MilvusService()