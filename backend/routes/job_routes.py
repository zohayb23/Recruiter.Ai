from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from ..services.job_service import job_service
from ..models.job import (
    JobGenerationRequest, JobGenerationResponse, JobSearchRequest,
    JobDescription, JobMatchRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/job-descriptions", tags=["Job Descriptions"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "job-description-service",
        "version": "1.0.0"
    }

@router.post("/generate", response_model=JobGenerationResponse)
async def generate_job_description(request: JobGenerationRequest):
    """
    Generate AI-powered job description
    """
    try:
        logger.info(f"Generating job description for: {request.title} at {request.company}")
        
        result = await job_service.generate_job_description(request)
        
        if result.success:
            logger.info(f"Successfully generated job description: {result.job_description.id}")
        else:
            logger.error(f"Failed to generate job description: {result.message}")
        
        return result
        
    except Exception as e:
        logger.error(f"Unexpected error generating job description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=JobDescription)
async def create_job_description(job_data: Dict[str, Any]):
    """
    Create a new job description
    """
    try:
        logger.info(f"Creating job description: {job_data.get('title', 'Unknown')}")
        
        job_description = await job_service.create_job_description(job_data)
        
        logger.info(f"Successfully created job description: {job_description.id}")
        return job_description
        
    except Exception as e:
        logger.error(f"Error creating job description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating job description: {str(e)}")

@router.get("/", response_model=List[JobDescription])
async def get_job_descriptions(limit: int = 50, offset: int = 0):
    """
    Get all job descriptions with pagination
    """
    try:
        jobs = await job_service.get_all_job_descriptions(limit=limit, offset=offset)
        return jobs
    except Exception as e:
        logger.error(f"Error retrieving job descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving job descriptions: {str(e)}")

@router.get("/{job_id}", response_model=JobDescription)
async def get_job_description(job_id: str):
    """
    Get a specific job description by ID
    """
    try:
        job = await job_service.get_job_description(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job description not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving job description {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving job description: {str(e)}")

@router.put("/{job_id}", response_model=JobDescription)
async def update_job_description(job_id: str, job_data: Dict[str, Any]):
    """
    Update an existing job description
    """
    try:
        logger.info(f"Updating job description: {job_id}")
        
        updated_job = await job_service.update_job_description(job_id, job_data)
        if not updated_job:
            raise HTTPException(status_code=404, detail="Job description not found")
        
        logger.info(f"Successfully updated job description: {job_id}")
        return updated_job
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job description {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating job description: {str(e)}")

@router.delete("/{job_id}")
async def delete_job_description(job_id: str):
    """
    Delete a job description by ID
    """
    try:
        logger.info(f"Deleting job description: {job_id}")
        
        success = await job_service.delete_job_description(job_id)
        if not success:
            raise HTTPException(status_code=404, detail="Job description not found")
        
        logger.info(f"Successfully deleted job description: {job_id}")
        return {
            "success": True,
            "message": f"Job description {job_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job description {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting job description: {str(e)}")

@router.post("/search")
async def search_job_descriptions(request: JobSearchRequest):
    """
    Search job descriptions using semantic search
    """
    try:
        logger.info(f"Searching job descriptions with query: {request.query}")
        
        results = await job_service.search_jobs(request)
        
        return {
            "results": results,
            "total": len(results),
            "query": request.query,
            "message": f"Found {len(results)} matching job descriptions"
        }
        
    except Exception as e:
        logger.error(f"Error searching job descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching job descriptions: {str(e)}")

@router.post("/match")
async def match_jobs_with_resume(request: JobMatchRequest):
    """
    Match jobs with a resume
    """
    try:
        logger.info(f"Matching jobs for resume: {request.resume_id}")
        
        matches = await job_service.match_jobs_with_resume(request)
        
        return {
            "matches": matches,
            "total": len(matches),
            "resume_id": request.resume_id,
            "message": f"Found {len(matches)} matching jobs"
        }
        
    except Exception as e:
        logger.error(f"Error matching jobs with resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error matching jobs with resume: {str(e)}")

@router.get("/drafts")
async def get_job_description_drafts():
    """
    Get all draft job descriptions
    """
    try:
        # TODO: Implement draft filtering
        jobs = await job_service.get_all_job_descriptions()
        drafts = [job for job in jobs if job.status == "draft"]
        
        return {
            "job_descriptions": drafts,
            "total": len(drafts),
            "message": f"Found {len(drafts)} draft job descriptions"
        }
    except Exception as e:
        logger.error(f"Error retrieving draft job descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving draft job descriptions: {str(e)}")
