import openai
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..models.job import (
    JobDescription, JobGenerationRequest, JobGenerationResponse,
    JobSearchRequest, JobSearchResult, JobMatchRequest, JobMatchResult
)
from ..config.settings import settings

class JobDescriptionService:
    """Service for AI job description generation and management"""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_job_description(self, request: JobGenerationRequest) -> JobGenerationResponse:
        """Generate AI-powered job description"""
        try:
            skills_text = ", ".join(request.key_skills) if request.key_skills else "relevant technical skills"
            
            prompt = f"""
            Generate a comprehensive job description for a {request.title} position in the {request.department} department.
            
            Details:
            - Company: {request.company} (use this as the company name)
            - Department: {request.department}
            - Location: {request.location} ({request.location_type})
            - Experience Level: {request.experience_level}
            - Key Skills: {skills_text}
            {f"- Additional Requirements: {request.additional_requirements}" if request.additional_requirements else ""}
            
            Please generate a complete job description including:
            1. Job Title
            2. Company Name ({request.company})
            3. Overview/Summary
            4. Key Responsibilities (5-7 bullet points)
            5. Required Qualifications (5-7 bullet points)
            6. Required Skills (list of technical skills)
            7. Preferred Skills (list of nice-to-have skills)
            8. Benefits (5-7 bullet points)
            9. Company Description (brief description of {request.company})
            
            Format the response as a JSON object with these exact keys:
            {{
                "title": "Job Title",
                "company": "{request.company}",
                "department": "Department Name",
                "location_type": "remote/onsite/hybrid",
                "location": "Location",
                "experience_level": "Experience Level",
                "overview": "Job overview paragraph",
                "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
                "qualifications": ["Qualification 1", "Qualification 2", ...],
                "required_skills": ["Skill 1", "Skill 2", ...],
                "preferred_skills": ["Skill 1", "Skill 2", ...],
                "benefits": ["Benefit 1", "Benefit 2", ...],
                "company_description": "Company description"
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert HR professional and job description writer. Generate professional, detailed job descriptions. Always use the exact company name provided by the user."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE
            )
            
            generated_text = response.choices[0].message.content.strip()
            
            # Clean up the response to extract JSON
            if generated_text.startswith("```json"):
                generated_text = generated_text[7:]
            if generated_text.endswith("```"):
                generated_text = generated_text[:-3]
            
            job_data = json.loads(generated_text)
            
            # Create JobDescription object
            job_id = str(uuid.uuid4())
            job_description = JobDescription(
                id=job_id,
                title=job_data["title"],
                company=job_data["company"],
                department=job_data["department"],
                location_type=job_data["location_type"],
                location=job_data["location"],
                experience_level=job_data["experience_level"],
                overview=job_data["overview"],
                responsibilities=job_data["responsibilities"],
                qualifications=job_data["qualifications"],
                required_skills=job_data["required_skills"],
                preferred_skills=job_data.get("preferred_skills", []),
                benefits=job_data["benefits"],
                company_description=job_data["company_description"],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return JobGenerationResponse(
                success=True,
                message="Job description generated successfully",
                job_description=job_description
            )
            
        except json.JSONDecodeError as e:
            return JobGenerationResponse(
                success=False,
                message="Failed to parse AI response",
                error=str(e)
            )
        except Exception as e:
            return JobGenerationResponse(
                success=False,
                message="Failed to generate job description",
                error=str(e)
            )
    
    async def create_job_description(self, job_data: Dict[str, Any]) -> JobDescription:
        """Create a new job description"""
        job_id = str(uuid.uuid4())
        
        job_description = JobDescription(
            id=job_id,
            title=job_data.get("title", ""),
            company=job_data.get("company", ""),
            department=job_data.get("department", ""),
            location_type=job_data.get("location_type", "remote"),
            location=job_data.get("location", "Anywhere"),
            experience_level=job_data.get("experience_level", "Mid-Level"),
            overview=job_data.get("overview", ""),
            responsibilities=job_data.get("responsibilities", []),
            qualifications=job_data.get("qualifications", []),
            required_skills=job_data.get("required_skills", []),
            preferred_skills=job_data.get("preferred_skills", []),
            benefits=job_data.get("benefits", []),
            company_description=job_data.get("company_description", ""),
            status=job_data.get("status", "draft"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # TODO: Store in Milvus database
        # await self.store_in_milvus(job_description)
        
        return job_description
    
    async def update_job_description(self, job_id: str, job_data: Dict[str, Any]) -> Optional[JobDescription]:
        """Update an existing job description"""
        # TODO: Implement database update
        return None
    
    async def delete_job_description(self, job_id: str) -> bool:
        """Delete a job description"""
        # TODO: Implement database deletion
        return True
    
    async def get_job_description(self, job_id: str) -> Optional[JobDescription]:
        """Get job description by ID"""
        # TODO: Implement database retrieval
        return None
    
    async def get_all_job_descriptions(self, limit: int = 50, offset: int = 0) -> List[JobDescription]:
        """Get all job descriptions with pagination"""
        # TODO: Implement database retrieval
        return []
    
    async def search_jobs(self, request: JobSearchRequest) -> List[JobSearchResult]:
        """Search jobs using semantic search"""
        # TODO: Implement Milvus semantic search
        return []
    
    async def match_jobs_with_resume(self, request: JobMatchRequest) -> List[JobMatchResult]:
        """Match jobs with a resume"""
        # TODO: Implement job-resume matching algorithm
        return []

# Global service instance
job_service = JobDescriptionService()
