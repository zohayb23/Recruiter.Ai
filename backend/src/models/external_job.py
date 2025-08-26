from typing import List, Optional
from pydantic import BaseModel

class JobSearchParams(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    page: int = 1
    full_time: Optional[bool] = None
    part_time: Optional[bool] = None
    contract: Optional[bool] = None
    permanent: Optional[bool] = None
    results_per_page: int = 10

class ExternalJob(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    url: Optional[str] = None
    created: Optional[str] = None
    contract_type: Optional[str] = None

class JobSearchResponse(BaseModel):
    total_results: int
    page: int
    results_per_page: int
    jobs: List[ExternalJob] 