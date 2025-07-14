from typing import Dict, List, Optional
from sqlalchemy.orm import Session
import openai
from datetime import datetime
import json
import os

from ..database.models import Job, JobDescription
from ..models.job_description import JobDescriptionCreate, JobRequirements

class JobDescriptionService:
    def __init__(self):
        """Initialize the job description service with OpenAI client"""
        self.openai_client = openai.OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Load job description templates
        self.templates = {
            "default": """
                {company_name} is seeking a {job_title}

                About the Role:
                {job_summary}

                Key Responsibilities:
                {responsibilities}

                Required Qualifications:
                {required_qualifications}

                Preferred Qualifications:
                {preferred_qualifications}

                Benefits & Perks:
                {benefits}

                About {company_name}:
                {company_description}

                {equal_opportunity_statement}
            """.strip()
        }

    def generate_description(
        self,
        db: Session,
        requirements: JobRequirements
    ) -> Dict:
        """Generate a job description using AI"""
        
        # Prepare the prompt for the AI
        prompt = f"""
        Create a professional job description for a {requirements.job_title} position.
        
        Use these details:
        - Company: {requirements.company_name}
        - Industry: {requirements.industry}
        - Experience Level: {requirements.experience_level}
        - Required Skills: {', '.join(requirements.required_skills)}
        - Location: {requirements.location}
        - Employment Type: {requirements.employment_type}
        
        Additional Context:
        {requirements.additional_context}
        
        Generate these sections:
        1. Job Summary
        2. Key Responsibilities
        3. Required Qualifications
        4. Preferred Qualifications
        5. Benefits & Perks
        
        Format as JSON with these keys:
        job_summary, responsibilities, required_qualifications, preferred_qualifications, benefits
        """

        # Generate content using OpenAI
        response = self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert technical recruiter and professional writer."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        # Parse the AI response
        content = json.loads(response.choices[0].message.content)
        
        # Apply the template
        description = self.templates["default"].format(
            company_name=requirements.company_name,
            job_title=requirements.job_title,
            job_summary=content["job_summary"],
            responsibilities=content["responsibilities"],
            required_qualifications=content["required_qualifications"],
            preferred_qualifications=content["preferred_qualifications"],
            benefits=content["benefits"],
            company_description=requirements.company_description,
            equal_opportunity_statement=requirements.equal_opportunity_statement
        )

        # Create a new job description record
        db_description = JobDescription(
            job_title=requirements.job_title,
            company_name=requirements.company_name,
            content=description,
            raw_requirements=requirements.dict(),
            generated_content=content,
            created_at=datetime.utcnow()
        )
        
        db.add(db_description)
        db.commit()
        db.refresh(db_description)
        
        return {
            "id": db_description.id,
            "content": description,
            "sections": content
        }

    def refine_description(
        self,
        db: Session,
        description_id: str,
        feedback: str
    ) -> Dict:
        """Refine an existing job description based on feedback"""
        
        # Get the original description
        db_description = (
            db.query(JobDescription)
            .filter(JobDescription.id == description_id)
            .first()
        )
        
        if not db_description:
            raise ValueError("Job description not found")
        
        # Prepare the refinement prompt
        prompt = f"""
        Refine this job description based on the feedback:

        Original Description:
        {db_description.content}

        Feedback:
        {feedback}

        Return the refined description in the same JSON format as before.
        """

        # Generate refined content
        response = self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert technical recruiter and professional writer."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        # Parse and format the refined content
        content = json.loads(response.choices[0].message.content)
        
        # Apply the template
        description = self.templates["default"].format(
            company_name=db_description.company_name,
            job_title=db_description.job_title,
            job_summary=content["job_summary"],
            responsibilities=content["responsibilities"],
            required_qualifications=content["required_qualifications"],
            preferred_qualifications=content["preferred_qualifications"],
            benefits=content["benefits"],
            company_description=db_description.raw_requirements["company_description"],
            equal_opportunity_statement=db_description.raw_requirements["equal_opportunity_statement"]
        )

        # Update the description
        db_description.content = description
        db_description.generated_content = content
        db_description.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_description)
        
        return {
            "id": db_description.id,
            "content": description,
            "sections": content
        } 