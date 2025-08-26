from fastapi import APIRouter, Query
from typing import List, Optional
from src.services.vector_store.milvus_service import MilvusService
import json

router = APIRouter()
milvus_service = MilvusService()

@router.get("/api/candidates/search")
async def search_candidates(
    status: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    minExperience: Optional[int] = Query(0),
    page: Optional[int] = Query(1),
    limit: Optional[int] = Query(10)
):
    try:
        # Get all resumes from Milvus
        expr = None  # You can add filters based on status, skills, etc.
        results = milvus_service.collection.query(
            expr=expr,
            output_fields=["*"],
            limit=limit
        )
        
        # Format the response
        candidates = []
        for result in results:
            # Parse work experience if it's a string
            work_exp = result.get("work_experience", "")
            if isinstance(work_exp, str):
                try:
                    work_exp = json.loads(work_exp)
                except:
                    work_exp = []
            
            # Parse skills if it's a string
            skills = result.get("skills", "")
            if isinstance(skills, str):
                skills = [s.strip() for s in skills.split(",") if s.strip()]
            elif not isinstance(skills, list):
                skills = []

            candidates.append({
                "resume_id": str(result.get("resume_id", "")),
                "full_name": str(result.get("full_name", "")),
                "email": str(result.get("email", "")),
                "phone": str(result.get("phone", "")),
                "linkedin": str(result.get("linkedin", "")),
                "github": str(result.get("github", "")),
                "website": str(result.get("website", "")),
                "skills": skills,
                "education": str(result.get("education", "")),
                "work_experience": work_exp,
                "created_at": str(result.get("created_at", ""))
            })
        
        return {
            "candidates": candidates,
            "total": len(candidates),
            "page": page,
            "total_pages": 1  # For now, we'll implement pagination later
        }
    except Exception as e:
        print(f"Error in search_candidates: {str(e)}")
        return {
            "candidates": [],
            "total": 0,
            "page": page,
            "total_pages": 0
        }