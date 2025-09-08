"""
Simple Duplicate Detection Router
Fast duplicate detection by name matching
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
import logging

from ..services.simple_duplicate_detection_service import SimpleDuplicateDetectionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simple-duplicate-detection", tags=["simple-duplicate-detection"])

# Initialize service
simple_duplicate_service = SimpleDuplicateDetectionService()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "simple-duplicate-detection",
        "message": "Simple duplicate detection by name matching is ready"
    }

@router.get("/stats")
async def get_duplicate_stats():
    """Get statistics about duplicates by name"""
    try:
        stats = await simple_duplicate_service.get_duplicate_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting duplicate stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/find")
async def find_duplicates():
    """Find all duplicates by name (without removing them)"""
    try:
        duplicates = await simple_duplicate_service.find_duplicates_by_name()
        return {
            "duplicates": duplicates,
            "total_duplicate_groups": len(duplicates),
            "message": "Duplicates found by name matching"
        }
    except Exception as e:
        logger.error(f"Error finding duplicates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/remove")
async def remove_duplicates():
    """Remove duplicate resumes, keeping the most recent one for each name"""
    try:
        result = await simple_duplicate_service.remove_duplicates_keep_latest()
        return result
    except Exception as e:
        logger.error(f"Error removing duplicates: {e}")
        raise HTTPException(status_code=500, detail=str(e))
