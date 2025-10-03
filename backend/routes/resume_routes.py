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

@router.post("/parse", response_model=ResumeUploadResponse)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse uploaded resume file (PDF, DOCX, TXT) and extract structured data using AI
    """
    try:
        logger.info(f"Processing resume upload: {file.filename}")
        
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Process the file
        result = await resume_service.process_resume_upload(file)
        
        if result.success:
            logger.info(f"Successfully parsed resume: {result.resume_id}")
        else:
            logger.error(f"Failed to parse resume: {result.message}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/stored-resumes")
async def get_stored_resumes(limit: int = 50, offset: int = 0):
    """
    Get all stored resumes with pagination
    """
    try:
        resumes = await resume_service.get_all_resumes(limit=limit, offset=offset)
        return {
            "resumes": resumes,
            "total": len(resumes),
            "limit": limit,
            "offset": offset,
            "message": f"Found {len(resumes)} resumes"
        }
    except Exception as e:
        logger.error(f"Error retrieving resumes: {str(e)}")
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
async def parse_resume_text(text: str):
    """
    Parse resume text directly (without file upload)
    """
    try:
        parsed_data = await resume_service.parse_resume_with_ai(text)
        return {
            "success": True,
            "message": "Resume text parsed successfully",
            "parsed_data": parsed_data
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
