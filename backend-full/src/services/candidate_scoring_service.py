import logging
from typing import Dict, List, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
from datetime import datetime

from ..models.resume import ParsedResume
from ..models.job_description import JobDescription
from ..services.vector_store.milvus_service import MilvusService
from ..services.vector_store.milvus_job_service import MilvusJobService

logger = logging.getLogger(__name__)

class CandidateScoringService:
    def __init__(self):
        """Initialize the candidate scoring service"""
        self.milvus_service = MilvusService()
        self.milvus_job_service = MilvusJobService()
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Scoring weights
        self.weights = {
            'semantic_similarity': 0.40,  # 40% - Overall content similarity
            'skills_match': 0.30,         # 30% - Skills alignment
            'experience_level': 0.20,     # 20% - Experience level match
            'location_match': 0.10        # 10% - Location preferences
        }
    
    async def score_candidate_against_job(
        self, 
        resume_id: str, 
        job_id: str
    ) -> Dict[str, any]:
        """
        Score a candidate against a specific job description
        
        Args:
            resume_id: ID of the resume to score
            job_id: ID of the job description to score against
            
        Returns:
            Dictionary containing detailed scoring breakdown
        """
        try:
            # Get resume and job description data
            resume_data = await self.milvus_service.get_resume(resume_id)
            job_data = await self.milvus_job_service.get_job_description(job_id)
            
            if not resume_data or not job_data:
                raise ValueError("Resume or job description not found")
            
            # Calculate individual scores
            semantic_score = await self._calculate_semantic_similarity(resume_data, job_data)
            skills_score = await self._calculate_skills_match(resume_data, job_data)
            experience_score = await self._calculate_experience_match(resume_data, job_data)
            location_score = await self._calculate_location_match(resume_data, job_data)
            
            # Calculate weighted total score
            total_score = (
                semantic_score * self.weights['semantic_similarity'] +
                skills_score * self.weights['skills_match'] +
                experience_score * self.weights['experience_level'] +
                location_score * self.weights['location_match']
            )
            
            # Round to 2 decimal places
            total_score = round(total_score * 100, 2)
            
            return {
                'resume_id': resume_id,
                'job_id': job_id,
                'candidate_name': resume_data.get('full_name', 'Unknown'),
                'job_title': job_data.get('title', 'Unknown'),
                'total_score': total_score,
                'score_breakdown': {
                    'semantic_similarity': round(semantic_score * 100, 2),
                    'skills_match': round(skills_score * 100, 2),
                    'experience_level': round(experience_score * 100, 2),
                    'location_match': round(location_score * 100, 2)
                },
                'weights': self.weights,
                'scored_at': datetime.now().isoformat(),
                'recommendation': self._get_recommendation(total_score)
            }
            
        except Exception as e:
            logger.error(f"Error scoring candidate {resume_id} against job {job_id}: {e}")
            raise
    
    async def _calculate_semantic_similarity(
        self, 
        resume_data: Dict, 
        job_data: Dict
    ) -> float:
        """Calculate semantic similarity between resume and job description"""
        try:
            # Combine resume text
            resume_text = self._extract_resume_text(resume_data)
            
            # Combine job description text
            job_text = self._extract_job_text(job_data)
            
            # Generate embeddings
            resume_embedding = self.model.encode([resume_text])
            job_embedding = self.model.encode([job_text])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(resume_embedding, job_embedding)[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return 0.0
    
    async def _calculate_skills_match(
        self, 
        resume_data: Dict, 
        job_data: Dict
    ) -> float:
        """Calculate skills match between resume and job requirements"""
        try:
            # Extract skills from resume
            resume_skills = self._extract_resume_skills(resume_data)
            
            # Extract required and preferred skills from job
            required_skills = job_data.get('required_skills', [])
            preferred_skills = job_data.get('preferred_skills', [])
            
            if not required_skills and not preferred_skills:
                return 0.5  # Neutral score if no skills specified
            
            # Calculate matches
            required_matches = self._count_skill_matches(resume_skills, required_skills)
            preferred_matches = self._count_skill_matches(resume_skills, preferred_skills)
            
            # Weight required skills more heavily
            total_skills = len(required_skills) + len(preferred_skills)
            if total_skills == 0:
                return 0.5
            
            # Calculate weighted score
            required_score = (required_matches / len(required_skills)) if required_skills else 0
            preferred_score = (preferred_matches / len(preferred_skills)) if preferred_skills else 0
            
            # Weight required skills 70%, preferred skills 30%
            skills_score = (required_score * 0.7) + (preferred_score * 0.3)
            
            return min(skills_score, 1.0)  # Cap at 1.0
            
        except Exception as e:
            logger.error(f"Error calculating skills match: {e}")
            return 0.0
    
    async def _calculate_experience_match(
        self, 
        resume_data: Dict, 
        job_data: Dict
    ) -> float:
        """Calculate experience level match"""
        try:
            job_experience_level = job_data.get('experience_level', '').lower()
            if not job_experience_level:
                return 0.5  # Neutral if not specified
            
            # Calculate years of experience from resume
            years_experience = self._calculate_years_experience(resume_data)
            
            # Map experience levels to years
            experience_mapping = {
                'entry': (0, 2),
                'junior': (0, 3),
                'mid': (2, 6),
                'senior': (5, 10),
                'lead': (8, 15),
                'principal': (10, 20)
            }
            
            if job_experience_level not in experience_mapping:
                return 0.5
            
            min_years, max_years = experience_mapping[job_experience_level]
            
            # Calculate match score
            if min_years <= years_experience <= max_years:
                return 1.0  # Perfect match
            elif years_experience < min_years:
                # Underqualified - score based on how close they are
                return max(0.0, years_experience / min_years)
            else:
                # Overqualified - still good but not perfect
                return max(0.5, 1.0 - ((years_experience - max_years) / max_years))
                
        except Exception as e:
            logger.error(f"Error calculating experience match: {e}")
            return 0.0
    
    async def _calculate_location_match(
        self, 
        resume_data: Dict, 
        job_data: Dict
    ) -> float:
        """Calculate location match"""
        try:
            job_location_type = job_data.get('location_type', '').lower()
            job_location = job_data.get('location', '').lower()
            
            if not job_location_type:
                return 0.5  # Neutral if not specified
            
            # For now, we'll use a simple scoring based on location type
            # In a real implementation, you'd check actual candidate location preferences
            
            if job_location_type == 'remote':
                return 1.0  # Remote jobs are accessible to everyone
            elif job_location_type == 'hybrid':
                return 0.8  # Hybrid is flexible
            else:  # in-person
                return 0.6  # In-person requires relocation
            
        except Exception as e:
            logger.error(f"Error calculating location match: {e}")
            return 0.0
    
    def _extract_resume_text(self, resume_data: Dict) -> str:
        """Extract and combine all text from resume"""
        text_parts = []
        
        # Add name
        if resume_data.get('full_name'):
            text_parts.append(str(resume_data['full_name']))
        
        # Add work experience
        work_experience = resume_data.get('work_experience', [])
        for exp in work_experience:
            if isinstance(exp, dict):
                text_parts.append(str(exp.get('title', '')))
                text_parts.append(str(exp.get('company', '')))
                description = exp.get('description', '')
                if isinstance(description, list):
                    text_parts.extend([str(item) for item in description])
                else:
                    text_parts.append(str(description))
                if exp.get('technologies'):
                    technologies = exp['technologies']
                    if isinstance(technologies, list):
                        text_parts.extend([str(tech) for tech in technologies])
                    else:
                        text_parts.append(str(technologies))
        
        # Add skills
        skills = resume_data.get('skills', [])
        for skill in skills:
            if isinstance(skill, dict):
                text_parts.append(str(skill.get('name', '')))
            elif isinstance(skill, str):
                text_parts.append(skill)
        
        # Add education
        education = resume_data.get('education', [])
        for edu in education:
            if isinstance(edu, dict):
                text_parts.append(str(edu.get('degree', '')))
                text_parts.append(str(edu.get('institution', '')))
        
        return ' '.join(filter(None, text_parts))
    
    def _extract_job_text(self, job_data: Dict) -> str:
        """Extract and combine all text from job description"""
        text_parts = []
        
        # Add basic info
        text_parts.append(str(job_data.get('title', '')))
        text_parts.append(str(job_data.get('overview', '')))
        text_parts.append(str(job_data.get('company_description', '')))
        
        # Add responsibilities
        responsibilities = job_data.get('responsibilities', [])
        for resp in responsibilities:
            if isinstance(resp, dict):
                text_parts.append(str(resp.get('description', '')))
            else:
                text_parts.append(str(resp))
        
        # Add qualifications
        qualifications = job_data.get('qualifications', [])
        for qual in qualifications:
            if isinstance(qual, dict):
                text_parts.append(str(qual.get('description', '')))
            else:
                text_parts.append(str(qual))
        
        # Add skills
        required_skills = job_data.get('required_skills', [])
        preferred_skills = job_data.get('preferred_skills', [])
        text_parts.extend([str(skill) for skill in required_skills])
        text_parts.extend([str(skill) for skill in preferred_skills])
        
        return ' '.join(filter(None, text_parts))
    
    def _extract_resume_skills(self, resume_data: Dict) -> List[str]:
        """Extract skills from resume data"""
        skills = []
        
        # Extract from skills section
        skills_list = resume_data.get('skills', [])
        for skill in skills_list:
            if isinstance(skill, dict):
                skills.append(skill.get('name', '').lower())
        
        # Extract from work experience technologies
        work_experience = resume_data.get('work_experience', [])
        for exp in work_experience:
            if isinstance(exp, dict) and exp.get('technologies'):
                skills.extend([tech.lower() for tech in exp['technologies']])
        
        return [skill for skill in skills if skill]
    
    def _count_skill_matches(self, resume_skills: List[str], job_skills: List[str]) -> int:
        """Count how many job skills match resume skills"""
        matches = 0
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        
        for job_skill in job_skills:
            job_skill_lower = job_skill.lower()
            
            # Exact match
            if job_skill_lower in resume_skills_lower:
                matches += 1
                continue
            
            # Partial match (contains)
            for resume_skill in resume_skills_lower:
                if job_skill_lower in resume_skill or resume_skill in job_skill_lower:
                    matches += 1
                    break
        
        return matches
    
    def _calculate_years_experience(self, resume_data: Dict) -> float:
        """Calculate total years of work experience"""
        try:
            work_experience = resume_data.get('work_experience', [])
            total_years = 0
            
            for exp in work_experience:
                if isinstance(exp, dict):
                    start_date = exp.get('start_date', '')
                    end_date = exp.get('end_date', '')
                    
                    if start_date:
                        try:
                            # Parse dates (assuming format like "2020-01" or "Jan 2020")
                            start_year = self._extract_year(start_date)
                            end_year = self._extract_year(end_date) if end_date else 2024
                            
                            if start_year and end_year:
                                years = end_year - start_year
                                total_years += max(0, years)
                        except:
                            continue
            
            return total_years
            
        except Exception as e:
            logger.error(f"Error calculating years of experience: {e}")
            return 0.0
    
    def _extract_year(self, date_str: str) -> Optional[int]:
        """Extract year from date string"""
        try:
            # Try different date formats
            if '-' in date_str:
                return int(date_str.split('-')[0])
            elif '/' in date_str:
                return int(date_str.split('/')[-1])
            else:
                # Look for 4-digit year
                year_match = re.search(r'\b(19|20)\d{2}\b', date_str)
                if year_match:
                    return int(year_match.group())
        except:
            pass
        return None
    
    def _get_recommendation(self, score: float) -> str:
        """Get recommendation based on score"""
        if score >= 80:
            return "Highly Recommended"
        elif score >= 65:
            return "Recommended"
        elif score >= 50:
            return "Consider"
        elif score >= 35:
            return "Maybe"
        else:
            return "Not Recommended"
    
    async def score_multiple_candidates(
        self, 
        job_id: str, 
        resume_ids: List[str]
    ) -> List[Dict[str, any]]:
        """Score multiple candidates against a job"""
        results = []
        
        for resume_id in resume_ids:
            try:
                score_result = await self.score_candidate_against_job(resume_id, job_id)
                results.append(score_result)
            except Exception as e:
                logger.error(f"Error scoring candidate {resume_id}: {e}")
                # Add error result
                results.append({
                    'resume_id': resume_id,
                    'job_id': job_id,
                    'error': str(e),
                    'total_score': 0
                })
        
        # Sort by score (highest first)
        results.sort(key=lambda x: x.get('total_score', 0), reverse=True)
        
        return results
