from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Contact(BaseModel):
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""

class Education(BaseModel):
    degree: str
    institution: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class WorkExperience(BaseModel):
    title: str
    company: str
    start_date: str = ""
    end_date: str = ""
    description: List[str] = []
    technologies: List[str] = []

class Skill(BaseModel):
    name: str
    category: str = "General"

class ParsedResume(BaseModel):
    resume_id: str
    full_name: str
    contact: Contact
    education: List[Education] = []
    work_experience: List[WorkExperience] = []
    skills: List[Skill] = []
    file_path: str
    created_at: str