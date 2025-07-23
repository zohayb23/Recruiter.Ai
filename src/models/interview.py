from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from typing import Optional, List
from pydantic import BaseModel

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PENDING = "pending"
    RESCHEDULED = "rescheduled"

class InterviewType(str, enum.Enum):
    TECHNICAL = "technical"
    HR = "hr"
    CULTURAL = "cultural"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"
    BEHAVIORAL = "behavioral"
    FINAL = "final"

class InterviewMode(str, enum.Enum):
    IN_PERSON = "in_person"
    VIDEO = "video"
    PHONE = "phone"
    ASYNC = "async"

class InterviewFeedbackCategory(str, enum.Enum):
    TECHNICAL_SKILLS = "technical_skills"
    COMMUNICATION = "communication"
    PROBLEM_SOLVING = "problem_solving"
    CULTURAL_FIT = "cultural_fit"
    EXPERIENCE = "experience"
    LEADERSHIP = "leadership"

# SQLAlchemy Models
class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    interviewer_id = Column(Integer, ForeignKey("users.id"))
    
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    interview_type = Column(Enum(InterviewType), nullable=False)
    interview_mode = Column(Enum(InterviewMode), nullable=False)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    
    meeting_link = Column(String, nullable=True)
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="interviews")
    job = relationship("Job", back_populates="interviews")
    interviewer = relationship("User", back_populates="conducted_interviews")
    feedback = relationship("InterviewFeedback", back_populates="interview")

class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    category = Column(Enum(InterviewFeedbackCategory), nullable=False)
    rating = Column(Float, nullable=False)  # Scale of 1-5
    comments = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interview = relationship("Interview", back_populates="feedback")

# Pydantic Models for API
class InterviewBase(BaseModel):
    candidate_id: int
    job_id: int
    interviewer_id: int
    scheduled_time: datetime
    duration_minutes: int = 60
    interview_type: InterviewType
    interview_mode: InterviewMode
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interview_type: Optional[InterviewType] = None
    interview_mode: Optional[InterviewMode] = None
    status: Optional[InterviewStatus] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewFeedbackBase(BaseModel):
    category: InterviewFeedbackCategory
    rating: float  # Scale of 1-5
    comments: Optional[str] = None

class InterviewFeedbackCreate(InterviewFeedbackBase):
    interview_id: int

class InterviewFeedbackUpdate(InterviewFeedbackBase):
    pass

class InterviewFeedbackResponse(InterviewFeedbackBase):
    id: int
    interview_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InterviewResponse(InterviewBase):
    id: int
    status: InterviewStatus
    created_at: datetime
    updated_at: datetime
    feedback: List[InterviewFeedbackResponse] = []

    class Config:
        from_attributes = True 