from typing import Optional, List, Dict
from ..models.job_description import JobDescription, JobDescriptionResponse, JobDescriptionSuggestions, MarketAnalysis
from datetime import datetime
import uuid
import json
import logging
from openai import AsyncOpenAI
import os
from ..services.vector_store.milvus_job_service import milvus_job_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobDescriptionService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4"  # Using GPT-4 for better quality

    async def generate_job_description(self, title: str, department: Optional[str] = None, 
                                     location_type: Optional[str] = "remote", location: Optional[str] = None,
                                     experience_level: Optional[str] = None, required_skills: Optional[List[str]] = None,
                                     company_info: Optional[Dict] = None) -> Dict:
        """Generate a job description using OpenAI"""
        try:
            # Create the prompt
            prompt = f"""Create a detailed job description for the following position:
            Title: {title}
            Department: {department if department else 'Not specified'}
            Location Type: {location_type}
            Location: {location if location else 'Not specified'}
            Experience Level: {experience_level if experience_level else 'Not specified'}
            Required Skills: {', '.join(required_skills) if required_skills else 'Not specified'}
            Company: {company_info.get('company', 'Not specified') if company_info else 'Not specified'}

            Please provide a JSON response with the following structure:
            {{
                "overview": "detailed job overview",
                "responsibilities": [
                    {{"description": "responsibility 1", "is_required": true}},
                    {{"description": "responsibility 2", "is_required": true}}
                ],
                "qualifications": [
                    {{"description": "qualification 1", "is_required": true}},
                    {{"description": "qualification 2", "is_required": false}}
                ],
                "required_skills": ["skill1", "skill2"],
                "preferred_skills": ["skill1", "skill2"],
                "benefits": [
                    {{"title": "benefit 1", "description": "description 1"}},
                    {{"title": "benefit 2", "description": "description 2"}}
                ],
                "company_description": "company description",
                "culture_values": "company culture and values statement",
                "diversity_statement": "diversity and inclusion statement"
            }}
            """

            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert HR professional who creates compelling job descriptions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            # Parse the response
            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing OpenAI response: {e}")
                logger.error(f"Raw response: {content}")
                raise ValueError("Invalid response format from OpenAI")

        except Exception as e:
            logger.error(f"Error generating job description: {e}")
            raise

    async def save_job_description(self, data: Dict) -> JobDescriptionResponse:
        """Save a job description"""
        try:
            # Add metadata
            jd_id = data.get('id', str(uuid.uuid4()))
            now = datetime.now().isoformat()
            
            job_description = JobDescription(
                id=jd_id,
                title=data.get("title", ""),
                department=data.get("department", ""),
                location_type=data.get("location_type", "remote"),
                location=data.get("location", ""),
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
                status=data.get("status", "draft"),
                created_at=data.get("created_at", now),
                updated_at=now
            )

            # Store in Milvus
            await milvus_job_service.save_job_description(job_description.dict())
            
            return JobDescriptionResponse(
                job_description=job_description,
                message="Job description saved successfully"
            )

        except Exception as e:
            logger.error(f"Error saving job description: {e}")
            raise

    async def get_job_description(self, jd_id: str) -> Optional[JobDescriptionResponse]:
        """Get a job description by ID"""
        try:
            jd = await milvus_job_service.get_job_description(jd_id)
            if not jd:
                return None
            return jd  # Return the job description data directly
        except Exception as e:
            logger.error(f"Error getting job description: {e}")
            raise

    async def list_job_descriptions(self, status: Optional[str] = None) -> List[JobDescription]:
        """List all job descriptions, optionally filtered by status"""
        try:
            jobs_data = await milvus_job_service.get_job_descriptions(status)
            # Convert the data to proper format
            converted_jobs = []
            for job_data in jobs_data:
                converted_job = self._convert_job_data(job_data)
                converted_jobs.append(JobDescription(**converted_job))
            return converted_jobs
        except Exception as e:
            logger.error(f"Error listing job descriptions: {e}")
            raise

    def _convert_job_data(self, job_data: Dict) -> Dict:
        """Convert job data from Milvus format to proper format"""
        try:
            # Handle responsibilities
            responsibilities = job_data.get('responsibilities', [])
            if isinstance(responsibilities, str):
                # Convert string to list of Responsibility objects
                responsibilities = [{"description": resp.strip(), "is_required": True} 
                                 for resp in responsibilities.split(',') if resp.strip()]
            elif isinstance(responsibilities, list) and responsibilities and isinstance(responsibilities[0], dict):
                # Already in correct format
                pass
            else:
                responsibilities = []

            # Handle qualifications
            qualifications = job_data.get('qualifications', [])
            if isinstance(qualifications, str):
                qualifications = [{"description": qual.strip(), "is_required": True} 
                                for qual in qualifications.split(',') if qual.strip()]
            elif isinstance(qualifications, list) and qualifications and isinstance(qualifications[0], dict):
                pass
            else:
                qualifications = []

            # Handle required_skills
            required_skills = job_data.get('required_skills', [])
            if isinstance(required_skills, str):
                required_skills = [skill.strip() for skill in required_skills.split(',') if skill.strip()]
            elif not isinstance(required_skills, list):
                required_skills = []

            # Handle preferred_skills
            preferred_skills = job_data.get('preferred_skills', [])
            if isinstance(preferred_skills, str):
                preferred_skills = [skill.strip() for skill in preferred_skills.split(',') if skill.strip()]
            elif not isinstance(preferred_skills, list):
                preferred_skills = []

            # Handle benefits
            benefits = job_data.get('benefits', [])
            if isinstance(benefits, str):
                benefits = [{"title": benefit.strip(), "description": ""} 
                          for benefit in benefits.split(',') if benefit.strip()]
            elif isinstance(benefits, list) and benefits and isinstance(benefits[0], dict):
                pass
            else:
                benefits = []

            return {
                'id': job_data.get('id', ''),
                'title': job_data.get('title', ''),
                'company': job_data.get('company', ''),
                'department': job_data.get('department', ''),
                'location_type': job_data.get('location_type', 'remote'),
                'location': job_data.get('location', ''),
                'experience_level': job_data.get('experience_level', ''),
                'overview': job_data.get('overview', ''),
                'responsibilities': responsibilities,
                'qualifications': qualifications,
                'required_skills': required_skills,
                'preferred_skills': preferred_skills,
                'benefits': benefits,
                'company_description': job_data.get('company_description', ''),
                'culture_values': job_data.get('culture_values', ''),
                'diversity_statement': job_data.get('diversity_statement', ''),
                'status': job_data.get('status', 'draft'),
                'created_at': job_data.get('created_at', ''),
                'updated_at': job_data.get('updated_at', '')
            }
        except Exception as e:
            logger.error(f"Error converting job data: {e}")
            return job_data

    async def update_job_description(self, jd_id: str, data: Dict) -> Optional[JobDescriptionResponse]:
        """Update a job description"""
        try:
            # Get existing job description
            existing_jd = await milvus_job_service.get_job_description(jd_id)
            if not existing_jd:
                return None

            # Update fields
            updated_data = existing_jd.dict()
            updated_data.update(data)
            updated_data["updated_at"] = datetime.now().isoformat()

            # Create updated job description
            updated_jd = JobDescription(**updated_data)

            # Save to Milvus
            await milvus_job_service.save_job_description(updated_jd.dict())

            return JobDescriptionResponse(
                job_description=updated_jd,
                message="Job description updated successfully"
            )
        except Exception as e:
            logger.error(f"Error updating job description: {e}")
            raise

    async def delete_job_description(self, jd_id: str) -> bool:
        """Delete a job description"""
        try:
            return await milvus_job_service.delete_job_description(jd_id)
        except Exception as e:
            logger.error(f"Error deleting job description: {e}")
            raise

job_description_service = JobDescriptionService()