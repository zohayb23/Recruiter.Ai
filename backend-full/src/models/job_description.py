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
    description: str = ""

class JobDescription(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location_type: Optional[str] = "remote"
    location: Optional[str] = None
    experience_level: Optional[str] = None
    overview: Optional[str] = None
    responsibilities: List[Responsibility] = []
    qualifications: List[Qualification] = []
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    benefits: List[Benefit] = []
    company_description: Optional[str] = None
    culture_values: Optional[str] = None
    diversity_statement: Optional[str] = None
    status: str = "draft"  # draft, published, archived
    created_at: str
    updated_at: str

class JobDescriptionResponse(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location_type: Optional[str] = "remote"
    location: Optional[str] = None
    experience_level: Optional[str] = None
    overview: Optional[str] = None
    responsibilities: List[Responsibility] = []
    qualifications: List[Qualification] = []
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    benefits: List[Benefit] = []
    company_description: Optional[str] = None
    culture_values: Optional[str] = None
    diversity_statement: Optional[str] = None
    status: str
    created_at: str
    updated_at: str

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