from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from ..services.candidate_scoring_service import CandidateScoringService
from ..models.resume import ParsedResume
from ..models.job_description import JobDescription

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidate-scoring", tags=["candidate-scoring"])

# Initialize the scoring service
scoring_service = CandidateScoringService()

@router.post("/score")
async def score_candidate_against_job(
    request: dict
):
    """
    Score a single candidate against a specific job description
    
    Args:
        request: JSON body containing resume_id and job_id
        
    Returns:
        Detailed scoring breakdown with total score and recommendations
    """
    try:
        resume_id = request.get('resume_id')
        job_id = request.get('job_id')
        
        if not resume_id or not job_id:
            raise HTTPException(status_code=400, detail="resume_id and job_id are required")
        
        result = await scoring_service.score_candidate_against_job(resume_id, job_id)
        return result
    except Exception as e:
        logger.error(f"Error scoring candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score-batch")
async def score_multiple_candidates(
    job_id: str,
    resume_ids: List[str]
):
    """
    Score multiple candidates against a specific job description
    
    Args:
        job_id: ID of the job description to score against
        resume_ids: List of resume IDs to score
        
    Returns:
        List of scoring results sorted by score (highest first)
    """
    try:
        if not resume_ids:
            raise HTTPException(status_code=400, detail="No resume IDs provided")
        
        if len(resume_ids) > 100:  # Limit batch size
            raise HTTPException(status_code=400, detail="Too many candidates. Maximum 100 per batch.")
        
        results = await scoring_service.score_multiple_candidates(job_id, resume_ids)
        return {
            'job_id': job_id,
            'total_candidates': len(resume_ids),
            'results': results
        }
    except Exception as e:
        logger.error(f"Error scoring multiple candidates for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}/candidates")
async def get_scored_candidates_for_job(
    job_id: str,
    limit: int = Query(50, ge=1, le=100),
    min_score: Optional[float] = Query(None, ge=0, le=100)
):
    """
    Get all candidates scored against a specific job
    
    Args:
        job_id: ID of the job description
        limit: Maximum number of results to return
        min_score: Minimum score threshold (0-100)
        
    Returns:
        List of scored candidates for the job
    """
    try:
        # For now, we'll get all resumes and score them
        # In a real implementation, you'd have a more efficient way to get candidates
        from ..services.vector_store.milvus_service import MilvusService
        milvus_service = MilvusService()
        
        # Get all resumes (this is a simplified approach)
        # In production, you'd want to implement pagination and filtering
        all_resumes = await milvus_service.get_all_resumes()
        
        if not all_resumes:
            return {
                'job_id': job_id,
                'total_candidates': 0,
                'results': []
            }
        
        # Extract resume IDs
        resume_ids = [resume.get('resume_id') for resume in all_resumes if resume.get('resume_id')]
        
        # Score all candidates
        results = await scoring_service.score_multiple_candidates(job_id, resume_ids)
        
        # Apply minimum score filter if specified
        if min_score is not None:
            results = [r for r in results if r.get('total_score', 0) >= min_score]
        
        # Apply limit
        results = results[:limit]
        
        return {
            'job_id': job_id,
            'total_candidates': len(results),
            'min_score': min_score,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error getting scored candidates for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/candidate/{resume_id}/jobs")
async def get_scored_jobs_for_candidate(
    resume_id: str,
    limit: int = Query(20, ge=1, le=50),
    min_score: Optional[float] = Query(None, ge=0, le=100)
):
    """
    Get all jobs scored for a specific candidate
    
    Args:
        resume_id: ID of the candidate's resume
        limit: Maximum number of results to return
        min_score: Minimum score threshold (0-100)
        
    Returns:
        List of scored jobs for the candidate
    """
    try:
        # Get all job descriptions
        from ..services.vector_store.milvus_job_service import MilvusJobService
        milvus_job_service = MilvusJobService()
        
        all_jobs = await milvus_job_service.get_job_descriptions()
        
        if not all_jobs:
            return {
                'resume_id': resume_id,
                'total_jobs': 0,
                'results': []
            }
        
        # Extract job IDs
        job_ids = [job.get('id') for job in all_jobs if job.get('id')]
        
        # Score candidate against all jobs
        results = []
        for job_id in job_ids:
            try:
                score_result = await scoring_service.score_candidate_against_job(resume_id, job_id)
                results.append(score_result)
            except Exception as e:
                logger.error(f"Error scoring candidate {resume_id} against job {job_id}: {e}")
                continue
        
        # Apply minimum score filter if specified
        if min_score is not None:
            results = [r for r in results if r.get('total_score', 0) >= min_score]
        
        # Sort by score (highest first)
        results.sort(key=lambda x: x.get('total_score', 0), reverse=True)
        
        # Apply limit
        results = results[:limit]
        
        return {
            'resume_id': resume_id,
            'total_jobs': len(results),
            'min_score': min_score,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error getting scored jobs for candidate {resume_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check for the candidate scoring service"""
    return {
        "status": "healthy",
        "service": "candidate-scoring",
        "weights": scoring_service.weights
    }
