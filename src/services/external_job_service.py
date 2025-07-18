import httpx
from typing import Optional
from ..models.external_job import JobSearchParams, JobSearchResponse, ExternalJob

class ExternalJobService:
    def __init__(self):
        self.base_url = 'https://api.adzuna.com/v1/api'
        self.app_id = '67a9f1c4'  # TODO: Move to environment variables
        self.app_key = '61f25f9cf41074f8262fe4483e7b4120'  # TODO: Move to environment variables
        self.country = 'us'

    async def search_jobs(self, params: JobSearchParams) -> JobSearchResponse:
        """Search for jobs using the Adzuna API."""
        try:
            # Build query parameters
            query_params = {
                'app_id': self.app_id,
                'app_key': self.app_key,
                'results_per_page': params.results_per_page,
                'what': params.query,
                'where': params.location,
                'full_time': '1' if params.full_time else None,
                'part_time': '1' if params.part_time else None,
                'contract': '1' if params.contract else None,
                'permanent': '1' if params.permanent else None,
                'sort_by': 'date'
            }

            # Remove None values
            query_params = {k: v for k, v in query_params.items() if v is not None}

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/jobs/{self.country}/search/{params.page}",
                    params=query_params,
                    headers={'Accept': 'application/json'}
                )
                response.raise_for_status()
                data = response.json()

                # Transform response to our model
                return JobSearchResponse(
                    count=data.get('count', 0),
                    mean=data.get('mean', None),
                    results=[
                        ExternalJob(
                            id=job['id'],
                            title=job['title'],
                            description=job['description'],
                            company=job['company'],
                            location=job['location'],
                            salary_min=job.get('salary_min'),
                            salary_max=job.get('salary_max'),
                            contract_type=job.get('contract_type'),
                            created=job['created'],
                            redirect_url=job['redirect_url']
                        )
                        for job in data.get('results', [])
                    ]
                )

        except httpx.HTTPError as e:
            raise Exception(f"Error fetching jobs from Adzuna: {str(e)}")

    async def get_job_details(self, job_id: str) -> Optional[ExternalJob]:
        """Get details of a specific job from Adzuna API."""
        try:
            query_params = {
                'app_id': self.app_id,
                'app_key': self.app_key
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/jobs/{self.country}/{job_id}",
                    params=query_params,
                    headers={'Accept': 'application/json'}
                )
                response.raise_for_status()
                job = response.json()

                return ExternalJob(
                    id=job['id'],
                    title=job['title'],
                    description=job['description'],
                    company=job['company'],
                    location=job['location'],
                    salary_min=job.get('salary_min'),
                    salary_max=job.get('salary_max'),
                    contract_type=job.get('contract_type'),
                    created=job['created'],
                    redirect_url=job['redirect_url']
                )

        except httpx.HTTPError as e:
            raise Exception(f"Error fetching job details from Adzuna: {str(e)}")

external_job_service = ExternalJobService() 