"""
Candidate Service - Business logic for candidate operations
"""
import json
import re
from typing import Dict, Any, Optional
from pymilvus import connections, Collection, utility

from ..services.milvus_service import (
    MILVUS_HOST, MILVUS_PORT, milvus_connected,
    get_resumes_from_milvus, get_jobs_from_milvus
)
from ..storage import stored_resumes

async def get_candidate_by_id(candidate_id: str) -> Optional[Dict[str, Any]]:
    """Get candidate data by ID from Milvus"""
    try:
        if not milvus_connected:
            return None
        
        collection = Collection("resumes")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{candidate_id}"',
            output_fields=["*"],
            limit=1
        )
        
        if results:
            result = results[0]
            return {
                "id": result.get("id", ""),
                "full_name": result.get("full_name", ""),
                "email": result.get("email", ""),
                "phone": result.get("phone", ""),
                "summary": result.get("summary", ""),
                "skills": json.loads(result.get("skills", "[]")) if isinstance(result.get("skills"), str) else result.get("skills", []),
                "education": json.loads(result.get("education", "[]")) if isinstance(result.get("education"), str) else result.get("education", []),
                "work_experience": json.loads(result.get("work_experience", "[]")) if isinstance(result.get("work_experience"), str) else result.get("work_experience", [])
            }
        return None
    except Exception as e:
        print(f"Error getting candidate: {e}")
        return None

def get_new_candidate_pool() -> Dict[str, Any]:
    """Get all candidates from the new candidate pool (1000 candidates)"""
    try:
        if not milvus_connected:
            return {
                "success": False,
                "candidates": [],
                "total": 0,
                "message": "Milvus not connected",
                "milvus_connected": milvus_connected
            }
        
        # Connect to Milvus
        if not utility.has_collection("new_candidate_pool"):
            return {
                "success": False,
                "candidates": [],
                "total": 0,
                "message": "New candidate pool collection not found",
                "milvus_connected": milvus_connected
            }
        
        collection = Collection("new_candidate_pool")
        collection.load()
        
        # Query all candidates
        results = collection.query(
            expr="",
            limit=1000,  # Get all 1000
            output_fields=["*"]
        )
        
        # Transform to frontend format
        candidates = []
        for r in results:
            skills = r.get("skills_extracted", [])
            if isinstance(skills, str) and skills:
                try:
                    # Try JSON parsing first
                    if skills.startswith('['):
                        # Handle format like: "['CI/CD', 'Python', 'GraphQL']"
                        cleaned = skills.strip('[]')
                        skills = re.findall(r"'([^']+)'", cleaned)
                    else:
                        skills = json.loads(skills) if skills else []
                except:
                    # Fallback to comma-separated
                    skills = [s.strip().strip("'\"") for s in skills.split(",") if s.strip()]
            elif not skills:
                skills = []
            
            # Parse position/titles field
            position_field = r.get("top_titles_mentioned", "")
            position_list = []
            
            if isinstance(position_field, str) and position_field:
                # Handle format like: "['Full-Stack Developer', 'Backend Engineer']"
                if position_field.startswith('['):
                    cleaned = position_field.strip('[]')
                    position_list = re.findall(r"'([^']+)'", cleaned)
                elif ',' in position_field:
                    position_list = [p.strip().strip("'\"") for p in position_field.split(",")]
                else:
                    position_list = [position_field.strip().strip("'\"")]
            
            if not position_list:
                position_list = ["Software Developer"]
            
            candidate = {
                "id": r.get("candidate_id", ""),
                "resume_id": r.get("candidate_id", ""),
                "name": r.get("name", "Unknown"),
                "full_name": r.get("name", "Unknown"),
                "email": r.get("email", ""),
                "phone": r.get("phone", ""),
                "location": f"{r.get('location_city', '')}, {r.get('location_state', '')}".strip(", "),
                "position": position_list if position_list else ["Software Developer"],
                "title": r.get("role_family", "backend"),
                "experienceYears": float(r.get("total_experience_years", 0)),
                "summary": r.get("semantic_summary", "") or r.get("summary", ""),
                "skills": skills,
                "experience_years": float(r.get("total_experience_years", 0)),
                "skills_text": ", ".join(skills) if isinstance(skills, list) else str(skills),
                "jobMatchScore": 0,
                "status": "active"
            }
            candidates.append(candidate)
        
        print(f"📊 Retrieved {len(candidates)} candidates from new pool")
        return {
            "success": True,
            "candidates": candidates,
            "total": len(candidates),
            "message": f"Successfully found {len(candidates)} candidates from new pool",
            "milvus_connected": milvus_connected
        }
    except Exception as e:
        print(f"❌ Error getting new candidate pool: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "candidates": [],
            "total": 0,
            "message": f"Error fetching candidates: {str(e)}",
            "error": str(e),
            "milvus_connected": milvus_connected
        }

async def find_matching_job_for_candidate(candidate_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Find a matching job description for the candidate based on skills and experience"""
    from pymilvus import Collection
    
    try:
        if not milvus_connected:
            return None
        
        # Get all job descriptions from Milvus
        collection = Collection("job_descriptions")
        collection.load()
        
        # Query all job descriptions
        results = collection.query(
            expr="id != ''",
            output_fields=["*"],
            limit=50
        )
        
        if not results:
            return None
        
        # Get candidate skills
        candidate_skills = candidate_data.get('skills', [])
        if isinstance(candidate_skills, str):
            try:
                candidate_skills = json.loads(candidate_skills)
            except:
                candidate_skills = []
        
        # Enhanced matching logic
        best_match = None
        best_score = 0
        
        candidate_experience = candidate_data.get('experience_years', 0)
        
        # Extract candidate title from work experience
        candidate_title = ""
        work_experience = candidate_data.get('work_experience', [])
        if isinstance(work_experience, list) and work_experience:
            latest_job = work_experience[0] if work_experience else {}
            candidate_title = latest_job.get('title', '').lower()
        
        candidate_summary = candidate_data.get('summary', '').lower()
        
        for job in results:
            score = 0
            match_reasons = []
            
            # 1. Match experience level (40% weight)
            job_experience_level = job.get('experience_level', '').lower()
            if 'entry' in job_experience_level and candidate_experience <= 2:
                score += 0.4
            elif 'mid' in job_experience_level and 2 < candidate_experience <= 5:
                score += 0.4
            elif 'senior' in job_experience_level and candidate_experience > 5:
                score += 0.4
            elif 'lead' in job_experience_level and candidate_experience > 8:
                score += 0.4
            
            # 2. Skill matching (30% weight)
            job_required_skills = job.get('required_skills', [])
            if isinstance(job_required_skills, str):
                try:
                    job_required_skills = json.loads(job_required_skills)
                except:
                    job_required_skills = []
            
            candidate_skills_lower = [s.lower() for s in candidate_skills] if candidate_skills else []
            job_required_lower = [s.lower() for s in job_required_skills] if job_required_skills else []
            
            if candidate_skills_lower and job_required_lower:
                required_overlap = len(set(candidate_skills_lower) & set(job_required_lower))
                if required_overlap > 0:
                    score += min(0.3, required_overlap * 0.05)
            
            # 3. Title matching (20% weight)
            job_title = job.get('title', '').lower()
            if candidate_title == job_title:
                score += 0.2
            elif any(word in candidate_title for word in job_title.split()):
                score += 0.1
            
            if score > best_score:
                best_score = score
                best_match = job
        
        if best_match:
            best_match = dict(best_match)
            
            # Parse JSON strings
            responsibilities = best_match.get('responsibilities', [])
            if isinstance(responsibilities, str):
                try:
                    responsibilities = json.loads(responsibilities)
                except:
                    responsibilities = []
            
            qualifications = best_match.get('qualifications', [])
            if isinstance(qualifications, str):
                try:
                    qualifications = json.loads(qualifications)
                except:
                    qualifications = []
            
            benefits = best_match.get('benefits', [])
            if isinstance(benefits, str):
                try:
                    benefits = json.loads(benefits)
                except:
                    benefits = []
            
            best_match['responsibilities'] = responsibilities
            best_match['qualifications'] = qualifications
            best_match['benefits'] = benefits
            
            if not best_match.get('description'):
                best_match['description'] = best_match.get('overview', '')
        
        return best_match
        
    except Exception as e:
        print(f"Error finding matching job: {e}")
        return None
