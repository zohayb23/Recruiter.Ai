from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Contact(BaseModel):
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None

class Education(BaseModel):
    degree: str
    institution: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    gpa: Optional[str] = None
    description: Optional[str] = None

class Skill(BaseModel):
    name: str
    category: Optional[str] = None
    years_of_experience: Optional[int] = None
    proficiency_level: Optional[str] = None

class WorkExperience(BaseModel):
    title: str
    company: str
    start_date: str
    end_date: str
    description: List[str] = []
    technologies: List[str] = []
    achievements: Optional[List[str]] = None

class ParsedResume(BaseModel):
    resume_id: str
    full_name: str
    contact: Contact
    education: List[Education] = []
    work_experience: List[WorkExperience] = []
    skills: List[Skill] = []
    professional_summary: Optional[str] = None
    raw_text: Optional[str] = None
    file_path: str
    created_at: str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

class ResumeParseResponse(BaseModel):
    success: bool
    data: Optional[ParsedResume] = None
    message: str 