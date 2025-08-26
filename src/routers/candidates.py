from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from ..services.vector_store.milvus_service import milvus_service

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

class CandidateResponse(BaseModel):
    resume_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    skills: List[str]
    education: List[dict]
    work_experience: List[dict]
    created_at: Optional[str] = None

@router.get("/search")
async def search_candidates(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search_term: Optional[str] = None,
    skills: Optional[str] = None,
    min_experience: Optional[int] = None
):
    """
    Search for candidates with pagination and filters
    """
    try:
        # Calculate offset
        offset = (page - 1) * limit

        # Get candidates from Milvus
        candidates = milvus_service.list_all_resumes()
        
        # Apply filters if provided
        if search_term:
            candidates = [c for c in candidates if search_term.lower() in c.get('full_name', '').lower() 
                        or search_term.lower() in c.get('email', '').lower()]
        
        if skills:
            skill_list = [s.strip().lower() for s in skills.split(',')]
            candidates = [c for c in candidates if any(skill.lower() in [s.lower() for s in c.get('skills', [])] 
                                                     for skill in skill_list)]
        
        if min_experience:
            candidates = [c for c in candidates if len(c.get('work_experience', [])) >= min_experience]

        # Get total count before pagination
        total_count = len(candidates)

        # Apply pagination
        candidates = candidates[offset:offset + limit]

        return {
            "candidates": candidates,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{resume_id}")
async def get_candidate(resume_id: str):
    """
    Get a specific candidate by resume_id
    """
    try:
        candidate = milvus_service.get_resume_by_id(resume_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return candidate
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
