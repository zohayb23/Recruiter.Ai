from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..services.assessment_service import AssessmentService
from ..models.assessment import (
    AssessmentCreate, AssessmentUpdate, AssessmentResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    SubmissionCreate, SubmissionUpdate, SubmissionResponse,
    ResponseCreate, ResponseUpdate, QuestionResponseDetail,
    AssessmentStatus, AssessmentType, DifficultyLevel
)

router = APIRouter(
    prefix="/api/assessments",
    tags=["assessments"]
)

# Helper function to get the assessment service
def get_assessment_service(db: Session = Depends(get_db)) -> AssessmentService:
    return AssessmentService(db)

@router.post("", response_model=AssessmentResponse)
async def create_assessment(
    assessment_data: AssessmentCreate,
    service: AssessmentService = Depends(get_assessment_service),
    current_user_id: int = 1  # TODO: Replace with actual auth
):
    """Create a new assessment"""
    return service.create_assessment(assessment_data, current_user_id)

@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Get assessment by ID"""
    assessment = service.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.get("", response_model=List[AssessmentResponse])
async def list_assessments(
    assessment_type: Optional[AssessmentType] = None,
    difficulty_level: Optional[DifficultyLevel] = None,
    status: Optional[AssessmentStatus] = None,
    created_by: Optional[int] = None,
    service: AssessmentService = Depends(get_assessment_service)
):
    """List assessments with optional filters"""
    return service.get_assessments(
        assessment_type=assessment_type,
        difficulty_level=difficulty_level,
        status=status,
        created_by=created_by
    )

@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: int,
    assessment_data: AssessmentUpdate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Update assessment details"""
    assessment = service.update_assessment(assessment_id, assessment_data)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Delete an assessment"""
    success = service.delete_assessment(assessment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"message": "Assessment deleted successfully"}

@router.post("/{assessment_id}/questions", response_model=QuestionResponse)
async def add_question(
    assessment_id: int,
    question_data: QuestionCreate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Add a question to an assessment"""
    return service.create_question(assessment_id, question_data)

@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Update a question"""
    question = service.update_question(question_id, question_data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Delete a question"""
    success = service.delete_question(question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}

@router.post("/submissions", response_model=SubmissionResponse)
async def create_submission(
    submission_data: SubmissionCreate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Create a new assessment submission"""
    return service.create_submission(submission_data)

@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Get submission by ID"""
    submission = service.get_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

@router.get("/candidates/{candidate_id}/submissions", response_model=List[SubmissionResponse])
async def get_candidate_submissions(
    candidate_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Get all submissions for a candidate"""
    return service.get_candidate_submissions(candidate_id)

@router.post("/submissions/{submission_id}/responses", response_model=QuestionResponseDetail)
async def submit_response(
    submission_id: int,
    response_data: ResponseCreate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Submit a response to a question"""
    return service.submit_response(submission_id, response_data)

@router.put("/responses/{response_id}", response_model=QuestionResponseDetail)
async def evaluate_response(
    response_id: int,
    evaluation_data: ResponseUpdate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Evaluate a response"""
    response = service.evaluate_response(response_id, evaluation_data)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    return response

@router.put("/submissions/{submission_id}/complete", response_model=SubmissionResponse)
async def complete_submission(
    submission_id: int,
    evaluation_data: SubmissionUpdate,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Complete an assessment submission"""
    submission = service.complete_submission(submission_id, evaluation_data)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission

@router.get("/submissions/{submission_id}/results")
async def get_submission_results(
    submission_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Get detailed results for a submission"""
    results = service.get_submission_results(submission_id)
    if not results:
        raise HTTPException(status_code=404, detail="Submission not found")
    return results

@router.get("/{assessment_id}/statistics")
async def get_assessment_statistics(
    assessment_id: int,
    service: AssessmentService = Depends(get_assessment_service)
):
    """Get statistics for an assessment"""
    statistics = service.get_assessment_statistics(assessment_id)
    if not statistics:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return statistics 