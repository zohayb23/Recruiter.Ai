import json
from datetime import datetime
import uuid
from typing import Optional, List, Dict
import logging
from .openai_service import openai_service
from .vector_store.milvus_job_service import milvus_job_service

logger = logging.getLogger(__name__)

class JobDescriptionService:
    async def generate_job_description(self,
        title: str,
        department: Optional[str] = None,
        experience_level: Optional[str] = None,
        required_skills: Optional[List[str]] = None,
        company_info: Optional[Dict] = None
    ) -> Dict:
        """Generate a job description using AI"""
        try:
            # Call OpenAI service to generate the job description
            response = await openai_service.generate_job_description(
                title=title,
                department=department,
                experience_level=experience_level,
                required_skills=required_skills,
                company_info=company_info
            )
            
            # Ensure response is a dictionary
            if isinstance(response, str):
                try:
                    response = json.loads(response)
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing response as JSON: {str(e)}")
                    raise ValueError("Invalid JSON response from OpenAI")
            
            # Ensure required fields exist with default values
            default_response = {
                "overview": "",
                "responsibilities": [],
                "qualifications": [],
                "required_skills": required_skills or [],
                "preferred_skills": [],
                "benefits": [],
                "company_description": "",
                "culture_values": "",
                "diversity_statement": ""
            }
            
            # Update default values with parsed response
            default_response.update(response)
            
            # Convert responsibilities to objects if they're strings
            if isinstance(default_response["responsibilities"], list):
                default_response["responsibilities"] = [
                    {"description": r, "is_required": True} if isinstance(r, str) else r
                    for r in default_response["responsibilities"]
                ]
            
            # Convert qualifications to objects if they're strings
            if isinstance(default_response["qualifications"], list):
                default_response["qualifications"] = [
                    {"description": q, "is_required": True} if isinstance(q, str) else q
                    for q in default_response["qualifications"]
                ]
            
            # Convert benefits to objects if they're strings
            if isinstance(default_response["benefits"], list):
                default_response["benefits"] = [
                    {"title": b.split(":")[0], "description": b.split(":")[1].strip()} if isinstance(b, str) and ":" in b
                    else {"title": b, "description": ""} if isinstance(b, str)
                    else b
                    for b in default_response["benefits"]
                ]
            
            # Return the dictionary directly
            return default_response
            
        except Exception as e:
            logger.error(f"Error generating job description: {str(e)}")
            raise ValueError(f"Error generating job description: {str(e)}")

    async def save_job_description(self, data: Dict) -> Dict:
        """Save a job description"""
        try:
            # Generate a unique ID and timestamps
            job_data = {
                **data,
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "status": data.get("status", "draft")
            }

            # Save to Milvus
            return await milvus_job_service.save_job_description(job_data)

        except Exception as e:
            logger.error(f"Error saving job description: {str(e)}")
            raise ValueError(f"Error saving job description: {str(e)}")

    async def get_job_descriptions(self, status: Optional[str] = None) -> List[Dict]:
        """Get all job descriptions, optionally filtered by status"""
        try:
            return await milvus_job_service.get_job_descriptions(status)
        except Exception as e:
            logger.error(f"Error getting job descriptions: {str(e)}")
            raise ValueError(f"Error getting job descriptions: {str(e)}")

    async def get_job_description(self, job_id: str) -> Optional[Dict]:
        """Get a specific job description by ID"""
        try:
            return await milvus_job_service.get_job_description(job_id)
        except Exception as e:
            logger.error(f"Error getting job description: {str(e)}")
            raise ValueError(f"Error getting job description: {str(e)}")

    async def search_similar_jobs(self, query_text: str, limit: int = 5) -> List[Dict]:
        """Search for similar job descriptions"""
        try:
            return await milvus_job_service.search_similar_jobs(query_text, limit)
        except Exception as e:
            logger.error(f"Error searching similar jobs: {str(e)}")
            raise ValueError(f"Error searching similar jobs: {str(e)}")

job_description_service = JobDescriptionService() 