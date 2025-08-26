from typing import Optional, List, Dict
from ..models.job_description import JobDescription, JobDescriptionResponse, JobDescriptionSuggestions, MarketAnalysis
from datetime import datetime
import uuid

class JobDescriptionService:
    def __init__(self):
        self.job_descriptions = {}  # In-memory storage for now

    async def create_job_description(self, data: dict) -> JobDescriptionResponse:
        """Create a new job description"""
        jd_id = str(uuid.uuid4())
        job_description = JobDescription(
            id=jd_id,
            title=data.get("title", ""),
            department=data.get("department", ""),
            location=data.get("location", ""),
            employment_type=data.get("employment_type", "Full-time"),
            experience_level=data.get("experience_level", ""),
            overview=data.get("overview", ""),
            responsibilities=data.get("responsibilities", []),
            qualifications=data.get("qualifications", []),
            required_skills=data.get("required_skills", []),
            preferred_skills=data.get("preferred_skills", []),
            benefits=data.get("benefits", []),
            company_description=data.get("company_description", ""),
            culture_values=data.get("culture_values", ""),
            diversity_statement=data.get("diversity_statement", ""),
            status="draft",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        self.job_descriptions[jd_id] = job_description
        return JobDescriptionResponse(
            job_description=job_description,
            message="Job description created successfully"
        )

    async def get_job_description(self, jd_id: str) -> Optional[JobDescriptionResponse]:
        """Get a job description by ID"""
        if jd_id not in self.job_descriptions:
            return None
        return JobDescriptionResponse(
            job_description=self.job_descriptions[jd_id],
            message="Job description retrieved successfully"
        )

    async def list_job_descriptions(self) -> List[JobDescription]:
        """List all job descriptions"""
        return list(self.job_descriptions.values())

    async def update_job_description(self, jd_id: str, data: dict) -> Optional[JobDescriptionResponse]:
        """Update a job description"""
        if jd_id not in self.job_descriptions:
            return None
        
        jd = self.job_descriptions[jd_id]
        updated_data = jd.dict()
        updated_data.update(data)
        updated_data["updated_at"] = datetime.now().isoformat()
        
        updated_jd = JobDescription(**updated_data)
        self.job_descriptions[jd_id] = updated_jd
        
        return JobDescriptionResponse(
            job_description=updated_jd,
            message="Job description updated successfully"
        )

    async def delete_job_description(self, jd_id: str) -> bool:
        """Delete a job description"""
        if jd_id not in self.job_descriptions:
            return False
        del self.job_descriptions[jd_id]
        return True

    async def publish_job_description(self, jd_id: str) -> Optional[JobDescriptionResponse]:
        """Publish a job description"""
        if jd_id not in self.job_descriptions:
            return None
        
        jd = self.job_descriptions[jd_id]
        updated_data = jd.dict()
        updated_data["status"] = "published"
        updated_data["updated_at"] = datetime.now().isoformat()
        
        updated_jd = JobDescription(**updated_data)
        self.job_descriptions[jd_id] = updated_jd
        
        return JobDescriptionResponse(
            job_description=updated_jd,
            message="Job description published successfully"
        )

    async def archive_job_description(self, jd_id: str) -> Optional[JobDescriptionResponse]:
        """Archive a job description"""
        if jd_id not in self.job_descriptions:
            return None
        
        jd = self.job_descriptions[jd_id]
        updated_data = jd.dict()
        updated_data["status"] = "archived"
        updated_data["updated_at"] = datetime.now().isoformat()
        
        updated_jd = JobDescription(**updated_data)
        self.job_descriptions[jd_id] = updated_jd
        
        return JobDescriptionResponse(
            job_description=updated_jd,
            message="Job description archived successfully"
        )

job_description_service = JobDescriptionService() 