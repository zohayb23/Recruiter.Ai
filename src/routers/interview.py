from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from ..database.database import get_db
from ..services.interview_service import InterviewService
from ..models.interview import (
    QuestionRequest,
    QuestionSet,
    InterviewFeedback
)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])
interview_service = InterviewService()

@router.post("/questions", response_model=Dict)
async def generate_questions(
    request: QuestionRequest,
    db: Session = Depends(get_db)
):
    """Generate interview questions based on job and candidate profile"""
    try:
        return interview_service.generate_questions(db, request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview questions: {str(e)}"
        )

@router.get("/questions/{question_set_id}", response_model=Dict)
async def get_questions(
    question_set_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve a specific set of interview questions"""
    try:
        return interview_service.get_questions_by_id(db, question_set_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve interview questions: {str(e)}"
        )

@router.post("/questions/{question_set_id}/feedback-form", response_model=Dict)
async def generate_feedback_form(
    question_set_id: str,
    db: Session = Depends(get_db)
):
    """Generate an interview feedback form for a question set"""
    try:
        return interview_service.generate_feedback_form(db, question_set_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate feedback form: {str(e)}"
        ) 