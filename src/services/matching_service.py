import logging
from typing import List, Dict, Optional
from .vector_store.milvus_service import milvus_service
from .vector_store.milvus_job_service import milvus_job_service
import json

logger = logging.getLogger(__name__)

class MatchingService:
    def __init__(self):
        self.resume_service = milvus_service
        self.job_service = milvus_job_service

    async def get_matching_candidates(self, job_id: str, limit: int = 10, min_score: float = 0.6) -> List[Dict]:
        """
        Find matching candidates for a specific job using vector similarity search.
        Returns candidates sorted by match score.
        """
        try:
            # Get the job description
            job = await self.job_service.get_job_description(job_id)
            if not job:
                raise ValueError(f"Job with ID {job_id} not found")

            # Create a search text combining important job aspects
            search_text = f"{job['title']} {job.get('overview', '')} "
            
            # Add required skills
            if job.get('required_skills'):
                if isinstance(job['required_skills'], str):
                    required_skills = json.loads(job['required_skills'])
                else:
                    required_skills = job['required_skills']
                search_text += ' '.join(required_skills)

            # Add preferred skills
            if job.get('preferred_skills'):
                if isinstance(job['preferred_skills'], str):
                    preferred_skills = json.loads(job['preferred_skills'])
                else:
                    preferred_skills = job['preferred_skills']
                search_text += ' '.join(preferred_skills)

            # Get all resumes
            resumes = self.resume_service.list_all_resumes()
            
            # Calculate match scores for each resume
            matches = []
            for resume in resumes:
                match_score = self._calculate_match_score(job, resume)
                if match_score >= min_score:
                    matches.append({
                        "candidate": resume,
                        "match_score": match_score,
                        "matching_skills": self._get_matching_skills(job, resume),
                        "experience_match": self._check_experience_match(job, resume),
                        "education_match": self._check_education_match(job, resume)
                    })

            # Sort matches by score (highest first) and limit results
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            return matches[:limit]

        except Exception as e:
            logger.error(f"Error finding matching candidates: {str(e)}")
            raise

    def _calculate_match_score(self, job: Dict, resume: Dict) -> float:
        """Calculate a match score between 0 and 1 based on various factors"""
        try:
            score = 0.0
            weights = {
                "skills": 0.5,      # 50% weight for skills match
                "experience": 0.3,   # 30% weight for experience match
                "education": 0.2     # 20% weight for education match
            }

            # Calculate skills match
            matching_skills = self._get_matching_skills(job, resume)
            required_skills = json.loads(job['required_skills']) if isinstance(job['required_skills'], str) else job['required_skills']
            skills_score = len(matching_skills) / len(required_skills) if required_skills else 0

            # Calculate experience match
            experience_score = 1.0 if self._check_experience_match(job, resume) else 0.0

            # Calculate education match
            education_score = 1.0 if self._check_education_match(job, resume) else 0.0

            # Calculate weighted score
            score = (
                skills_score * weights["skills"] +
                experience_score * weights["experience"] +
                education_score * weights["education"]
            )

            return min(max(score, 0.0), 1.0)  # Ensure score is between 0 and 1

        except Exception as e:
            logger.error(f"Error calculating match score: {str(e)}")
            return 0.0

    def _get_matching_skills(self, job: Dict, resume: Dict) -> List[str]:
        """Get list of matching skills between job and resume"""
        try:
            # Get job skills
            required_skills = json.loads(job['required_skills']) if isinstance(job['required_skills'], str) else job['required_skills']
            preferred_skills = json.loads(job['preferred_skills']) if isinstance(job['preferred_skills'], str) else job['preferred_skills']
            job_skills = set([skill.lower() for skill in (required_skills + preferred_skills)])

            # Get resume skills
            resume_skills_raw = json.loads(resume['skills']) if isinstance(resume['skills'], str) else resume['skills']
            resume_skills = set()
            for skill in resume_skills_raw:
                if isinstance(skill, dict):
                    resume_skills.add(skill['name'].lower())
                else:
                    resume_skills.add(skill.lower())

            # Return matching skills
            return list(job_skills.intersection(resume_skills))

        except Exception as e:
            logger.error(f"Error getting matching skills: {str(e)}")
            return []

    def _check_experience_match(self, job: Dict, resume: Dict) -> bool:
        """Check if candidate's experience matches job requirements"""
        try:
            # Get job experience requirement (you might want to add this field to your job schema)
            required_years = 0  # Default to 0 if not specified
            if job.get('experience_level'):
                level_mapping = {
                    'Entry': 0,
                    'Mid': 3,
                    'Senior': 5,
                    'Lead': 8,
                    'Executive': 10
                }
                required_years = level_mapping.get(job['experience_level'], 0)

            # Calculate total years of experience from resume
            work_experience = json.loads(resume['work_experience']) if isinstance(resume['work_experience'], str) else resume['work_experience']
            total_years = 0
            for exp in work_experience:
                if isinstance(exp, dict):
                    # You might want to implement actual date calculation here
                    # For now, assuming each experience entry counts as 1 year
                    total_years += 1

            return total_years >= required_years

        except Exception as e:
            logger.error(f"Error checking experience match: {str(e)}")
            return False

    def _check_education_match(self, job: Dict, resume: Dict) -> bool:
        """Check if candidate's education matches job requirements"""
        try:
            # Get education from resume
            education = json.loads(resume['education']) if isinstance(resume['education'], str) else resume['education']
            
            # For now, simply check if they have any education listed
            # You might want to add more sophisticated matching based on degree level and field
            return len(education) > 0

        except Exception as e:
            logger.error(f"Error checking education match: {str(e)}")
            return False

matching_service = MatchingService()
