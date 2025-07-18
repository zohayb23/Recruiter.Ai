from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.external_job import JobSearchParams, JobSearchResponse, ExternalJob
from ..services.external_job_service import external_job_service

router = APIRouter(prefix="/api/external-jobs", tags=["external-jobs"])

@router.get("/search", response_model=JobSearchResponse)
async def search_jobs(
    query: Optional[str] = Query(None, description="Job search query"),
    location: Optional[str] = Query(None, description="Location to search in"),
    page: Optional[int] = Query(1, description="Page number"),
    full_time: Optional[bool] = Query(None, description="Filter for full-time jobs"),
    part_time: Optional[bool] = Query(None, description="Filter for part-time jobs"),
    contract: Optional[bool] = Query(None, description="Filter for contract jobs"),
    permanent: Optional[bool] = Query(None, description="Filter for permanent jobs"),
    results_per_page: Optional[int] = Query(10, description="Number of results per page")
):
    """
    Search for external jobs using various filters.
    """
    try:
        params = JobSearchParams(
            query=query,
            location=location,
            page=page,
            full_time=full_time,
            part_time=part_time,
            contract=contract,
            permanent=permanent,
            results_per_page=results_per_page
        )
        return await external_job_service.search_jobs(params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}", response_model=ExternalJob)
async def get_job_details(job_id: str):
    """
    Get details of a specific external job.
    """
    try:
        job = await external_job_service.get_job_details(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 