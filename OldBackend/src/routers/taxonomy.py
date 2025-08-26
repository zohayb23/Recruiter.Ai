from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, List

from ..database.database import get_db
from ..services.taxonomy_service import TaxonomyService
from ..models.taxonomy import (
    TaxonomyRequest,
    TaxonomyResponse,
    SkillDetails,
    SkillPath
)

router = APIRouter(prefix="/api/taxonomy", tags=["taxonomy"])
taxonomy_service = TaxonomyService()

@router.post("", response_model=Dict)
async def build_taxonomy(
    request: TaxonomyRequest,
    db: Session = Depends(get_db)
):
    """Build or update the skills taxonomy"""
    try:
        return taxonomy_service.build_taxonomy(db, request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build taxonomy: {str(e)}"
        )

@router.get("/skills/{skill_name}", response_model=Dict)
async def get_skill_details(
    skill_name: str,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific skill"""
    try:
        return taxonomy_service.get_skill_details(db, skill_name)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get skill details: {str(e)}"
        )

@router.get("/skills/{from_skill}/to/{to_skill}", response_model=List[Dict])
async def get_skill_path(
    from_skill: str,
    to_skill: str,
    db: Session = Depends(get_db)
):
    """Find the learning path between two skills"""
    try:
        return taxonomy_service.get_skill_path(db, from_skill, to_skill)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find skill path: {str(e)}"
        ) 