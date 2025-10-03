from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SkillCategory(str, Enum):
    PROGRAMMING_LANGUAGES = "Programming Languages"
    FRAMEWORKS = "Frameworks"
    DATABASES = "Databases"
    TOOLS = "Tools"
    CLOUD = "Cloud"
    OTHER = "Other"

class ProficiencyLevel(str, Enum):
    NATIVE = "Native"
    FLUENT = "Fluent"
    INTERMEDIATE = "Intermediate"
    BASIC = "Basic"

class Skill(BaseModel):
    name: str
    category: SkillCategory

class Education(BaseModel):
    degree: str
    institution: str
    year: str
    gpa: Optional[str] = None
    location: Optional[str] = None

class WorkExperience(BaseModel):
    title: str
    company: str
    start_date: str
    end_date: Optional[str] = None
    location: Optional[str] = None
    description: str
    achievements: List[str] = []
    technologies: List[str] = []

class Certification(BaseModel):
    name: str
    issuer: str
    date: str
    expiry: Optional[str] = None

class Language(BaseModel):
    language: str
    proficiency: ProficiencyLevel

class ParsedResume(BaseModel):
    """Structured resume data parsed from raw text"""
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    summary: Optional[str] = None
    skills: List[Skill] = []
    education: List[Education] = []
    work_experience: List[WorkExperience] = []
    certifications: List[Certification] = []
    languages: List[Language] = []

class ResumeDocument(BaseModel):
    """Complete resume document with metadata"""
    id: str
    filename: str
    file_type: str
    file_size: int
    raw_text: str
    parsed_data: ParsedResume
    created_at: datetime
    updated_at: datetime
    milvus_id: Optional[str] = None

class ResumeSearchRequest(BaseModel):
    """Request for semantic resume search"""
    query: str
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None

class ResumeSearchResult(BaseModel):
    """Result from semantic resume search"""
    resume: ResumeDocument
    similarity_score: float
    matched_fields: List[str] = []

class ResumeUploadResponse(BaseModel):
    """Response after resume upload and parsing"""
    success: bool
    message: str
    resume_id: str
    parsed_data: ParsedResume
    milvus_stored: bool = False
