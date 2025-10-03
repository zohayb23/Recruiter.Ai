from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PipelineStageStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    ASSESSMENT = "assessment"
    REFERENCE_CHECK = "reference_check"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"

class CandidateStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class Candidate(BaseModel):
    """Candidate model"""
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    resume_id: Optional[str] = None
    current_stage: PipelineStageStatus
    status: CandidateStatus = CandidateStatus.ACTIVE
    pipeline_id: str
    recruiter_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class PipelineStage(BaseModel):
    """Pipeline stage model"""
    id: str
    name: str
    order: int
    description: str
    color: str
    pipeline_id: str
    created_at: datetime
    updated_at: datetime

class CandidatePipeline(BaseModel):
    """Candidate pipeline model"""
    id: str
    name: str
    description: str
    stages: List[PipelineStage] = []
    candidates: List[Candidate] = []
    created_by: str
    created_at: datetime
    updated_at: datetime

class CandidateNote(BaseModel):
    """Candidate note/comment"""
    id: str
    candidate_id: str
    content: str
    author_id: str
    author_name: str
    created_at: datetime
    updated_at: datetime

class CandidateActivity(BaseModel):
    """Candidate activity log"""
    id: str
    candidate_id: str
    activity_type: str  # stage_change, note_added, email_sent, etc.
    description: str
    metadata: Dict[str, Any] = {}
    created_by: str
    created_at: datetime

class PipelineAnalytics(BaseModel):
    """Pipeline analytics"""
    pipeline_id: str
    total_candidates: int
    candidates_by_stage: Dict[str, int] = {}
    average_time_in_stage: Dict[str, float] = {}  # days
    conversion_rate: float = 0.0
    last_updated: datetime

class StageTransitionRequest(BaseModel):
    """Request to move candidate to different stage"""
    candidate_id: str
    new_stage: PipelineStageStatus
    note: Optional[str] = None

class CandidateSearchRequest(BaseModel):
    """Request for candidate search"""
    query: Optional[str] = None
    pipeline_id: Optional[str] = None
    stage: Optional[PipelineStageStatus] = None
    status: Optional[CandidateStatus] = None
    recruiter_id: Optional[str] = None
    limit: int = 50
    offset: int = 0
