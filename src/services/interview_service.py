from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..models.interview import (
    Interview, InterviewFeedback,
    InterviewCreate, InterviewUpdate,
    InterviewFeedbackCreate, InterviewFeedbackUpdate,
    InterviewStatus
)

class InterviewService:
    def __init__(self, db: Session):
        self.db = db

    def create_interview(self, interview_data: InterviewCreate) -> Interview:
        """Create a new interview"""
        interview = Interview(**interview_data.model_dump())
        self.db.add(interview)
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def get_interview(self, interview_id: int) -> Optional[Interview]:
        """Get interview by ID"""
        return self.db.query(Interview).filter(Interview.id == interview_id).first()

    def get_interviews(
        self,
        candidate_id: Optional[int] = None,
        job_id: Optional[int] = None,
        interviewer_id: Optional[int] = None,
        status: Optional[InterviewStatus] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> List[Interview]:
        """Get interviews with optional filters"""
        query = self.db.query(Interview)

        if candidate_id:
            query = query.filter(Interview.candidate_id == candidate_id)
        if job_id:
            query = query.filter(Interview.job_id == job_id)
        if interviewer_id:
            query = query.filter(Interview.interviewer_id == interviewer_id)
        if status:
            query = query.filter(Interview.status == status)
        if from_date and to_date:
            query = query.filter(
                and_(
                    Interview.scheduled_time >= from_date,
                    Interview.scheduled_time <= to_date
                )
            )

        return query.order_by(Interview.scheduled_time.desc()).all()

    def update_interview(self, interview_id: int, interview_data: InterviewUpdate) -> Optional[Interview]:
        """Update interview details"""
        interview = self.get_interview(interview_id)
        if not interview:
            return None

        update_data = interview_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(interview, field, value)

        self.db.commit()
        self.db.refresh(interview)
        return interview

    def delete_interview(self, interview_id: int) -> bool:
        """Delete an interview"""
        interview = self.get_interview(interview_id)
        if not interview:
            return False

        self.db.delete(interview)
        self.db.commit()
        return True

    def create_feedback(self, feedback_data: InterviewFeedbackCreate) -> InterviewFeedback:
        """Create interview feedback"""
        feedback = InterviewFeedback(**feedback_data.model_dump())
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def get_feedback(self, feedback_id: int) -> Optional[InterviewFeedback]:
        """Get feedback by ID"""
        return self.db.query(InterviewFeedback).filter(InterviewFeedback.id == feedback_id).first()

    def get_interview_feedback(self, interview_id: int) -> List[InterviewFeedback]:
        """Get all feedback for an interview"""
        return self.db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview_id).all()

    def update_feedback(self, feedback_id: int, feedback_data: InterviewFeedbackUpdate) -> Optional[InterviewFeedback]:
        """Update interview feedback"""
        feedback = self.get_feedback(feedback_id)
        if not feedback:
            return None

        update_data = feedback_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(feedback, field, value)

        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def delete_feedback(self, feedback_id: int) -> bool:
        """Delete interview feedback"""
        feedback = self.get_feedback(feedback_id)
        if not feedback:
            return False

        self.db.delete(feedback)
        self.db.commit()
        return True

    def get_upcoming_interviews(self, days: int = 7) -> List[Interview]:
        """Get upcoming interviews within specified days"""
        now = datetime.utcnow()
        return self.db.query(Interview).filter(
            and_(
                Interview.scheduled_time >= now,
                Interview.status == InterviewStatus.SCHEDULED
            )
        ).order_by(Interview.scheduled_time).all()

    def get_interviewer_schedule(self, interviewer_id: int, from_date: datetime, to_date: datetime) -> List[Interview]:
        """Get interviewer's schedule for a date range"""
        return self.db.query(Interview).filter(
            and_(
                Interview.interviewer_id == interviewer_id,
                Interview.scheduled_time >= from_date,
                Interview.scheduled_time <= to_date
            )
        ).order_by(Interview.scheduled_time).all()

    def cancel_interview(self, interview_id: int, cancellation_reason: Optional[str] = None) -> Optional[Interview]:
        """Cancel an interview"""
        interview = self.get_interview(interview_id)
        if not interview:
            return None

        interview.status = InterviewStatus.CANCELLED
        if cancellation_reason:
            interview.notes = f"Cancelled: {cancellation_reason}"

        self.db.commit()
        self.db.refresh(interview)
        return interview

    def reschedule_interview(self, interview_id: int, new_time: datetime) -> Optional[Interview]:
        """Reschedule an interview"""
        interview = self.get_interview(interview_id)
        if not interview:
            return None

        interview.scheduled_time = new_time
        interview.status = InterviewStatus.RESCHEDULED

        self.db.commit()
        self.db.refresh(interview)
        return interview 