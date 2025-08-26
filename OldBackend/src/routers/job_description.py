from fastapi import APIRouter, HTTPException
from typing import List
from ..models.job_description import JobDescription, JobDescriptionResponse
from ..services.job_description_service import job_description_service

router = APIRouter()

@router.post("/job-descriptions", response_model=JobDescriptionResponse)
async def create_job_description(data: dict):
    """Create a new job description"""
    try:
        jd = job_description_service.create_job_description(data)
        return JobDescriptionResponse(
            success=True,
            data=jd,
            message="Job description created successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating job description: {str(e)}"
        )

@router.get("/job-descriptions/{job_id}", response_model=JobDescriptionResponse)
async def get_job_description(job_id: str):
    """Get a job description by ID"""
    jd = job_description_service.get_job_description(job_id)
    if not jd:
        raise HTTPException(
            status_code=404,
            detail="Job description not found"
        )
    return JobDescriptionResponse(
        success=True,
        data=jd,
        message="Job description retrieved successfully"
    )

@router.get("/job-descriptions", response_model=JobDescriptionResponse)
async def list_job_descriptions():
    """List all job descriptions"""
    try:
        jds = job_description_service.list_job_descriptions()
        return JobDescriptionResponse(
            success=True,
            data=jds,
            message=f"Found {len(jds)} job descriptions"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing job descriptions: {str(e)}"
        )

@router.put("/job-descriptions/{job_id}", response_model=JobDescriptionResponse)
async def update_job_description(job_id: str, data: dict):
    """Update a job description"""
    try:
        jd = job_description_service.update_job_description(job_id, data)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail="Job description not found"
            )
        return JobDescriptionResponse(
            success=True,
            data=jd,
            message="Job description updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating job description: {str(e)}"
        )

@router.delete("/job-descriptions/{job_id}", response_model=JobDescriptionResponse)
async def delete_job_description(job_id: str):
    """Delete a job description"""
    try:
        success = job_description_service.delete_job_description(job_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Job description not found"
            )
        return JobDescriptionResponse(
            success=True,
            data=None,
            message="Job description deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting job description: {str(e)}"
        )

@router.post("/job-descriptions/{job_id}/publish", response_model=JobDescriptionResponse)
async def publish_job_description(job_id: str):
    """Publish a job description"""
    try:
        jd = job_description_service.publish_job_description(job_id)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail="Job description not found"
            )
        return JobDescriptionResponse(
            success=True,
            data=jd,
            message="Job description published successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error publishing job description: {str(e)}"
        )

@router.post("/job-descriptions/{job_id}/archive", response_model=JobDescriptionResponse)
async def archive_job_description(job_id: str):
    """Archive a job description"""
    try:
        jd = job_description_service.archive_job_description(job_id)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail="Job description not found"
            )
        return JobDescriptionResponse(
            success=True,
            data=jd,
            message="Job description archived successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error archiving job description: {str(e)}"
        )

@router.post("/job-descriptions/generate", response_model=JobDescriptionResponse)
async def generate_job_description(data: dict):
    """Generate a job description using AI"""
    try:
        jd = await job_description_service.generate_job_description(data)
        if not jd:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate job description"
            )
        return JobDescriptionResponse(
            success=True,
            data=jd,
            message="Job description generated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating job description: {str(e)}"
        )

@router.post("/job-descriptions/{job_id}/improve", response_model=JobDescriptionResponse)
async def improve_job_description(job_id: str):
    """Get improvement suggestions for a job description"""
    try:
        jd = job_description_service.get_job_description(job_id)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail="Job description not found"
            )

        suggestions = await job_description_service.improve_job_description(jd.dict())
        if not suggestions:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate suggestions"
            )

        return JobDescriptionResponse(
            success=True,
            data=suggestions,
            message="Improvement suggestions generated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating suggestions: {str(e)}"
        )

@router.post("/job-descriptions/{job_id}/market-analysis", response_model=JobDescriptionResponse)
async def analyze_market_alignment(job_id: str):
    """Analyze job description market alignment"""
    try:
        jd = job_description_service.get_job_description(job_id)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail="Job description not found"
            )

        analysis = await job_description_service.analyze_market_alignment(jd.dict())
        if not analysis:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate market analysis"
            )

        return JobDescriptionResponse(
            success=True,
            data=analysis,
            message="Market analysis generated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating market analysis: {str(e)}"
        ) 