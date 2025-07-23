from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..services.interview_service import InterviewService
from ..models.interview import (
    InterviewCreate, InterviewUpdate, InterviewResponse,
    InterviewFeedbackCreate, InterviewFeedbackUpdate, InterviewFeedbackResponse,
    InterviewStatus
)

router = APIRouter(
    prefix="/api/interviews",
    tags=["interviews"]
)

# Helper function to get the interview service
def get_interview_service(db: Session = Depends(get_db)) -> InterviewService:
    return InterviewService(db)

@router.post("", response_model=InterviewResponse)
async def create_interview(
    interview_data: InterviewCreate,
    service: InterviewService = Depends(get_interview_service)
):
    """Create a new interview"""
    return service.create_interview(interview_data)

@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: int,
    service: InterviewService = Depends(get_interview_service)
):
    """Get interview by ID"""
    interview = service.get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.get("", response_model=List[InterviewResponse])
async def get_interviews(
    candidate_id: Optional[int] = None,
    job_id: Optional[int] = None,
    interviewer_id: Optional[int] = None,
    status: Optional[InterviewStatus] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    service: InterviewService = Depends(get_interview_service)
):
    """Get interviews with optional filters"""
    return service.get_interviews(
        candidate_id=candidate_id,
        job_id=job_id,
        interviewer_id=interviewer_id,
        status=status,
        from_date=from_date,
        to_date=to_date
    )

@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: int,
    interview_data: InterviewUpdate,
    service: InterviewService = Depends(get_interview_service)
):
    """Update interview details"""
    interview = service.update_interview(interview_id, interview_data)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.delete("/{interview_id}")
async def delete_interview(
    interview_id: int,
    service: InterviewService = Depends(get_interview_service)
):
    """Delete an interview"""
    success = service.delete_interview(interview_id)
    if not success:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"message": "Interview deleted successfully"}

@router.post("/{interview_id}/feedback", response_model=InterviewFeedbackResponse)
async def create_interview_feedback(
    interview_id: int,
    feedback_data: InterviewFeedbackCreate,
    service: InterviewService = Depends(get_interview_service)
):
    """Create feedback for an interview"""
    if feedback_data.interview_id != interview_id:
        raise HTTPException(status_code=400, detail="Interview ID mismatch")
    return service.create_feedback(feedback_data)

@router.get("/{interview_id}/feedback", response_model=List[InterviewFeedbackResponse])
async def get_interview_feedback(
    interview_id: int,
    service: InterviewService = Depends(get_interview_service)
):
    """Get all feedback for an interview"""
    return service.get_interview_feedback(interview_id)

@router.put("/feedback/{feedback_id}", response_model=InterviewFeedbackResponse)
async def update_feedback(
    feedback_id: int,
    feedback_data: InterviewFeedbackUpdate,
    service: InterviewService = Depends(get_interview_service)
):
    """Update interview feedback"""
    feedback = service.update_feedback(feedback_id, feedback_data)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    service: InterviewService = Depends(get_interview_service)
):
    """Delete interview feedback"""
    success = service.delete_feedback(feedback_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"message": "Feedback deleted successfully"}

@router.get("/upcoming/next-days", response_model=List[InterviewResponse])
async def get_upcoming_interviews(
    days: int = Query(7, ge=1, le=30),
    service: InterviewService = Depends(get_interview_service)
):
    """Get upcoming interviews for the next X days"""
    return service.get_upcoming_interviews(days)

@router.get("/interviewer/{interviewer_id}/schedule", response_model=List[InterviewResponse])
async def get_interviewer_schedule(
    interviewer_id: int,
    from_date: datetime,
    to_date: datetime,
    service: InterviewService = Depends(get_interview_service)
):
    """Get interviewer's schedule for a date range"""
    return service.get_interviewer_schedule(interviewer_id, from_date, to_date)

@router.post("/{interview_id}/cancel", response_model=InterviewResponse)
async def cancel_interview(
    interview_id: int,
    cancellation_reason: Optional[str] = None,
    service: InterviewService = Depends(get_interview_service)
):
    """Cancel an interview"""
    interview = service.cancel_interview(interview_id, cancellation_reason)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.post("/{interview_id}/reschedule", response_model=InterviewResponse)
async def reschedule_interview(
    interview_id: int,
    new_time: datetime,
    service: InterviewService = Depends(get_interview_service)
):
    """Reschedule an interview"""
    interview = service.reschedule_interview(interview_id, new_time)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview 