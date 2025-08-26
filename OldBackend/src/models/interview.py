from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"
    PROBLEM_SOLVING = "problem_solving"
    CULTURAL_FIT = "cultural_fit"

class DifficultyLevel(str, Enum):
    ENTRY = "entry"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class QuestionRequest(BaseModel):
    role_title: str = Field(..., min_length=2, max_length=100)
    question_type: QuestionType
    difficulty: DifficultyLevel
    num_questions: int = Field(..., ge=1, le=10)
    focus_areas: List[str]
    job_id: Optional[str] = None
    candidate_id: Optional[str] = None

class Question(BaseModel):
    question: str
    type: QuestionType
    difficulty: DifficultyLevel
    expected_answer: List[str]
    evaluation_criteria: List[str]
    good_answer_example: str
    bad_answer_example: str
    follow_up_questions: List[str]

class QuestionSet(BaseModel):
    id: str
    job_id: Optional[str]
    candidate_id: Optional[str]
    question_type: QuestionType
    difficulty: DifficultyLevel
    questions: List[Question]
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeedbackSection(BaseModel):
    question: str
    evaluation_criteria: List[str]
    score: Optional[int] = None
    notes: Optional[str] = None
    red_flags: Optional[List[str]] = None
    strengths: Optional[List[str]] = None

class InterviewFeedback(BaseModel):
    question_set_id: str
    sections: List[FeedbackSection] 