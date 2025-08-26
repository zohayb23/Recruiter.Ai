from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AssessmentType(str, enum.Enum):
    TECHNICAL = "technical"
    CODING = "coding"
    PERSONALITY = "personality"
    SKILLS = "skills"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"

class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class AssessmentStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class QuestionType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    CODING = "coding"
    OPEN_ENDED = "open_ended"
    SYSTEM_DESIGN = "system_design"
    TRUE_FALSE = "true_false"
    SCALE = "scale"

class CodingLanguage(str, enum.Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    CSHARP = "csharp"
    RUBY = "ruby"
    GO = "go"
    RUST = "rust"

# SQLAlchemy Models
class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    assessment_type = Column(Enum(AssessmentType), nullable=False)
    difficulty_level = Column(Enum(DifficultyLevel), nullable=False)
    time_limit_minutes = Column(Integer)
    passing_score = Column(Float)
    status = Column(Enum(AssessmentStatus), default=AssessmentStatus.DRAFT)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")
    submissions = relationship("AssessmentSubmission", back_populates="assessment")
    creator = relationship("User", back_populates="created_assessments")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    question_type = Column(Enum(QuestionType), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)  # For multiple choice questions
    correct_answer = Column(JSON, nullable=True)  # Can be string, array, or object depending on question type
    points = Column(Float, default=1.0)
    
    # For coding questions
    coding_language = Column(Enum(CodingLanguage), nullable=True)
    test_cases = Column(JSON, nullable=True)
    initial_code = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    responses = relationship("QuestionResponse", back_populates="question")

class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    total_score = Column(Float, nullable=True)
    passed = Column(Boolean, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="submissions")
    candidate = relationship("Candidate", back_populates="assessment_submissions")
    responses = relationship("QuestionResponse", back_populates="submission")

class QuestionResponse(Base):
    __tablename__ = "question_responses"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assessment_submissions.id"))
    question_id = Column(Integer, ForeignKey("assessment_questions.id"))
    
    response_data = Column(JSON, nullable=False)  # The actual answer provided
    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    
    # For coding questions
    execution_time = Column(Float, nullable=True)  # in milliseconds
    memory_used = Column(Float, nullable=True)  # in MB
    test_results = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    submission = relationship("AssessmentSubmission", back_populates="responses")
    question = relationship("AssessmentQuestion", back_populates="responses")

# Pydantic Models for API
class QuestionBase(BaseModel):
    question_type: QuestionType
    question_text: str
    options: Optional[Dict[str, Any]]
    points: float = 1.0
    coding_language: Optional[CodingLanguage] = None
    test_cases: Optional[List[Dict[str, Any]]] = None
    initial_code: Optional[str] = None

class QuestionCreate(QuestionBase):
    correct_answer: Any

class QuestionUpdate(QuestionBase):
    correct_answer: Optional[Any] = None

class QuestionResponse(QuestionBase):
    id: int
    assessment_id: int
    correct_answer: Any
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssessmentBase(BaseModel):
    title: str
    description: str
    assessment_type: AssessmentType
    difficulty_level: DifficultyLevel
    time_limit_minutes: Optional[int] = None
    passing_score: Optional[float] = None

class AssessmentCreate(AssessmentBase):
    questions: List[QuestionCreate]

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assessment_type: Optional[AssessmentType] = None
    difficulty_level: Optional[DifficultyLevel] = None
    time_limit_minutes: Optional[int] = None
    passing_score: Optional[float] = None
    status: Optional[AssessmentStatus] = None

class AssessmentResponse(AssessmentBase):
    id: int
    status: AssessmentStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse]

    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    assessment_id: int
    candidate_id: int

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    total_score: Optional[float] = None
    passed: Optional[bool] = None

class ResponseCreate(BaseModel):
    question_id: int
    response_data: Any
    execution_time: Optional[float] = None
    memory_used: Optional[float] = None

class ResponseUpdate(BaseModel):
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    test_results: Optional[Dict[str, Any]] = None

class QuestionResponseDetail(BaseModel):
    id: int
    response_data: Any
    is_correct: Optional[bool]
    score: Optional[float]
    feedback: Optional[str]
    execution_time: Optional[float]
    memory_used: Optional[float]
    test_results: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubmissionResponse(SubmissionBase):
    id: int
    started_at: datetime
    completed_at: Optional[datetime]
    total_score: Optional[float]
    passed: Optional[bool]
    responses: List[QuestionResponseDetail]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 