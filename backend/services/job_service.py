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
        self._openai_client = None
    
    @property
    def openai_client(self):
        """Lazy initialization of OpenAI client"""
        if self._openai_client is None:
            import os
            api_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
            if api_key:
                self._openai_client = openai.OpenAI(api_key=api_key)
        return self._openai_client
    
    def _normalize_location_type(self, location_type: str) -> str:
        """Normalize location_type to match enum values"""
        location_type_lower = location_type.lower()
        if "remote" in location_type_lower:
            return "remote"
        elif "hybrid" in location_type_lower:
            return "hybrid"
        elif "onsite" in location_type_lower or "on-site" in location_type_lower:
            return "onsite"
        return "remote"  # default
    
    def _normalize_experience_level(self, experience_level: str) -> str:
        """Normalize experience_level to match enum values"""
        experience_lower = experience_level.lower()
        if "entry" in experience_lower or "junior" in experience_lower or "0-2" in experience_level:
            return "Entry-Level"
        elif "senior" in experience_lower or "5+" in experience_level or "6-10" in experience_level:
            return "Senior Level"
        elif "executive" in experience_lower or "c-level" in experience_lower or "director" in experience_lower:
            return "Executive"
        else:
            return "Mid-Level"  # default for mid, intermediate, 3-5 years, etc.
    
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
            
            if not self.openai_client:
                return JobGenerationResponse(
                    success=False,
                    message="OpenAI API key not configured",
                    error="OpenAI client not initialized"
                )
            
            model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')
            max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 3000)
            temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.7)
            
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert HR professional and job description writer. Generate professional, detailed job descriptions. Always use the exact company name provided by the user."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
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
            
            # Store in Milvus
            try:
                from ..services.milvus_service import milvus_service
                job_dict = {
                    "id": job_id,
                    "title": job_description.title,
                    "company": job_description.company,
                    "department": job_description.department,
                    "location_type": job_description.location_type.value if hasattr(job_description.location_type, 'value') else str(job_description.location_type),
                    "location": job_description.location,
                    "experience_level": job_description.experience_level.value if hasattr(job_description.experience_level, 'value') else str(job_description.experience_level),
                    "overview": job_description.overview,
                    "responsibilities": job_description.responsibilities,
                    "qualifications": job_description.qualifications,
                    "required_skills": job_description.required_skills,
                    "preferred_skills": job_description.preferred_skills,
                    "benefits": job_description.benefits,
                    "company_description": job_description.company_description,
                    "status": job_description.status.value if hasattr(job_description.status, 'value') else str(job_description.status)
                }
                milvus_service.store_job_in_milvus(job_dict, job_id)
            except Exception as e:
                print(f"⚠️ Failed to store job in Milvus: {e}")
            
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
        
        # Store in Milvus database
        try:
            from ..services.milvus_service import milvus_service
            job_dict = {
                "id": job_id,
                "title": job_description.title,
                "company": job_description.company,
                "department": job_description.department,
                "location_type": job_description.location_type.value if hasattr(job_description.location_type, 'value') else str(job_description.location_type),
                "location": job_description.location,
                "experience_level": job_description.experience_level.value if hasattr(job_description.experience_level, 'value') else str(job_description.experience_level),
                "overview": job_description.overview,
                "responsibilities": job_description.responsibilities,
                "qualifications": job_description.qualifications,
                "required_skills": job_description.required_skills,
                "preferred_skills": job_description.preferred_skills,
                "benefits": job_description.benefits,
                "company_description": job_description.company_description,
                "status": job_description.status.value if hasattr(job_description.status, 'value') else str(job_description.status)
            }
            milvus_service.store_job_in_milvus(job_dict, job_id)
        except Exception as e:
            print(f"⚠️ Failed to store job in Milvus: {e}")
        
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
        from ..services.milvus_service import get_jobs_from_milvus
        try:
            jobs = get_jobs_from_milvus()
            for job_data in jobs:
                if job_data.get("id") == job_id or job_data.get("job_id") == job_id:
                    # Convert to JobDescription
                    return JobDescription(
                        id=job_data.get("id") or job_data.get("job_id", ""),
                        title=job_data.get("title", ""),
                        company=job_data.get("company", ""),
                        department=job_data.get("department", ""),
                        location_type=job_data.get("location_type", "remote"),
                        location=job_data.get("location", ""),
                        experience_level=job_data.get("experience_level", "Mid-Level"),
                        overview=job_data.get("overview", ""),
                        responsibilities=job_data.get("responsibilities", []),
                        qualifications=job_data.get("qualifications", []),
                        required_skills=job_data.get("required_skills", []),
                        preferred_skills=job_data.get("preferred_skills", []),
                        benefits=job_data.get("benefits", []),
                        company_description=job_data.get("company_description", ""),
                        status=job_data.get("status", "draft"),
                        created_at=datetime.fromisoformat(job_data.get("created_at", datetime.now().isoformat())),
                        updated_at=datetime.fromisoformat(job_data.get("updated_at", datetime.now().isoformat()))
                    )
            return None
        except Exception as e:
            print(f"Error getting job: {e}")
            return None
    
    async def get_all_job_descriptions(self, limit: int = 50, offset: int = 0) -> List[JobDescription]:
        """Get all job descriptions with pagination"""
        from ..services.milvus_service import get_jobs_from_milvus
        try:
            jobs_data = get_jobs_from_milvus()
            job_descriptions = []
            for job_data in jobs_data[offset:offset+limit]:
                try:
                    # Normalize enum values
                    location_type = self._normalize_location_type(job_data.get("location_type", "remote"))
                    experience_level = self._normalize_experience_level(job_data.get("experience_level", "Mid-Level"))
                    
                    job_desc = JobDescription(
                        id=job_data.get("id") or job_data.get("job_id", ""),
                        title=job_data.get("title", ""),
                        company=job_data.get("company", ""),
                        department=job_data.get("department", ""),
                        location_type=location_type,
                        location=job_data.get("location", ""),
                        experience_level=experience_level,
                        overview=job_data.get("overview", ""),
                        responsibilities=job_data.get("responsibilities", []),
                        qualifications=job_data.get("qualifications", []),
                        required_skills=job_data.get("required_skills", []),
                        preferred_skills=job_data.get("preferred_skills", []),
                        benefits=job_data.get("benefits", []),
                        company_description=job_data.get("company_description", ""),
                        status=job_data.get("status", "draft"),
                        created_at=datetime.fromisoformat(job_data.get("created_at", datetime.now().isoformat())),
                        updated_at=datetime.fromisoformat(job_data.get("updated_at", datetime.now().isoformat()))
                    )
                    job_descriptions.append(job_desc)
                except Exception as e:
                    print(f"Error converting job data: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            return job_descriptions
        except Exception as e:
            print(f"Error getting jobs: {e}")
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
