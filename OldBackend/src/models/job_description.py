from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Responsibility(BaseModel):
    description: str
    is_required: bool = True

class Qualification(BaseModel):
    description: str
    is_required: bool = True

class Benefit(BaseModel):
    title: str
    description: str

class JobDescription(BaseModel):
    id: str
    title: str
    department: str
    location: str
    employment_type: str = "Full-time"
    experience_level: str
    overview: str
    responsibilities: List[Responsibility]
    qualifications: List[Qualification]
    required_skills: List[str]
    preferred_skills: List[str]
    benefits: List[Benefit]
    company_description: str
    culture_values: str
    diversity_statement: str
    status: str = "draft"  # draft, published, archived
    created_at: str
    updated_at: str

class JobDescriptionResponse(BaseModel):
    job_description: JobDescription
    message: str

class JobDescriptionSuggestions(BaseModel):
    inclusive_language: List[str]
    clarity_improvements: List[str]
    attractiveness_suggestions: List[str]
    technical_accuracy: List[str]
    culture_fit: List[str]

class MarketAnalysis(BaseModel):
    salary_range: dict
    skills_alignment: dict
    experience_match: dict
    title_accuracy: dict 