from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from ..services.job_description_service import job_description_service

class GenerateJobDescriptionRequest(BaseModel):
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None
    required_skills: Optional[List[str]] = None
    company_info: Optional[Dict] = None

class ResponsibilityModel(BaseModel):
    description: str = Field(..., description="The description of the responsibility")
    is_required: bool = Field(True, description="Whether this responsibility is required")

class QualificationModel(BaseModel):
    description: str = Field(..., description="The description of the qualification")
    is_required: bool = Field(True, description="Whether this qualification is required")

class BenefitModel(BaseModel):
    title: str = Field(..., description="The title of the benefit")
    description: str = Field("", description="Additional details about the benefit")

class SaveJobDescriptionRequest(BaseModel):
    title: str = Field(..., description="The job title")
    company: Optional[str] = Field(None, description="The company name")
    department: Optional[str] = Field(None, description="The department name")
    experience_level: Optional[str] = Field(None, description="The required experience level")
    overview: Optional[str] = Field(None, description="Overview of the job")
    responsibilities: Optional[List[ResponsibilityModel]] = Field(default_factory=list, description="List of job responsibilities")
    qualifications: Optional[List[QualificationModel]] = Field(default_factory=list, description="List of required qualifications")
    required_skills: Optional[List[str]] = Field(default_factory=list, description="List of required skills")
    preferred_skills: Optional[List[str]] = Field(default_factory=list, description="List of preferred skills")
    benefits: Optional[List[BenefitModel]] = Field(default_factory=list, description="List of job benefits")
    company_description: Optional[str] = Field(None, description="Description of the company")
    culture_values: Optional[str] = Field(None, description="Company culture and values")
    diversity_statement: Optional[str] = Field(None, description="Diversity and inclusion statement")
    status: Optional[str] = Field("draft", description="Status of the job description")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Senior Software Engineer",
                "company": "TechCorp",
                "department": "Engineering",
                "experience_level": "Senior",
                "overview": "We are seeking a talented Senior Software Engineer...",
                "responsibilities": [
                    {"description": "Design and implement scalable solutions", "is_required": True}
                ],
                "qualifications": [
                    {"description": "5+ years of software development experience", "is_required": True}
                ],
                "required_skills": ["Python", "JavaScript"],
                "preferred_skills": ["React", "AWS"],
                "benefits": [
                    {"title": "Health Insurance", "description": "Full medical, dental, and vision coverage"}
                ],
                "company_description": "TechCorp is a leading software company...",
                "culture_values": "We value innovation and collaboration...",
                "diversity_statement": "We are committed to building a diverse team...",
                "status": "draft"
            }
        }

class JobDescriptionResponse(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    status: str
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None
    overview: Optional[str] = None
    responsibilities: Optional[List[ResponsibilityModel]] = None
    qualifications: Optional[List[QualificationModel]] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    benefits: Optional[List[BenefitModel]] = None
    company_description: Optional[str] = None
    culture_values: Optional[str] = None
    diversity_statement: Optional[str] = None

router = APIRouter(prefix="/job-descriptions", tags=["job-descriptions"])

@router.post("/generate", response_model=Dict)
async def generate_job_description(data: GenerateJobDescriptionRequest):
    """Generate a job description using OpenAI"""
    try:
        return await job_description_service.generate_job_description(
            title=data.title,
            department=data.department,
            experience_level=data.experience_level,
            required_skills=data.required_skills,
            company_info={"company": data.company} if data.company else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save", response_model=JobDescriptionResponse)
async def save_job_description(data: SaveJobDescriptionRequest):
    """Save a job description as draft or publish it"""
    try:
        # Convert Pydantic model to dict
        job_data = data.dict(exclude_unset=True)
        return await job_description_service.save_job_description(job_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[JobDescriptionResponse])
async def get_all_job_descriptions():
    """Get all job descriptions"""
    try:
        return await job_description_service.get_job_descriptions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drafts", response_model=List[JobDescriptionResponse])
async def get_draft_job_descriptions():
    """Get all draft job descriptions"""
    try:
        return await job_description_service.get_job_descriptions(status="draft")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=JobDescriptionResponse)
async def get_job_description(job_id: str):
    """Get a specific job description by ID"""
    try:
        jd = await job_description_service.get_job_description(job_id)
        if not jd:
            raise HTTPException(status_code=404, detail="Job description not found")
        return jd
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 