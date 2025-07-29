from typing import Optional
import httpx
from ..models.external_job import JobSearchParams, JobSearchResponse, ExternalJob

class ExternalJobService:
    def __init__(self):
        self.base_url = "https://api.adzuna.com/v1/api"
        # In a real application, these would be loaded from environment variables
        self.app_id = "your_app_id"
        self.app_key = "your_app_key"

    async def search_jobs(self, params: JobSearchParams) -> JobSearchResponse:
        """
        Search for jobs using the Adzuna API
        """
        # For now, return mock data that matches the search query
        mock_jobs = [
            ExternalJob(
                id="1",
                title=f"Senior {params.query} Engineer",
                company="Tech Corp",
                location="San Francisco, CA",
                description=f"We are looking for an experienced {params.query} engineer to join our team.",
                salary_min=120000,
                salary_max=180000,
                url="https://example.com/job/1",
                created="2024-01-29",
                contract_type="Full Time"
            ),
            ExternalJob(
                id="2",
                title=f"{params.query} Developer",
                company="Startup Inc",
                location="New York, NY",
                description=f"Join our fast-growing team as a {params.query} Developer.",
                salary_min=100000,
                salary_max=150000,
                url="https://example.com/job/2",
                created="2024-01-28",
                contract_type="Contract"
            ),
            ExternalJob(
                id="3",
                title=f"Lead {params.query} Architect",
                company="Enterprise Solutions",
                location="Remote",
                description=f"Looking for a Lead {params.query} Architect to drive our technical vision.",
                salary_min=150000,
                salary_max=200000,
                url="https://example.com/job/3",
                created="2024-01-27",
                contract_type="Full Time"
            )
        ]

        return JobSearchResponse(
            total_results=len(mock_jobs),
            page=params.page,
            results_per_page=params.results_per_page,
            jobs=mock_jobs
        )

    async def get_job_details(self, job_id: str) -> Optional[ExternalJob]:
        """
        Get details of a specific job
        """
        # Mock job details
        mock_jobs = {
            "1": ExternalJob(
                id="1",
                title="Senior AWS Engineer",
                company="Tech Corp",
                location="San Francisco, CA",
                description="We are looking for an experienced AWS engineer to join our team.",
                salary_min=120000,
                salary_max=180000,
                url="https://example.com/job/1",
                created="2024-01-29",
                contract_type="Full Time"
            )
        }
        return mock_jobs.get(job_id)

external_job_service = ExternalJobService() 