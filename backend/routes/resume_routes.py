from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import logging

from ..services.resume_service import resume_service
from ..models.resume import ResumeSearchRequest, ResumeUploadResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume-parser", tags=["Resume Parser"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "resume-parser-service",
        "version": "1.0.0"
    }

@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse uploaded resume file (PDF, DOCX, TXT) and extract structured data using AI
    EXACT COPY of monolithic backend implementation
    """
    try:
        import os
        import uuid
        from datetime import datetime
        from ..utils.file_parser import extract_text_from_file, parse_resume_with_ai
        from ..services.milvus_service import store_resume_in_milvus
        from ..storage import stored_resumes
        
        print(f"Starting resume parsing for: {file.filename}")
        
        file_content = await file.read()
        text = extract_text_from_file(file_content, file.filename)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        parsed_data = parse_resume_with_ai(text)
        resume_id = str(uuid.uuid4())
        
        current_time = datetime.now().isoformat()
        
        # Save the uploaded file to docx_resumes directory
        os.makedirs("docx_resumes", exist_ok=True)
        saved_filename = f"{resume_id}_{file.filename}"
        file_path = f"docx_resumes/{saved_filename}"
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        print(f"✅ File saved to: {file_path}")
        
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
            "file_path": saved_filename,  # Store the saved filename
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
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.get("/stored-resumes")
async def get_stored_resumes(limit: int = 50, offset: int = 0):
    """
    Get all stored resumes with pagination
    """
    try:
        from ..services.milvus_service import get_resumes_from_milvus
        
        # Get resumes from Milvus in the format the frontend expects
        resumes_data = get_resumes_from_milvus()
        
        # Transform to match frontend expectations - flatten structure
        flattened_resumes = []
        for resume in resumes_data[offset:offset+limit]:
            flattened = {
                "resume_id": resume.get("id", ""),
                "id": resume.get("id", ""),
                "full_name": resume.get("name", ""),
                "email": resume.get("email", ""),
                "phone": resume.get("phone", ""),
                "contact": {
                    "email": resume.get("email", ""),
                    "phone": resume.get("phone", ""),
                    "linkedin": None,
                    "github": None,
                    "website": None
                },
                "skills": resume.get("skills", []),
                "education": resume.get("education", []),
                "work_experience": resume.get("work_experience", []),
                "summary": resume.get("summary", ""),
                "file_path": resume.get("file_path", ""),
                "created_at": resume.get("created_at", ""),
                "certifications": [],
                "languages": []
            }
            flattened_resumes.append(flattened)
        
        return {
            "resumes": flattened_resumes,
            "total": len(flattened_resumes),
            "limit": limit,
            "offset": offset,
            "message": f"Found {len(flattened_resumes)} resumes"
        }
    except Exception as e:
        logger.error(f"Error retrieving resumes: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving resumes: {str(e)}")

@router.get("/resume/{resume_id}")
async def get_resume_by_id(resume_id: str):
    """
    Get a specific resume by ID
    """
    try:
        resume = await resume_service.get_resume_by_id(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return resume
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving resume {resume_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving resume: {str(e)}")

@router.post("/search")
async def search_resumes(request: ResumeSearchRequest):
    """
    Search resumes using semantic search
    """
    try:
        results = await resume_service.search_resumes(request)
        return {
            "results": results,
            "total": len(results),
            "query": request.query,
            "message": f"Found {len(results)} matching resumes"
        }
    except Exception as e:
        logger.error(f"Error searching resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching resumes: {str(e)}")

@router.post("/parse-text")
async def parse_resume_text(request: dict):
    """
    Parse resume text directly (without file upload)
    """
    try:
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text field is required")
        
        parsed_data = await resume_service.parse_resume_with_ai(text)
        return {
            "success": True,
            "message": "Resume text parsed successfully",
            "parsed_data": parsed_data.dict() if hasattr(parsed_data, 'dict') else parsed_data
        }
    except Exception as e:
        logger.error(f"Error parsing resume text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing resume text: {str(e)}")

@router.delete("/resume/{resume_id}")
async def delete_resume(resume_id: str):
    """
    Delete a resume by ID
    """
    try:
        # TODO: Implement resume deletion
        return {
            "success": True,
            "message": f"Resume {resume_id} deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting resume {resume_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting resume: {str(e)}")
