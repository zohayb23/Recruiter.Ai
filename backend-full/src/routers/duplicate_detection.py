import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..services.duplicate_detection_service import DuplicateDetectionService
from ..services.duplicate_merge_service import DuplicateMergeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/duplicate-detection", tags=["duplicate-detection"])

# Initialize services
duplicate_detection_service = DuplicateDetectionService()
duplicate_merge_service = DuplicateMergeService()

# Pydantic models
class DuplicateDetectionResponse(BaseModel):
    total_resumes: int
    duplicate_groups: List[List[Dict]]
    total_duplicates: int
    detection_summary: str

class SingleResumeDetectionResponse(BaseModel):
    target_resume: str
    duplicates_found: List[Dict]
    total_duplicates: int

class MergeRequest(BaseModel):
    primary_resume_id: str
    duplicate_resume_ids: List[str]
    merge_strategy: str = "best"  # "best", "combine", "latest"

class MergeResponse(BaseModel):
    success: bool
    primary_resume_id: str
    merged_resume: Dict
    deleted_resume_ids: List[str]
    merge_strategy: str
    merge_timestamp: str
    summary: str

@router.get("/detect", response_model=DuplicateDetectionResponse)
async def detect_all_duplicates():
    """
    Detect all duplicate resumes in the database
    
    Returns:
        List of duplicate groups and detection summary
    """
    try:
        result = await duplicate_detection_service.detect_duplicates()
        return DuplicateDetectionResponse(**result)
    except Exception as e:
        logger.error(f"Error detecting duplicates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/detect/{resume_id}", response_model=SingleResumeDetectionResponse)
async def detect_duplicates_for_resume(resume_id: str):
    """
    Detect duplicates for a specific resume
    
    Args:
        resume_id: ID of the resume to check for duplicates
        
    Returns:
        List of duplicate resumes found
    """
    try:
        result = await duplicate_detection_service.detect_duplicates(resume_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        return SingleResumeDetectionResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting duplicates for resume {resume_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/merge", response_model=MergeResponse)
async def merge_duplicates(request: MergeRequest):
    """
    Merge duplicate resumes into a single resume
    
    Args:
        request: Merge request containing primary resume ID, duplicate IDs, and strategy
        
    Returns:
        Merge operation results
    """
    try:
        # Validate merge strategy
        valid_strategies = ["best", "combine", "latest"]
        if request.merge_strategy not in valid_strategies:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid merge strategy. Must be one of: {valid_strategies}"
            )
        
        # Validate that we have duplicates to merge
        if not request.duplicate_resume_ids:
            raise HTTPException(
                status_code=400,
                detail="No duplicate resume IDs provided"
            )
        
        # Perform the merge
        result = await duplicate_merge_service.merge_duplicates(
            primary_resume_id=request.primary_resume_id,
            duplicate_resume_ids=request.duplicate_resume_ids,
            merge_strategy=request.merge_strategy
        )
        
        return MergeResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error merging duplicates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint for duplicate detection service"""
    return {
        "status": "healthy",
        "service": "duplicate-detection",
        "timestamp": "2025-01-08T19:30:00Z"
    }

@router.get("/stats")
async def get_duplicate_stats():
    """
    Get statistics about duplicates in the database
    
    Returns:
        Statistics about duplicate detection
    """
    try:
        result = await duplicate_detection_service.detect_duplicates()
        
        # Calculate additional statistics
        total_groups = len(result['duplicate_groups'])
        total_duplicates = result['total_duplicates']
        total_resumes = result['total_resumes']
        
        # Calculate duplicate percentage
        duplicate_percentage = (total_duplicates / total_resumes * 100) if total_resumes > 0 else 0
        
        return {
            "total_resumes": total_resumes,
            "duplicate_groups": total_groups,
            "total_duplicates": total_duplicates,
            "duplicate_percentage": round(duplicate_percentage, 2),
            "clean_resumes": total_resumes - total_duplicates,
            "detection_summary": result['detection_summary']
        }
        
    except Exception as e:
        logger.error(f"Error getting duplicate stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview/{resume_id}")
async def preview_duplicates(resume_id: str):
    """
    Preview duplicates for a specific resume without performing any actions
    
    Args:
        resume_id: ID of the resume to preview duplicates for
        
    Returns:
        Detailed preview of potential duplicates
    """
    try:
        result = await duplicate_detection_service.detect_duplicates(resume_id)
        if 'error' in result:
            raise HTTPException(status_code=404, detail=result['error'])
        
        # Get detailed match information for each duplicate
        detailed_duplicates = []
        for duplicate in result['duplicates_found']:
            # This would require additional method in the service
            # For now, return basic information
            detailed_duplicates.append({
                'resume_id': duplicate.get('metadata', {}).get('resume_id'),
                'name': duplicate.get('basic_information', {}).get('name'),
                'email': duplicate.get('basic_information', {}).get('contact', {}).get('email'),
                'phone': duplicate.get('basic_information', {}).get('contact', {}).get('phone'),
                'skills_count': duplicate.get('skills', {}).get('total_count', 0),
                'education_count': duplicate.get('education', {}).get('total_count', 0)
            })
        
        return {
            'target_resume_id': resume_id,
            'duplicates_preview': detailed_duplicates,
            'total_duplicates': len(detailed_duplicates),
            'preview_timestamp': "2025-01-08T19:30:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing duplicates for resume {resume_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
