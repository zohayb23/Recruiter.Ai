from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from ..services.job_description_service import job_description_service

class GenerateJobDescriptionRequest(BaseModel):
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location_type: Optional[str] = "remote"
    location: Optional[str] = None
    experience_level: Optional[str] = None
    required_skills: Optional[List[str]] = None
    company_info: Optional[Dict] = None

class ResponsibilityModel(BaseModel):
    description: str
    is_required: bool = True

    @validator('description')
    def description_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Description cannot be empty')
        return v.strip()

class QualificationModel(BaseModel):
    description: str
    is_required: bool = True

    @validator('description')
    def description_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Description cannot be empty')
        return v.strip()

class BenefitModel(BaseModel):
    title: str
    description: str = ""

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class SaveJobDescriptionRequest(BaseModel):
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location_type: Optional[str] = "remote"
    location: Optional[str] = None
    experience_level: Optional[str] = None
    overview: Optional[str] = None
    responsibilities: Optional[List[ResponsibilityModel]] = []
    qualifications: Optional[List[QualificationModel]] = []
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    benefits: Optional[List[BenefitModel]] = []
    company_description: Optional[str] = None
    culture_values: Optional[str] = None
    diversity_statement: Optional[str] = None
    status: Optional[str] = "draft"

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('responsibilities', 'qualifications', 'required_skills', 'preferred_skills', 'benefits', pre=True)
    def ensure_list(cls, v):
        if v is None:
            return []
        return v

    class Config:
        extra = 'allow'  # Allow extra fields

class JobDescriptionResponse(BaseModel):
    id: str
    created_at: str
    updated_at: str
    status: str
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    location_type: Optional[str] = "remote"
    location: Optional[str] = None
    experience_level: Optional[str] = None
    overview: Optional[str] = None
    responsibilities: Optional[List[ResponsibilityModel]] = []
    qualifications: Optional[List[QualificationModel]] = []
    required_skills: Optional[List[str]] = []
    preferred_skills: Optional[List[str]] = []
    benefits: Optional[List[BenefitModel]] = []
    company_description: Optional[str] = None
    culture_values: Optional[str] = None
    diversity_statement: Optional[str] = None

    class Config:
        extra = 'allow'  # Allow extra fields

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
        
        # Add default values for required fields if not present
        if 'responsibilities' not in job_data:
            job_data['responsibilities'] = []
        if 'qualifications' not in job_data:
            job_data['qualifications'] = []
        if 'required_skills' not in job_data:
            job_data['required_skills'] = []
        if 'preferred_skills' not in job_data:
            job_data['preferred_skills'] = []
        if 'benefits' not in job_data:
            job_data['benefits'] = []
        if 'status' not in job_data:
            job_data['status'] = 'draft'

        result = await job_description_service.save_job_description(job_data)
        return result
    except Exception as e:
        if isinstance(e, ValueError):
            raise HTTPException(status_code=422, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drafts", response_model=List[JobDescriptionResponse])
async def get_draft_job_descriptions():
    """Get all draft job descriptions"""
    try:
        return await job_description_service.list_job_descriptions()
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