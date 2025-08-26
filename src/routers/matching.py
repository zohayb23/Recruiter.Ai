from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from ..services.matching_service import matching_service

router = APIRouter(prefix="/matching", tags=["matching"])

@router.get("/{job_id}/candidates")
async def get_matching_candidates(
    job_id: str,
    limit: Optional[int] = 10,
    min_score: Optional[float] = 0.6
) -> List[Dict]:
    """Get matching candidates for a specific job"""
    try:
        return await matching_service.get_matching_candidates(
            job_id=job_id,
            limit=limit,
            min_score=min_score
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
