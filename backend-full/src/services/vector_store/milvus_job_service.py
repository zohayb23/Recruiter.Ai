from pymilvus import (
    connections,
    utility,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)
import json
from datetime import datetime
import logging
from typing import Dict, List, Optional
from sentence_transformers import SentenceTransformer
import os

logger = logging.getLogger(__name__)

class MilvusJobService:
    def __init__(self):
        self.collection_name = "job_descriptions"
        self.dim = 384  # Dimension for all-MiniLM-L6-v2
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.init_collection()

    def init_collection(self):
        """Initialize the job descriptions collection"""
        try:
            # Connect to Milvus using environment variables
            host = os.getenv("MILVUS_HOST", "localhost")
            port = os.getenv("MILVUS_PORT", "19530")
            connections.connect("default", host=host, port=port)
            logger.info(f"Successfully connected to Milvus at {host}:{port}")

            # Check if collection exists
            if utility.has_collection(self.collection_name):
                logger.info(f"Using existing collection {self.collection_name}")
                collection = Collection(self.collection_name)
                collection.load()
                return

            # Define fields for the collection
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=36, is_primary=True),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=64),
                FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=64),
                FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=20),
                FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=256),
                FieldSchema(name="company", dtype=DataType.VARCHAR, max_length=256),
                FieldSchema(name="department", dtype=DataType.VARCHAR, max_length=256),
                FieldSchema(name="experience_level", dtype=DataType.VARCHAR, max_length=64),
                FieldSchema(name="overview", dtype=DataType.VARCHAR, max_length=2048),
                FieldSchema(name="responsibilities", dtype=DataType.VARCHAR, max_length=4096),  # JSON string
                FieldSchema(name="qualifications", dtype=DataType.VARCHAR, max_length=4096),  # JSON string
                FieldSchema(name="required_skills", dtype=DataType.VARCHAR, max_length=1024),  # JSON string
                FieldSchema(name="preferred_skills", dtype=DataType.VARCHAR, max_length=1024),  # JSON string
                FieldSchema(name="benefits", dtype=DataType.VARCHAR, max_length=2048),  # JSON string
                FieldSchema(name="company_description", dtype=DataType.VARCHAR, max_length=2048),
                FieldSchema(name="culture_values", dtype=DataType.VARCHAR, max_length=2048),
                FieldSchema(name="diversity_statement", dtype=DataType.VARCHAR, max_length=2048),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dim)
            ]

            # Create collection schema
            schema = CollectionSchema(
                fields=fields,
                description="Job descriptions collection",
                enable_dynamic_field=True
            )

            # Create collection
            collection = Collection(
                name=self.collection_name,
                schema=schema,
                using='default',
                shards_num=2
            )

            # Create index for vector field
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            collection.create_index(field_name="embedding", index_params=index_params)
            
            # Load the collection into memory
            collection.load()
            
            logger.info(f"Successfully created collection {self.collection_name} with index")

        except Exception as e:
            logger.error(f"Error initializing Milvus collection: {str(e)}")
            raise

    def _prepare_data_for_insert(self, job_data: Dict) -> Dict:
        """Prepare job description data for insertion into Milvus"""
        try:
            # Generate embedding from title and overview
            text_to_embed = f"{job_data['title']} {job_data.get('overview', '')}"
            embedding = self.model.encode(text_to_embed).tolist()

            # Convert complex objects to JSON strings and ensure all fields are strings
            data = {
                "id": str(job_data["id"]),
                "created_at": job_data["created_at"],
                "updated_at": job_data["updated_at"],
                "status": str(job_data["status"]),
                "title": str(job_data["title"]),
                "company": str(job_data.get("company", "")),
                "department": str(job_data.get("department", "")),
                "experience_level": str(job_data.get("experience_level", "")),
                "overview": str(job_data.get("overview", "")),
                "responsibilities": json.dumps(job_data.get("responsibilities", [])),
                "qualifications": json.dumps(job_data.get("qualifications", [])),
                "required_skills": json.dumps(job_data.get("required_skills", [])),
                "preferred_skills": json.dumps(job_data.get("preferred_skills", [])),
                "benefits": json.dumps(job_data.get("benefits", [])),
                "company_description": str(job_data.get("company_description", "")),
                "culture_values": str(job_data.get("culture_values", "")),
                "diversity_statement": str(job_data.get("diversity_statement", "")),
                "embedding": embedding
            }
            
            logger.info(f"Prepared data for insertion: {json.dumps(data, indent=2)}")
            return data

        except Exception as e:
            logger.error(f"Error preparing data for insertion: {str(e)}")
            raise

    def _parse_milvus_data(self, data: Dict) -> Dict:
        """Parse data from Milvus format back to Python objects"""
        return {
            "id": data["id"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
            "status": data["status"],
            "title": data["title"],
            "company": data.get("company"),
            "department": data.get("department"),
            "experience_level": data.get("experience_level"),
            "overview": data.get("overview"),
            "responsibilities": json.loads(data.get("responsibilities", "[]")),
            "qualifications": json.loads(data.get("qualifications", "[]")),
            "required_skills": json.loads(data.get("required_skills", "[]")),
            "preferred_skills": json.loads(data.get("preferred_skills", "[]")),
            "benefits": json.loads(data.get("benefits", "[]")),
            "company_description": data.get("company_description"),
            "culture_values": data.get("culture_values"),
            "diversity_statement": data.get("diversity_statement")
        }

    async def save_job_description(self, job_data: Dict) -> Dict:
        """Save a job description to Milvus"""
        try:
            # Get collection and ensure it's loaded
            collection = Collection(self.collection_name)
            collection.load()
            
            # Prepare data for insertion
            data = self._prepare_data_for_insert(job_data)
            
            # Insert data
            try:
                collection.insert([data])
                collection.flush()  # Force flush to ensure data is written
                
                # Verify the insert
                results = collection.query(
                    expr=f"id == '{job_data['id']}'",
                    output_fields=["*"]
                )
                
                if not results:
                    raise ValueError("Data was not successfully inserted")
                
                logger.info(f"Successfully saved and verified job description with ID: {job_data['id']}")
                return job_data
                
            except Exception as e:
                logger.error(f"Error during Milvus insert: {str(e)}")
                raise ValueError(f"Failed to insert data into Milvus: {str(e)}")

        except Exception as e:
            logger.error(f"Error saving job description: {str(e)}")
            raise ValueError(f"Error saving job description: {str(e)}")

    async def get_job_descriptions(self, status: Optional[str] = None) -> List[Dict]:
        """Get all job descriptions, optionally filtered by status"""
        try:
            collection = Collection(self.collection_name)
            collection.load()  # Ensure collection is loaded
            
            # Prepare query
            expr = f"status == '{status}'" if status else ""
            
            # Execute search
            results = collection.query(
                expr=expr,
                output_fields=["*"]
            )
            
            logger.info(f"Retrieved {len(results)} job descriptions")
            
            # Parse results
            return [self._parse_milvus_data(result) for result in results]

        except Exception as e:
            logger.error(f"Error getting job descriptions: {str(e)}")
            raise ValueError(f"Error getting job descriptions: {str(e)}")

    async def get_job_description(self, job_id: str) -> Optional[Dict]:
        """Get a specific job description by ID"""
        try:
            collection = Collection(self.collection_name)
            collection.load()  # Ensure collection is loaded
            
            # Execute search
            results = collection.query(
                expr=f"id == '{job_id}'",
                output_fields=["*"]
            )
            
            if results:
                logger.info(f"Retrieved job description with ID: {job_id}")
                return self._parse_milvus_data(results[0])
            else:
                logger.info(f"No job description found with ID: {job_id}")
                return None

        except Exception as e:
            logger.error(f"Error getting job description: {str(e)}")
            raise ValueError(f"Error getting job description: {str(e)}")

    async def search_similar_jobs(self, query_text: str, limit: int = 5) -> List[Dict]:
        """Search for similar job descriptions based on text similarity"""
        try:
            collection = Collection(self.collection_name)
            collection.load()  # Ensure collection is loaded

            # Generate query embedding
            query_embedding = self.model.encode(query_text).tolist()

            # Search
            search_params = {
                "metric_type": "L2",
                "params": {"nprobe": 10},
            }
            results = collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=limit,
                output_fields=["*"]
            )

            # Parse and return results
            return [self._parse_milvus_data(hit.entity._row_data) for hit in results[0]]

        except Exception as e:
            logger.error(f"Error searching similar jobs: {str(e)}")
            raise ValueError(f"Error searching similar jobs: {str(e)}")

milvus_job_service = MilvusJobService()