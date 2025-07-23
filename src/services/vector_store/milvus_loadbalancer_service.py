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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MilvusLoadBalancerService:
    def __init__(self):
        self.host = "localhost"
        self.port = 19532  # Updated to match new Docker port
        self.collection_name = "resumes_lb"  # Different collection name
        self.dim = 384  # Dimension of the sentence-transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.is_connected = False
        self.max_retries = 5
        self.retry_delay = 2
        self.collection = None
        self.ensure_connection()

    def ensure_connection(self) -> bool:
        """Ensure connection to Milvus and collection initialization."""
        if self.is_connected and self.collection is not None:
            return True

        if self.connect():
            try:
                # Initialize collection if it doesn't exist
                if not utility.has_collection(self.collection_name):
                    self.init_collection()
                
                # Get collection instance
                self.collection = Collection(self.collection_name)
                
                # Load collection into memory
                self.collection.load()
                
                logger.info(f"Successfully connected to collection {self.collection_name}")
                return True
            except Exception as e:
                logger.error(f"Failed to initialize collection: {e}")
                self.is_connected = False
                return False
        return False

    def connect(self) -> bool:
        """Connect to Milvus server with retries."""
        if self.is_connected:
            return True

        for attempt in range(self.max_retries):
            try:
                connections.connect(
                    alias="loadbalancer",  # Different alias
                    host=self.host,
                    port=self.port,
                    timeout=10
                )
                self.is_connected = True
                logger.info(f"Successfully connected to Milvus loadbalancer at {self.host}:{self.port}")
                return True
            except Exception as e:
                logger.error(f"Failed to connect to Milvus loadbalancer (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    logger.info(f"Retrying in {self.retry_delay} seconds...")
                    time.sleep(self.retry_delay)

        logger.warning("Failed to connect to Milvus loadbalancer after all retries.")
        return False

    def init_collection(self) -> bool:
        """Initialize the Milvus collection with schema."""
        try:
            if not self.connect():
                return False

            # Define fields for the collection
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="resume_id", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="content_vector", dtype=DataType.FLOAT_VECTOR, dim=self.dim),
                FieldSchema(name="full_name", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="email", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="phone", dtype=DataType.VARCHAR, max_length=20),
                FieldSchema(name="experience_years", dtype=DataType.INT32),
                FieldSchema(name="skills", dtype=DataType.VARCHAR, max_length=2000),
                FieldSchema(name="last_position", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="education", dtype=DataType.VARCHAR, max_length=1000),
                FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=500),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=30),
            ]

            # Create collection schema
            schema = CollectionSchema(
                fields=fields,
                description="Resume collection for vector similarity search (Loadbalancer)"
            )

            # Create collection
            collection = Collection(
                name=self.collection_name,
                schema=schema,
                using='loadbalancer',
                shards_num=2
            )

            # Create IVF_FLAT index for vector field
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            collection.create_index(
                field_name="content_vector",
                index_params=index_params
            )

            logger.info("Successfully created collection resumes_lb with schema")
            logger.info(f"Collection schema: {collection.schema}")
            
            # Load the collection into memory
            collection.load()
            
            return True

        except Exception as e:
            logger.error(f"Failed to initialize collection: {e}")
            return False

    def insert_resume(self, resume_data: Dict[str, Any]) -> bool:
        """Insert a resume into Milvus."""
        try:
            if not self.ensure_connection():
                logger.warning("Milvus loadbalancer connection not available, skipping vector storage")
                return False

            # Generate embedding from resume text
            logger.info("Generating embedding from resume text")
            embedding = self.model.encode(resume_data['raw_text'])
            
            # Calculate total experience (simplified)
            experience_years = 0
            if resume_data.get('work_experience'):
                for exp in resume_data['work_experience']:
                    if exp.get('start_date') and exp.get('end_date'):
                        experience_years += (exp['end_date'].year - exp['start_date'].year)

            # Format skills as a comma-separated string
            skills = []
            for skill in resume_data.get('skills', []):
                skill_str = skill['name']
                if skill.get('level'):
                    skill_str += f" ({skill['level']})"
                skills.append(skill_str)
            skills_str = ', '.join(skills)

            # Format education as a pipe-separated string
            education = []
            for edu in resume_data.get('education', []):
                edu_str = f"{edu.get('degree', '')} from {edu.get('institution', '')}"
                if edu.get('start_date') and edu.get('end_date'):
                    edu_str += f" ({edu['start_date'].year}-{edu['end_date'].year})"
                education.append(edu_str)
            education_str = ' | '.join(education)

            # Prepare data for insertion
            insert_data = [{
                "resume_id": f"res_{str(abs(hash(resume_data['resume_id'])))[:3].zfill(3)}",
                "content_vector": embedding.tolist(),
                "full_name": resume_data['full_name'],
                "email": resume_data.get('contact', {}).get('email', ''),
                "phone": resume_data.get('contact', {}).get('phone', '') or '',
                "experience_years": experience_years,
                "skills": skills_str,
                "last_position": resume_data.get('work_experience', [{}])[0].get('title', ''),
                "education": education_str,
                "file_path": resume_data['file_path'],
                "created_at": resume_data['created_at']
            }]

            logger.info("Inserting data into Milvus loadbalancer collection")
            mr = self.collection.insert(insert_data)
            
            # Verify insertion
            expr = f'resume_id in ["res_{str(abs(hash(resume_data["resume_id"])))[:3].zfill(3)}"]'
            results = self.collection.query(
                expr=expr,
                output_fields=["full_name", "resume_id"]
            )
            
            if results:
                logger.info(f"Successfully verified resume insertion in loadbalancer: {results}")
                return True
            else:
                logger.error("Failed to verify resume insertion in loadbalancer")
                return False

        except Exception as e:
            logger.error(f"Failed to insert resume in loadbalancer: {e}")
            return False

    def list_all_resumes(self) -> List[Dict[str, Any]]:
        """List all resumes in the collection."""
        try:
            if not self.ensure_connection():
                logger.warning("Milvus loadbalancer connection not available, cannot list resumes")
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

            logger.info(f"Found {len(results)} resumes in the loadbalancer database")
            return results

        except Exception as e:
            logger.error(f"Failed to list resumes from loadbalancer: {e}")
            return []

    def check_collection_status(self):
        """Check Milvus connection and collection status."""
        try:
            if not self.ensure_connection():
                return

            logger.info("Checking Milvus loadbalancer connection and collection status")
            
            # List all collections
            collections = utility.list_collections()
            logger.info(f"Available collections: {collections}")
            
            # Check if our collection exists
            if utility.has_collection(self.collection_name):
                logger.info(f"Collection {self.collection_name} exists")
                
                # Get collection schema
                logger.info(f"Collection schema: {self.collection.schema}")
                
                # Get statistics
                stats = self.collection.num_entities
                logger.info(f"Collection statistics: {stats}")
                
                # Try a sample query
                results = self.collection.query(
                    expr="resume_id != ''",
                    limit=1
                )
                logger.info(f"Sample query result: {results}")
            else:
                logger.warning(f"Collection {self.collection_name} does not exist")

        except Exception as e:
            logger.error(f"Error checking loadbalancer collection status: {e}")

milvus_loadbalancer_service = MilvusLoadBalancerService() 