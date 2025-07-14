from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class JobRequirements(BaseModel):
    job_title: str = Field(..., min_length=2, max_length=100)
    company_name: str = Field(..., min_length=2, max_length=100)
    industry: str
    experience_level: str  # e.g., "Entry Level", "Mid-Senior", "Senior"
    required_skills: List[str]
    location: str
    employment_type: str  # e.g., "Full-time", "Part-time", "Contract"
    company_description: str
    equal_opportunity_statement: str = Field(
        default="We are an equal opportunity employer and value diversity at our company."
    )
    additional_context: Optional[str] = None

class JobDescriptionCreate(BaseModel):
    requirements: JobRequirements

class JobDescriptionRefine(BaseModel):
    feedback: str = Field(..., min_length=10)

class JobDescription(BaseModel):
    id: str
    job_title: str
    company_name: str
    content: str
    raw_requirements: dict
    generated_content: dict
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 