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
                                     experience_level: Optional[str] = None, required_skills: Optional[List[str]] = None,
                                     company_info: Optional[Dict] = None) -> Dict:
        """Generate a job description using OpenAI"""
        try:
            # Create the prompt
            prompt = f"""Create a detailed job description for the following position:
            Title: {title}
            Department: {department if department else 'Not specified'}
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
                
            return JobDescriptionResponse(
                job_description=jd,
                message="Job description retrieved successfully"
            )
        except Exception as e:
            logger.error(f"Error getting job description: {e}")
            raise

    async def list_job_descriptions(self, status: Optional[str] = None) -> List[JobDescription]:
        """List all job descriptions, optionally filtered by status"""
        try:
            return await milvus_job_service.list_job_descriptions(status)
        except Exception as e:
            logger.error(f"Error listing job descriptions: {e}")
            raise

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