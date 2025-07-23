from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class Contact(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

class Education(BaseModel):
    degree: str
    institution: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[float] = None
    description: Optional[str] = None

class WorkExperience(BaseModel):
    title: str
    company: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[List[str]] = None
    technologies: Optional[List[str]] = None

class Skill(BaseModel):
    name: str
    category: str
    years_of_experience: Optional[float] = None
    level: Optional[str] = None

class ParsedResume(BaseModel):
    # Basic information
    resume_id: Optional[str] = None
    full_name: str
    contact: Contact
    summary: Optional[str] = None
    
    # Main sections
    work_experience: List[WorkExperience]
    education: List[Education]
    skills: List[Skill]
    certifications: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    
    # Metadata
    file_path: Optional[str] = None
    created_at: Optional[str] = None
    raw_text: Optional[str] = None

class ResumeParseResponse(BaseModel):
    success: bool
    data: Optional[ParsedResume] = None
    message: Optional[str] = None 