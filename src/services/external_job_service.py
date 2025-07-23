import httpx
import logging
from typing import Optional
from ..models.external_job import JobSearchParams, JobSearchResponse, ExternalJob

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

            logger.info(f"Searching jobs with params: {query_params}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/jobs/{self.country}/search/{params.page}",
                    params=query_params,
                    headers={'Accept': 'application/json'}
                )
                
                if response.status_code != 200:
                    logger.error(f"Adzuna API error: {response.status_code} - {response.text}")
                    raise httpx.HTTPError(f"API request failed with status code: {response.status_code}")
                
                try:
                    data = response.json()
                except Exception as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    logger.error(f"Response text: {response.text}")
                    raise Exception("Failed to parse API response")

                logger.info(f"Found {data.get('count', 0)} jobs")

                # Transform response to our model
                return JobSearchResponse(
                    count=data.get('count', 0),
                    mean=data.get('mean', None),
                    results=[
                        ExternalJob(
                            id=str(job.get('id', '')),
                            title=job.get('title', ''),
                            description=job.get('description', ''),
                            company={"display_name": job.get('company', {}).get('display_name', 'Unknown Company')},
                            location={
                                "display_name": job.get('location', {}).get('display_name', 'Unknown Location'),
                                "area": job.get('location', {}).get('area', [])
                            },
                            salary_min=job.get('salary_min'),
                            salary_max=job.get('salary_max'),
                            contract_type=job.get('contract_type'),
                            created=job.get('created', ''),
                            redirect_url=job.get('redirect_url', '')
                        )
                        for job in data.get('results', [])
                    ]
                )

        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {e}")
            raise Exception(f"Error fetching jobs from Adzuna: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise Exception(f"Error processing jobs response: {str(e)}")

    async def get_job_details(self, job_id: str) -> Optional[ExternalJob]:
        """Get details of a specific job from Adzuna API."""
        try:
            query_params = {
                'app_id': self.app_id,
                'app_key': self.app_key
            }

            logger.info(f"Fetching job details for ID: {job_id}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/jobs/{self.country}/{job_id}",
                    params=query_params,
                    headers={'Accept': 'application/json'}
                )
                
                if response.status_code != 200:
                    logger.error(f"Adzuna API error: {response.status_code} - {response.text}")
                    raise httpx.HTTPError(f"API request failed with status code: {response.status_code}")
                
                try:
                    job = response.json()
                except Exception as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    logger.error(f"Response text: {response.text}")
                    raise Exception("Failed to parse API response")

                return ExternalJob(
                    id=str(job.get('id', '')),
                    title=job.get('title', ''),
                    description=job.get('description', ''),
                    company={"display_name": job.get('company', {}).get('display_name', 'Unknown Company')},
                    location={
                        "display_name": job.get('location', {}).get('display_name', 'Unknown Location'),
                        "area": job.get('location', {}).get('area', [])
                    },
                    salary_min=job.get('salary_min'),
                    salary_max=job.get('salary_max'),
                    contract_type=job.get('contract_type'),
                    created=job.get('created', ''),
                    redirect_url=job.get('redirect_url', '')
                )

        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {e}")
            raise Exception(f"Error fetching job details from Adzuna: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise Exception(f"Error processing job details: {str(e)}")

external_job_service = ExternalJobService() 