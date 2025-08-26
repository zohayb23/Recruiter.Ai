from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from src.services.vector_store.milvus_service import MilvusService
from src.services.vector_store.milvus_job_service import MilvusJobService
from sentence_transformers import SentenceTransformer
import numpy as np

router = APIRouter()
milvus_service = MilvusService()
job_service = MilvusJobService()
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Initializing matching router")  # Debug log

@router.get("/matching/{job_id}/candidates", tags=["matching"])
async def get_matching_candidates(
    job_id: str,
    limit: Optional[int] = Query(10),
    min_score: Optional[float] = Query(0.6)
):
    """
    Get matching candidates for a specific job.
    """
    try:
        print(f"Getting matches for job {job_id}")
        
        # Get the job description
        job = await job_service.get_job_description(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        print(f"Found job: {job.get('title')}")

        # Create a search string from job requirements
        required_skills = job.get('required_skills', [])
        preferred_skills = job.get('preferred_skills', [])
        all_skills = ' '.join(required_skills + preferred_skills)
        
        search_text = f"{job.get('title', '')} {job.get('overview', '')} {all_skills}"
        print(f"Search text: {search_text[:100]}...")
        
        # Generate embedding for the job
        job_embedding = model.encode(search_text)

        # Search in Milvus
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10},
        }
        
        # Make sure collection is loaded
        milvus_service.collection.load()
        print("Milvus collection loaded")
        
        results = milvus_service.collection.search(
            data=[job_embedding.tolist()],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            output_fields=["*"]
        )

        print(f"Found {len(results)} result sets")

        # Format results
        candidates = []
        for hits in results:
            print(f"Processing {len(hits)} hits")
            for hit in hits:
                # Convert L2 distance to similarity score (0-1 range)
                similarity = 1 / (1 + hit.score)
                
                if similarity >= min_score:
                    candidate_data = hit.entity.to_dict()
                    
                    # Parse skills if they're a string
                    if isinstance(candidate_data.get('skills'), str):
                        candidate_data['skills'] = [s.strip() for s in candidate_data['skills'].split(',') if s.strip()]
                    elif candidate_data.get('skills') is None:
                        candidate_data['skills'] = []
                    
                    # Add match score
                    candidate_data['match_score'] = float(similarity)
                    
                    candidates.append(candidate_data)

        # Sort by match score
        candidates.sort(key=lambda x: x['match_score'], reverse=True)

        print(f"Returning {len(candidates)} candidates")

        return {
            "candidates": candidates,
            "total": len(candidates)
        }

    except Exception as e:
        print(f"Error in get_matching_candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Print available routes in this router
print("Matching router routes:")
for route in router.routes:
    print(f"{route.methods} {route.path}")