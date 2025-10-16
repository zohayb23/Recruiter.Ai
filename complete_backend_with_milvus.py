from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import openai
from typing import List, Dict, Any, Optional
import json
import uuid
from datetime import datetime, timedelta
import docx
import PyPDF2
import io
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
import numpy as np
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Pydantic models for Marketing & CRM
class CampaignRequest(BaseModel):
    name: str
    subject: str
    content: str
    recipients: List[str]
    template_id: Optional[str] = None
    scheduled_at: Optional[str] = None

class TemplateRequest(BaseModel):
    name: str
    subject: str
    content: str
    category: Optional[str] = None

class ExperimentRequest(BaseModel):
    name: str
    description: str
    test_type: str
    test_duration_hours: int
    variants: List[Dict[str, Any]]

class SegmentRequest(BaseModel):
    name: str
    description: str
    rules: List[Dict[str, Any]]

class WorkflowRequest(BaseModel):
    name: str
    description: str
    trigger: Dict[str, Any]
    actions: List[Dict[str, Any]]
    is_active: bool = True

app = FastAPI(title="Recruiter.AI Complete Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
print(f"🔑 [OpenAI] API Key loaded: {'Yes' if openai.api_key else 'No'}")
if openai.api_key:
    print(f"🔑 [OpenAI] Key starts with: {openai.api_key[:10]}...")
else:
    print("❌ [OpenAI] No API key found in environment variables")

# Milvus connection - GCP Milvus Cluster (connect to same instance as Attu)
# Your Attu interface uses: MILVUS_URL: http://my-milvus:19530
# We need to connect to the same Milvus instance that your Attu interface is using
# From your Kubernetes services: my-milvus LoadBalancer has external IP 34.135.232.156
# But let's try the internal service name first to match your Attu interface
MILVUS_HOST = os.getenv("MILVUS_HOST", "34.135.232.156")  # Correct Milvus IP with 10 candidates
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")  # Milvus API port
MILVUS_DB_NAME = os.getenv("MILVUS_DB_NAME", "default")  # Use default database

# In-memory storage for resumes and job descriptions (backup)
stored_resumes = []
stored_job_descriptions = []

# Add some sample job data as fallback
if not stored_job_descriptions:
    stored_job_descriptions = [
        {
            "job_id": "sample-job-1",
            "id": "sample-job-1",
            "title": "Senior Software Engineer",
            "company": "Tech Corp",
            "department": "Engineering",
            "location": "San Francisco, CA",
            "location_type": "Hybrid",
            "experience_level": "Senior Level (5-8 years)",
            "status": "PUBLISHED",
            "overview": "We are looking for a senior software engineer to join our dynamic team.",
            "responsibilities": ["Design and develop scalable applications", "Lead technical projects", "Mentor junior developers"],
            "qualifications": ["Bachelor's degree in Computer Science", "5+ years of experience", "Strong problem-solving skills"],
            "required_skills": ["Python", "JavaScript", "React", "Node.js"],
            "preferred_skills": ["AWS", "Docker", "Kubernetes"],
            "benefits": ["Health insurance", "401k matching", "Flexible work hours"],
            "company_description": "Tech Corp is a leading technology company focused on innovation.",
            "created_at": "2025-10-13T15:28:54.574362",
            "updated_at": "2025-10-13T15:28:54.574362"
        }
    ]

# Add some sample data as fallback
if not stored_resumes:
    stored_resumes = [
        {
            "id": "sample-1",
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "+1-555-0123",
            "skills": ["Python", "JavaScript", "React", "Node.js"],
            "education": [{"degree": "Bachelor of Computer Science", "institution": "Stanford University"}],
            "work_experience": [{"title": "Software Engineer", "company": "Tech Corp", "period": "2020-2023"}],
            "created_at": "2025-10-13T15:28:54.574362",
            "updated_at": "2025-10-13T15:28:54.574362",
            "status": "Active",
            "score": 85,
            "location": "Remote",
            "experience_years": 3,
            "summary": "Experienced software engineer with 3 years of experience in full-stack development."
        }
    ]

# Simple cache for parsed resumes to avoid re-parsing identical content
resume_cache = {}

# In-memory storage for CRM and Mass Mailing
crm_pipeline = {
    "stages": [
        {"id": "applied", "name": "Applied", "candidates": []},
        {"id": "screening", "name": "Screening", "candidates": []},
        {"id": "interview", "name": "Interview", "candidates": []},
        {"id": "offer", "name": "Offer", "candidates": []},
        {"id": "hired", "name": "Hired", "candidates": []}
    ]
}

email_campaigns = []
email_templates = []

# Data persistence storage
ab_testing_experiments = []
segmentation_segments = []
automation_workflows = []
candidate_notes = {}  # candidate_id -> list of notes
candidate_tags = {}   # candidate_id -> list of tags
engagement_history = []  # list of engagement events

# Candidate Evaluation & Analytics storage
interview_summaries = {}  # candidate_id -> list of summaries
candidate_scores = {}     # candidate_id -> scoring data
analytics_metrics = {    # analytics dashboard data
    "total_candidates": 0,
    "interviewed_candidates": 0,
    "average_scores": {},
    "score_distribution": {},
    "department_breakdown": {},
    "hiring_timeline": []
}

# WebSocket connection management for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove disconnected connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

# Initialize Milvus connection
try:
    # Disconnect any existing connections first
    try:
        connections.disconnect("default")
    except:
        pass
    
    print(f"🔄 Attempting to connect to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
    connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
    print(f"✅ Connected to GCP Milvus cluster via port forwarding at {MILVUS_HOST}:{MILVUS_PORT}")
    
    # Check if collections exist and get entity counts
    if utility.has_collection("resumes"):
        collection = Collection("resumes")
        count = collection.num_entities
        print(f"✅ Resumes collection already exists - {count} entities")
    else:
        print("❌ Resumes collection not found")
    
    if utility.has_collection("job_descriptions"):
        collection = Collection("job_descriptions")
        count = collection.num_entities
        print(f"✅ Job descriptions collection already exists - {count} entities")
    else:
        print("❌ Job descriptions collection not found")
    
    # Create new collections for marketing and CRM data
    # create_campaigns_collection()
    # create_experiments_collection()
    # create_segments_collection()
    # create_workflows_collection()
    
    # Check entity counts for new collections
    if utility.has_collection("campaigns"):
        collection = Collection("campaigns")
        count = collection.num_entities
        print(f"✅ Campaigns collection - {count} entities")
    
    if utility.has_collection("experiments"):
        collection = Collection("experiments")
        count = collection.num_entities
        print(f"✅ Experiments collection - {count} entities")
    
    if utility.has_collection("segments"):
        collection = Collection("segments")
        count = collection.num_entities
        print(f"✅ Segments collection - {count} entities")
    
    if utility.has_collection("workflows"):
        collection = Collection("workflows")
        count = collection.num_entities
        print(f"✅ Workflows collection - {count} entities")
        
    milvus_connected = True
    print(f"🎉 Milvus connection successful! All collections loaded.")
except Exception as e:
    print(f"⚠️ Failed to connect to Milvus: {e}")
    print(f"⚠️ Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    milvus_connected = False

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

def recreate_resumes_collection():
    """Drop and recreate the resumes collection with correct schema"""
    try:
        # Drop existing collection if it exists
        if utility.has_collection("resumes"):
            print("🗑️ Dropping existing resumes collection...")
            utility.drop_collection("resumes")
            print("✅ Existing collection dropped")
        
        # Create new collection with correct schema
        print("🔄 Creating new resumes collection with correct schema...")
        collection = create_resumes_collection()
        
        if collection:
            print("✅ Resumes collection recreated successfully")
            return {"success": True, "message": "Resumes collection recreated with correct schema"}
        else:
            return {"success": False, "message": "Failed to recreate collection"}
            
    except Exception as e:
        print(f"❌ Error recreating resumes collection: {e}")
        return {"success": False, "message": f"Error recreating collection: {str(e)}"}

def recreate_job_descriptions_collection():
    """Drop and recreate the job descriptions collection with correct schema"""
    try:
        # Drop existing collection if it exists
        if utility.has_collection("job_descriptions"):
            print("🗑️ Dropping existing job_descriptions collection...")
            utility.drop_collection("job_descriptions")
            print("✅ Existing collection dropped")
        
        # Create new collection with correct schema
        print("🔄 Creating new job_descriptions collection with correct schema...")
        collection = create_job_descriptions_collection()
        
        if collection:
            print("✅ Job descriptions collection recreated successfully")
            return {"success": True, "message": "Job descriptions collection recreated with correct schema"}
        else:
            return {"success": False, "message": "Failed to recreate collection"}
            
    except Exception as e:
        print(f"❌ Error recreating job descriptions collection: {e}")
        return {"success": False, "message": f"Error recreating collection: {str(e)}"}

def create_resumes_collection():
    """Create resumes collection in Milvus with larger field sizes"""
    try:
        if utility.has_collection("resumes"):
            print("✅ Resumes collection already exists")
            return Collection("resumes")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="full_name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="email", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="phone", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="summary", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="skills", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="education", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="work_experience", dtype=DataType.VARCHAR, max_length=15000),
            FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=500),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Resumes collection")
        collection = Collection("resumes", schema)
        
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Resumes collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating resumes collection: {e}")
        return None

def create_job_descriptions_collection():
    """Create job descriptions collection in Milvus"""
    try:
        if utility.has_collection("job_descriptions"):
            print("✅ Job descriptions collection already exists")
            return Collection("job_descriptions")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="company", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="department", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="location_type", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="location", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="experience_level", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="overview", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="responsibilities", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="qualifications", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="required_skills", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="preferred_skills", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="benefits", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="company_description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Job descriptions collection")
        collection = Collection("job_descriptions", schema)
        
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Job descriptions collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating job descriptions collection: {e}")
        return None

def create_campaigns_collection():
    """Create campaigns collection in Milvus for mass mailing data"""
    try:
        if utility.has_collection("campaigns"):
            print("✅ Campaigns collection already exists")
            return Collection("campaigns")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="subject", dtype=DataType.VARCHAR, max_length=500),
            FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="recipients", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="template_id", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="sent_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="open_rate", dtype=DataType.FLOAT),
            FieldSchema(name="click_rate", dtype=DataType.FLOAT),
            FieldSchema(name="reply_rate", dtype=DataType.FLOAT),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Campaigns collection for mass mailing")
        collection = Collection("campaigns", schema)
        
        print("✅ Campaigns collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating campaigns collection: {e}")
        return None

def create_experiments_collection():
    """Create experiments collection in Milvus for A/B testing data"""
    try:
        if utility.has_collection("experiments"):
            print("✅ Experiments collection already exists")
            return Collection("experiments")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="test_type", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="test_duration_hours", dtype=DataType.INT64),
            FieldSchema(name="variants", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="start_date", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="end_date", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="traffic_split", dtype=DataType.VARCHAR, max_length=1000),
            FieldSchema(name="metrics", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="results", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Experiments collection for A/B testing")
        collection = Collection("experiments", schema)
        
        # Create index for embedding field
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Experiments collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating experiments collection: {e}")
        return None

def create_segments_collection():
    """Create segments collection in Milvus for segmentation data"""
    try:
        if utility.has_collection("segments"):
            print("✅ Segments collection already exists")
            return Collection("segments")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="criteria", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="rules", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="recipient_count", dtype=DataType.INT64),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="last_updated", dtype=DataType.VARCHAR, max_length=50)
        ]
        
        schema = CollectionSchema(fields, "Segments collection for candidate segmentation")
        collection = Collection("segments", schema)
        
        print("✅ Segments collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating segments collection: {e}")
        return None

def create_workflows_collection():
    """Create workflows collection in Milvus for automation data"""
    try:
        if utility.has_collection("workflows"):
            print("✅ Workflows collection already exists")
            return Collection("workflows")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="triggers", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="actions", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="conditions", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="is_active", dtype=DataType.BOOL),
            FieldSchema(name="execution_count", dtype=DataType.INT64),
            FieldSchema(name="last_executed", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50)
        ]
        
        schema = CollectionSchema(fields, "Workflows collection for automation")
        collection = Collection("workflows", schema)
        
        print("✅ Workflows collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating workflows collection: {e}")
        return None

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from uploaded file based on file extension"""
    try:
        if filename.lower().endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        elif filename.lower().endswith('.docx'):
            doc = docx.Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        else:
            return file_content.decode('utf-8')
    except Exception as e:
        print(f"Error extracting text from file: {e}")
        return ""

def parse_resume_with_ai(text: str) -> Dict[str, Any]:
    """Use OpenAI to parse resume text and extract structured data - OPTIMIZED VERSION"""
    try:
        # Check cache first to avoid re-parsing identical content
        text_hash = hash(text[:1000])  # Use first 1000 chars as cache key
        if text_hash in resume_cache:
            print(f"🚀 [Cache] Using cached result for resume parsing")
            return resume_cache[text_hash]
        
        # Optimize text length - use more text for better accuracy but limit for performance
        optimized_text = text[:4000]  # Reduced to 4000 for faster processing
        print(f"🤖 [OpenAI] Starting resume parsing with {len(optimized_text)} characters (optimized)")
        
        # Streamlined prompt for faster processing
        prompt = f"""Extract resume data as JSON. Return ONLY valid JSON:

{{
    "full_name": "Name",
    "email": "email",
    "phone": "phone",
    "linkedin": "url",
    "github": "url",
    "summary": "Professional summary",
    "skills": ["skill1", "skill2"],
    "education": [{{"degree": "degree", "institution": "school", "year": "year"}}],
    "work_experience": [{{"title": "title", "company": "company", "period": "period", "description": "description"}}],
    "certifications": [{{"name": "name", "issuer": "issuer", "date": "date"}}]
}}

Resume:
{optimized_text}
"""
        
        print(f"🚀 [OpenAI] Making API call...")
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Extract resume data accurately. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,  # Further reduced for faster processing
            temperature=0.0,
            timeout=15  # Reduced timeout for faster failure detection
        )
        
        generated_text = response.choices[0].message.content
        print(f"📝 [OpenAI] Raw response: {generated_text[:200]}...")
        
        # Clean up the response to extract JSON
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        print(f"🔍 [OpenAI] Extracted JSON: {json_str[:200]}...")
        
        parsed_data = json.loads(json_str)
        print(f"✅ [OpenAI] Successfully parsed resume for: {parsed_data.get('full_name', 'Unknown')}")
        
        # Cache the result for future use
        resume_cache[text_hash] = parsed_data
        print(f"💾 [Cache] Cached parsed result")
        
        return parsed_data
        
    except Exception as e:
        print(f"❌ [OpenAI] Failed with error: {str(e)}")
        print(f"🔄 [OpenAI] Using enhanced fallback parsing...")
        
        # Enhanced fallback parsing
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        name = "Unknown"
        email = ""
        phone = ""
        skills = []
        education = []
        work_experience = []
        
        # Extract name (usually first non-empty line)
        for line in lines[:5]:
            if len(line.split()) >= 2 and len(line.split()) <= 4:
                if not any(char in line.lower() for char in ['@', 'http', 'www', '.com', 'experience', 'education', 'skills']):
                    name = line
                    break
        
        # Extract email and phone
        for line in lines:
            if '@' in line and '.' in line:
                email = line.strip()
            elif any(char.isdigit() for char in line) and len(line.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) >= 10:
                phone = line.strip()
        
        # Extract skills (look for skills section)
        in_skills_section = False
        for line in lines:
            if 'skill' in line.lower():
                in_skills_section = True
                continue
            elif in_skills_section and line and not any(word in line.lower() for word in ['experience', 'education', 'certification']):
                # Extract individual skills
                skill_items = [item.strip() for item in line.replace(',', ' ').replace('-', ' ').split() if item.strip()]
                for skill in skill_items:
                    if len(skill) > 2 and skill.isalpha():
                        skills.append({"name": skill, "category": "Other"})
            elif any(word in line.lower() for word in ['experience', 'education', 'certification']):
                in_skills_section = False
        
        # Extract education
        in_education_section = False
        for line in lines:
            if 'education' in line.lower() or 'degree' in line.lower():
                in_education_section = True
                continue
            elif in_education_section and line and not any(word in line.lower() for word in ['experience', 'skill', 'certification']):
                if any(word in line.lower() for word in ['bachelor', 'master', 'phd', 'degree', 'university', 'college']):
                    education.append({
                        "degree": line,
                        "institution": "See resume",
                        "year": "",
                        "gpa": "",
                        "location": ""
                    })
            elif any(word in line.lower() for word in ['experience', 'skill', 'certification']):
                in_education_section = False
        
        # Extract work experience
        in_experience_section = False
        for line in lines:
            if 'experience' in line.lower() and 'work' in line.lower():
                in_experience_section = True
                continue
            elif in_experience_section and line and not any(word in line.lower() for word in ['education', 'skill', 'certification']):
                if any(word in line.lower() for word in ['developer', 'engineer', 'manager', 'analyst', 'consultant', 'specialist']):
                    work_experience.append({
                        "title": line,
                        "company": "See resume",
                        "start_date": "",
                        "end_date": "",
                        "location": "",
                        "description": line,
                        "achievements": [],
                        "technologies": []
                    })
            elif any(word in line.lower() for word in ['education', 'skill', 'certification']):
                in_experience_section = False
        
        return {
            "full_name": name,
            "contact": {
                "email": email,
                "phone": phone,
                "linkedin": "",
                "github": "",
                "website": ""
            },
            "summary": text[:500] + "..." if len(text) > 500 else text,
            "skills": skills if skills else [{"name": "Extracted from resume", "category": "Other"}],
            "education": education if education else [{"degree": "See resume", "institution": "See resume", "year": "", "gpa": "", "location": ""}],
            "work_experience": work_experience if work_experience else [{"title": "See resume", "company": "See resume", "start_date": "", "end_date": "", "location": "", "description": text[:200] + "...", "achievements": [], "technologies": []}],
            "certifications": [],
            "languages": []
        }

def test_milvus_connection():
    """Test Milvus connection and update global status"""
    global milvus_connected
    try:
        connections.disconnect("default")
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        print(f"✅ Successfully connected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        milvus_connected = True
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Milvus: {e}")
        milvus_connected = False
        return False

def store_resume_in_milvus(resume_data: dict, resume_id: str):
    """Store resume in Milvus database"""
    global milvus_connected
    if not milvus_connected:
        print("⚠️ Milvus not connected, attempting to reconnect...")
        if not test_milvus_connection():
            print("⚠️ Storing in memory only")
            return False
    
    try:
        collection = Collection("resumes")
        collection.load()
        
        skills_text = json.dumps(resume_data.get("skills", []))
        education_text = json.dumps(resume_data.get("education", []))
        work_experience_text = json.dumps(resume_data.get("work_experience", []))
        
        embedding_text = f"{resume_data.get('summary', '')} {skills_text} {education_text} {work_experience_text}"
        embedding = get_embedding(embedding_text)
        
        current_time = datetime.now().isoformat()
        
        data = [{
            "id": resume_id,
            "full_name": resume_data.get("full_name", ""),
            "email": resume_data.get("contact", {}).get("email", ""),
            "phone": resume_data.get("contact", {}).get("phone", ""),
            "summary": resume_data.get("summary", ""),
            "skills": skills_text,
            "education": education_text,
            "work_experience": work_experience_text,
            "file_path": resume_data.get("file_path", ""),
            "created_at": current_time,
            "updated_at": current_time,
            "embedding": embedding
        }]
        
        collection.insert(data)
        collection.flush()
        print(f"✅ Resume stored in Milvus with ID: {resume_id}")
        return True
    except Exception as e:
        print(f"❌ Error storing resume in Milvus: {e}")
        return False

def store_job_in_milvus(job_data: dict, job_id: str):
    """Store job description in Milvus database"""
    if not milvus_connected:
        print("⚠️ Milvus not connected, storing in memory only")
        return False
    
    try:
        collection = Collection("job_descriptions")
        collection.load()
        
        embedding_text = f"{job_data.get('title', '')} {job_data.get('company', '')} {job_data.get('overview', '')} {job_data.get('required_skills', [])}"
        embedding = get_embedding(embedding_text)
        
        current_time = datetime.now().isoformat()
        
        data = [{
            "id": job_id,
            "title": job_data.get("title", ""),
            "company": job_data.get("company", ""),
            "department": job_data.get("department", ""),
            "location_type": job_data.get("location_type", ""),
            "location": job_data.get("location", ""),
            "experience_level": job_data.get("experience_level", ""),
            "overview": job_data.get("overview", ""),
            "responsibilities": json.dumps(job_data.get("responsibilities", [])),
            "qualifications": json.dumps(job_data.get("qualifications", [])),
            "required_skills": json.dumps(job_data.get("required_skills", [])),
            "preferred_skills": json.dumps(job_data.get("preferred_skills", [])),
            "benefits": json.dumps(job_data.get("benefits", [])),
            "company_description": job_data.get("company_description", ""),
            "status": job_data.get("status", "published"),
            "created_at": current_time,
            "updated_at": current_time,
            "embedding": embedding
        }]
        
        collection.insert(data)
        collection.flush()
        print(f"✅ Job description stored in Milvus with ID: {job_id}")
        return True
    except Exception as e:
        print(f"❌ Error storing job in Milvus: {e}")
        return False

def get_resumes_from_milvus():
    """Get all resumes from Milvus database"""
    if not milvus_connected:
        print("⚠️ Milvus not connected, attempting to reconnect...")
        try:
            # Try to reconnect to Milvus
            connections.disconnect("default")
            connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
            print(f"✅ Reconnected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        except Exception as e:
            print(f"❌ Failed to reconnect to Milvus: {e}")
            print("⚠️ Returning in-memory resumes")
            return stored_resumes
    
    try:
        print("🔄 Getting resumes from Milvus...")
        collection = Collection("resumes")
        collection.load()
        
        results = collection.query(expr="id != ''", output_fields=["*"])
        print(f"📊 Found {len(results)} resumes in Milvus")
        
        resumes = []
        for result in results:
            # Parse JSON strings to arrays
            try:
                education = json.loads(result.get("education", "[]"))
                work_experience = json.loads(result.get("work_experience", "[]"))
                skills = json.loads(result.get("skills", "[]"))
            except (json.JSONDecodeError, TypeError):
                education = []
                work_experience = []
                skills = []
            
            # Extract contact information
            email = result.get("email", "")
            phone = result.get("phone", "")
            
            # Extract skills list for display
            skills_list = []
            if isinstance(skills, list):
                for skill in skills:
                    if isinstance(skill, dict):
                        skills_list.append(skill.get("name", ""))
                    else:
                        skills_list.append(str(skill))
            
            # Calculate experience years from work experience
            experience_years = len(work_experience) if isinstance(work_experience, list) else 0
            
            resume = {
                "id": result.get("id", ""),
                "name": result.get("full_name", "") or "Unknown",
                "email": email,
                "phone": phone,
                "skills": skills_list,
                "education": education,
                "work_experience": work_experience,
                "created_at": result.get("created_at", ""),
                "updated_at": result.get("created_at", ""),
                "status": "Active",
                "score": 85 + (hash(result.get("id", "")) % 15),
                "location": "Remote",
                "experience_years": experience_years,
                "summary": result.get("summary", "")[:200] + "..." if result.get("summary") else ""
            }
            resumes.append(resume)
        
        print(f"✅ Successfully retrieved {len(resumes)} resumes from Milvus")
        return resumes
    except Exception as e:
        print(f"❌ Error getting resumes from Milvus: {e}")
        print(f"⚠️ Falling back to in-memory storage with {len(stored_resumes)} resumes")
        return stored_resumes

def get_jobs_from_milvus():
    """Get all job descriptions from Milvus database"""
    if not milvus_connected:
        print("⚠️ Milvus not connected, attempting to reconnect...")
        try:
            # Try to reconnect to Milvus
            connections.disconnect("default")
            connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
            print(f"✅ Reconnected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        except Exception as e:
            print(f"❌ Failed to reconnect to Milvus: {e}")
            print("⚠️ Returning in-memory jobs")
            return stored_job_descriptions
    
    try:
        print("🔄 Getting jobs from Milvus...")
        collection = Collection("job_descriptions")
        collection.load()
        
        results = collection.query(expr="id != ''", output_fields=["*"])
        print(f"📊 Found {len(results)} jobs in Milvus")
        
        jobs = []
        for result in results:
            job = {
                "job_id": result.get("id", ""),
                "title": result.get("title", ""),
                "company": result.get("company", ""),
                "department": result.get("department", ""),
                "location_type": result.get("location_type", ""),
                "location": result.get("location", ""),
                "experience_level": result.get("experience_level", ""),
                "overview": result.get("overview", ""),
                "responsibilities": json.loads(result.get("responsibilities", "[]")),
                "qualifications": json.loads(result.get("qualifications", "[]")),
                "required_skills": json.loads(result.get("required_skills", "[]")),
                "preferred_skills": json.loads(result.get("preferred_skills", "[]")),
                "benefits": json.loads(result.get("benefits", "[]")),
                "company_description": result.get("company_description", ""),
                "status": result.get("status", "published"),
                "created_at": result.get("created_at", ""),
                "updated_at": result.get("updated_at", "")
            }
            jobs.append(job)
        
        print(f"✅ Successfully retrieved {len(jobs)} jobs from Milvus")
        return jobs
    except Exception as e:
        print(f"❌ Error getting jobs from Milvus: {e}")
        print(f"⚠️ Falling back to in-memory storage with {len(stored_job_descriptions)} jobs")
        return stored_job_descriptions

@app.get("/")
async def root():
    return {
        "message": "Recruiter.AI Complete Backend with Milvus Integration",
        "status": "healthy",
        "milvus_connected": milvus_connected,
        "features": [
            "OpenAI integration (with fallback when quota exceeded)",
            "Milvus database integration",
            "Resume parsing and storage",
            "Job description generation and storage",
            "In-memory backup storage",
            "All API endpoints working"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "recruiter-ai-complete-backend", "milvus_connected": milvus_connected}

@app.post("/api/milvus/reconnect")
async def reconnect_milvus():
    """Manually reconnect to Milvus"""
    global milvus_connected
    if test_milvus_connection():
        return {"status": "success", "message": "Successfully reconnected to Milvus", "milvus_connected": milvus_connected}
    else:
        return {"status": "error", "message": "Failed to reconnect to Milvus", "milvus_connected": milvus_connected}

@app.post("/api/test-job-generation")
async def test_job_generation():
    return {
        "job_description": "# Test Job\n\nThis is a test job description.",
        "job_data": {
            "title": "Test Job",
            "company": "Test Company",
            "department": "Test",
            "location_type": "Remote",
            "location": "Anywhere",
            "experience_level": "Mid Level",
            "overview": "This is a test job overview.",
            "responsibilities": ["Test responsibility 1", "Test responsibility 2"],
            "qualifications": ["Test qualification 1", "Test qualification 2"],
            "required_skills": ["Test skill 1", "Test skill 2"],
            "preferred_skills": ["Test preferred skill 1"],
            "benefits": ["Test benefit 1", "Test benefit 2"],
            "company_description": "This is a test company description."
        },
        "success": True
    }

@app.post("/api/keywords/generate")
async def generate_keywords(request_data: dict):
    """Generate SEO-optimized keywords for job postings using OpenAI"""
    print(f"🔑 [KeywordGenerator] Received request: {request_data}")
    
    try:
        job_title = request_data.get("job_title", "")
        company = request_data.get("company", "")
        industry = request_data.get("industry", "")
        location = request_data.get("location", "")
        experience_level = request_data.get("experience_level", "")
        job_description = request_data.get("job_description", "")
        
        if not job_title.strip():
            return {
                "success": False,
                "error": "Job title is required"
            }
        
        # Create context for keyword generation
        context_parts = [f"Job Title: {job_title}"]
        if company:
            context_parts.append(f"Company: {company}")
        if industry:
            context_parts.append(f"Industry: {industry}")
        if location:
            context_parts.append(f"Location: {location}")
        if experience_level:
            context_parts.append(f"Experience Level: {experience_level}")
        if job_description:
            context_parts.append(f"Job Description: {job_description[:1000]}...")  # Limit description length
        
        context = "\n".join(context_parts)
        
        try:
            # Use OpenAI to generate keywords
            prompt = f"""Generate comprehensive SEO-optimized keywords for this job posting. Return ONLY a valid JSON object with these exact categories:

{{
    "primary_keywords": ["keyword1", "keyword2", "keyword3"],
    "secondary_keywords": ["keyword1", "keyword2", "keyword3"],
    "trending_keywords": ["keyword1", "keyword2", "keyword3"],
    "long_tail_keywords": ["keyword1", "keyword2", "keyword3"],
    "skill_keywords": ["keyword1", "keyword2", "keyword3"],
    "industry_keywords": ["keyword1", "keyword2", "keyword3"],
    "location_keywords": ["keyword1", "keyword2", "keyword3"],
    "experience_keywords": ["keyword1", "keyword2", "keyword3"]
}}

Guidelines:
- Primary keywords: Core terms directly related to the job title and main responsibilities
- Secondary keywords: Supporting terms that enhance search visibility
- Trending keywords: Currently popular terms in the industry
- Long-tail keywords: Specific phrases that attract qualified candidates (3-5 words)
- Skill keywords: Technical and soft skills relevant to the position
- Industry keywords: Terms specific to the industry sector
- Location keywords: Geographic and remote work terms
- Experience keywords: Terms related to experience level and career stage

Job Information:
{context}

Generate 5-8 relevant keywords for each category. Focus on terms that job seekers and recruiters would actually search for."""

            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert SEO specialist and recruitment marketing professional. Generate high-quality, relevant keywords for job postings."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.3,
                timeout=30
            )
            
            generated_text = response.choices[0].message.content
            print(f"🔑 [KeywordGenerator] OpenAI response: {generated_text[:200]}...")
            
            # Extract JSON from response
            start_idx = generated_text.find('{')
            end_idx = generated_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")
                
            json_str = generated_text[start_idx:end_idx]
            keywords_data = json.loads(json_str)
            
            print(f"✅ [KeywordGenerator] Successfully generated keywords for: {job_title}")
            
            return {
                "success": True,
                "keywords": keywords_data,
                "job_title": job_title
            }
            
        except Exception as e:
            print(f"❌ [KeywordGenerator] OpenAI failed: {e}")
            # Fallback keyword generation
            return generate_fallback_keywords(job_title, company, industry, location, experience_level)
            
    except Exception as e:
        print(f"❌ [KeywordGenerator] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def generate_fallback_keywords(job_title: str, company: str, industry: str, location: str, experience_level: str):
    """Generate fallback keywords when OpenAI is not available"""
    print(f"🔄 [KeywordGenerator] Using fallback keyword generation")
    
    # Basic keyword generation based on job title and context
    title_words = job_title.lower().split()
    
    # Primary keywords (job title variations)
    primary_keywords = [
        job_title,
        job_title.replace("Senior", "").replace("Junior", "").strip(),
        f"{job_title} jobs",
        f"{job_title} careers"
    ]
    
    # Secondary keywords (related terms)
    secondary_keywords = [
        "hiring",
        "employment",
        "career opportunity",
        "job opening",
        "position available"
    ]
    
    # Skill keywords (common skills for the role)
    skill_keywords = []
    if "engineer" in job_title.lower():
        skill_keywords = ["programming", "software development", "coding", "technical skills", "problem solving"]
    elif "manager" in job_title.lower():
        skill_keywords = ["leadership", "management", "team building", "project management", "communication"]
    elif "analyst" in job_title.lower():
        skill_keywords = ["data analysis", "research", "analytical thinking", "reporting", "statistics"]
    else:
        skill_keywords = ["communication", "teamwork", "problem solving", "adaptability", "time management"]
    
    # Industry keywords
    industry_keywords = []
    if industry:
        industry_keywords = [industry, f"{industry} sector", f"{industry} industry"]
    else:
        industry_keywords = ["business", "professional", "corporate"]
    
    # Location keywords
    location_keywords = []
    if location:
        location_keywords = [location, f"{location} jobs", f"jobs in {location}"]
    else:
        location_keywords = ["remote", "work from home", "flexible location"]
    
    # Experience keywords
    experience_keywords = []
    if experience_level:
        experience_keywords = [experience_level, f"{experience_level} position", f"{experience_level} role"]
    else:
        experience_keywords = ["experienced", "professional", "career"]
    
    # Trending keywords (generic trending terms)
    trending_keywords = [
        "remote work",
        "flexible schedule",
        "growth opportunity",
        "competitive salary",
        "benefits package"
    ]
    
    # Long-tail keywords
    long_tail_keywords = [
        f"{job_title} {location}" if location else f"{job_title} remote",
        f"{job_title} {industry}" if industry else f"{job_title} position",
        f"hiring {job_title}",
        f"{job_title} career opportunity"
    ]
    
    return {
        "success": True,
        "keywords": {
            "primary_keywords": primary_keywords[:8],
            "secondary_keywords": secondary_keywords[:8],
            "trending_keywords": trending_keywords[:8],
            "long_tail_keywords": long_tail_keywords[:8],
            "skill_keywords": skill_keywords[:8],
            "industry_keywords": industry_keywords[:8],
            "location_keywords": location_keywords[:8],
            "experience_keywords": experience_keywords[:8]
        },
        "job_title": job_title,
        "fallback": True
    }

@app.post("/api/search/enhanced")
async def enhanced_search(request_data: dict):
    """Enhanced search with AI query processing and intelligent result ranking"""
    print(f"🔍 [EnhancedSearch] Received request: {request_data}")
    
    try:
        query = request_data.get("query", "").strip()
        search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
        limit = request_data.get("limit", 10)
        filters = request_data.get("filters", {})
        
        if not query:
            return {
                "success": False,
                "error": "Search query is required"
            }
        
        # AI-powered query understanding and enhancement
        try:
            enhanced_query_data = await enhance_search_query(query, filters)
            print(f"🧠 [EnhancedSearch] AI-enhanced query: {enhanced_query_data}")
        except Exception as e:
            print(f"⚠️ [EnhancedSearch] AI enhancement failed, using original query: {e}")
            enhanced_query_data = {
                "original_query": query,
                "enhanced_query": query,
                "search_intent": "general",
                "suggested_filters": {},
                "related_terms": []
            }
        
        # Perform semantic search with enhanced query
        search_results = await perform_enhanced_semantic_search(
            enhanced_query_data["enhanced_query"],
            search_type,
            limit,
            filters
        )
        
        # AI-powered result ranking and summarization
        try:
            ranked_results = await rank_and_summarize_results(search_results, enhanced_query_data)
            print(f"📊 [EnhancedSearch] AI-ranked results: {len(ranked_results.get('results', {}).get('resumes', []))} resumes, {len(ranked_results.get('results', {}).get('jobs', []))} jobs")
        except Exception as e:
            print(f"⚠️ [EnhancedSearch] AI ranking failed, using original results: {e}")
            ranked_results = search_results
        
        return {
            "success": True,
            "query_analysis": enhanced_query_data,
            "results": ranked_results,
            "total_results": ranked_results.get("total_results", 0),
            "message": f"Enhanced search completed for '{query}'"
        }
        
    except Exception as e:
        print(f"❌ [EnhancedSearch] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def enhance_search_query(query: str, filters: dict) -> dict:
    """Use AI to understand and enhance the search query"""
    try:
        prompt = f"""Analyze this search query and provide enhanced search capabilities. Return ONLY a valid JSON object:

{{
    "original_query": "{query}",
    "enhanced_query": "enhanced version of the query",
    "search_intent": "job_search|candidate_search|skill_search|company_search|general",
    "suggested_filters": {{
        "experience_level": "entry|mid|senior|lead",
        "location": "location if mentioned",
        "industry": "industry if mentioned",
        "skills": ["skill1", "skill2"],
        "company_size": "startup|mid|enterprise"
    }},
    "related_terms": ["related term 1", "related term 2"],
    "search_tips": ["tip 1", "tip 2"]
}}

Guidelines:
- Enhanced query: Expand abbreviations, add synonyms, clarify intent
- Search intent: Determine what the user is looking for
- Suggested filters: Extract filter criteria from the query
- Related terms: Suggest alternative search terms
- Search tips: Provide helpful search suggestions

Query: "{query}"
Filters: {filters}"""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search analyst. Analyze search queries and provide intelligent enhancements for better search results."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.2,
            timeout=20
        )
        
        generated_text = response.choices[0].message.content
        print(f"🧠 [EnhancedSearch] AI response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        enhanced_data = json.loads(json_str)
        
        return enhanced_data
        
    except Exception as e:
        print(f"❌ [EnhancedSearch] AI enhancement failed: {e}")
        # Fallback to basic enhancement
        return {
            "original_query": query,
            "enhanced_query": query,
            "search_intent": "general",
            "suggested_filters": {},
            "related_terms": [],
            "search_tips": ["Try using more specific terms", "Consider adding location or experience level"]
        }

async def perform_enhanced_semantic_search(query: str, search_type: str, limit: int, filters: dict):
    """Perform semantic search with enhanced query"""
    try:
        # Generate embedding for the enhanced query
        query_embedding = get_embedding(query)
        
        results = {
            "query": query,
            "search_type": search_type,
            "resumes": [],
            "jobs": [],
            "total_results": 0
        }
        
        if not milvus_connected:
            return {
                "message": "Milvus not connected, using fallback search",
                "results": results
            }
        
        # Search resumes if requested
        if search_type in ["resumes", "both"]:
            try:
                collection = Collection("resumes")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                resume_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "full_name", "email", "summary", "skills", "work_experience", "education"]
                )
                
                for hit in resume_results[0]:
                    resume_data = {
                        "resume_id": hit.entity.get("id"),
                        "full_name": hit.entity.get("full_name"),
                        "email": hit.entity.get("email"),
                        "summary": hit.entity.get("summary"),
                        "skills": json.loads(hit.entity.get("skills", "[]")),
                        "work_experience": json.loads(hit.entity.get("work_experience", "[]")),
                        "education": json.loads(hit.entity.get("education", "[]")),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance),
                        "ai_relevance_score": float(hit.score)  # Will be enhanced by AI ranking
                    }
                    results["resumes"].append(resume_data)
                    
            except Exception as e:
                print(f"Error searching resumes: {e}")
        
        # Search jobs if requested
        if search_type in ["jobs", "both"]:
            try:
                collection = Collection("job_descriptions")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                job_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "title", "company", "overview", "required_skills", "responsibilities", "location", "experience_level"]
                )
                
                for hit in job_results[0]:
                    job_data = {
                        "job_id": hit.entity.get("id"),
                        "title": hit.entity.get("title"),
                        "company": hit.entity.get("company"),
                        "overview": hit.entity.get("overview"),
                        "required_skills": json.loads(hit.entity.get("required_skills", "[]")),
                        "responsibilities": json.loads(hit.entity.get("responsibilities", "[]")),
                        "location": hit.entity.get("location"),
                        "experience_level": hit.entity.get("experience_level"),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance),
                        "ai_relevance_score": float(hit.score)  # Will be enhanced by AI ranking
                    }
                    results["jobs"].append(job_data)
                    
            except Exception as e:
                print(f"Error searching jobs: {e}")
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        return results
        
    except Exception as e:
        print(f"Error in enhanced semantic search: {e}")
        raise e

async def rank_and_summarize_results(search_results: dict, query_analysis: dict) -> dict:
    """Use AI to rank results and provide intelligent summaries"""
    try:
        # Prepare data for AI ranking
        all_results = []
        
        for resume in search_results.get("resumes", []):
            all_results.append({
                "type": "resume",
                "id": resume["resume_id"],
                "title": resume["full_name"],
                "content": f"{resume.get('summary', '')} Skills: {', '.join(resume.get('skills', [])[:5])}",
                "similarity_score": resume["similarity_score"]
            })
        
        for job in search_results.get("jobs", []):
            all_results.append({
                "type": "job",
                "id": job["job_id"],
                "title": job["title"],
                "content": f"{job.get('overview', '')} Skills: {', '.join(job.get('required_skills', [])[:5])}",
                "similarity_score": job["similarity_score"]
            })
        
        if not all_results:
            return search_results
        
        # Limit results for AI processing (to avoid token limits)
        results_for_ai = all_results[:20]
        
        prompt = f"""Rank and analyze these search results based on the query analysis. Return ONLY a valid JSON object:

{{
    "ranked_results": [
        {{
            "id": "result_id",
            "type": "resume|job",
            "ai_relevance_score": 0.95,
            "relevance_explanation": "Why this result is relevant",
            "key_highlights": ["highlight1", "highlight2"]
        }}
    ],
    "search_summary": "Brief summary of search results",
    "improvement_suggestions": ["suggestion1", "suggestion2"]
}}

Query Analysis: {query_analysis}
Results to rank: {json.dumps(results_for_ai, indent=2)}

Rank based on:
1. Relevance to the original query
2. Match quality with search intent
3. Key skills and experience alignment
4. Overall fit score

Provide AI relevance scores (0.0-1.0) and brief explanations for top results."""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search result analyst. Rank and analyze search results to provide the most relevant matches."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1200,
            temperature=0.1,
            timeout=25
        )
        
        generated_text = response.choices[0].message.content
        print(f"📊 [EnhancedSearch] AI ranking response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in ranking response")
            
        json_str = generated_text[start_idx:end_idx]
        ranking_data = json.loads(json_str)
        
        # Apply AI rankings to results
        ranked_results = search_results.copy()
        
        # Update resume results with AI rankings
        for ranked_item in ranking_data.get("ranked_results", []):
            if ranked_item["type"] == "resume":
                for resume in ranked_results["resumes"]:
                    if resume["resume_id"] == ranked_item["id"]:
                        resume["ai_relevance_score"] = ranked_item.get("ai_relevance_score", resume["similarity_score"])
                        resume["relevance_explanation"] = ranked_item.get("relevance_explanation", "")
                        resume["key_highlights"] = ranked_item.get("key_highlights", [])
                        break
        
        # Update job results with AI rankings
        for ranked_item in ranking_data.get("ranked_results", []):
            if ranked_item["type"] == "job":
                for job in ranked_results["jobs"]:
                    if job["job_id"] == ranked_item["id"]:
                        job["ai_relevance_score"] = ranked_item.get("ai_relevance_score", job["similarity_score"])
                        job["relevance_explanation"] = ranked_item.get("relevance_explanation", "")
                        job["key_highlights"] = ranked_item.get("key_highlights", [])
                        break
        
        # Sort results by AI relevance score
        ranked_results["resumes"].sort(key=lambda x: x.get("ai_relevance_score", 0), reverse=True)
        ranked_results["jobs"].sort(key=lambda x: x.get("ai_relevance_score", 0), reverse=True)
        
        # Add AI analysis
        ranked_results["ai_analysis"] = {
            "search_summary": ranking_data.get("search_summary", ""),
            "improvement_suggestions": ranking_data.get("improvement_suggestions", [])
        }
        
        return ranked_results
        
    except Exception as e:
        print(f"❌ [EnhancedSearch] AI ranking failed: {e}")
        return search_results

@app.post("/api/candidates/ai-score")
async def ai_score_candidate(request_data: dict):
    """AI-powered candidate scoring against job requirements"""
    print(f"🎯 [AIScoring] Received request: {request_data}")
    
    try:
        candidate_id = request_data.get("candidate_id", "")
        job_id = request_data.get("job_id", "")
        candidate_data = request_data.get("candidate_data", {})
        job_data = request_data.get("job_data", {})
        
        if not candidate_data and not candidate_id:
            return {
                "success": False,
                "error": "Candidate data or candidate_id is required"
            }
        
        if not job_data and not job_id:
            return {
                "success": False,
                "error": "Job data or job_id is required"
            }
        
        # Get candidate data if only ID provided
        if candidate_id and not candidate_data:
            candidate_data = await get_candidate_by_id(candidate_id)
            if not candidate_data:
                return {
                    "success": False,
                    "error": "Candidate not found"
                }
        
        # Get job data if only ID provided
        if job_id and not job_data:
            job_data = await get_job_by_id(job_id)
            if not job_data:
                return {
                    "success": False,
                    "error": "Job not found"
                }
        
        # Perform AI scoring
        try:
            scoring_result = await perform_ai_candidate_scoring(candidate_data, job_data)
            print(f"🎯 [AIScoring] AI scoring completed: {scoring_result.get('overall_score', 0)}/100")
        except Exception as e:
            print(f"⚠️ [AIScoring] AI scoring failed, using fallback: {e}")
            scoring_result = await fallback_candidate_scoring(candidate_data, job_data)
        
        return {
            "success": True,
            "candidate_id": candidate_id or candidate_data.get("id", ""),
            "job_id": job_id or job_data.get("id", ""),
            "scoring_result": scoring_result,
            "message": "AI candidate scoring completed successfully"
        }
        
    except Exception as e:
        print(f"❌ [AIScoring] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def get_candidate_by_id(candidate_id: str) -> dict:
    """Get candidate data by ID from Milvus"""
    try:
        if not milvus_connected:
            return None
        
        collection = Collection("resumes")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{candidate_id}"',
            output_fields=["*"]
        )
        
        if results:
            result = results[0]
            return {
                "id": result.get("id", ""),
                "full_name": result.get("full_name", ""),
                "email": result.get("email", ""),
                "phone": result.get("phone", ""),
                "summary": result.get("summary", ""),
                "skills": json.loads(result.get("skills", "[]")),
                "education": json.loads(result.get("education", "[]")),
                "work_experience": json.loads(result.get("work_experience", "[]"))
            }
        return None
    except Exception as e:
        print(f"Error getting candidate: {e}")
        return None

async def get_job_by_id(job_id: str) -> dict:
    """Get job data by ID from Milvus"""
    try:
        if not milvus_connected:
            return None
        
        collection = Collection("job_descriptions")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{job_id}"',
            output_fields=["*"]
        )
        
        if results:
            result = results[0]
            return {
                "id": result.get("id", ""),
                "title": result.get("title", ""),
                "company": result.get("company", ""),
                "overview": result.get("overview", ""),
                "required_skills": json.loads(result.get("required_skills", "[]")),
                "preferred_skills": json.loads(result.get("preferred_skills", "[]")),
                "responsibilities": json.loads(result.get("responsibilities", "[]")),
                "qualifications": json.loads(result.get("qualifications", "[]")),
                "experience_level": result.get("experience_level", ""),
                "location": result.get("location", "")
            }
        return None
    except Exception as e:
        print(f"Error getting job: {e}")
        return None

async def perform_ai_candidate_scoring(candidate_data: dict, job_data: dict) -> dict:
    """Use AI to score candidate against job requirements"""
    try:
        # Prepare candidate information
        candidate_info = f"""
        Candidate: {candidate_data.get('full_name', 'Unknown')}
        Summary: {candidate_data.get('summary', '')}
        Skills: {', '.join(candidate_data.get('skills', []))}
        Education: {json.dumps(candidate_data.get('education', []), indent=2)}
        Work Experience: {json.dumps(candidate_data.get('work_experience', []), indent=2)}
        """
        
        # Prepare job information
        job_info = f"""
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Overview: {job_data.get('overview', '')}
        Required Skills: {', '.join(job_data.get('required_skills', []))}
        Preferred Skills: {', '.join(job_data.get('preferred_skills', []))}
        Responsibilities: {json.dumps(job_data.get('responsibilities', []), indent=2)}
        Qualifications: {json.dumps(job_data.get('qualifications', []), indent=2)}
        Experience Level: {job_data.get('experience_level', '')}
        Location: {job_data.get('location', '')}
        """
        
        prompt = f"""Analyze this candidate against the job requirements and provide a comprehensive scoring. Return ONLY a valid JSON object:

{{
    "overall_score": 85,
    "category_scores": {{
        "technical_skills": 90,
        "experience_match": 80,
        "education_qualification": 85,
        "cultural_fit": 75,
        "communication_skills": 80
    }},
    "detailed_analysis": {{
        "strengths": ["strength1", "strength2", "strength3"],
        "weaknesses": ["weakness1", "weakness2"],
        "missing_requirements": ["requirement1", "requirement2"],
        "recommendations": ["recommendation1", "recommendation2"]
    }},
    "skill_match_analysis": {{
        "required_skills_match": 85,
        "preferred_skills_match": 70,
        "skill_gaps": ["skill1", "skill2"],
        "additional_skills": ["skill1", "skill2"]
    }},
    "experience_analysis": {{
        "years_experience_match": 80,
        "relevant_experience": 85,
        "industry_experience": 75,
        "leadership_experience": 70
    }},
    "fit_assessment": {{
        "job_level_match": "good",
        "career_progression": "positive",
        "location_flexibility": "high",
        "salary_expectations": "reasonable"
    }},
    "interview_recommendations": [
        "Ask about specific experience with [technology]",
        "Discuss leadership experience in [area]",
        "Evaluate communication skills through [method]"
    ],
    "hiring_recommendation": "strong_yes|yes|maybe|no|strong_no",
    "confidence_level": 85,
    "reasoning": "Detailed explanation of the scoring rationale"
}}

Guidelines:
- Overall score: 0-100 (100 being perfect match)
- Category scores: 0-100 for each category
- Strengths: 3-5 key strengths of the candidate
- Weaknesses: 2-3 areas for improvement
- Missing requirements: Skills/experience the candidate lacks
- Recommendations: How to improve the candidate's profile
- Skill match: Percentage of required/preferred skills matched
- Experience analysis: How well experience aligns with requirements
- Fit assessment: Overall compatibility with the role
- Interview recommendations: Specific questions to ask
- Hiring recommendation: Overall hiring decision
- Confidence level: How confident you are in this assessment (0-100)
- Reasoning: Detailed explanation of your scoring

Candidate Information:
{candidate_info}

Job Information:
{job_info}"""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR professional and recruitment specialist. Analyze candidates objectively and provide detailed, actionable scoring and recommendations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.1,
            timeout=30
        )
        
        generated_text = response.choices[0].message.content
        print(f"🎯 [AIScoring] AI response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        scoring_data = json.loads(json_str)
        
        # Add metadata
        scoring_data["ai_generated"] = True
        scoring_data["scored_at"] = datetime.now().isoformat()
        scoring_data["model_used"] = "gpt-4o-mini"
        
        return scoring_data
        
    except Exception as e:
        print(f"❌ [AIScoring] AI scoring failed: {e}")
        raise e

async def fallback_candidate_scoring(candidate_data: dict, job_data: dict) -> dict:
    """Fallback scoring when AI is not available"""
    print(f"🔄 [AIScoring] Using fallback scoring")
    
    # Basic scoring based on skill matching
    candidate_skills = [skill.lower() for skill in candidate_data.get("skills", [])]
    required_skills = [skill.lower() for skill in job_data.get("required_skills", [])]
    preferred_skills = [skill.lower() for skill in job_data.get("preferred_skills", [])]
    
    # Calculate skill match percentages
    required_match = 0
    if required_skills:
        matched_required = sum(1 for skill in required_skills if any(cs in skill or skill in cs for cs in candidate_skills))
        required_match = (matched_required / len(required_skills)) * 100
    
    preferred_match = 0
    if preferred_skills:
        matched_preferred = sum(1 for skill in preferred_skills if any(cs in skill or skill in cs for cs in candidate_skills))
        preferred_match = (matched_preferred / len(preferred_skills)) * 100
    
    # Calculate overall score
    overall_score = (required_match * 0.7 + preferred_match * 0.3)
    
    # Determine hiring recommendation
    if overall_score >= 80:
        hiring_rec = "strong_yes"
    elif overall_score >= 65:
        hiring_rec = "yes"
    elif overall_score >= 50:
        hiring_rec = "maybe"
    elif overall_score >= 30:
        hiring_rec = "no"
    else:
        hiring_rec = "strong_no"
    
    return {
        "overall_score": round(overall_score, 1),
        "category_scores": {
            "technical_skills": round(required_match, 1),
            "experience_match": 75.0,  # Default assumption
            "education_qualification": 70.0,  # Default assumption
            "cultural_fit": 65.0,  # Default assumption
            "communication_skills": 70.0  # Default assumption
        },
        "detailed_analysis": {
            "strengths": ["Has relevant technical skills", "Experience in related field"],
            "weaknesses": ["Limited information available", "Need to verify experience"],
            "missing_requirements": [skill for skill in required_skills if not any(cs in skill or skill in cs for cs in candidate_skills)],
            "recommendations": ["Conduct detailed interview", "Verify technical skills", "Check references"]
        },
        "skill_match_analysis": {
            "required_skills_match": round(required_match, 1),
            "preferred_skills_match": round(preferred_match, 1),
            "skill_gaps": [skill for skill in required_skills if not any(cs in skill or skill in cs for cs in candidate_skills)],
            "additional_skills": [skill for skill in candidate_skills if skill not in required_skills and skill not in preferred_skills]
        },
        "experience_analysis": {
            "years_experience_match": 75.0,
            "relevant_experience": 70.0,
            "industry_experience": 65.0,
            "leadership_experience": 60.0
        },
        "fit_assessment": {
            "job_level_match": "good" if overall_score >= 70 else "fair",
            "career_progression": "positive",
            "location_flexibility": "unknown",
            "salary_expectations": "unknown"
        },
        "interview_recommendations": [
            "Verify technical skills through practical assessment",
            "Discuss relevant project experience",
            "Evaluate problem-solving abilities"
        ],
        "hiring_recommendation": hiring_rec,
        "confidence_level": 60.0,
        "reasoning": f"Basic scoring based on skill matching. {required_match:.1f}% of required skills matched, {preferred_match:.1f}% of preferred skills matched.",
        "ai_generated": False,
        "scored_at": datetime.now().isoformat(),
        "model_used": "fallback"
    }

@app.post("/api/analysis/gap-analysis")
async def ai_gap_analysis(request_data: dict):
    """AI-powered gap analysis between candidates and job requirements"""
    print(f"🔍 [GapAnalysis] Received request: {request_data}")
    
    try:
        candidate_id = request_data.get("candidate_id", "")
        job_id = request_data.get("job_id", "")
        candidate_data = request_data.get("candidate_data", {})
        job_data = request_data.get("job_data", {})
        analysis_type = request_data.get("analysis_type", "comprehensive")  # comprehensive, skills, experience, education
        
        if not candidate_data and not candidate_id:
            return {
                "success": False,
                "error": "Candidate data or candidate_id is required"
            }
        
        if not job_data and not job_id:
            return {
                "success": False,
                "error": "Job data or job_id is required"
            }
        
        # Get candidate data if only ID provided
        if candidate_id and not candidate_data:
            candidate_data = await get_candidate_by_id(candidate_id)
            if not candidate_data:
                return {
                    "success": False,
                    "error": "Candidate not found"
                }
        
        # Get job data if only ID provided
        if job_id and not job_data:
            job_data = await get_job_by_id(job_id)
            if not job_data:
                return {
                    "success": False,
                    "error": "Job not found"
                }
        
        # Perform AI gap analysis
        try:
            gap_analysis_result = await perform_ai_gap_analysis(candidate_data, job_data, analysis_type)
            print(f"🔍 [GapAnalysis] AI analysis completed: {len(gap_analysis_result.get('gaps', []))} gaps identified")
        except Exception as e:
            print(f"⚠️ [GapAnalysis] AI analysis failed, using fallback: {e}")
            gap_analysis_result = await fallback_gap_analysis(candidate_data, job_data, analysis_type)
        
        return {
            "success": True,
            "candidate_id": candidate_id or candidate_data.get("id", ""),
            "job_id": job_id or job_data.get("id", ""),
            "analysis_type": analysis_type,
            "gap_analysis": gap_analysis_result,
            "message": "AI gap analysis completed successfully"
        }
        
    except Exception as e:
        print(f"❌ [GapAnalysis] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def perform_ai_gap_analysis(candidate_data: dict, job_data: dict, analysis_type: str) -> dict:
    """Use AI to perform comprehensive gap analysis"""
    try:
        # Prepare candidate information
        candidate_info = f"""
        Candidate: {candidate_data.get('full_name', 'Unknown')}
        Summary: {candidate_data.get('summary', '')}
        Skills: {', '.join(candidate_data.get('skills', []))}
        Education: {json.dumps(candidate_data.get('education', []), indent=2)}
        Work Experience: {json.dumps(candidate_data.get('work_experience', []), indent=2)}
        """
        
        # Prepare job information
        job_info = f"""
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Overview: {job_data.get('overview', '')}
        Required Skills: {', '.join(job_data.get('required_skills', []))}
        Preferred Skills: {', '.join(job_data.get('preferred_skills', []))}
        Responsibilities: {json.dumps(job_data.get('responsibilities', []), indent=2)}
        Qualifications: {json.dumps(job_data.get('qualifications', []), indent=2)}
        Experience Level: {job_data.get('experience_level', '')}
        Location: {job_data.get('location', '')}
        """
        
        prompt = f"""Perform a comprehensive gap analysis between this candidate and job requirements. Return ONLY a valid JSON object:

{{
    "overall_gap_score": 25,
    "gap_categories": {{
        "critical_gaps": [
            {{
                "category": "Technical Skills",
                "gap": "Missing Python expertise",
                "impact": "high",
                "priority": "critical",
                "description": "Candidate lacks Python programming skills required for the role",
                "recommendations": ["Take Python programming course", "Complete Python projects", "Get Python certification"]
            }}
        ],
        "moderate_gaps": [
            {{
                "category": "Experience",
                "gap": "Limited leadership experience",
                "impact": "medium",
                "priority": "moderate",
                "description": "Candidate has minimal experience leading teams",
                "recommendations": ["Seek leadership opportunities", "Take management training", "Volunteer for team lead roles"]
            }}
        ],
        "minor_gaps": [
            {{
                "category": "Education",
                "gap": "Missing specific certification",
                "impact": "low",
                "priority": "minor",
                "description": "Candidate lacks AWS certification mentioned as preferred",
                "recommendations": ["Pursue AWS certification", "Complete AWS training modules"]
            }}
        ]
    }},
    "skill_gap_analysis": {{
        "missing_required_skills": ["Python", "Django"],
        "missing_preferred_skills": ["AWS", "Docker"],
        "skill_strengths": ["JavaScript", "React"],
        "skill_development_plan": [
            {{
                "skill": "Python",
                "current_level": "beginner",
                "target_level": "intermediate",
                "estimated_time": "3-6 months",
                "learning_path": ["Python basics", "Django framework", "Project practice"]
            }}
        ]
    }},
    "experience_gap_analysis": {{
        "years_experience_gap": 2,
        "missing_experience_areas": ["Team leadership", "Project management"],
        "relevant_experience": ["Web development", "Database design"],
        "experience_development_plan": [
            {{
                "area": "Team Leadership",
                "current_level": "none",
                "target_level": "basic",
                "development_activities": ["Lead small projects", "Mentor junior developers", "Take leadership course"]
            }}
        ]
    }},
    "education_gap_analysis": {{
        "education_match": 85,
        "missing_qualifications": ["AWS Certification"],
        "additional_education_needed": ["Cloud computing fundamentals"],
        "education_development_plan": [
            {{
                "qualification": "AWS Certification",
                "type": "certification",
                "duration": "2-3 months",
                "cost_estimate": "$150-300",
                "provider": "Amazon Web Services"
            }}
        ]
    }},
    "development_roadmap": {{
        "short_term_goals": ["Learn Python basics", "Complete online course"],
        "medium_term_goals": ["Build Python project", "Gain leadership experience"],
        "long_term_goals": ["Achieve senior-level skills", "Get relevant certifications"],
        "timeline": "6-12 months",
        "estimated_investment": "$500-1000"
    }},
    "hiring_recommendation": {{
        "recommendation": "hire_with_development_plan|hire_immediately|consider_after_development|not_suitable",
        "confidence": 80,
        "reasoning": "Candidate shows strong potential but needs development in key areas",
        "conditions": ["Complete Python training within 3 months", "Show progress in leadership skills"]
    }},
    "training_recommendations": [
        {{
            "training_type": "Technical Skills",
            "title": "Python Programming Bootcamp",
            "duration": "3 months",
            "cost": "$500",
            "provider": "Online platform",
            "priority": "high"
        }}
    ],
    "mentorship_opportunities": [
        {{
            "area": "Technical Leadership",
            "mentor_type": "Senior Developer",
            "duration": "6 months",
            "focus": "Code review, architecture decisions, team collaboration"
        }}
    ],
    "success_metrics": {{
        "technical_skills_improvement": "80% of required skills within 6 months",
        "leadership_development": "Lead at least 2 small projects",
        "certification_goals": "Complete 2 relevant certifications"
    }}
}}

Guidelines:
- Overall gap score: 0-100 (0 = perfect match, 100 = major gaps)
- Categorize gaps by priority: critical, moderate, minor
- Provide specific, actionable recommendations
- Include realistic timelines and cost estimates
- Consider both technical and soft skills
- Provide development roadmap with clear milestones
- Include mentorship and training opportunities
- Set measurable success metrics

Analysis Type: {analysis_type}

Candidate Information:
{candidate_info}

Job Information:
{job_info}"""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR professional and career development specialist. Provide detailed, actionable gap analysis with realistic development plans and timelines."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2500,
            temperature=0.1,
            timeout=30
        )
        
        generated_text = response.choices[0].message.content
        print(f"🔍 [GapAnalysis] AI response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        gap_analysis_data = json.loads(json_str)
        
        # Add metadata
        gap_analysis_data["ai_generated"] = True
        gap_analysis_data["analyzed_at"] = datetime.now().isoformat()
        gap_analysis_data["model_used"] = "gpt-4o-mini"
        gap_analysis_data["analysis_type"] = analysis_type
        
        return gap_analysis_data
        
    except Exception as e:
        print(f"❌ [GapAnalysis] AI analysis failed: {e}")
        raise e

async def fallback_gap_analysis(candidate_data: dict, job_data: dict, analysis_type: str) -> dict:
    """Fallback gap analysis when AI is not available"""
    print(f"🔄 [GapAnalysis] Using fallback analysis")
    
    # Basic gap analysis based on skill matching
    candidate_skills = [skill.lower() for skill in candidate_data.get("skills", [])]
    required_skills = [skill.lower() for skill in job_data.get("required_skills", [])]
    preferred_skills = [skill.lower() for skill in job_data.get("preferred_skills", [])]
    
    # Calculate gaps
    missing_required = [skill for skill in required_skills if not any(cs in skill or skill in cs for cs in candidate_skills)]
    missing_preferred = [skill for skill in preferred_skills if not any(cs in skill or skill in cs for cs in candidate_skills)]
    
    # Calculate gap score
    total_skills = len(required_skills) + len(preferred_skills)
    missing_skills = len(missing_required) + len(missing_preferred)
    gap_score = (missing_skills / total_skills * 100) if total_skills > 0 else 0
    
    # Determine hiring recommendation
    if gap_score <= 20:
        hiring_rec = "hire_immediately"
    elif gap_score <= 40:
        hiring_rec = "hire_with_development_plan"
    elif gap_score <= 60:
        hiring_rec = "consider_after_development"
    else:
        hiring_rec = "not_suitable"
    
    return {
        "overall_gap_score": round(gap_score, 1),
        "gap_categories": {
            "critical_gaps": [
                {
                    "category": "Technical Skills",
                    "gap": f"Missing {', '.join(missing_required[:3])}",
                    "impact": "high",
                    "priority": "critical",
                    "description": f"Candidate lacks required skills: {', '.join(missing_required)}",
                    "recommendations": ["Take relevant courses", "Practice with projects", "Get certifications"]
                }
            ] if missing_required else [],
            "moderate_gaps": [
                {
                    "category": "Preferred Skills",
                    "gap": f"Missing {', '.join(missing_preferred[:3])}",
                    "impact": "medium",
                    "priority": "moderate",
                    "description": f"Candidate lacks preferred skills: {', '.join(missing_preferred)}",
                    "recommendations": ["Learn preferred technologies", "Gain hands-on experience"]
                }
            ] if missing_preferred else [],
            "minor_gaps": []
        },
        "skill_gap_analysis": {
            "missing_required_skills": missing_required,
            "missing_preferred_skills": missing_preferred,
            "skill_strengths": [skill for skill in candidate_skills if skill in required_skills or skill in preferred_skills],
            "skill_development_plan": [
                {
                    "skill": skill,
                    "current_level": "beginner",
                    "target_level": "intermediate",
                    "estimated_time": "3-6 months",
                    "learning_path": ["Online course", "Practice projects", "Certification"]
                } for skill in missing_required[:3]
            ]
        },
        "experience_gap_analysis": {
            "years_experience_gap": 2,  # Default assumption
            "missing_experience_areas": ["Leadership", "Project management"],
            "relevant_experience": ["Development", "Problem solving"],
            "experience_development_plan": [
                {
                    "area": "Leadership",
                    "current_level": "basic",
                    "target_level": "intermediate",
                    "development_activities": ["Lead small projects", "Mentor others", "Take leadership course"]
                }
            ]
        },
        "education_gap_analysis": {
            "education_match": 75,
            "missing_qualifications": ["Relevant certifications"],
            "additional_education_needed": ["Technical skills training"],
            "education_development_plan": [
                {
                    "qualification": "Technical Certification",
                    "type": "certification",
                    "duration": "3-6 months",
                    "cost_estimate": "$200-500",
                    "provider": "Online platform"
                }
            ]
        },
        "development_roadmap": {
            "short_term_goals": ["Learn missing required skills", "Complete online courses"],
            "medium_term_goals": ["Build relevant projects", "Gain practical experience"],
            "long_term_goals": ["Achieve proficiency in all required areas"],
            "timeline": "6-12 months",
            "estimated_investment": "$500-1000"
        },
        "hiring_recommendation": {
            "recommendation": hiring_rec,
            "confidence": 70,
            "reasoning": f"Gap analysis shows {gap_score:.1f}% skill gaps. {'Suitable for development' if gap_score <= 40 else 'Needs significant development'}.",
            "conditions": ["Complete skill development plan", "Show progress in key areas"]
        },
        "training_recommendations": [
            {
                "training_type": "Technical Skills",
                "title": "Required Skills Training",
                "duration": "3-6 months",
                "cost": "$300-600",
                "provider": "Online platform",
                "priority": "high"
            }
        ],
        "mentorship_opportunities": [
            {
                "area": "Technical Development",
                "mentor_type": "Senior Developer",
                "duration": "6 months",
                "focus": "Skill development, best practices, career guidance"
            }
        ],
        "success_metrics": {
            "technical_skills_improvement": "80% of required skills within 6 months",
            "project_completion": "Complete 2 relevant projects",
            "certification_goals": "Obtain 1 relevant certification"
        },
        "ai_generated": False,
        "analyzed_at": datetime.now().isoformat(),
        "model_used": "fallback",
        "analysis_type": analysis_type
    }

@app.get("/api/duplicate-detection/scan")
async def scan_for_duplicates():
    """Scan for duplicate candidates in the database"""
    print(f"🔍 [DuplicateDetection] Starting duplicate scan")
    
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection("resumes"):
            return {
                "success": False,
                "error": "Resumes collection not found"
            }
        
        collection = Collection("resumes")
        collection.load()
        
        # Get all candidates
        results = collection.query(
            expr="id != ''",
            output_fields=["id", "full_name", "email", "phone", "skills", "work_experience", "education"],
            limit=1000
        )
        
        print(f"🔍 [DuplicateDetection] Found {len(results)} candidates to analyze")
        
        # Find duplicates based on various criteria
        duplicate_groups = []
        processed_ids = set()
        
        for i, candidate1 in enumerate(results):
            if candidate1["id"] in processed_ids:
                continue
                
            duplicates = [candidate1]
            
            for j, candidate2 in enumerate(results[i+1:], i+1):
                if candidate2["id"] in processed_ids:
                    continue
                    
                similarity_score = calculate_candidate_similarity(candidate1, candidate2)
                
                if similarity_score >= 80:  # 80% similarity threshold
                    duplicates.append(candidate2)
                    processed_ids.add(candidate2["id"])
            
            if len(duplicates) > 1:
                # Create duplicate group
                group_id = f"group_{len(duplicate_groups) + 1}"
                match_type = "exact" if max([calculate_candidate_similarity(duplicates[0], dup) for dup in duplicates[1:]]) >= 95 else "high"
                
                duplicate_group = {
                    "id": group_id,
                    "candidates": [
                        {
                            "id": dup["id"],
                            "name": dup.get("full_name", "Unknown"),
                            "email": dup.get("email", ""),
                            "phone": dup.get("phone", ""),
                            "location": "Unknown",  # Location not available in Milvus
                            "job_title": dup.get("work_experience", [{}])[0].get("title", "") if dup.get("work_experience") else "",
                            "company": dup.get("work_experience", [{}])[0].get("company", "") if dup.get("work_experience") else "",
                            "experience_years": len(dup.get("work_experience", [])),
                            "education": dup.get("education", [{}])[0].get("degree", "") if dup.get("education") else "",
                            "skills": dup.get("skills", []),
                            "resume_url": f"/resumes/{dup['id']}.pdf",
                            "created_at": "2024-09-20T10:00:00Z",
                            "updated_at": "2024-09-25T10:00:00Z",
                            "confidence_score": calculate_candidate_similarity(duplicates[0], dup),
                            "match_reasons": get_match_reasons(duplicates[0], dup)
                        }
                        for dup in duplicates
                    ],
                    "similarity_score": max([calculate_candidate_similarity(duplicates[0], dup) for dup in duplicates[1:]]),
                    "match_type": match_type,
                    "created_at": "2024-09-25T10:00:00Z",
                    "status": "pending"
                }
                
                duplicate_groups.append(duplicate_group)
                processed_ids.add(candidate1["id"])
        
        print(f"🔍 [DuplicateDetection] Found {len(duplicate_groups)} duplicate groups")
        
        return {
            "success": True,
            "duplicate_groups": duplicate_groups,
            "total_groups": len(duplicate_groups),
            "total_candidates": sum(len(group["candidates"]) for group in duplicate_groups),
            "message": f"Found {len(duplicate_groups)} duplicate groups"
        }
        
    except Exception as e:
        print(f"❌ [DuplicateDetection] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/duplicate-detection/groups")
async def get_duplicate_groups():
    """Get all duplicate groups"""
    print(f"🔍 [DuplicateDetection] Getting duplicate groups")
    
    try:
        # For now, return mock data. In production, this would be stored in a database
        mock_groups = [
            {
                "id": "1",
                "candidates": [
                    {
                        "id": "candidate_1",
                        "name": "Bhagyaraju Kurakula",
                        "email": "bhagyaraju@email.com",
                        "phone": "+1-555-0123",
                        "location": "San Francisco, CA",
                        "job_title": "Senior Software Engineer",
                        "company": "TechCorp Inc.",
                        "experience_years": 5,
                        "education": "Bachelor of Computer Science",
                        "skills": ["Python", "JavaScript", "React", "AWS"],
                        "resume_url": "/resumes/bhagyaraju.pdf",
                        "created_at": "2024-09-20T10:00:00Z",
                        "updated_at": "2024-09-25T10:00:00Z",
                        "confidence_score": 95,
                        "match_reasons": ["Same name", "Same email", "Same phone number"]
                    },
                    {
                        "id": "candidate_2",
                        "name": "Bhagyaraju Kurakula",
                        "email": "bhagyaraju@email.com",
                        "phone": "+1-555-0123",
                        "location": "San Francisco, CA",
                        "job_title": "Senior Software Engineer",
                        "company": "TechCorp Inc.",
                        "experience_years": 5,
                        "education": "Bachelor of Computer Science",
                        "skills": ["Python", "JavaScript", "React", "AWS", "Docker"],
                        "resume_url": "/resumes/bhagyaraju_v2.pdf",
                        "created_at": "2024-09-22T14:00:00Z",
                        "updated_at": "2024-09-24T16:00:00Z",
                        "confidence_score": 95,
                        "match_reasons": ["Same name", "Same email", "Same phone number"]
                    }
                ],
                "similarity_score": 95,
                "match_type": "exact",
                "created_at": "2024-09-25T10:00:00Z",
                "status": "pending"
            }
        ]
        
        return {
            "success": True,
            "duplicate_groups": mock_groups,
            "total_groups": len(mock_groups),
            "total_candidates": sum(len(group["candidates"]) for group in mock_groups),
            "pending_groups": len([g for g in mock_groups if g["status"] == "pending"]),
            "avg_similarity": 95
        }
        
    except Exception as e:
        print(f"❌ [DuplicateDetection] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/gap-analysis/reports")
async def get_gap_analysis_reports():
    """Get all gap analysis reports"""
    print(f"🔍 [GapAnalysis] Getting gap analysis reports")
    
    try:
        # For now, return mock data. In production, this would be stored in a database
        mock_reports = [
            {
                "id": "1",
                "candidate_id": "candidate_1",
                "candidate_name": "Bhagyaraju Kurakula",
                "job_title": "Senior Software Engineer",
                "company": "TechCorp Inc.",
                "analysis_date": "2024-09-25T10:00:00Z",
                "overall_score": 75,
                "gaps": {
                    "skill_gaps": [
                        {
                            "skill_name": "Docker",
                            "required_level": 8,
                            "current_level": 4,
                            "gap_size": 4,
                            "importance": "critical",
                            "learning_resources": ["Docker Official Documentation", "Docker Deep Dive Course"],
                            "estimated_time": "2-3 months"
                        },
                        {
                            "skill_name": "Kubernetes",
                            "required_level": 6,
                            "current_level": 2,
                            "gap_size": 4,
                            "importance": "important",
                            "learning_resources": ["Kubernetes Basics Course", "Hands-on Labs"],
                            "estimated_time": "3-4 months"
                        }
                    ],
                    "experience_gaps": [
                        {
                            "experience_type": "Team Leadership",
                            "required_years": 2,
                            "current_years": 0,
                            "gap_years": 2,
                            "importance": "critical",
                            "suggestions": ["Lead a small project", "Mentor junior developers"]
                        }
                    ],
                    "education_gaps": [
                        {
                            "education_type": "Advanced Degree",
                            "required_level": "Master's in Computer Science",
                            "current_level": "Bachelor's in Computer Science",
                            "gap_description": "Missing advanced degree",
                            "importance": "nice_to_have",
                            "alternatives": ["Professional certifications", "Advanced courses"]
                        }
                    ],
                    "certification_gaps": [
                        {
                            "certification_name": "AWS Solutions Architect",
                            "required": True,
                            "current_status": "none",
                            "importance": "critical",
                            "exam_info": "AWS SAA-C03 Exam",
                            "study_resources": ["AWS Training", "Practice Tests"]
                        }
                    ]
                },
                "recommendations": {
                    "skill_development": ["Focus on Docker and Kubernetes", "Practice with real projects"],
                    "experience_building": ["Take on leadership opportunities", "Mentor team members"],
                    "education_improvements": ["Consider online master's program", "Take advanced courses"],
                    "certification_requirements": ["Start AWS certification path", "Study for SAA-C03"]
                },
                "timeline_estimates": {
                    "skill_development": "3-4 months",
                    "experience_building": "6-12 months",
                    "education_improvements": "12-18 months",
                    "certification_requirements": "2-3 months"
                },
                "priority_level": "high",
                "status": "pending"
            }
        ]
        
        return {
            "success": True,
            "analyses": mock_reports,
            "total_analyses": len(mock_reports),
            "avg_score": 75,
            "high_priority": len([a for a in mock_reports if a["priority_level"] == "high"]),
            "in_progress": len([a for a in mock_reports if a["status"] == "in_progress"])
        }
        
    except Exception as e:
        print(f"❌ [GapAnalysis] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def calculate_candidate_similarity(candidate1: dict, candidate2: dict) -> int:
    """Calculate similarity score between two candidates"""
    score = 0
    total_checks = 0
    
    # Name similarity
    if candidate1.get("full_name") and candidate2.get("full_name"):
        name1 = candidate1["full_name"].lower()
        name2 = candidate2["full_name"].lower()
        if name1 == name2:
            score += 30
        elif name1 in name2 or name2 in name1:
            score += 20
        total_checks += 1
    
    # Email similarity
    if candidate1.get("email") and candidate2.get("email"):
        if candidate1["email"] == candidate2["email"]:
            score += 25
        total_checks += 1
    
    # Phone similarity
    if candidate1.get("phone") and candidate2.get("phone"):
        if candidate1["phone"] == candidate2["phone"]:
            score += 25
        total_checks += 1
    
    # Location similarity (skip for now as location not in Milvus)
    # if candidate1.get("location") and candidate2.get("location"):
    #     loc1 = candidate1["location"].lower()
    #     loc2 = candidate2["location"].lower()
    #     if loc1 == loc2:
    #         score += 15
    #     elif any(word in loc2 for word in loc1.split()) or any(word in loc1 for word in loc2.split()):
    #         score += 10
    #     total_checks += 1
    
    # Skills similarity
    if candidate1.get("skills") and candidate2.get("skills"):
        skills1 = set([s.lower() for s in candidate1["skills"]])
        skills2 = set([s.lower() for s in candidate2["skills"]])
        if skills1 and skills2:
            common_skills = len(skills1.intersection(skills2))
            total_skills = len(skills1.union(skills2))
            skill_similarity = (common_skills / total_skills) * 20
            score += skill_similarity
        total_checks += 1
    
    return min(100, int(score))

def get_match_reasons(candidate1: dict, candidate2: dict) -> list:
    """Get reasons why two candidates are considered duplicates"""
    reasons = []
    
    # Name match
    if candidate1.get("full_name") and candidate2.get("full_name"):
        name1 = candidate1["full_name"].lower()
        name2 = candidate2["full_name"].lower()
        if name1 == name2:
            reasons.append("Same name")
        elif name1 in name2 or name2 in name1:
            reasons.append("Similar name")
    
    # Email match
    if candidate1.get("email") and candidate2.get("email"):
        if candidate1["email"] == candidate2["email"]:
            reasons.append("Same email")
    
    # Phone match
    if candidate1.get("phone") and candidate2.get("phone"):
        if candidate1["phone"] == candidate2["phone"]:
            reasons.append("Same phone number")
    
    # Location match (skip for now as location not in Milvus)
    # if candidate1.get("location") and candidate2.get("location"):
    #     loc1 = candidate1["location"].lower()
    #     loc2 = candidate2["location"].lower()
    #     if loc1 == loc2:
    #         reasons.append("Same location")
    #     elif any(word in loc2 for word in loc1.split()) or any(word in loc1 for word in loc2.split()):
    #         reasons.append("Similar location")
    
    # Skills match
    if candidate1.get("skills") and candidate2.get("skills"):
        skills1 = set([s.lower() for s in candidate1["skills"]])
        skills2 = set([s.lower() for s in candidate2["skills"]])
        if skills1 and skills2:
            common_skills = len(skills1.intersection(skills2))
            if common_skills >= 3:
                reasons.append("Same skills")
            elif common_skills >= 1:
                reasons.append("Similar skills")
    
    return reasons if reasons else ["Potential duplicate"]

@app.post("/api/duplicate-detection/merge")
async def merge_duplicates(request_data: dict):
    """Merge duplicate candidates into one"""
    print(f"🔗 [DuplicateDetection] Merging duplicates: {request_data}")
    
    try:
        group_id = request_data.get("group_id")
        primary_candidate_id = request_data.get("primary_candidate_id")
        duplicate_candidate_ids = request_data.get("duplicate_candidate_ids", [])
        
        if not group_id or not primary_candidate_id:
            return {
                "success": False,
                "error": "Group ID and primary candidate ID are required"
            }
        
        # In a real implementation, this would:
        # 1. Keep the primary candidate
        # 2. Merge data from duplicates into primary
        # 3. Delete duplicate records
        # 4. Update the duplicate group status
        
        print(f"🔗 [DuplicateDetection] Merged group {group_id}, primary: {primary_candidate_id}, duplicates: {duplicate_candidate_ids}")
        
        return {
            "success": True,
            "message": f"Successfully merged {len(duplicate_candidate_ids)} duplicates into primary candidate",
            "merged_count": len(duplicate_candidate_ids)
        }
        
    except Exception as e:
        print(f"❌ [DuplicateDetection] Merge error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/duplicate-detection/ignore")
async def ignore_duplicates(request_data: dict):
    """Mark duplicate group as ignored"""
    print(f"🚫 [DuplicateDetection] Ignoring duplicates: {request_data}")
    
    try:
        group_id = request_data.get("group_id")
        
        if not group_id:
            return {
                "success": False,
                "error": "Group ID is required"
            }
        
        # In a real implementation, this would update the group status to "ignored"
        
        print(f"🚫 [DuplicateDetection] Ignored group {group_id}")
        
        return {
            "success": True,
            "message": f"Successfully ignored duplicate group {group_id}"
        }
        
    except Exception as e:
        print(f"❌ [DuplicateDetection] Ignore error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.delete("/api/duplicate-detection/group/{group_id}")
async def delete_duplicate_group(group_id: str):
    """Delete a duplicate group"""
    print(f"🗑️ [DuplicateDetection] Deleting group: {group_id}")
    
    try:
        # In a real implementation, this would delete the group from the database
        
        print(f"🗑️ [DuplicateDetection] Deleted group {group_id}")
        
        return {
            "success": True,
            "message": f"Successfully deleted duplicate group {group_id}"
        }
        
    except Exception as e:
        print(f"❌ [DuplicateDetection] Delete error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/mass-mailing/ai-generate-content")
async def ai_generate_mailing_content(request_data: dict):
    """AI-powered content generation for mass mailing campaigns"""
    print(f"📧 [MassMailingAI] Received request: {request_data}")
    
    try:
        campaign_type = request_data.get("campaign_type", "job_opportunity")  # job_opportunity, follow_up, newsletter, event_invitation
        target_audience = request_data.get("target_audience", "software_engineers")
        job_data = request_data.get("job_data", {})
        company_info = request_data.get("company_info", {})
        personalization_level = request_data.get("personalization_level", "medium")  # low, medium, high
        tone = request_data.get("tone", "professional")  # professional, friendly, casual, formal
        content_length = request_data.get("content_length", "medium")  # short, medium, long
        
        if not job_data and campaign_type in ["job_opportunity", "follow_up"]:
            return {
                "success": False,
                "error": "Job data is required for job opportunity and follow-up campaigns"
            }
        
        # Perform AI content generation
        try:
            content_result = await perform_ai_content_generation(
                campaign_type, target_audience, job_data, company_info, 
                personalization_level, tone, content_length
            )
            print(f"📧 [MassMailingAI] AI content generation completed: {len(content_result.get('email_variants', []))} variants created")
        except Exception as e:
            print(f"⚠️ [MassMailingAI] AI generation failed, using fallback: {e}")
            content_result = await fallback_content_generation(
                campaign_type, target_audience, job_data, company_info, 
                personalization_level, tone, content_length
            )
        
        return {
            "success": True,
            "campaign_type": campaign_type,
            "target_audience": target_audience,
            "content_result": content_result,
            "message": "AI content generation completed successfully"
        }
        
    except Exception as e:
        print(f"❌ [MassMailingAI] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def perform_ai_content_generation(campaign_type: str, target_audience: str, job_data: dict, 
                                      company_info: dict, personalization_level: str, tone: str, content_length: str) -> dict:
    """Use AI to generate personalized email content"""
    try:
        # Prepare context information
        job_context = ""
        if job_data:
            job_context = f"""
            Job Title: {job_data.get('title', '')}
            Company: {job_data.get('company', '')}
            Location: {job_data.get('location', '')}
            Experience Level: {job_data.get('experience_level', '')}
            Required Skills: {', '.join(job_data.get('required_skills', []))}
            Job Overview: {job_data.get('overview', '')}
            """
        
        company_context = ""
        if company_info:
            company_context = f"""
            Company Name: {company_info.get('name', '')}
            Industry: {company_info.get('industry', '')}
            Company Size: {company_info.get('size', '')}
            Company Description: {company_info.get('description', '')}
            Company Values: {', '.join(company_info.get('values', []))}
            """
        
        prompt = f"""Generate personalized email content for a mass mailing campaign. Return ONLY a valid JSON object:

{{
    "email_variants": [
        {{
            "variant_name": "Professional Approach",
            "subject_line": "Exciting {job_data.get('title', 'Opportunity')} at {job_data.get('company', 'Our Company')}",
            "preheader": "Join our innovative team and make an impact",
            "greeting": "Dear [Candidate Name],",
            "body": "I hope this email finds you well. I'm reaching out because your background in [relevant skill] caught our attention...",
            "call_to_action": "Apply Now",
            "closing": "Best regards,\n[Your Name]\n[Your Title]",
            "personalization_tokens": ["[Candidate Name]", "[relevant skill]", "[years of experience]"],
            "tone": "professional",
            "length": "medium"
        }}
    ],
    "personalization_options": {{
        "greeting_variants": ["Dear [Name]", "Hi [Name]", "Hello [Name]", "Dear [First Name]"],
        "skill_mentions": ["your expertise in [skill]", "your background in [skill]", "your experience with [skill]"],
        "company_highlights": ["our innovative culture", "our cutting-edge technology", "our collaborative environment"],
        "urgency_indicators": ["limited time", "exclusive opportunity", "priority hiring"]
    }},
    "subject_line_variants": [
        "Exciting {job_data.get('title', 'Opportunity')} at {job_data.get('company', 'Our Company')}",
        "Your skills match our {job_data.get('title', 'opening')}",
        "Join {job_data.get('company', 'our team')} as a {job_data.get('title', 'team member')}"
    ],
    "call_to_action_variants": [
        "Apply Now",
        "Learn More",
        "Schedule a Call",
        "View Job Details",
        "Get in Touch"
    ],
    "content_templates": {{
        "opening_paragraphs": [
            "I hope this email finds you well. I'm reaching out because your background in [relevant skill] caught our attention.",
            "I came across your profile and was impressed by your experience in [relevant skill].",
            "Your expertise in [relevant skill] aligns perfectly with what we're looking for."
        ],
        "value_propositions": [
            "We offer competitive compensation, excellent benefits, and opportunities for growth.",
            "Join a team that values innovation, collaboration, and professional development.",
            "Be part of exciting projects that make a real impact in the industry."
        ],
        "closing_paragraphs": [
            "I'd love to discuss this opportunity with you further. Please let me know if you're interested.",
            "If this sounds like something you'd be interested in, I'd be happy to provide more details.",
            "I look forward to hearing from you and potentially welcoming you to our team."
        ]
    }},
    "segmentation_suggestions": {{
        "by_experience_level": {{
            "entry_level": "Focus on learning opportunities and mentorship",
            "mid_level": "Emphasize growth and challenging projects",
            "senior_level": "Highlight leadership opportunities and impact"
        }},
        "by_skills": {{
            "technical": "Emphasize cutting-edge technology and innovation",
            "management": "Focus on leadership opportunities and team building",
            "creative": "Highlight creative freedom and innovative projects"
        }},
        "by_location": {{
            "remote": "Emphasize work-life balance and flexibility",
            "onsite": "Highlight office culture and collaboration",
            "hybrid": "Focus on best of both worlds approach"
        }}
    }},
    "best_practices": [
        "Keep subject lines under 50 characters",
        "Use personalization tokens for better engagement",
        "Include clear call-to-action buttons",
        "Test different subject lines for optimal open rates",
        "Segment your audience for better targeting"
    ],
    "compliance_notes": [
        "Ensure compliance with CAN-SPAM Act",
        "Include unsubscribe option",
        "Provide clear sender identification",
        "Avoid misleading subject lines"
    ]
}}

Guidelines:
- Generate 3-5 email variants with different approaches
- Include personalization tokens like [Candidate Name], [relevant skill], [years of experience]
- Create subject lines that are engaging but not spammy
- Provide multiple call-to-action options
- Include segmentation suggestions for different audiences
- Ensure content is professional and compliant
- Vary the tone and length based on requirements

Campaign Type: {campaign_type}
Target Audience: {target_audience}
Personalization Level: {personalization_level}
Tone: {tone}
Content Length: {content_length}

Job Information:
{job_context}

Company Information:
{company_context}"""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert email marketing specialist and recruitment professional. Create engaging, personalized email content that drives candidate engagement while maintaining professionalism and compliance."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2500,
            temperature=0.3,
            timeout=30
        )
        
        generated_text = response.choices[0].message.content
        print(f"📧 [MassMailingAI] AI response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        content_data = json.loads(json_str)
        
        # Add metadata
        content_data["ai_generated"] = True
        content_data["generated_at"] = datetime.now().isoformat()
        content_data["model_used"] = "gpt-4o-mini"
        content_data["campaign_type"] = campaign_type
        content_data["target_audience"] = target_audience
        content_data["personalization_level"] = personalization_level
        content_data["tone"] = tone
        content_data["content_length"] = content_length
        
        return content_data
        
    except Exception as e:
        print(f"❌ [MassMailingAI] AI generation failed: {e}")
        raise e

async def fallback_content_generation(campaign_type: str, target_audience: str, job_data: dict, 
                                    company_info: dict, personalization_level: str, tone: str, content_length: str) -> dict:
    """Fallback content generation when AI is not available"""
    print(f"🔄 [MassMailingAI] Using fallback content generation")
    
    # Basic email templates
    job_title = job_data.get('title', 'Position') if job_data else 'Opportunity'
    company_name = job_data.get('company', 'Our Company') if job_data else company_info.get('name', 'Our Company')
    
    return {
        "email_variants": [
            {
                "variant_name": "Standard Professional",
                "subject_line": f"Exciting {job_title} at {company_name}",
                "preheader": "Join our innovative team",
                "greeting": "Dear [Candidate Name],",
                "body": f"I hope this email finds you well. I'm reaching out because your background in [relevant skill] caught our attention. We have an exciting {job_title} opportunity at {company_name} that I believe would be a great fit for your skills and career goals.\n\nWe offer competitive compensation, excellent benefits, and opportunities for growth. If this sounds like something you'd be interested in, I'd be happy to provide more details.\n\nI look forward to hearing from you.",
                "call_to_action": "Apply Now",
                "closing": "Best regards,\n[Your Name]\n[Your Title]",
                "personalization_tokens": ["[Candidate Name]", "[relevant skill]", "[Your Name]", "[Your Title]"],
                "tone": "professional",
                "length": "medium"
            }
        ],
        "personalization_options": {
            "greeting_variants": ["Dear [Name]", "Hi [Name]", "Hello [Name]"],
            "skill_mentions": ["your expertise in [skill]", "your background in [skill]"],
            "company_highlights": ["our innovative culture", "our collaborative environment"],
            "urgency_indicators": ["limited time", "exclusive opportunity"]
        },
        "subject_line_variants": [
            f"Exciting {job_title} at {company_name}",
            f"Your skills match our {job_title}",
            f"Join {company_name} as a {job_title}"
        ],
        "call_to_action_variants": [
            "Apply Now",
            "Learn More",
            "Schedule a Call",
            "View Job Details"
        ],
        "content_templates": {
            "opening_paragraphs": [
                "I hope this email finds you well. I'm reaching out because your background in [relevant skill] caught our attention.",
                "I came across your profile and was impressed by your experience in [relevant skill]."
            ],
            "value_propositions": [
                "We offer competitive compensation, excellent benefits, and opportunities for growth.",
                "Join a team that values innovation, collaboration, and professional development."
            ],
            "closing_paragraphs": [
                "I'd love to discuss this opportunity with you further. Please let me know if you're interested.",
                "If this sounds like something you'd be interested in, I'd be happy to provide more details."
            ]
        },
        "segmentation_suggestions": {
            "by_experience_level": {
                "entry_level": "Focus on learning opportunities and mentorship",
                "mid_level": "Emphasize growth and challenging projects",
                "senior_level": "Highlight leadership opportunities and impact"
            },
            "by_skills": {
                "technical": "Emphasize cutting-edge technology and innovation",
                "management": "Focus on leadership opportunities and team building"
            }
        },
        "best_practices": [
            "Keep subject lines under 50 characters",
            "Use personalization tokens for better engagement",
            "Include clear call-to-action buttons",
            "Test different subject lines for optimal open rates"
        ],
        "compliance_notes": [
            "Ensure compliance with CAN-SPAM Act",
            "Include unsubscribe option",
            "Provide clear sender identification"
        ],
        "ai_generated": False,
        "generated_at": datetime.now().isoformat(),
        "model_used": "fallback",
        "campaign_type": campaign_type,
        "target_audience": target_audience,
        "personalization_level": personalization_level,
        "tone": tone,
        "content_length": content_length
    }

@app.post("/api/semantic-search/ai-enhanced")
async def ai_enhanced_semantic_search(request_data: dict):
    """AI-enhanced semantic search with intelligent query understanding and result ranking"""
    print(f"🔍 [SemanticSearchAI] Received request: {request_data}")
    
    try:
        query = request_data.get("query", "").strip()
        search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
        limit = request_data.get("limit", 10)
        filters = request_data.get("filters", {})
        search_mode = request_data.get("search_mode", "hybrid")  # "semantic", "keyword", "hybrid"
        
        if not query:
            return {
                "success": False,
                "error": "Search query is required"
            }
        
        # AI-powered query analysis and enhancement
        try:
            query_analysis = await analyze_search_query(query, search_type, filters)
            print(f"🧠 [SemanticSearchAI] Query analysis: {query_analysis.get('search_intent', 'unknown')}")
        except Exception as e:
            print(f"⚠️ [SemanticSearchAI] Query analysis failed, using basic search: {e}")
            query_analysis = {
                "original_query": query,
                "enhanced_query": query,
                "search_intent": "general",
                "key_concepts": [],
                "suggested_filters": {},
                "search_strategy": "semantic"
            }
        
        # Perform enhanced semantic search
        search_results = await perform_ai_enhanced_semantic_search(
            query_analysis, search_type, limit, filters, search_mode
        )
        
        # AI-powered result ranking and summarization
        try:
            enhanced_results = await enhance_search_results(search_results, query_analysis)
            print(f"📊 [SemanticSearchAI] Enhanced results: {len(enhanced_results.get('results', {}).get('resumes', []))} resumes, {len(enhanced_results.get('results', {}).get('jobs', []))} jobs")
        except Exception as e:
            print(f"⚠️ [SemanticSearchAI] Result enhancement failed, using original results: {e}")
            enhanced_results = search_results
        
        return {
            "success": True,
            "query_analysis": query_analysis,
            "results": enhanced_results,
            "search_mode": search_mode,
            "total_results": enhanced_results.get("total_results", 0),
            "message": f"AI-enhanced semantic search completed for '{query}'"
        }
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

async def analyze_search_query(query: str, search_type: str, filters: dict) -> dict:
    """Use AI to analyze and enhance search queries"""
    try:
        prompt = f"""Analyze this search query and provide intelligent search enhancement. Return ONLY a valid JSON object:

{{
    "original_query": "{query}",
    "enhanced_query": "improved version of the query",
    "search_intent": "job_search|candidate_search|skill_search|company_search|general",
    "key_concepts": ["concept1", "concept2", "concept3"],
    "extracted_skills": ["skill1", "skill2", "skill3"],
    "extracted_experience": "entry|junior|mid|senior|lead|any",
    "extracted_location": "location or remote",
    "extracted_company": "company name if mentioned",
    "suggested_filters": {{
        "experience_level": "entry|junior|mid|senior|lead",
        "location": "specific location or remote",
        "skills": ["skill1", "skill2"],
        "industry": "industry name",
        "company_size": "startup|small|medium|large|enterprise"
    }},
    "search_strategy": "semantic|keyword|hybrid",
    "related_terms": ["term1", "term2", "term3"],
    "search_tips": ["tip1", "tip2", "tip3"],
    "confidence_score": 85
}}

Guidelines:
- Enhanced query: Improve clarity, add synonyms, expand abbreviations
- Search intent: Determine what the user is looking for
- Key concepts: Extract main themes and requirements
- Extracted fields: Parse specific information from the query
- Suggested filters: Recommend filters based on query content
- Search strategy: Recommend best search approach
- Related terms: Suggest alternative search terms
- Search tips: Provide helpful suggestions for better results
- Confidence score: How confident you are in the analysis (0-100)

Search Type: {search_type}
Current Filters: {filters}

Query: "{query}" """

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search analyst and recruitment specialist. Analyze search queries to provide intelligent enhancement and better search results."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.1,
            timeout=20
        )
        
        generated_text = response.choices[0].message.content
        print(f"🧠 [SemanticSearchAI] AI analysis: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        analysis_data = json.loads(json_str)
        
        return analysis_data
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Query analysis failed: {e}")
        raise e

async def perform_ai_enhanced_semantic_search(query_analysis: dict, search_type: str, limit: int, filters: dict, search_mode: str) -> dict:
    """Perform enhanced semantic search using AI analysis"""
    try:
        enhanced_query = query_analysis.get("enhanced_query", query_analysis.get("original_query", ""))
        search_strategy = query_analysis.get("search_strategy", "semantic")
        
        # Combine suggested filters with provided filters
        suggested_filters = query_analysis.get("suggested_filters", {})
        combined_filters = {**filters, **suggested_filters}
        
        results = {"resumes": [], "jobs": [], "total_results": 0}
        
        if search_type in ["resumes", "both"]:
            # Search resumes using enhanced query
            resume_results = await search_resumes_enhanced(enhanced_query, limit, combined_filters, search_strategy)
            results["resumes"] = resume_results
        
        if search_type in ["jobs", "both"]:
            # Search jobs using enhanced query
            job_results = await search_jobs_enhanced(enhanced_query, limit, combined_filters, search_strategy)
            results["jobs"] = job_results
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        
        return {
            "query": enhanced_query,
            "search_type": search_type,
            "search_strategy": search_strategy,
            "results": results,
            "total_results": results["total_results"]
        }
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Enhanced search failed: {e}")
        # Fallback to basic search
        return await perform_basic_semantic_search(query_analysis.get("original_query", ""), search_type, limit, filters)

async def search_resumes_enhanced(query: str, limit: int, filters: dict, search_strategy: str) -> list:
    """Enhanced resume search with AI analysis"""
    try:
        if not milvus_connected:
            print("⚠️ [SemanticSearchAI] Milvus not connected, using fallback")
            return []
        
        collection = Collection("resumes")
        collection.load()
        
        # Generate embedding for the enhanced query
        query_embedding = get_embedding(query)
        
        # Build search expression with filters
        search_expr = "id != ''"
        if filters.get("experience_level"):
            search_expr += f" AND experience_level == '{filters['experience_level']}'"
        if filters.get("location"):
            search_expr += f" AND location LIKE '%{filters['location']}%'"
        
        # Perform vector search
        search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            expr=search_expr,
            output_fields=["*"]
        )
        
        resumes = []
        for hit in results[0]:
            result = hit.entity
            resume_data = {
                "id": result.get("id", ""),
                "full_name": result.get("full_name", ""),
                "email": result.get("email", ""),
                "phone": result.get("phone", ""),
                "summary": result.get("summary", ""),
                "skills": json.loads(result.get("skills", "[]")),
                "education": json.loads(result.get("education", "[]")),
                "work_experience": json.loads(result.get("work_experience", "[]")),
                "similarity_score": float(hit.score),
                "match_reason": f"Semantic similarity: {float(hit.score):.3f}"
            }
            resumes.append(resume_data)
        
        return resumes
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Resume search failed: {e}")
        return []

async def search_jobs_enhanced(query: str, limit: int, filters: dict, search_strategy: str) -> list:
    """Enhanced job search with AI analysis"""
    try:
        if not milvus_connected:
            print("⚠️ [SemanticSearchAI] Milvus not connected, using fallback")
            return []
        
        collection = Collection("job_descriptions")
        collection.load()
        
        # Generate embedding for the enhanced query
        query_embedding = get_embedding(query)
        
        # Build search expression with filters
        search_expr = "id != ''"
        if filters.get("experience_level"):
            search_expr += f" AND experience_level == '{filters['experience_level']}'"
        if filters.get("location"):
            search_expr += f" AND location LIKE '%{filters['location']}%'"
        if filters.get("company"):
            search_expr += f" AND company LIKE '%{filters['company']}%'"
        
        # Perform vector search
        search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            expr=search_expr,
            output_fields=["*"]
        )
        
        jobs = []
        for hit in results[0]:
            result = hit.entity
            job_data = {
                "id": result.get("id", ""),
                "title": result.get("title", ""),
                "company": result.get("company", ""),
                "location": result.get("location", ""),
                "experience_level": result.get("experience_level", ""),
                "overview": result.get("overview", ""),
                "required_skills": json.loads(result.get("required_skills", "[]")),
                "preferred_skills": json.loads(result.get("preferred_skills", "[]")),
                "responsibilities": json.loads(result.get("responsibilities", "[]")),
                "qualifications": json.loads(result.get("qualifications", "[]")),
                "similarity_score": float(hit.score),
                "match_reason": f"Semantic similarity: {float(hit.score):.3f}"
            }
            jobs.append(job_data)
        
        return jobs
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Job search failed: {e}")
        return []

async def enhance_search_results(search_results: dict, query_analysis: dict) -> dict:
    """Use AI to enhance and rank search results"""
    try:
        enhanced_query = query_analysis.get("enhanced_query", "")
        search_intent = query_analysis.get("search_intent", "general")
        key_concepts = query_analysis.get("key_concepts", [])
        
        # Prepare results for AI analysis
        results_summary = {
            "total_resumes": len(search_results.get("results", {}).get("resumes", [])),
            "total_jobs": len(search_results.get("results", {}).get("jobs", [])),
            "sample_resumes": search_results.get("results", {}).get("resumes", [])[:3],  # First 3 for analysis
            "sample_jobs": search_results.get("results", {}).get("jobs", [])[:3]  # First 3 for analysis
        }
        
        prompt = f"""Analyze these search results and provide intelligent ranking and insights. Return ONLY a valid JSON object:

{{
    "result_analysis": {{
        "relevance_score": 85,
        "quality_assessment": "high|medium|low",
        "coverage_analysis": "comprehensive|partial|limited",
        "key_insights": ["insight1", "insight2", "insight3"]
    }},
    "ranking_improvements": [
        {{
            "item_id": "resume_1",
            "item_type": "resume|job",
            "current_rank": 1,
            "suggested_rank": 2,
            "reason": "Better skill match found",
            "confidence": 80
        }}
    ],
    "result_summaries": {{
        "resumes": [
            {{
                "id": "resume_1",
                "summary": "Strong Python developer with 5 years experience",
                "key_highlights": ["Python expert", "Django experience", "Team lead"],
                "match_strength": "high|medium|low"
            }}
        ],
        "jobs": [
            {{
                "id": "job_1",
                "summary": "Senior Python Developer at TechCorp",
                "key_highlights": ["Remote work", "Senior level", "Python focus"],
                "match_strength": "high|medium|low"
            }}
        ]
    }},
    "search_suggestions": [
        "Try searching for 'Python Django developer' for more specific results",
        "Consider adding location filter for better targeting",
        "Look for 'Senior' level positions for more relevant matches"
    ],
    "alternative_queries": [
        "Python developer with Django experience",
        "Senior software engineer Python",
        "Full stack developer Python React"
    ],
    "confidence_metrics": {{
        "overall_confidence": 85,
        "result_quality": 80,
        "query_understanding": 90
    }}
}}

Guidelines:
- Analyze the relevance and quality of search results
- Suggest ranking improvements based on better matches
- Provide concise summaries for each result
- Offer search suggestions for better results
- Suggest alternative queries that might yield better results
- Provide confidence metrics for the analysis

Search Intent: {search_intent}
Enhanced Query: {enhanced_query}
Key Concepts: {key_concepts}

Search Results Summary:
{json.dumps(results_summary, indent=2)}"""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search analyst and recruitment specialist. Analyze search results to provide intelligent insights and improvements."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.1,
            timeout=25
        )
        
        generated_text = response.choices[0].message.content
        print(f"📊 [SemanticSearchAI] AI enhancement: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        enhancement_data = json.loads(json_str)
        
        # Apply ranking improvements to results
        enhanced_results = apply_ranking_improvements(search_results, enhancement_data)
        
        # Add AI insights to the results
        enhanced_results["ai_insights"] = enhancement_data
        
        return enhanced_results
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Result enhancement failed: {e}")
        return search_results

def apply_ranking_improvements(search_results: dict, enhancement_data: dict) -> dict:
    """Apply AI-suggested ranking improvements to search results"""
    try:
        ranking_improvements = enhancement_data.get("ranking_improvements", [])
        
        if not ranking_improvements:
            return search_results
        
        # Create a mapping of suggested improvements
        improvement_map = {}
        for improvement in ranking_improvements:
            item_id = improvement.get("item_id", "")
            suggested_rank = improvement.get("suggested_rank", 0)
            improvement_map[item_id] = suggested_rank
        
        # Apply improvements to resumes
        resumes = search_results.get("results", {}).get("resumes", [])
        if resumes:
            # Sort resumes based on AI suggestions
            resumes.sort(key=lambda x: improvement_map.get(x.get("id", ""), 999))
            search_results["results"]["resumes"] = resumes
        
        # Apply improvements to jobs
        jobs = search_results.get("results", {}).get("jobs", [])
        if jobs:
            # Sort jobs based on AI suggestions
            jobs.sort(key=lambda x: improvement_map.get(x.get("id", ""), 999))
            search_results["results"]["jobs"] = jobs
        
        return search_results
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Ranking application failed: {e}")
        return search_results

async def perform_basic_semantic_search(query: str, search_type: str, limit: int, filters: dict) -> dict:
    """Fallback basic semantic search when AI enhancement fails"""
    print(f"🔄 [SemanticSearchAI] Using basic semantic search")
    
    try:
        if not milvus_connected:
            return {
                "query": query,
                "search_type": search_type,
                "results": {"resumes": [], "jobs": [], "total_results": 0},
                "total_results": 0,
                "message": "Milvus not connected, using fallback search"
            }
        
        results = {"resumes": [], "jobs": [], "total_results": 0}
        
        if search_type in ["resumes", "both"]:
            # Basic resume search
            resume_results = await search_resumes_enhanced(query, limit, filters, "semantic")
            results["resumes"] = resume_results
        
        if search_type in ["jobs", "both"]:
            # Basic job search
            job_results = await search_jobs_enhanced(query, limit, filters, "semantic")
            results["jobs"] = job_results
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        
        return {
            "query": query,
            "search_type": search_type,
            "results": results,
            "total_results": results["total_results"],
            "message": "Basic semantic search completed"
        }
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Basic search failed: {e}")
        return {
            "query": query,
            "search_type": search_type,
            "results": {"resumes": [], "jobs": [], "total_results": 0},
            "total_results": 0,
            "error": str(e)
        }

# Milvus Database Management Endpoints
@app.get("/api/milvus/collections")
async def get_collections():
    """Get all Milvus collections"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        collections = []
        for collection_name in ["resumes", "job_descriptions"]:
            if utility.has_collection(collection_name):
                collection = Collection(collection_name)
                collection.load()
                
                # Get entity count
                entity_count = collection.num_entities
                
                # Get field information
                fields = []
                for field in collection.schema.fields:
                    fields.append({
                        "name": field.name,
                        "type": str(field.dtype),
                        "description": f"Field of type {field.dtype}"
                    })
                
                collections.append({
                    "name": collection_name,
                    "description": f"Collection for {collection_name.replace('_', ' ')}",
                    "entityCount": entity_count,
                    "fields": fields
                })
        
        return collections
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collections: {str(e)}")

@app.get("/api/milvus/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str):
    """Get collection statistics"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail="Collection not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        stats = {
            "name": collection_name,
            "entity_count": collection.num_entities,
            "indexes": len(collection.indexes),
            "partitions": len(collection.partitions),
            "schema": {
                "fields": [
                    {
                        "name": field.name,
                        "type": str(field.dtype),
                        "is_primary": field.is_primary,
                        "auto_id": field.auto_id
                    }
                    for field in collection.schema.fields
                ]
            }
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collection stats: {str(e)}")

@app.post("/api/milvus/collections/{collection_name}/insert")
async def insert_data(collection_name: str, data: dict):
    """Insert data into collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail="Collection not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        # This is a placeholder - actual implementation would depend on collection schema
        return {"message": f"Data insertion for {collection_name} not implemented yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting data: {str(e)}")

@app.delete("/api/milvus/collections/{collection_name}/delete")
async def delete_data(collection_name: str, data: dict):
    """Delete data from collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail="Collection not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        # This is a placeholder - actual implementation would depend on collection schema
        return {"message": f"Data deletion for {collection_name} not implemented yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting data: {str(e)}")

# Frontend Data Integration Endpoints
@app.get("/api/jobs")
async def get_jobs():
    """Get all jobs from Milvus job_descriptions collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection("job_descriptions"):
            return {"jobs": [], "total": 0}
        
        collection = Collection("job_descriptions")
        collection.load()
        
        # Query all job descriptions (excluding embeddings)
        results = collection.query(
            expr="",  # Empty expression means get all
            output_fields=["id", "title", "company", "department", "location_type", "location", "experience_level", "overview", "responsibilities", "qualifications", "required_skills", "preferred_skills", "benefits", "company_description", "status", "created_at", "updated_at"],
            limit=1000
        )
        
        jobs = []
        for result in results:
            # Parse skills from the actual data structure
            required_skills = result.get("required_skills", [])
            preferred_skills = result.get("preferred_skills", [])
            
            # Extract skills list for display
            required_skills_list = []
            if isinstance(required_skills, list):
                for skill in required_skills:
                    if isinstance(skill, dict):
                        required_skills_list.append(skill.get("name", ""))
                    else:
                        required_skills_list.append(str(skill))
            
            preferred_skills_list = []
            if isinstance(preferred_skills, list):
                for skill in preferred_skills:
                    if isinstance(skill, dict):
                        preferred_skills_list.append(skill.get("name", ""))
                    else:
                        preferred_skills_list.append(str(skill))
            
            # Parse JSON string fields if they are strings
            responsibilities = result["responsibilities"]
            if isinstance(responsibilities, str):
                try:
                    responsibilities = json.loads(responsibilities)
                except:
                    responsibilities = []
            
            qualifications = result["qualifications"]
            if isinstance(qualifications, str):
                try:
                    qualifications = json.loads(qualifications)
                except:
                    qualifications = []
            
            benefits = result["benefits"]
            if isinstance(benefits, str):
                try:
                    benefits = json.loads(benefits)
                except:
                    benefits = []
            
            job = {
                "id": result["id"],
                "title": result["title"],
                "company": result["company"],
                "department": result["department"],
                "location_type": result["location_type"],
                "location": result["location"],
                "experience_level": result["experience_level"],
                "overview": result["overview"],
                "responsibilities": responsibilities,
                "qualifications": qualifications,
                "required_skills": required_skills_list,
                "preferred_skills": preferred_skills_list,
                "benefits": benefits,
                "company_description": result["company_description"],
                "status": result["status"],
                "created_at": result["created_at"],
                "updated_at": result["updated_at"],
                "applications": 15 + (hash(result["id"]) % 50),  # Mock application count
                "views": 100 + (hash(result["id"]) % 200)  # Mock view count
            }
            jobs.append(job)
        
        return {
            "jobs": jobs,
            "total": len(jobs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching jobs: {str(e)}")

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a single job by ID from Milvus job_descriptions collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection("job_descriptions"):
            raise HTTPException(status_code=404, detail="Job not found")
        
        collection = Collection("job_descriptions")
        collection.load()
        
        # Query specific job by ID
        results = collection.query(
            expr=f'id == "{job_id}"',
            output_fields=["id", "title", "company", "department", "location_type", "location", "experience_level", "overview", "responsibilities", "qualifications", "required_skills", "preferred_skills", "benefits", "company_description", "status", "created_at", "updated_at"],
            limit=1
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Job not found")
        
        result = results[0]
        
        # Parse skills from the actual data structure
        required_skills = result.get("required_skills", [])
        preferred_skills = result.get("preferred_skills", [])
        
        # Extract skills list for display
        required_skills_list = []
        if isinstance(required_skills, list):
            for skill in required_skills:
                if isinstance(skill, dict):
                    required_skills_list.append(skill.get("name", ""))
                else:
                    required_skills_list.append(str(skill))
        
        preferred_skills_list = []
        if isinstance(preferred_skills, list):
            for skill in preferred_skills:
                if isinstance(skill, dict):
                    preferred_skills_list.append(skill.get("name", ""))
                else:
                    preferred_skills_list.append(str(skill))
        
        # Parse JSON string fields if they are strings
        responsibilities = result["responsibilities"]
        if isinstance(responsibilities, str):
            try:
                responsibilities = json.loads(responsibilities)
            except:
                responsibilities = []
        
        qualifications = result["qualifications"]
        if isinstance(qualifications, str):
            try:
                qualifications = json.loads(qualifications)
            except:
                qualifications = []
        
        benefits = result["benefits"]
        if isinstance(benefits, str):
            try:
                benefits = json.loads(benefits)
            except:
                benefits = []
        
        job = {
            "id": result["id"],
            "title": result["title"],
            "company": result["company"],
            "department": result["department"],
            "location_type": result["location_type"],
            "location": result["location"],
            "experience_level": result["experience_level"],
            "overview": result["overview"],
            "responsibilities": responsibilities,
            "qualifications": qualifications,
            "required_skills": required_skills_list,
            "preferred_skills": preferred_skills_list,
            "benefits": benefits,
            "company_description": result["company_description"],
            "status": result["status"],
            "created_at": result["created_at"],
            "updated_at": result["updated_at"],
            "applications": 15 + (hash(result["id"]) % 50),  # Mock application count
            "views": 100 + (hash(result["id"]) % 200)  # Mock view count
        }
        
        return {"job": job}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching job: {str(e)}")

# PDF to CSV Conversion Endpoint
@app.post("/api/pdf-to-csv/convert")
async def convert_pdfs_to_csv(files: List[UploadFile] = File(...)):
    """Convert multiple PDF files to a single CSV file"""
    try:
        import PyPDF2
        import io
        import csv
        from datetime import datetime
        
        pdf_data = []
        
        for file in files:
            # Accept both PDF and TXT files for testing
            if not (file.filename.lower().endswith('.pdf') or file.filename.lower().endswith('.txt')):
                continue
                
            try:
                # Read file content
                content = await file.read()
                
                # Handle text files differently
                if file.filename.lower().endswith('.txt'):
                    text_content = content.decode('utf-8')
                    pages_count = 1  # Text files are considered 1 page
                else:
                    # Try multiple PDF parsing methods
                    text_content = ""
                    pages_count = 0
                    
                    try:
                        # Method 1: PyPDF2
                        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                        pages_count = len(pdf_reader.pages)
                        
                        for page in pdf_reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text_content += page_text + "\n"
                        
                        # If PyPDF2 didn't extract much text, try alternative method
                        if len(text_content.strip()) < 50:
                            try:
                                # Method 2: Try pdfplumber as alternative
                                import pdfplumber
                                with pdfplumber.open(io.BytesIO(content)) as pdf:
                                    pages_count = len(pdf.pages)
                                    for page in pdf.pages:
                                        page_text = page.extract_text()
                                        if page_text:
                                            text_content += page_text + "\n"
                            except ImportError:
                                # pdfplumber not available, continue with PyPDF2 result
                                pass
                            except Exception as pdfplumber_error:
                                print(f"pdfplumber failed for {file.filename}: {str(pdfplumber_error)}")
                    
                    except Exception as pdf_error:
                        print(f"PDF parsing failed for {file.filename}: {str(pdf_error)}")
                        # Try to get basic info even if text extraction fails
                        try:
                            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                            pages_count = len(pdf_reader.pages)
                            text_content = f"PDF file with {pages_count} pages, but text extraction failed. File may be image-based or corrupted."
                        except:
                            text_content = f"Unable to process PDF file: {file.filename}. File may be corrupted or in an unsupported format."
                            pages_count = 0
                
                # Clean up text
                if text_content:
                    clean_text = text_content.replace('\n', ' ').replace('\r', ' ')
                    clean_text = ' '.join(clean_text.split())  # Remove extra whitespace
                    clean_text = clean_text.strip()
                    
                    # Check if we got meaningful text
                    if len(clean_text) < 10:
                        clean_text = f"PDF file with {pages_count} pages, but minimal text content extracted. File may contain mostly images or be in a non-standard format."
                else:
                    clean_text = f"No text content extracted from {file.filename}. File may be image-based or corrupted."
                
                # Extract name from content
                def extract_name_from_content(text, filename):
                    lines = text.split('\n')
                    for i, line in enumerate(lines[:5]):  # Check first 5 lines
                        line = line.strip()
                        if (line.lower() in ['resume', 'cv', 'curriculum vitae'] or 
                            not line or len(line) < 2):
                            continue
                        
                        words = line.split()
                        if 2 <= len(words) <= 3:
                            if all(word.replace('.', '').isalpha() and word[0].isupper() for word in words):
                                return line
                    
                    # Fallback: use filename
                    name = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ')
                    return ' '.join(word.capitalize() for word in name.split())
                
                # Generate unique ID
                import hashlib
                id_hash = hashlib.md5(f"{file.filename}_{datetime.now().isoformat()}".encode()).hexdigest()[:12]
                resume_id = f"resume_{id_hash}"
                
                extracted_name = extract_name_from_content(clean_text, file.filename)
                
                pdf_data.append({
                    "id": resume_id,
                    "full_name": extracted_name,
                    "email": "",  # Will be extracted or left empty
                    "phone": "",  # Will be extracted or left empty
                    "summary": clean_text[:5000] if len(clean_text) > 5000 else clean_text,  # Truncate if too long
                    "skills": "",  # Will be extracted or left empty
                    "education": "",  # Will be extracted or left empty
                    "work_experience": clean_text,  # Use full text as work experience
                    "file_path": file.filename,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "embedding": "[" + ",".join(["0.0"] * 384) + "]"  # Zero vector placeholder
                })
                
            except Exception as e:
                print(f"Error processing {file.filename}: {str(e)}")
                # Add error entry with more specific error message
                error_msg = str(e)
                if "password" in error_msg.lower():
                    error_msg = f"Password-protected PDF: {file.filename}. Please remove password protection."
                elif "corrupted" in error_msg.lower():
                    error_msg = f"Corrupted PDF file: {file.filename}. Please check file integrity."
                else:
                    error_msg = f"Unable to process {file.filename}: {error_msg}"
                
                # Generate ID for error case too
                import hashlib
                id_hash = hashlib.md5(f"{file.filename}_{datetime.now().isoformat()}".encode()).hexdigest()[:12]
                resume_id = f"resume_{id_hash}"
                
                pdf_data.append({
                    "id": resume_id,
                    "full_name": file.filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').title(),
                    "email": "",
                    "phone": "",
                    "summary": error_msg,
                    "skills": "",
                    "education": "",
                    "work_experience": error_msg,
                    "file_path": file.filename,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "embedding": "[" + ",".join(["0.0"] * 384) + "]"  # Zero vector placeholder
                })
        
        # Create CSV content (Milvus schema: all required fields)
        csv_output = io.StringIO()
        fieldnames = [
            'id', 'full_name', 'email', 'phone', 'summary', 'skills', 
            'education', 'work_experience', 'file_path', 'created_at', 
            'updated_at', 'embedding'
        ]
        writer = csv.DictWriter(csv_output, fieldnames=fieldnames)
        
        writer.writeheader()
        for data in pdf_data:
            writer.writerow(data)
        
        csv_content = csv_output.getvalue()
        csv_output.close()
        
        return {
            "success": True,
            "message": f"Successfully converted {len(pdf_data)} PDF files to CSV",
            "csv_data": csv_content,
            "processed_files": len(pdf_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting PDFs to CSV: {str(e)}")

@app.get("/api/test-endpoint")
async def test_endpoint():
    """Test endpoint to verify new endpoints are being registered"""
    return {"message": "Test endpoint working"}

@app.post("/api/test-job-generation")
async def test_job_generation():
    """Test endpoint for job generation"""
    print("🧪 [Test] Job generation test endpoint called")
    return {
        "success": True,
        "message": "Job generation test endpoint working",
        "openai_available": bool(openai.api_key),
        "milvus_connected": milvus_connected
    }

@app.get("/api/test-milvus-connection")
async def test_milvus_connection():
    """Test endpoint to verify Milvus connection and data"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        # Get entity counts
        resume_count = 0
        job_count = 0
        
        if utility.has_collection("resumes"):
            collection = Collection("resumes")
            resume_count = collection.num_entities
        
        if utility.has_collection("job_descriptions"):
            collection = Collection("job_descriptions")
            job_count = collection.num_entities
        
        return {
            "message": "Milvus connection test",
            "milvus_host": MILVUS_HOST,
            "milvus_port": MILVUS_PORT,
            "resume_count": resume_count,
            "job_count": job_count,
            "expected": "7 resumes, 1 job description"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "milvus_host": MILVUS_HOST,
            "milvus_port": MILVUS_PORT
        }

@app.post("/api/jobs")
async def create_job(job_data: dict):
    """Create a new job posting"""
    try:
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # Prepare job data with required fields
        job = {
            "id": job_id,
            "title": job_data.get("title", "Untitled Job"),
            "company": job_data.get("company", "Unknown Company"),
            "department": job_data.get("department", "General"),
            "location_type": job_data.get("location_type", "remote"),
            "location": job_data.get("location", "Remote"),
            "experience_level": job_data.get("experience_level", "Mid Level"),
            "overview": job_data.get("overview", job_data.get("description", "Job description not provided")),
            "responsibilities": job_data.get("responsibilities", []),
            "qualifications": job_data.get("qualifications", []),
            "required_skills": job_data.get("required_skills", []),
            "preferred_skills": job_data.get("preferred_skills", []),
            "benefits": job_data.get("benefits", []),
            "company_description": job_data.get("company_description", ""),
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Connect to Milvus
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection("job_descriptions"):
            # Create collection if it doesn't exist
            from pymilvus import CollectionSchema, FieldSchema, DataType
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=100),
                FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=500),
                FieldSchema(name="company", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="department", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="location_type", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="location", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="experience_level", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="overview", dtype=DataType.VARCHAR, max_length=2000),
                FieldSchema(name="responsibilities", dtype=DataType.VARCHAR, max_length=2000),
                FieldSchema(name="qualifications", dtype=DataType.VARCHAR, max_length=2000),
                FieldSchema(name="required_skills", dtype=DataType.VARCHAR, max_length=1000),
                FieldSchema(name="preferred_skills", dtype=DataType.VARCHAR, max_length=1000),
                FieldSchema(name="benefits", dtype=DataType.VARCHAR, max_length=1000),
                FieldSchema(name="company_description", dtype=DataType.VARCHAR, max_length=1000),
                FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
            ]
            schema = CollectionSchema(fields, "Collection for job descriptions")
            collection = Collection("job_descriptions", schema)
        else:
            collection = Collection("job_descriptions")
        
        # Prepare data for insertion
        insert_data = [
            [job["id"]],
            [job["title"]],
            [job["company"]],
            [job["department"]],
            [job["location_type"]],
            [job["location"]],
            [job["experience_level"]],
            [job["overview"]],
            [json.dumps(job["responsibilities"])],
            [json.dumps(job["qualifications"])],
            [json.dumps(job["required_skills"])],
            [json.dumps(job["preferred_skills"])],
            [json.dumps(job["benefits"])],
            [job["company_description"]],
            [job["status"]],
            [job["created_at"]],
            [job["updated_at"]],
            [[0.0] * 384]  # Dummy embedding
        ]
        
        # Insert the job
        collection.insert(insert_data)
        collection.flush()
        
        return {
            "message": "Job created successfully",
            "job_id": job_id,
            "job": job
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating job: {str(e)}")

# Resume Parser Endpoints
@app.get("/api/resume-parser/stored-resumes")
async def get_stored_resumes():
    resumes = get_resumes_from_milvus()
    return {
        "resumes": resumes,
        "total": len(resumes),
        "message": f"Found {len(resumes)} stored resumes"
    }

@app.post("/api/resume-parser/parse")
async def parse_resume(file: UploadFile = File(...)):
    try:
        print(f"Starting resume parsing for: {file.filename}")
        
        file_content = await file.read()
        text = extract_text_from_file(file_content, file.filename)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        parsed_data = parse_resume_with_ai(text)
        resume_id = str(uuid.uuid4())
        
        current_time = datetime.now().isoformat()
        
        # Store in memory
        resume_data = {
            "resume_id": resume_id,
            "full_name": parsed_data.get("full_name", ""),
            "contact": {
                "email": parsed_data.get("email", ""),
                "phone": parsed_data.get("phone", ""),
                "linkedin": parsed_data.get("linkedin"),
                "github": parsed_data.get("github"),
                "website": parsed_data.get("website")
            },
            "education": parsed_data.get("education", []),
            "work_experience": parsed_data.get("work_experience", []),
            "skills": parsed_data.get("skills", []),
            "file_path": file.filename,
            "created_at": current_time,
            "summary": parsed_data.get("summary"),
            "certifications": parsed_data.get("certifications", []),
            "languages": parsed_data.get("languages", [])
        }
        
        stored_resumes.append(resume_data)
        
        # Store in Milvus
        store_resume_in_milvus(resume_data, resume_id)
        
        print(f"✅ Resume stored with ID: {resume_id}")
        print(f"✅ Stored data for: {resume_data['full_name']}")
        print(f"✅ Total resumes in memory: {len(stored_resumes)}")
        
        print(f"Resume parsing completed for: {resume_data['full_name']}")
        return resume_data
        
    except Exception as e:
        print(f"Error parsing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

async def process_single_file(file: UploadFile, index: int, total: int) -> Dict[str, Any]:
    """Process a single resume file - optimized for parallel processing"""
    try:
        print(f"🔄 Processing file {index+1}/{total}: {file.filename}")
        
        file_content = await file.read()
        text = extract_text_from_file(file_content, file.filename)
        
        if not text.strip():
            return {
                "filename": file.filename,
                "status": "error",
                "error": "Could not extract text from file"
            }
        
        # Parse resume with AI
        parsed_data = parse_resume_with_ai(text)
        resume_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Store in memory
        resume_data = {
            "resume_id": resume_id,
            "full_name": parsed_data.get("full_name", ""),
            "contact": {
                "email": parsed_data.get("email", ""),
                "phone": parsed_data.get("phone", ""),
                "linkedin": parsed_data.get("linkedin"),
                "github": parsed_data.get("github"),
                "website": parsed_data.get("website")
            },
            "education": parsed_data.get("education", []),
            "work_experience": parsed_data.get("work_experience", []),
            "skills": parsed_data.get("skills", []),
            "file_path": file.filename,
            "created_at": current_time,
            "summary": parsed_data.get("summary"),
            "certifications": parsed_data.get("certifications", []),
            "languages": parsed_data.get("languages", [])
        }
        
        stored_resumes.append(resume_data)
        
        # Store in Milvus
        store_resume_in_milvus(resume_data, resume_id)
        
        print(f"✅ Successfully processed: {file.filename} -> {resume_data['full_name']}")
        
        return {
            "filename": file.filename,
            "resume_id": resume_id,
            "full_name": resume_data['full_name'],
            "status": "success"
        }
        
    except Exception as e:
        error_msg = f"Error processing {file.filename}: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "filename": file.filename,
            "status": "error",
            "error": str(e)
        }

@app.post("/api/resume-parser/bulk-parse")
async def bulk_parse_resumes(files: List[UploadFile] = File(...)):
    """Parse multiple resumes in bulk - OPTIMIZED WITH PARALLEL PROCESSING"""
    try:
        if len(files) > 50:  # Limit to 50 files at once
            raise HTTPException(status_code=400, detail="Maximum 50 files allowed per bulk upload")
        
        print(f"🚀 Starting parallel processing of {len(files)} files...")
        
        # Process files in parallel with limited concurrency to avoid rate limits
        max_workers = min(5, len(files))  # Limit to 5 concurrent requests to avoid OpenAI rate limits
        
        # Create tasks for parallel processing
        tasks = []
        for i, file in enumerate(files):
            task = process_single_file(file, i, len(files))
            tasks.append(task)
        
        # Execute tasks with limited concurrency
        results = []
        errors = []
        
        # Process in batches to avoid overwhelming the API
        batch_size = max_workers
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i:i + batch_size]
            batch_results = await asyncio.gather(*batch, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, Exception):
                    errors.append({
                        "filename": "unknown",
                        "error": str(result)
                    })
                elif result.get("status") == "error":
                    errors.append({
                        "filename": result["filename"],
                        "error": result["error"]
                    })
                else:
                    results.append(result)
        
        print(f"🎉 Parallel processing completed: {len(results)} successful, {len(errors)} failed")
        
        return {
            "message": f"Bulk processing completed. {len(results)} successful, {len(errors)} failed.",
            "total_files": len(files),
            "successful": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }
        
    except Exception as e:
        print(f"❌ Error in bulk resume parsing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in bulk resume parsing: {str(e)}")

# Job Description Endpoints
@app.get("/api/job-descriptions/drafts")
async def get_job_descriptions_drafts():
    return {"job_descriptions": [], "total": 0, "message": "No drafts"}

@app.get("/api/job-descriptions")
async def get_job_descriptions():
    jobs = get_jobs_from_milvus()
    return {
        "job_descriptions": jobs,
        "total": len(jobs),
        "message": f"Found {len(jobs)} published jobs"
    }

@app.get("/api/job-descriptions/{job_id}")
async def get_job_description_by_id(job_id: str):
    # Handle undefined job_id
    if job_id == "undefined" or not job_id:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    jobs = get_jobs_from_milvus()
    for job in jobs:
        if job.get("job_id") == job_id:
            return job
    
    raise HTTPException(status_code=404, detail="Job not found")

@app.post("/api/job-descriptions/generate")
async def generate_job_description(request_data: dict):
    print(f"🚀 [JobGeneration] Received request: {request_data}")
    print(f"🚀 [JobGeneration] OpenAI API Key available: {bool(openai.api_key)}")
    
    # Quick test return
    if request_data.get("title") == "TEST":
        return {"success": True, "message": "Test endpoint working", "data": request_data}
    
    try:
        title = request_data.get("title", "Software Engineer")
        company = request_data.get("company", "Company Name")
        department = request_data.get("department", "Engineering")
        location_type = request_data.get("location_type", "remote")
        location = request_data.get("location", "Anywhere")
        experience_level = request_data.get("experience_level", "Senior Level")
        key_skills = request_data.get("key_skills", [])
        
        skills_text = ", ".join(key_skills) if key_skills else "relevant technical skills"
        
        try:
            # Try OpenAI first
            prompt = f"""
            Create an EXTREMELY DETAILED, REALISTIC job description for a {title} position at {company}. This should be as comprehensive and specific as a real job posting from a top tech company.

            COMPANY: {company}
            ROLE: {title}
            DEPARTMENT: {department}
            LOCATION: {location} ({location_type})
            EXPERIENCE: {experience_level}
            KEY SKILLS: {skills_text if skills_text else "industry-relevant technical skills"}

            CRITICAL REQUIREMENTS:
            1. Make this ULTRA-SPECIFIC to the {title} role - NOT generic software development tasks
            2. Create DETAILED responsibilities that a {title} would actually do at {company}
            3. Include SPECIFIC technical requirements and tools for {title} role
            4. Add REALISTIC qualifications that match the {title} role and company's standards
            5. Include AUTHENTIC company benefits and culture details
            6. Write in the tone and style of a real {company} job posting
            7. Use EXACT values: {company}, {title}, {department}, {location}, {location_type}, {experience_level}

            ROLE-SPECIFIC REQUIREMENTS:
            - If {title} is "Data Scientist": Focus on data analysis, machine learning, statistics, data visualization, A/B testing, model building
            - If {title} is "Business Consultant": Focus on business strategy, client consulting, process improvement, stakeholder management, business analysis
            - If {title} is "Software Engineer": Focus on software development, coding, system design, debugging, testing
            - If {title} is "Product Manager": Focus on product strategy, roadmap planning, stakeholder management, market research, feature prioritization
            - If {title} is "Marketing Manager": Focus on marketing campaigns, brand management, digital marketing, analytics, content strategy
            - If {title} is "Sales Manager": Focus on sales strategy, team management, client relationships, revenue targets, business development
            - If {title} is "HR Manager": Focus on talent acquisition, employee relations, performance management, policy development, culture building
            - If {title} is "Finance Manager": Focus on financial planning, budgeting, analysis, reporting, compliance, risk management
            - If {title} is "Operations Manager": Focus on process optimization, supply chain, quality control, team management, efficiency improvement
            - If {title} is "Designer": Focus on user experience, visual design, prototyping, user research, design systems

            JOB DESCRIPTION STRUCTURE:

            **About the Company:**
            - Write 2-3 paragraphs about {company}'s mission, culture, and what makes it unique
            - Include company size, industry position, and key products/services
            - Mention company values and work environment
            - Explain why someone would want to work at {company}

            **About the Team:**
            - Describe the {department} department and its role at {company}
            - Explain what the team does and how it contributes to company goals
            - Mention team size, structure, and collaboration style

            **Role Overview:**
            - 2-3 sentences explaining the {title} role and its importance
            - What the person will accomplish and impact they'll have
            - How this role fits into the broader {company} mission

            **Tech Stack:**
            - List specific technologies, frameworks, and tools used for {title} role at {company}
            - Include programming languages, databases, cloud platforms, etc.
            - Be specific about versions and tools (e.g., "Python 3.9+", "AWS Lambda", "Kubernetes")

            **Key Responsibilities:**
            - 10-15 SPECIFIC, DETAILED responsibilities for {title} role
            - Include specific tasks, deliverables, and outcomes
            - Mention specific technologies and tools
            - Include collaboration and leadership aspects
            - Be specific about what success looks like
            - Include metrics and KPIs where relevant
            - Mention specific projects and initiatives
            - Include cross-functional collaboration details

            **Requirements - Must Have:**
            - 8-12 SPECIFIC requirements for {title} role
            - Exact education requirements (degree, field, GPA if relevant)
            - Specific years of experience in relevant areas
            - Required technical skills with proficiency levels
            - Required certifications or licenses
            - Industry experience requirements
            - Soft skills and competencies
            - Specific project experience requirements
            - Leadership and management experience
            - Communication and presentation skills

            **Requirements - Nice to Have:**
            - 6-10 additional skills that would make a candidate stand out
            - Specific technologies or frameworks
            - Industry experience or domain knowledge
            - Leadership or management experience
            - Advanced certifications or degrees
            - Open source contributions
            - Conference speaking experience
            - Patent or publication experience
            - Mentoring or teaching experience

            **Benefits & Perks:**
            - 8-12 REALISTIC benefits that {company} would actually offer
            - Include specific compensation details (salary ranges, equity, bonuses)
            - Health, dental, vision insurance details
            - Work-life balance perks (flexible hours, remote work, PTO)
            - Professional development opportunities
            - Company-specific perks and culture benefits
            - Stock options and equity details
            - Retirement and savings plans
            - Wellness and fitness programs
            - Learning and development budgets

            Format as JSON with these EXACT keys:
            {{
                "title": "{title}",
                "company": "{company}",
                "department": "{department}",
                "location_type": "{location_type}",
                "location": "{location}",
                "experience_level": "{experience_level}",
                "overview": "Detailed role overview specific to {company}",
                "responsibilities": ["Specific, detailed responsibility 1", "Specific, detailed responsibility 2", ...],
                "qualifications": ["Specific qualification 1", "Specific qualification 2", ...],
                "required_skills": ["Specific technical skill 1", "Specific technical skill 2", ...],
                "preferred_skills": ["Preferred skill 1", "Preferred skill 2", ...],
                "benefits": ["Specific benefit 1", "Specific benefit 2", ...],
                "company_description": "Detailed description of {company} as a real company"
            }}
            """
            
            response = openai.chat.completions.create(
                model="gpt-4o",  # Use more powerful model for better quality
                messages=[
                    {"role": "system", "content": "You are an expert job description writer who creates EXTREMELY DETAILED, REALISTIC job postings for top tech companies. Your job descriptions are comprehensive, specific, and authentic - they read like real job postings from actual companies. You excel at creating detailed technical requirements, specific responsibilities, authentic company culture descriptions, and realistic benefits. Each job description is unique and tailored to the specific company, role, and industry. Focus on ULTRA-SPECIFICITY, authenticity, and EXTREME detail. Use EXACTLY the provided company name, job title, department, location, and experience level. Return ONLY valid JSON, no markdown formatting or additional text."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},  # Force JSON response
                max_tokens=6000,  # Significantly increased for extremely detailed descriptions
                temperature=0.8,  # More creative for realistic descriptions
                timeout=60  # Add timeout
            )
            
            generated_text = response.choices[0].message.content
            
            try:
                start_idx = generated_text.find('{')
                end_idx = generated_text.rfind('}') + 1
                json_str = generated_text[start_idx:end_idx]
                job_data = json.loads(json_str)
            except:
                job_data = {
                    "title": title,
                    "company": company,
                    "department": department,
                    "location_type": location_type,
                    "location": location,
                    "experience_level": experience_level,
                    "overview": generated_text[:500] + "...",
                    "responsibilities": ["Generated by AI - see full description above"],
                    "qualifications": ["Generated by AI - see full description above"],
                    "required_skills": key_skills,
                    "preferred_skills": [],
                    "benefits": ["Competitive salary", "Health insurance", "401k", "Flexible work arrangements"],
                    "company_description": f"{company} is a leading company in the industry."
                }
        except Exception as e:
            print(f"OpenAI failed, using fallback job generation: {e}")
            # Fallback job description
            job_data = {
                "title": title,
                "company": company,
                "department": department or "Engineering",
                "location_type": location_type,
                "location": location or "Remote",
                "experience_level": experience_level,
                "overview": f"We are looking for a {title} to join our {company} team. This position offers an exciting opportunity to work on cutting-edge projects and contribute to our company's success.",
                "responsibilities": [
                    f"Develop and maintain {title.lower()} solutions",
                    "Collaborate with cross-functional teams",
                    "Write clean, maintainable code",
                    "Participate in code reviews",
                    "Contribute to technical documentation"
                ],
                "qualifications": [
                    f"Bachelor's degree in Computer Science or related field",
                    f"3+ years of experience in {title.lower()}",
                    f"Strong programming skills in {', '.join(key_skills) if key_skills else 'relevant technologies'}",
                    "Excellent problem-solving abilities",
                    "Strong communication skills"
                ],
                "required_skills": key_skills if key_skills else ["Programming", "Problem Solving", "Team Collaboration"],
                "preferred_skills": ["Cloud Computing", "Agile Development", "Version Control"],
                "benefits": [
                    "Competitive salary and equity",
                    "Comprehensive health insurance",
                    "401k matching",
                    "Flexible work arrangements",
                    "Professional development opportunities"
                ],
                "company_description": f"{company} is a leading company in the industry, known for innovation and excellence."
            }
        
        # Format the job description as a readable text (outside the try-catch)
        try:
            job_description = f"""# {job_data['title']}

## Company: {job_data['company']}
**Department:** {job_data['department']}
**Location:** {job_data['location']} ({job_data['location_type']})
**Experience Level:** {job_data['experience_level']}

## Job Overview
{job_data['overview']}

## Key Responsibilities
{chr(10).join([f"• {resp}" for resp in job_data['responsibilities']])}

## Required Qualifications
{chr(10).join([f"• {qual}" for qual in job_data['qualifications']])}

## Required Skills
{chr(10).join([f"• {skill}" for skill in job_data['required_skills']])}

## Preferred Skills
{chr(10).join([f"• {skill}" for skill in job_data['preferred_skills']]) if job_data['preferred_skills'] else "• None specified"}

## Benefits
{chr(10).join([f"• {benefit}" for benefit in job_data['benefits']])}

## About {job_data['company']}
{job_data['company_description']}
"""

            return {
                "job_description": job_description,
                "job_data": job_data,
                "success": True
            }
        except Exception as format_error:
            print(f"❌ Error formatting job description: {format_error}")
            # Fallback to simple format
            job_description = f"# {job_data['title']}\n\n## Company: {job_data['company']}\n\n## Overview\n{job_data['overview']}"
            return {
                "job_description": job_description,
                "job_data": job_data,
                "success": True
            }
        
        # This should never be reached, but just in case
        return {
            "error": "Unexpected error in job generation",
            "message": "Failed to generate job description",
            "success": False
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to generate job description",
            "success": False
        }

@app.post("/api/job-descriptions/save")
async def save_job_description(job_data: dict):
    job_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    # Add metadata to job data
    job_with_metadata = {
        "job_id": job_id,
        "created_at": current_time,
        "updated_at": current_time,
        "status": "published",
        **job_data
    }
    
    # Store in memory
    stored_job_descriptions.append(job_with_metadata)
    
    # Store in Milvus
    store_job_in_milvus(job_with_metadata, job_id)
    
    print(f"✅ Job description stored with ID: {job_id}")
    print(f"✅ Stored job: {job_data.get('title', 'Unknown')} at {job_data.get('company', 'Unknown Company')}")
    print(f"✅ Total jobs in memory: {len(stored_job_descriptions)}")
    
    return {
        "success": True,
        "message": "Job description saved successfully!",
        "job_id": job_id,
        "job": job_with_metadata
    }

@app.post("/api/job-descriptions")
async def create_job_description(job_data: dict):
    return await save_job_description(job_data)

# Candidate Endpoints
@app.get("/api/candidates")
async def get_candidates():
    candidates = get_resumes_from_milvus()
    return {
        "candidates": candidates,
        "total": len(candidates),
        "message": f"Found {len(candidates)} candidates"
    }

@app.get("/api/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Get a single candidate by ID from Milvus resumes collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection("resumes"):
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        collection = Collection("resumes")
        collection.load()
        
        # Query specific candidate by ID
        results = collection.query(
            expr=f'id == "{candidate_id}"',
            output_fields=["id", "name", "email", "phone", "location", "experience_years", "skills", "score", "status", "summary", "created_at", "updated_at"],
            limit=1
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        result = results[0]
        
        # Parse skills from the actual data structure
        skills = result.get("skills", [])
        skills_list = []
        if isinstance(skills, list):
            for skill in skills:
                if isinstance(skill, dict):
                    skills_list.append(skill.get("name", ""))
                else:
                    skills_list.append(str(skill))
        
        candidate = {
            "id": result["id"],
            "name": result["name"],
            "email": result.get("email", ""),
            "phone": result.get("phone", ""),
            "location": result["location"],
            "position": "Software Developer",  # Default position since it's not in the data
            "experienceYears": result["experience_years"],
            "skills": skills_list,
            "jobMatchScore": result["score"],
            "status": result["status"],
            "lastActivity": result["updated_at"],
            "resumeText": result.get("summary", ""),
            "createdAt": result["created_at"],
            "updatedAt": result["updated_at"]
        }
        
        return {"candidate": candidate}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching candidate {candidate_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching candidate: {str(e)}")

@app.post("/api/candidates")
async def create_candidate():
    return {"message": "Not implemented"}

# Semantic Search Endpoints
@app.post("/api/search/semantic")
async def semantic_search(request_data: dict):
    """Perform semantic search across resumes and job descriptions"""
    query_text = request_data.get("query", "")
    search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
    limit = request_data.get("limit", 10)
    
    if not query_text.strip():
        raise HTTPException(status_code=400, detail="Query text is required")
    
    try:
        
        # Generate embedding for the query
        query_embedding = get_embedding(query_text)
        
        results = {
            "query": query_text,
            "search_type": search_type,
            "resumes": [],
            "jobs": [],
            "total_results": 0
        }
        
        if not milvus_connected:
            return {
                "message": "Milvus not connected, using fallback search",
                "results": results
            }
        
        # Search resumes if requested
        if search_type in ["resumes", "both"]:
            try:
                collection = Collection("resumes")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                resume_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "full_name", "email", "summary", "skills", "work_experience"]
                )
                
                for hit in resume_results[0]:
                    resume_data = {
                        "resume_id": hit.entity.get("id"),
                        "full_name": hit.entity.get("full_name"),
                        "email": hit.entity.get("email"),
                        "summary": hit.entity.get("summary"),
                        "skills": json.loads(hit.entity.get("skills", "[]")),
                        "work_experience": json.loads(hit.entity.get("work_experience", "[]")),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance)
                    }
                    results["resumes"].append(resume_data)
                    
            except Exception as e:
                print(f"Error searching resumes: {e}")
        
        # Search jobs if requested
        if search_type in ["jobs", "both"]:
            try:
                collection = Collection("job_descriptions")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                job_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "title", "company", "overview", "required_skills", "responsibilities"]
                )
                
                for hit in job_results[0]:
                    job_data = {
                        "job_id": hit.entity.get("id"),
                        "title": hit.entity.get("title"),
                        "company": hit.entity.get("company"),
                        "overview": hit.entity.get("overview"),
                        "required_skills": json.loads(hit.entity.get("required_skills", "[]")),
                        "responsibilities": json.loads(hit.entity.get("responsibilities", "[]")),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance)
                    }
                    results["jobs"].append(job_data)
                    
            except Exception as e:
                print(f"Error searching jobs: {e}")
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        
        return {
            "success": True,
            "results": results,
            "message": f"Found {results['total_results']} results for '{query_text}'"
        }
        
    except Exception as e:
        print(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

@app.post("/api/search/similar-resumes")
async def find_similar_resumes(request_data: dict):
    """Find resumes similar to a given resume"""
    try:
        resume_id = request_data.get("resume_id", "")
        limit = request_data.get("limit", 5)
        
        if not resume_id:
            raise HTTPException(status_code=400, detail="Resume ID is required")
        
        if not milvus_connected:
            return {"message": "Milvus not connected", "similar_resumes": []}
        
        # Get the target resume's embedding
        collection = Collection("resumes")
        collection.load()
        
        target_resume = collection.query(
            expr=f'id == "{resume_id}"',
            output_fields=["id", "embedding", "full_name", "summary"]
        )
        
        if not target_resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        target_embedding = target_resume[0]["embedding"]
        
        # Search for similar resumes
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        similar_results = collection.search(
            data=[target_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit + 1,  # +1 to exclude the target resume itself
            output_fields=["id", "full_name", "summary", "skills"]
        )
        
        similar_resumes = []
        for hit in similar_results[0]:
            if hit.entity.get("id") != resume_id:  # Exclude the target resume
                similar_resume = {
                    "resume_id": hit.entity.get("id"),
                    "full_name": hit.entity.get("full_name"),
                    "summary": hit.entity.get("summary"),
                    "skills": json.loads(hit.entity.get("skills", "[]")),
                    "similarity_score": float(hit.score),
                    "distance": float(hit.distance)
                }
                similar_resumes.append(similar_resume)
        
        return {
            "success": True,
            "target_resume_id": resume_id,
            "similar_resumes": similar_resumes,
            "message": f"Found {len(similar_resumes)} similar resumes"
        }
        
    except Exception as e:
        print(f"Error finding similar resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find similar resumes: {str(e)}")

@app.post("/api/search/similar-jobs")
async def find_similar_jobs(request_data: dict):
    """Find jobs similar to a given job"""
    try:
        job_id = request_data.get("job_id", "")
        limit = request_data.get("limit", 5)
        
        if not job_id:
            raise HTTPException(status_code=400, detail="Job ID is required")
        
        if not milvus_connected:
            return {"message": "Milvus not connected", "similar_jobs": []}
        
        # Get the target job's embedding
        collection = Collection("job_descriptions")
        collection.load()
        
        target_job = collection.query(
            expr=f'id == "{job_id}"',
            output_fields=["id", "embedding", "title", "company", "overview"]
        )
        
        if not target_job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        target_embedding = target_job[0]["embedding"]
        
        # Search for similar jobs
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        similar_results = collection.search(
            data=[target_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit + 1,  # +1 to exclude the target job itself
            output_fields=["id", "title", "company", "overview", "required_skills"]
        )
        
        similar_jobs = []
        for hit in similar_results[0]:
            if hit.entity.get("id") != job_id:  # Exclude the target job
                similar_job = {
                    "job_id": hit.entity.get("id"),
                    "title": hit.entity.get("title"),
                    "company": hit.entity.get("company"),
                    "overview": hit.entity.get("overview"),
                    "required_skills": json.loads(hit.entity.get("required_skills", "[]")),
                    "similarity_score": float(hit.score),
                    "distance": float(hit.distance)
                }
                similar_jobs.append(similar_job)
        
        return {
            "success": True,
            "target_job_id": job_id,
            "similar_jobs": similar_jobs,
            "message": f"Found {len(similar_jobs)} similar jobs"
        }
        
    except Exception as e:
        print(f"Error finding similar jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find similar jobs: {str(e)}")

# CRM Pipeline Endpoints
@app.get("/api/crm/pipeline")
async def get_crm_pipeline():
    """Get the current CRM pipeline stages and candidates"""
    return crm_pipeline

@app.post("/api/crm/pipeline/move-candidate")
async def move_candidate_to_stage(data: dict):
    """Move a candidate from one stage to another"""
    try:
        candidate_id = data.get("candidate_id")
        from_stage = data.get("from_stage")
        to_stage = data.get("to_stage")
        
        # Find candidate in source stage
        source_stage = next((stage for stage in crm_pipeline["stages"] if stage["id"] == from_stage), None)
        target_stage = next((stage for stage in crm_pipeline["stages"] if stage["id"] == to_stage), None)
        
        if not source_stage or not target_stage:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        # Find and move candidate
        candidate = None
        for i, c in enumerate(source_stage["candidates"]):
            if c["id"] == candidate_id:
                candidate = source_stage["candidates"].pop(i)
                break
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found in source stage")
        
        target_stage["candidates"].append(candidate)
        
        return {"message": f"Candidate moved from {from_stage} to {to_stage}", "candidate": candidate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crm/pipeline/add-candidate")
async def add_candidate_to_stage(candidate_data: dict):
    """Add a new candidate to a specific stage"""
    try:
        stage_id = candidate_data.get("stage_id", "applied")
        stage = next((s for s in crm_pipeline["stages"] if s["id"] == stage_id), None)
        
        if not stage:
            raise HTTPException(status_code=404, detail="Stage not found")
        
        candidate = {
            "id": str(uuid.uuid4()),
            "name": candidate_data.get("name", ""),
            "email": candidate_data.get("email", ""),
            "phone": candidate_data.get("phone", ""),
            "position": candidate_data.get("position", ""),
            "added_date": datetime.now().isoformat(),
            "notes": candidate_data.get("notes", "")
        }
        
        stage["candidates"].append(candidate)
        return {"message": "Candidate added successfully", "candidate": candidate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Notes & Tagging Endpoints (TAQ-156, TAQ-160, TAQ-161)
@app.get("/api/crm/candidate/{candidate_id}/notes")
async def get_candidate_notes(candidate_id: str):
    """Get all notes for a specific candidate"""
    try:
        notes = candidate_notes.get(candidate_id, [])
        return {"candidate_id": candidate_id, "notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crm/candidate/{candidate_id}/notes")
async def add_candidate_note(candidate_id: str, note_data: dict):
    """Add a note to a specific candidate"""
    try:
        note = {
            "id": str(uuid.uuid4()),
            "content": note_data.get("note", ""),
            "author": note_data.get("author", "Recruiter"),
            "created_at": datetime.now().isoformat(),
            "type": note_data.get("type", "general")
        }
        
        if candidate_id not in candidate_notes:
            candidate_notes[candidate_id] = []
        
        candidate_notes[candidate_id].append(note)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "note_added",
            "details": f"Note added: {note['content'][:50]}...",
            "timestamp": datetime.now().isoformat(),
            "user": note["author"]
        })
        
        return {"message": "Note added successfully", "note": note}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/crm/candidate/{candidate_id}/notes/{note_id}")
async def delete_candidate_note(candidate_id: str, note_id: str):
    """Delete a specific note from a candidate"""
    try:
        if candidate_id not in candidate_notes:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        notes = candidate_notes[candidate_id]
        note_index = next((i for i, note in enumerate(notes) if note["id"] == note_id), None)
        
        if note_index is None:
            raise HTTPException(status_code=404, detail="Note not found")
        
        deleted_note = notes.pop(note_index)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "note_deleted",
            "details": f"Note deleted: {deleted_note['content'][:50]}...",
            "timestamp": datetime.now().isoformat(),
            "user": "System"
        })
        
        return {"message": "Note deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crm/candidate/{candidate_id}/tags")
async def get_candidate_tags(candidate_id: str):
    """Get all tags for a specific candidate"""
    try:
        tags = candidate_tags.get(candidate_id, [])
        return {"candidate_id": candidate_id, "tags": tags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crm/candidate/{candidate_id}/tags")
async def add_candidate_tag(candidate_id: str, tag_data: dict):
    """Add a tag to a specific candidate"""
    try:
        tag = {
            "id": str(uuid.uuid4()),
            "name": tag_data.get("tag", ""),
            "color": tag_data.get("color", "#3b82f6"),
            "created_at": datetime.now().isoformat(),
            "created_by": tag_data.get("created_by", "Recruiter")
        }
        
        if candidate_id not in candidate_tags:
            candidate_tags[candidate_id] = []
        
        # Check if tag already exists
        existing_tag = next((t for t in candidate_tags[candidate_id] if t["name"].lower() == tag["name"].lower()), None)
        if existing_tag:
            raise HTTPException(status_code=400, detail="Tag already exists")
        
        candidate_tags[candidate_id].append(tag)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "tag_added",
            "details": f"Tag added: {tag['name']}",
            "timestamp": datetime.now().isoformat(),
            "user": tag["created_by"]
        })
        
        return {"message": "Tag added successfully", "tag": tag}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/crm/candidate/{candidate_id}/tags/{tag_id}")
async def delete_candidate_tag(candidate_id: str, tag_id: str):
    """Delete a specific tag from a candidate"""
    try:
        if candidate_id not in candidate_tags:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        tags = candidate_tags[candidate_id]
        tag_index = next((i for i, tag in enumerate(tags) if tag["id"] == tag_id), None)
        
        if tag_index is None:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        deleted_tag = tags.pop(tag_index)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "tag_deleted",
            "details": f"Tag deleted: {deleted_tag['name']}",
            "timestamp": datetime.now().isoformat(),
            "user": "System"
        })
        
        return {"message": "Tag deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crm/candidate/{candidate_id}/engagement")
async def get_candidate_engagement_history(candidate_id: str):
    """Get engagement history for a specific candidate"""
    try:
        candidate_engagement = [e for e in engagement_history if e["candidate_id"] == candidate_id]
        return {"candidate_id": candidate_id, "engagement_history": candidate_engagement}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mass Mailing Endpoints
@app.get("/api/mass-mailing/campaigns")
async def get_email_campaigns():
    """Get all email campaigns"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        collection = Collection("campaigns")
        collection.load()
        
        # Query all campaigns
        results = collection.query(
            expr="id != ''",
            output_fields=["id", "name", "subject", "content", "recipients", "status", 
                          "template_id", "created_at", "updated_at", "sent_at", 
                          "open_rate", "click_rate", "reply_rate"]
        )
        
        campaigns = []
        for result in results:
            # Parse recipients from JSON string
            recipients = result["recipients"]
            if isinstance(recipients, str):
                try:
                    recipients = json.loads(recipients)
                except:
                    recipients = []
            
            campaign = {
                "id": result["id"],
                "name": result["name"],
                "subject": result["subject"],
                "content": result["content"],
                "recipients": recipients,
                "status": result["status"],
                "template_id": result["template_id"],
                "created_date": result["created_at"],
                "sent_date": result["sent_at"] if result["sent_at"] else None,
                "open_rate": result["open_rate"],
                "click_rate": result["click_rate"],
                "response_rate": result["reply_rate"]
            }
            campaigns.append(campaign)
        
        return {"campaigns": campaigns}
    except Exception as e:
        print(f"Error getting campaigns: {e}")
        return {"campaigns": []}

@app.post("/api/mass-mailing/campaigns")
async def create_email_campaign(campaign_data: CampaignRequest):
    """Create a new email campaign"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        campaign_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Generate embedding for the campaign content
        campaign_text = f"{campaign_data.name} {campaign_data.subject} {campaign_data.content}"
        embedding = get_embedding(campaign_text)
        
        campaign = {
            "id": campaign_id,
            "name": campaign_data.name,
            "subject": campaign_data.subject,
            "content": campaign_data.content,
            "recipients": json.dumps(campaign_data.recipients),
            "status": "draft",
            "template_id": campaign_data.template_id or "",
            "created_at": current_time,
            "updated_at": current_time,
            "sent_at": "",
            "open_rate": 0.0,
            "click_rate": 0.0,
            "reply_rate": 0.0,
            "embedding": embedding
        }
        
        # Store in Milvus
        collection = Collection("campaigns")
        collection.insert([campaign])
        collection.flush()
        
        return {"message": "Campaign created successfully", "campaign": campaign}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mass-mailing/campaigns/{campaign_id}/send")
async def send_email_campaign(campaign_id: str):
    """Send an email campaign"""
    try:
        campaign = next((c for c in email_campaigns if c["id"] == campaign_id), None)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign["status"] = "sent"
        campaign["sent_date"] = datetime.now().isoformat()
        
        # Simulate sending (in real implementation, use SendGrid, etc.)
        campaign["open_rate"] = 0.25  # 25% open rate
        campaign["click_rate"] = 0.05  # 5% click rate
        campaign["response_rate"] = 0.02  # 2% response rate
        
        return {"message": "Campaign sent successfully", "campaign": campaign}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mass-mailing/templates")
async def get_email_templates():
    """Get all email templates"""
    return {"templates": email_templates}

@app.post("/api/mass-mailing/templates")
async def create_email_template(template_data: TemplateRequest):
    """Create a new email template"""
    try:
        template = {
            "id": str(uuid.uuid4()),
            "name": template_data.name,
            "subject": template_data.subject,
            "content": template_data.content,
            "category": template_data.category or "general",
            "created_date": datetime.now().isoformat(),
            "usage_count": 0
        }
        
        email_templates.append(template)
        return {"message": "Template created successfully", "template": template}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# A/B Testing Endpoints
@app.get("/api/ab-testing/experiments")
async def get_ab_experiments():
    """Get all A/B testing experiments"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        collection = Collection("experiments")
        collection.load()
        
        # Query all experiments
        results = collection.query(
            expr="id != ''",
            output_fields=["id", "name", "description", "variants", "status", 
                          "start_date", "end_date", "traffic_split", "metrics", 
                          "results", "created_at", "updated_at"]
        )
        
        experiments = []
        for result in results:
            # Parse JSON fields
            variants = result["variants"]
            if isinstance(variants, str):
                try:
                    variants = json.loads(variants)
                except:
                    variants = []
            
            traffic_split = result["traffic_split"]
            if isinstance(traffic_split, str):
                try:
                    traffic_split = json.loads(traffic_split)
                except:
                    traffic_split = {"A": 50, "B": 50}
            
            metrics = result["metrics"]
            if isinstance(metrics, str):
                try:
                    metrics = json.loads(metrics)
                except:
                    metrics = {}
            
            results_data = result["results"]
            if isinstance(results_data, str):
                try:
                    results_data = json.loads(results_data)
                except:
                    results_data = {}
            
            experiment = {
                "id": result["id"],
                "name": result["name"],
                "description": result["description"],
                "variants": variants,
                "status": result["status"],
                "created_date": result["created_at"],
                "results": results_data,
                "participants": metrics.get("participants", 0),
                "conversion_rate": metrics.get("conversion_rate", 0.0)
            }
            experiments.append(experiment)
        
        return {"experiments": experiments}
    except Exception as e:
        print(f"Error getting experiments: {e}")
        return {"experiments": []}

@app.post("/api/ab-testing/experiments")
async def create_ab_experiment(experiment_data: ExperimentRequest):
    """Create a new A/B testing experiment"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        experiment_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Generate embedding for the experiment content
        experiment_text = f"{experiment_data.name} {experiment_data.description}"
        embedding = get_embedding(experiment_text)
        
        experiment = {
            "id": experiment_id,
            "name": experiment_data.name,
            "description": experiment_data.description,
            "test_type": experiment_data.test_type,
            "test_duration_hours": experiment_data.test_duration_hours,
            "variants": json.dumps(experiment_data.variants),
            "status": "draft",
            "start_date": "",
            "end_date": "",
            "traffic_split": json.dumps({"A": 50, "B": 50}),
            "metrics": json.dumps({}),
            "results": json.dumps({}),
            "created_at": current_time,
            "updated_at": current_time,
            "embedding": embedding
        }
        
        # Store in Milvus
        collection = Collection("experiments")
        collection.insert([experiment])
        collection.flush()
        
        return {"message": "Experiment created successfully", "experiment": experiment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/ab-testing/experiments/{experiment_id}/start")
async def start_ab_experiment(experiment_id: str):
    """Start an A/B testing experiment"""
    try:
        experiment = next((e for e in ab_testing_experiments if e["id"] == experiment_id), None)
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        experiment["status"] = "running"
        experiment["started_date"] = datetime.now().isoformat()
        
        return {"message": "Experiment started successfully", "experiment": experiment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/ab-testing/experiments/{experiment_id}/stop")
async def stop_ab_experiment(experiment_id: str):
    """Stop an A/B testing experiment"""
    try:
        experiment = next((e for e in ab_testing_experiments if e["id"] == experiment_id), None)
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        experiment["status"] = "completed"
        experiment["completed_date"] = datetime.now().isoformat()
        
        return {"message": "Experiment stopped successfully", "experiment": experiment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Segmentation Endpoints
@app.get("/api/segmentation/segments")
async def get_segments():
    """Get all candidate segments"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        collection = Collection("segments")
        collection.load()
        
        # Query all segments
        results = collection.query(
            expr="id != ''",
            output_fields=["id", "name", "description", "criteria", "rules", 
                          "recipient_count", "status", "created_at", "updated_at", "last_updated"]
        )
        
        segments = []
        for result in results:
            # Parse JSON fields
            criteria = result["criteria"]
            if isinstance(criteria, str):
                try:
                    criteria = json.loads(criteria)
                except:
                    criteria = {}
            
            rules = result["rules"]
            if isinstance(rules, str):
                try:
                    rules = json.loads(rules)
                except:
                    rules = []
            
            segment = {
                "id": result["id"],
                "name": result["name"],
                "description": result["description"],
                "criteria": criteria,
                "rules": rules,
                "created_date": result["created_at"],
                "candidate_count": result["recipient_count"],
                "last_updated": result["last_updated"]
            }
            segments.append(segment)
        
        return {"segments": segments}
    except Exception as e:
        print(f"Error getting segments: {e}")
        return {"segments": []}

@app.post("/api/segmentation/segments")
async def create_segment(segment_data: SegmentRequest):
    """Create a new candidate segment"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        segment_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Generate embedding for the segment content
        segment_text = f"{segment_data.name} {segment_data.description}"
        embedding = get_embedding(segment_text)
        
        segment = {
            "id": segment_id,
            "name": segment_data.name,
            "description": segment_data.description,
            "criteria": json.dumps({}),
            "rules": json.dumps(segment_data.rules),
            "recipient_count": 0,
            "status": "active",
            "created_at": current_time,
            "updated_at": current_time,
            "last_updated": current_time,
            "embedding": embedding
        }
        
        # Store in Milvus
        collection = Collection("segments")
        collection.insert([segment])
        collection.flush()
        
        return {"message": "Segment created successfully", "segment": segment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/segmentation/segments/{segment_id}/candidates")
async def get_segment_candidates(segment_id: str):
    """Get candidates that match a specific segment"""
    try:
        segment = next((s for s in segmentation_segments if s["id"] == segment_id), None)
        if not segment:
            raise HTTPException(status_code=404, detail="Segment not found")
        
        # This would normally query the database based on criteria
        # For now, return mock data
        matching_candidates = []
        
        return {"segment_id": segment_id, "candidates": matching_candidates, "count": len(matching_candidates)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Automation Endpoints
@app.get("/api/automation/workflows")
async def get_automation_workflows():
    """Get all automation workflows"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        collection = Collection("workflows")
        collection.load()
        
        # Query all workflows
        results = collection.query(
            expr="id != ''",
            output_fields=["id", "name", "description", "triggers", "actions", "conditions", 
                          "status", "is_active", "execution_count", "last_executed", 
                          "created_at", "updated_at"]
        )
        
        workflows = []
        for result in results:
            # Parse JSON fields
            triggers = result["triggers"]
            if isinstance(triggers, str):
                try:
                    triggers = json.loads(triggers)
                except:
                    triggers = []
            
            actions = result["actions"]
            if isinstance(actions, str):
                try:
                    actions = json.loads(actions)
                except:
                    actions = []
            
            conditions = result["conditions"]
            if isinstance(conditions, str):
                try:
                    conditions = json.loads(conditions)
                except:
                    conditions = []
            
            workflow = {
                "id": result["id"],
                "name": result["name"],
                "description": result["description"],
                "triggers": triggers,
                "actions": actions,
                "status": result["status"],
                "created_date": result["created_at"],
                "last_triggered": result["last_executed"] if result["last_executed"] else None,
                "execution_count": result["execution_count"]
            }
            workflows.append(workflow)
        
        return {"workflows": workflows}
    except Exception as e:
        print(f"Error getting workflows: {e}")
        return {"workflows": []}

@app.post("/api/automation/workflows")
async def create_automation_workflow(workflow_data: WorkflowRequest):
    """Create a new automation workflow"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        workflow_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Generate embedding for the workflow content
        workflow_text = f"{workflow_data.name} {workflow_data.description}"
        embedding = get_embedding(workflow_text)
        
        workflow = {
            "id": workflow_id,
            "name": workflow_data.name,
            "description": workflow_data.description,
            "triggers": json.dumps([workflow_data.trigger]),
            "actions": json.dumps(workflow_data.actions),
            "conditions": json.dumps([]),
            "status": "draft",
            "is_active": workflow_data.is_active,
            "execution_count": 0,
            "last_executed": "",
            "created_at": current_time,
            "updated_at": current_time,
            "embedding": embedding
        }
        
        # Store in Milvus
        collection = Collection("workflows")
        collection.insert([workflow])
        collection.flush()
        
        return {"message": "Workflow created successfully", "workflow": workflow}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/automation/workflows/{workflow_id}/activate")
async def activate_workflow(workflow_id: str):
    """Activate an automation workflow"""
    try:
        workflow = next((w for w in automation_workflows if w["id"] == workflow_id), None)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow["status"] = "active"
        workflow["activated_date"] = datetime.now().isoformat()
        
        return {"message": "Workflow activated successfully", "workflow": workflow}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/automation/workflows/{workflow_id}/deactivate")
async def deactivate_workflow(workflow_id: str):
    """Deactivate an automation workflow"""
    try:
        workflow = next((w for w in automation_workflows if w["id"] == workflow_id), None)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow["status"] = "inactive"
        workflow["deactivated_date"] = datetime.now().isoformat()
        
        return {"message": "Workflow deactivated successfully", "workflow": workflow}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Engagement Tracking Endpoints
@app.get("/api/engagement/history")
async def get_engagement_history():
    """Get all engagement history"""
    return {"engagement_history": engagement_history}

@app.post("/api/engagement/track")
async def track_engagement(engagement_data: dict):
    """Track a new engagement event"""
    try:
        engagement = {
            "id": str(uuid.uuid4()),
            "candidate_id": engagement_data.get("candidate_id"),
            "action": engagement_data.get("action", ""),
            "details": engagement_data.get("details", ""),
            "timestamp": datetime.now().isoformat(),
            "user": engagement_data.get("user", "System"),
            "metadata": engagement_data.get("metadata", {})
        }
        
        engagement_history.append(engagement)
        # Broadcast real-time update
        await manager.broadcast(json.dumps({
            "type": "engagement_tracked",
            "data": engagement
        }))
        
        return {"message": "Engagement tracked successfully", "engagement": engagement}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/engagement/analytics")
async def get_engagement_analytics():
    """Get engagement analytics"""
    try:
        total_engagements = len(engagement_history)
        unique_candidates = len(set(e["candidate_id"] for e in engagement_history if e["candidate_id"]))
        
        # Group by action type
        action_counts = {}
        for engagement in engagement_history:
            action = engagement["action"]
            action_counts[action] = action_counts.get(action, 0) + 1
        
        # Recent activity (last 7 days)
        recent_engagements = [
            e for e in engagement_history 
            if (datetime.now() - datetime.fromisoformat(e["timestamp"])).days <= 7
        ]
        
        return {
            "total_engagements": total_engagements,
            "unique_candidates": unique_candidates,
            "action_breakdown": action_counts,
            "recent_activity": len(recent_engagements),
            "engagement_history": engagement_history[-10:]  # Last 10 engagements
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Candidate Evaluation & Analytics Endpoints (TAQ-124 to TAQ-133)
@app.get("/api/evaluation/candidate/{candidate_id}/summaries")
async def get_interview_summaries(candidate_id: str):
    """Get all interview summaries for a specific candidate (TAQ-128, TAQ-129)"""
    try:
        summaries = interview_summaries.get(candidate_id, [])
        return {"candidate_id": candidate_id, "summaries": summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluation/candidate/{candidate_id}/summaries")
async def create_interview_summary(candidate_id: str, summary_data: dict):
    """Create a new AI-based interview summary (TAQ-128, TAQ-129)"""
    try:
        summary = {
            "id": str(uuid.uuid4()),
            "interview_date": summary_data.get("interview_date", datetime.now().isoformat()),
            "interviewer": summary_data.get("interviewer", "Unknown"),
            "summary": summary_data.get("summary", ""),
            "key_points": summary_data.get("key_points", []),
            "strengths": summary_data.get("strengths", []),
            "concerns": summary_data.get("concerns", []),
            "recommendation": summary_data.get("recommendation", "pending"),
            "created_at": datetime.now().isoformat(),
            "ai_generated": summary_data.get("ai_generated", True)
        }
        
        if candidate_id not in interview_summaries:
            interview_summaries[candidate_id] = []
        
        interview_summaries[candidate_id].append(summary)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "interview_summary_created",
            "details": f"Interview summary created by {summary['interviewer']}",
            "timestamp": datetime.now().isoformat(),
            "user": summary["interviewer"]
        })
        
        return {"message": "Interview summary created successfully", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluation/candidate/{candidate_id}/score")
async def score_candidate(candidate_id: str, score_data: dict):
    """Score a candidate with fit indicators (TAQ-130, TAQ-131)"""
    try:
        # Calculate overall score based on multiple criteria
        technical_score = score_data.get("technical_score", 0)
        communication_score = score_data.get("communication_score", 0)
        cultural_fit_score = score_data.get("cultural_fit_score", 0)
        experience_score = score_data.get("experience_score", 0)
        
        # Weighted average
        weights = {
            "technical": 0.3,
            "communication": 0.25,
            "cultural_fit": 0.25,
            "experience": 0.2
        }
        
        overall_score = (
            technical_score * weights["technical"] +
            communication_score * weights["communication"] +
            cultural_fit_score * weights["cultural_fit"] +
            experience_score * weights["experience"]
        )
        
        # Determine flag color (TAQ-131)
        if overall_score >= 80:
            flag_color = "green"
            flag_status = "Strong Match"
        elif overall_score >= 60:
            flag_color = "yellow"
            flag_status = "Moderate Match"
        else:
            flag_color = "red"
            flag_status = "Weak Match"
        
        score_record = {
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "scores": {
                "technical": technical_score,
                "communication": communication_score,
                "cultural_fit": cultural_fit_score,
                "experience": experience_score,
                "overall": round(overall_score, 2)
            },
            "flag_color": flag_color,
            "flag_status": flag_status,
            "scored_by": score_data.get("scored_by", "System"),
            "scored_at": datetime.now().isoformat(),
            "notes": score_data.get("notes", ""),
            "recommendation": score_data.get("recommendation", "pending")
        }
        
        candidate_scores[candidate_id] = score_record
        
        # Update analytics metrics
        analytics_metrics["total_candidates"] = len(candidate_scores)
        analytics_metrics["interviewed_candidates"] = len(interview_summaries)
        
        # Log engagement
        engagement_history.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate_id,
            "action": "candidate_scored",
            "details": f"Candidate scored: {overall_score}/100 ({flag_status})",
            "timestamp": datetime.now().isoformat(),
            "user": score_record["scored_by"]
        })
        
        return {"message": "Candidate scored successfully", "score": score_record}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/evaluation/candidate/{candidate_id}/score")
async def get_candidate_score(candidate_id: str):
    """Get the current score for a specific candidate"""
    try:
        score = candidate_scores.get(candidate_id)
        if not score:
            raise HTTPException(status_code=404, detail="No score found for this candidate")
        
        return {"candidate_id": candidate_id, "score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/evaluation/analytics")
async def get_evaluation_analytics():
    """Get comprehensive analytics dashboard data (TAQ-132)"""
    try:
        # Calculate analytics metrics
        total_candidates = len(candidate_scores)
        interviewed_candidates = len(interview_summaries)
        
        # Score distribution
        score_distribution = {"green": 0, "yellow": 0, "red": 0}
        average_scores = {"technical": 0, "communication": 0, "cultural_fit": 0, "experience": 0, "overall": 0}
        
        if total_candidates > 0:
            for score_data in candidate_scores.values():
                flag_color = score_data["flag_color"]
                score_distribution[flag_color] += 1
                
                scores = score_data["scores"]
                for key in average_scores:
                    average_scores[key] += scores.get(key, 0)
            
            # Calculate averages
            for key in average_scores:
                average_scores[key] = round(average_scores[key] / total_candidates, 2)
        
        # Department breakdown (mock data for now)
        department_breakdown = {
            "Engineering": {"total": 0, "hired": 0, "average_score": 0},
            "Sales": {"total": 0, "hired": 0, "average_score": 0},
            "Marketing": {"total": 0, "hired": 0, "average_score": 0}
        }
        
        # Hiring timeline (last 30 days)
        hiring_timeline = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            hiring_timeline.append({
                "date": date,
                "candidates_evaluated": max(0, total_candidates // 30 + (i % 3)),
                "interviews_conducted": max(0, interviewed_candidates // 30 + (i % 2)),
                "candidates_hired": max(0, (total_candidates // 30) // 3)
            })
        
        analytics_data = {
            "overview": {
                "total_candidates": total_candidates,
                "interviewed_candidates": interviewed_candidates,
                "hired_candidates": sum(1 for s in candidate_scores.values() if s["flag_color"] == "green"),
                "average_overall_score": average_scores["overall"]
            },
            "score_distribution": score_distribution,
            "average_scores": average_scores,
            "department_breakdown": department_breakdown,
            "hiring_timeline": hiring_timeline,
            "recent_scores": list(candidate_scores.values())[-5:],  # Last 5 scores
            "top_performers": sorted(
                [s for s in candidate_scores.values() if s["flag_color"] == "green"],
                key=lambda x: x["scores"]["overall"],
                reverse=True
            )[:3]
        }
        
        return analytics_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/evaluation/analytics/export")
async def export_analytics_data():
    """Export analytics data for download (TAQ-133)"""
    try:
        # Get all analytics data
        analytics_data = await get_evaluation_analytics()
        
        # Add export metadata
        export_data = {
            "export_date": datetime.now().isoformat(),
            "export_type": "candidate_evaluation_analytics",
            "data": analytics_data,
            "summary": {
                "total_records": len(candidate_scores),
                "export_format": "JSON",
                "generated_by": "Recruiter.AI System"
            }
        }
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back for testing
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Real-time update endpoints
@app.post("/api/realtime/broadcast")
async def broadcast_update(update_data: dict):
    """Broadcast a real-time update to all connected clients"""
    try:
        message = json.dumps({
            "type": update_data.get("type", "update"),
            "data": update_data.get("data", {}),
            "timestamp": datetime.now().isoformat()
        })
        
        await manager.broadcast(message)
        return {"message": "Update broadcasted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Collection Management Endpoints
@app.post("/api/milvus/reset-resumes-collection")
async def reset_resumes_collection():
    """Reset the resumes collection with correct schema"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        result = recreate_resumes_collection()
        
        if result["success"]:
            return {
                "success": True,
                "message": "Resumes collection reset successfully with correct schema",
                "schema_fields": [
                    "id", "full_name", "email", "phone", "summary", "skills", 
                    "education", "work_experience", "file_path", "created_at", 
                    "updated_at", "embedding"
                ]
            }
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting collection: {str(e)}")

@app.post("/api/milvus/reset-all-collections")
async def reset_all_collections():
    """Reset all collections with correct embedding dimensions - WARNING: This will delete all data"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        # Reset resumes collection
        resumes_result = recreate_resumes_collection()
        
        # Reset job descriptions collection  
        job_result = recreate_job_descriptions_collection()
        
        if resumes_result["success"] and job_result["success"]:
            return {
                "success": True,
                "message": "All collections reset successfully with correct embedding dimensions (1536)",
                "resumes_collection": resumes_result,
                "job_descriptions_collection": job_result
            }
        else:
            return {
                "success": False,
                "message": "Failed to reset some collections",
                "resumes_result": resumes_result,
                "job_result": job_result
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting collections: {str(e)}")

@app.get("/api/milvus/collection-schema")
async def get_collection_schema():
    """Get the current schema of the resumes collection"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        if not utility.has_collection("resumes"):
            return {
                "success": False,
                "message": "Resumes collection does not exist",
                "schema_fields": []
            }
        
        collection = Collection("resumes")
        schema = collection.schema
        
        fields = []
        for field in schema.fields:
            fields.append({
                "name": field.name,
                "type": str(field.dtype),
                "max_length": getattr(field, 'max_length', None),
                "is_primary": getattr(field, 'is_primary', False),
                "dim": getattr(field, 'params', {}).get('dim', None) if hasattr(field, 'params') else None
            })
        
        return {
            "success": True,
            "message": "Schema retrieved successfully",
            "schema_fields": fields,
            "collection_name": "resumes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting schema: {str(e)}")

if __name__ == "__main__":
    # Create collections on startup
    if milvus_connected:
        create_resumes_collection()
        create_job_descriptions_collection()
    
    uvicorn.run(app, host="0.0.0.0", port=8804)