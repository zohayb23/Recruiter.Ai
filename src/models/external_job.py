from pydantic import BaseModel
from typing import Optional, List

class JobSearchParams(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    page: Optional[int] = 1
    full_time: Optional[bool] = None
    part_time: Optional[bool] = None
    contract: Optional[bool] = None
    permanent: Optional[bool] = None
    results_per_page: Optional[int] = 10

class Company(BaseModel):
    display_name: str

class Location(BaseModel):
    display_name: str
    area: List[str]

class ExternalJob(BaseModel):
    id: str
    title: str
    description: str
    company: Company
    location: Location
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    contract_type: Optional[str] = None
    created: str
    redirect_url: str

class JobSearchResponse(BaseModel):
    count: int
    mean: Optional[float] = None
    results: List[ExternalJob] 