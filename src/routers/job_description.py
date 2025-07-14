from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from ..database.database import get_db
from ..services.job_description_service import JobDescriptionService
from ..models.job_description import (
    JobDescriptionCreate,
    JobDescriptionRefine,
    JobDescription
)

router = APIRouter(prefix="/api/job-descriptions", tags=["job-descriptions"])
description_service = JobDescriptionService()

@router.post("", response_model=Dict)
async def generate_job_description(
    request: JobDescriptionCreate,
    db: Session = Depends(get_db)
):
    """Generate a new job description using AI"""
    try:
        return description_service.generate_description(
            db=db,
            requirements=request.requirements
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate job description: {str(e)}"
        )

@router.post("/{description_id}/refine", response_model=Dict)
async def refine_job_description(
    description_id: str,
    request: JobDescriptionRefine,
    db: Session = Depends(get_db)
):
    """Refine an existing job description based on feedback"""
    try:
        return description_service.refine_description(
            db=db,
            description_id=description_id,
            feedback=request.feedback
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refine job description: {str(e)}"
        ) 