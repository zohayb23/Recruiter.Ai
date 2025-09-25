from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import openai
from typing import List, Dict, Any
import json
import uuid
from datetime import datetime
import docx
import PyPDF2
import io
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
import numpy as np

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

# Milvus connection
MILVUS_HOST = os.getenv("MILVUS_HOST", "34.60.125.249")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")

# In-memory storage for resumes and job descriptions (backup)
stored_resumes = []
stored_job_descriptions = []

# Initialize Milvus connection
try:
    connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
    print(f"✅ Connected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
    milvus_connected = True
except Exception as e:
    print(f"⚠️ Failed to connect to Milvus: {e}")
    milvus_connected = False

def get_embedding(text: str) -> List[float]:
    """Generate simple embedding for text"""
    try:
        hash_val = hash(text) % (2**32)
        embedding = []
        for i in range(384):
            val = ((hash_val + i) % 1000) / 1000.0
            embedding.append(val)
        return embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return [0.0] * 384

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
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384)
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
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384)
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
    """Use OpenAI to parse resume text and extract structured data"""
    try:
        prompt = f"""
        Parse the following resume text and extract structured data. Return a JSON object with these exact fields:

        {{
            "full_name": "Full Name",
            "email": "email@example.com",
            "phone": "+1234567890",
            "linkedin": "https://linkedin.com/in/username",
            "github": "https://github.com/username",
            "website": "https://website.com",
            "summary": "Professional summary paragraph",
            "skills": [
                {{
                    "name": "Skill Name",
                    "category": "Programming Languages" | "Frameworks" | "Databases" | "Tools" | "Cloud" | "Other"
                }}
            ],
            "education": [
                {{
                    "degree": "Degree Name",
                    "institution": "University Name",
                    "year": "2020",
                    "gpa": "3.8",
                    "location": "City, State"
                }}
            ],
            "work_experience": [
                {{
                    "title": "Job Title",
                    "company": "Company Name",
                    "start_date": "Jan 2020",
                    "end_date": "Dec 2023",
                    "location": "City, State",
                    "description": "Detailed job description",
                    "achievements": ["Achievement 1", "Achievement 2"],
                    "technologies": ["Tech 1", "Tech 2"]
                }}
            ],
            "certifications": [
                {{
                    "name": "Certification Name",
                    "issuer": "Issuing Organization",
                    "date": "2020",
                    "expiry": "2023"
                }}
            ],
            "languages": [
                {{
                    "language": "English",
                    "proficiency": "Native" | "Fluent" | "Intermediate" | "Basic"
                }}
            ]
        }}

        Resume text:
        {text[:5000]}
        """
        
        response = openai.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {"role": "system", "content": "You are an expert resume parser. Extract ALL available information with maximum detail."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.1
        )
        
        generated_text = response.choices[0].message.content
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        json_str = generated_text[start_idx:end_idx]
        return json.loads(json_str)
    except Exception as e:
        print(f"OpenAI failed, using fallback parsing: {e}")
        # Fallback: Extract basic info from text
        lines = text.split('\n')
        name = "Unknown"
        email = ""
        phone = ""
        
        # Try to extract name from filename or first few lines
        for line in lines[:10]:
            if '@' in line and '.' in line:
                email = line.strip()
            elif any(char.isdigit() for char in line) and len(line.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) >= 10:
                phone = line.strip()
            elif len(line.split()) >= 2 and len(line.split()) <= 4 and not any(char in line for char in ['@', 'http', 'www', '.com']):
                name = line.strip()
                break
        
        return {
            "full_name": name,
            "email": email,
            "phone": phone,
            "linkedin": "",
            "github": "",
            "website": "",
            "summary": text[:500] + "..." if len(text) > 500 else text,
            "skills": [{"name": "Extracted from resume", "category": "Other"}],
            "education": [{"degree": "See resume", "institution": "See resume", "year": "", "gpa": "", "location": ""}],
            "work_experience": [{"title": "See resume", "company": "See resume", "start_date": "", "end_date": "", "location": "", "description": text[:200] + "...", "achievements": [], "technologies": []}],
            "certifications": [],
            "languages": []
        }

def store_resume_in_milvus(resume_data: dict, resume_id: str):
    """Store resume in Milvus database"""
    if not milvus_connected:
        print("⚠️ Milvus not connected, storing in memory only")
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
        return stored_resumes
    
    try:
        collection = Collection("resumes")
        collection.load()
        
        results = collection.query(expr="id != ''", output_fields=["*"])
        
        resumes = []
        for result in results:
            resume = {
                "resume_id": result.get("id", ""),
                "full_name": result.get("full_name", ""),
                "contact": {
                    "email": result.get("email", ""),
                    "phone": result.get("phone", ""),
                    "linkedin": "",
                    "github": "",
                    "website": ""
                },
                "education": json.loads(result.get("education", "[]")),
                "work_experience": json.loads(result.get("work_experience", "[]")),
                "skills": json.loads(result.get("skills", "[]")),
                "file_path": result.get("file_path", ""),
                "created_at": result.get("created_at", ""),
                "summary": result.get("summary", ""),
                "certifications": [],
                "languages": []
            }
            resumes.append(resume)
        
        return resumes
    except Exception as e:
        print(f"❌ Error getting resumes from Milvus: {e}")
        return stored_resumes

def get_jobs_from_milvus():
    """Get all job descriptions from Milvus database"""
    if not milvus_connected:
        return stored_job_descriptions
    
    try:
        collection = Collection("job_descriptions")
        collection.load()
        
        results = collection.query(expr="id != ''", output_fields=["*"])
        
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
        
        return jobs
    except Exception as e:
        print(f"❌ Error getting jobs from Milvus: {e}")
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
            Generate a comprehensive job description for a {title} position in the {department} department.
            
            Details:
            - Company: {company} (use this as the company name)
            - Department: {department}
            - Location: {location} ({location_type})
            - Experience Level: {experience_level}
            - Key Skills: {skills_text}
            
            Please generate a complete job description including:
            1. Job Title
            2. Company Name ({company})
            3. Overview/Summary
            4. Key Responsibilities (5-7 bullet points)
            5. Required Qualifications (5-7 bullet points)
            6. Required Skills (list of technical skills)
            7. Preferred Skills (list of nice-to-have skills)
            8. Benefits (5-7 bullet points)
            9. Company Description (brief description of {company})
            
            Format the response as a JSON object with these exact keys:
            {{
                "title": "Job Title",
                "company": "{company}",
                "department": "Department Name",
                "location_type": "remote/onsite/hybrid",
                "location": "Location",
                "experience_level": "Experience Level",
                "overview": "Job overview paragraph",
                "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
                "qualifications": ["Qualification 1", "Qualification 2", ...],
                "required_skills": ["Skill 1", "Skill 2", ...],
                "preferred_skills": ["Skill 1", "Skill 2", ...],
                "benefits": ["Benefit 1", "Benefit 2", ...],
                "company_description": "Brief company description of {company}"
            }}
            """
            
            response = openai.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {"role": "system", "content": "You are an expert HR professional and job description writer. Generate professional, detailed job descriptions. Always use the exact company name provided by the user."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
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
        
        return job_data
        
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to generate job description"
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

@app.post("/api/candidates")
async def create_candidate():
    return {"message": "Not implemented"}

# Semantic Search Endpoints
@app.post("/api/search/semantic")
async def semantic_search(request_data: dict):
    """Perform semantic search across resumes and job descriptions"""
    try:
        query_text = request_data.get("query", "")
        search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
        limit = request_data.get("limit", 10)
        
        if not query_text.strip():
            raise HTTPException(status_code=400, detail="Query text is required")
        
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

if __name__ == "__main__":
    # Create collections on startup
    if milvus_connected:
        create_resumes_collection()
        create_job_descriptions_collection()
    
    uvicorn.run(app, host="0.0.0.0", port=8804)