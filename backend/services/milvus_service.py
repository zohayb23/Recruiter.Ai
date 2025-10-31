"""
Milvus Service - Handles all Milvus database operations
"""
import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility

from ..config.settings import settings
from ..utils.embeddings import get_embedding

# Milvus connection configuration
MILVUS_HOST = os.getenv("MILVUS_HOST", settings.MILVUS_HOST)
MILVUS_PORT = os.getenv("MILVUS_PORT", settings.MILVUS_PORT)
MILVUS_DB_NAME = os.getenv("MILVUS_DB_NAME", "default")

# Global connection status
milvus_connected = False

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

# Initialize connection on module import
test_milvus_connection()

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

def create_interview_results_collection():
    """Create interview_results collection in Milvus for storing AI evaluation results"""
    try:
        if utility.has_collection("interview_results"):
            print("✅ Interview results collection already exists")
            return Collection("interview_results")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="candidate_id", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="candidate_name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="job_id", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="job_title", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="company_name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="overall_score", dtype=DataType.FLOAT),
            FieldSchema(name="category_scores", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="ai_feedback", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="detailed_analysis", dtype=DataType.VARCHAR, max_length=15000),
            FieldSchema(name="skill_match_analysis", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="experience_analysis", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="fit_assessment", dtype=DataType.VARCHAR, max_length=3000),
            FieldSchema(name="interview_recommendations", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="hiring_recommendation", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="confidence_level", dtype=DataType.FLOAT),
            FieldSchema(name="reasoning", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="evaluation_date", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="evaluated_by", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="model_used", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Interview results collection for AI evaluation data")
        collection = Collection("interview_results", schema)
        
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Interview results collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating interview results collection: {e}")
        return None

def create_job_categories_collection():
    """Create job_categories collection in Milvus for job categorization and metadata"""
    try:
        if utility.has_collection("job_categories"):
            print("✅ Job categories collection already exists")
            return Collection("job_categories")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="job_id", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="job_title", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="company_name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="subcategory", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="industry", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="department", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="experience_level", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="employment_type", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="location", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="remote_friendly", dtype=DataType.BOOL),
            FieldSchema(name="salary_range_min", dtype=DataType.INT64),
            FieldSchema(name="salary_range_max", dtype=DataType.INT64),
            FieldSchema(name="required_skills", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="preferred_skills", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="keywords", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="job_description_summary", dtype=DataType.VARCHAR, max_length=3000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Job categories collection for job classification and metadata")
        collection = Collection("job_categories", schema)
        
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Job categories collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating job categories collection: {e}")
        return None

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
            "email": resume_data.get("contact", {}).get("email", "") if isinstance(resume_data.get("contact"), dict) else resume_data.get("email", ""),
            "phone": resume_data.get("contact", {}).get("phone", "") if isinstance(resume_data.get("contact"), dict) else resume_data.get("phone", ""),
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
    global milvus_connected
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

def get_resumes_from_milvus():
    """Get all resumes from Milvus database"""
    global milvus_connected
    from ..storage import stored_resumes
    
    if not milvus_connected:
        print("⚠️ Milvus not connected, attempting to reconnect...")
        try:
            connections.disconnect("default")
            connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
            print(f"✅ Reconnected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
            milvus_connected = True
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
                "summary": result.get("summary", "")[:200] + "..." if result.get("summary") else "",
                "file_path": result.get("file_path", "")
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
    global milvus_connected
    from ..storage import stored_job_descriptions
    
    if not milvus_connected:
        print("⚠️ Milvus not connected, attempting to reconnect...")
        try:
            connections.disconnect("default")
            connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
            print(f"✅ Reconnected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
            milvus_connected = True
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
                "id": result.get("id", ""),
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

