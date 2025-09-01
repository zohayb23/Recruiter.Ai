from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import re

router = APIRouter(prefix="/search-utils", tags=["search-utils"])

class KeywordRequest(BaseModel):
    job_title: str
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    experience_level: Optional[str] = "mid-level"
    industry: Optional[str] = "technology"

class KeywordResponse(BaseModel):
    boolean_query: str
    keywords: List[str]
    search_suggestions: List[str]

class CategorizationRequest(BaseModel):
    search_query: str
    filters: Optional[Dict[str, Any]] = {}

class CategorizationResponse(BaseModel):
    skill_categories: List[Dict[str, Any]]
    location_categories: List[Dict[str, Any]]
    experience_categories: List[Dict[str, Any]]

@router.post("/generate-keywords", response_model=KeywordResponse)
async def generate_search_keywords(request: KeywordRequest):
    """Generate boolean search query and keywords for job search"""
    try:
        # Build boolean search query
        required_terms = [f'"{skill}"' for skill in request.required_skills]
        preferred_terms = [f'"{skill}"' for skill in request.preferred_skills]
        
        # Create boolean query
        boolean_query = " AND ".join(required_terms)
        if preferred_terms:
            boolean_query += f" AND ({' OR '.join(preferred_terms)})"
        
        # Add experience level keywords
        experience_keywords = {
            "entry": ["entry-level", "junior", "0-2 years", "recent graduate"],
            "mid-level": ["mid-level", "intermediate", "2-5 years", "experienced"],
            "senior": ["senior", "lead", "5+ years", "expert"],
            "executive": ["executive", "director", "VP", "C-level", "10+ years"]
        }
        
        if request.experience_level in experience_keywords:
            exp_terms = experience_keywords[request.experience_level]
            boolean_query += f" AND ({' OR '.join(exp_terms)})"
        
        # Add industry-specific keywords
        industry_keywords = {
            "technology": ["software", "tech", "IT", "digital", "web", "mobile"],
            "healthcare": ["medical", "healthcare", "clinical", "patient", "hospital"],
            "finance": ["financial", "banking", "investment", "accounting", "risk"],
            "marketing": ["marketing", "advertising", "brand", "digital marketing", "SEO"]
        }
        
        if request.industry in industry_keywords:
            ind_terms = industry_keywords[request.industry]
            boolean_query += f" AND ({' OR '.join(ind_terms)})"
        
        # Generate search suggestions
        search_suggestions = [
            f"{request.job_title} {skill}" for skill in request.required_skills
        ]
        search_suggestions.extend([
            f"{request.job_title} {request.experience_level}",
            f"{request.job_title} {request.industry}",
            f"{request.job_title} remote",
            f"{request.job_title} hybrid"
        ])
        
        return KeywordResponse(
            boolean_query=boolean_query,
            keywords=request.required_skills + request.preferred_skills,
            search_suggestions=search_suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating keywords: {str(e)}")

@router.post("/categorize-results", response_model=CategorizationResponse)
async def categorize_search_results(request: CategorizationRequest):
    """Categorize search results by skill, location, and experience"""
    try:
        # Mock categorization logic - in real implementation, this would analyze actual data
        # from your Milvus database or external job sources
        
        # Skill categorization
        skill_categories = [
            {"category": "Programming Languages", "skills": ["Python", "JavaScript", "Java", "C++"], "count": 45},
            {"category": "Frameworks", "skills": ["React", "Django", "Spring", "Angular"], "count": 32},
            {"category": "Databases", "skills": ["PostgreSQL", "MongoDB", "MySQL", "Redis"], "count": 28},
            {"category": "Cloud & DevOps", "skills": ["AWS", "Docker", "Kubernetes", "CI/CD"], "count": 23}
        ]
        
        # Location categorization
        location_categories = [
            {"category": "Remote", "locations": ["Remote", "Work from Home"], "count": 67},
            {"category": "Major Cities", "locations": ["New York", "San Francisco", "London", "Toronto"], "count": 89},
            {"category": "Tech Hubs", "locations": ["Austin", "Seattle", "Boston", "Denver"], "count": 56},
            {"category": "International", "locations": ["Europe", "Asia", "Canada", "Australia"], "count": 34}
        ]
        
        # Experience categorization
        experience_categories = [
            {"category": "Entry Level", "levels": ["0-2 years", "Junior", "Graduate"], "count": 23},
            {"category": "Mid Level", "levels": ["2-5 years", "Intermediate", "Mid-level"], "count": 67},
            {"category": "Senior Level", "levels": ["5-8 years", "Senior", "Lead"], "count": 45},
            {"category": "Executive", "levels": ["8+ years", "Director", "VP", "C-level"], "count": 12}
        ]
        
        return CategorizationResponse(
            skill_categories=skill_categories,
            location_categories=location_categories,
            experience_categories=experience_categories
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error categorizing results: {str(e)}")

@router.get("/search-suggestions")
async def get_search_suggestions(query: str = Query(..., min_length=2)):
    """Get search suggestions based on partial query"""
    try:
        # Mock suggestions - in real implementation, this would query your database
        suggestions = [
            f"{query} developer",
            f"{query} engineer",
            f"{query} manager",
            f"{query} specialist",
            f"{query} analyst",
            f"{query} consultant"
        ]
        
        return {"suggestions": suggestions[:5]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting suggestions: {str(e)}")
