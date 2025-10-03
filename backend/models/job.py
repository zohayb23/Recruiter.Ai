from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class LocationType(str, Enum):
    REMOTE = "remote"
    ONSITE = "onsite"
    HYBRID = "hybrid"

class ExperienceLevel(str, Enum):
    ENTRY_LEVEL = "Entry-Level"
    MID_LEVEL = "Mid-Level"
    SENIOR_LEVEL = "Senior Level"
    EXECUTIVE = "Executive"

class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    PAUSED = "paused"

class JobDescription(BaseModel):
    """Complete job description model"""
    id: str
    title: str
    company: str
    department: str
    location_type: LocationType
    location: str
    experience_level: ExperienceLevel
    overview: str
    responsibilities: List[str]
    qualifications: List[str]
    required_skills: List[str]
    preferred_skills: List[str] = []
    benefits: List[str]
    company_description: str
    status: JobStatus = JobStatus.DRAFT
    created_at: datetime
    updated_at: datetime
    created_by: str = "system"
    milvus_id: Optional[str] = None

class JobGenerationRequest(BaseModel):
    """Request for AI job description generation"""
    title: str
    company: str
    department: str
    location_type: LocationType = LocationType.REMOTE
    location: str = "Anywhere"
    experience_level: ExperienceLevel = ExperienceLevel.MID_LEVEL
    key_skills: List[str] = []
    additional_requirements: Optional[str] = None

class JobGenerationResponse(BaseModel):
    """Response from AI job description generation"""
    success: bool
    message: str
    job_description: Optional[JobDescription] = None
    error: Optional[str] = None

class JobSearchRequest(BaseModel):
    """Request for semantic job search"""
    query: str
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None
    location_filter: Optional[str] = None
    experience_level_filter: Optional[ExperienceLevel] = None
    department_filter: Optional[str] = None

class JobSearchResult(BaseModel):
    """Result from semantic job search"""
    job: JobDescription
    similarity_score: float
    matched_fields: List[str] = []

class JobMatchRequest(BaseModel):
    """Request for job-resume matching"""
    resume_id: str
    job_id: Optional[str] = None
    limit: int = 10

class JobMatchResult(BaseModel):
    """Result from job-resume matching"""
    job: JobDescription
    match_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendations: List[str] = []

class JobAnalytics(BaseModel):
    """Job posting analytics"""
    job_id: str
    views: int = 0
    applications: int = 0
    matches: int = 0
    created_at: datetime
    last_updated: datetime
