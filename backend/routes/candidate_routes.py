"""
Candidate Routes - Handle all candidate-related endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
from pymilvus import connections, Collection, utility

from ..services.milvus_service import MILVUS_HOST, MILVUS_PORT, milvus_connected, get_resumes_from_milvus
from ..services.candidate_service import get_candidate_by_id, get_new_candidate_pool
from ..storage import stored_resumes

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("")
async def get_candidates():
    """Get all candidates from Milvus database with detailed error handling"""
    try:
        print("🔄 API: Getting candidates from Milvus...")
        candidates = get_resumes_from_milvus()
        
        print(f"📊 API: Retrieved {len(candidates)} candidates")
        for i, candidate in enumerate(candidates[:3]):  # Log first 3 candidates
            print(f"  {i+1}. {candidate.get('name', 'Unknown')} - {candidate.get('email', 'No email')}")
        
        return {
            "success": True,
            "candidates": candidates,
            "total": len(candidates),
            "message": f"Successfully found {len(candidates)} candidates",
            "milvus_connected": milvus_connected
        }
    except Exception as e:
        print(f"❌ API Error getting candidates: {e}")
        import traceback
        traceback.print_exc()
        
        # Return fallback data
        return {
            "success": False,
            "candidates": stored_resumes,
            "total": len(stored_resumes),
            "message": f"Using fallback data: {len(stored_resumes)} candidates",
            "error": str(e),
            "milvus_connected": milvus_connected
        }

@router.get("/new-pool")
async def get_new_candidate_pool_endpoint():
    """Get all candidates from the new candidate pool (1000 candidates)"""
    result = get_new_candidate_pool()
    return result

@router.get("/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Get a single candidate by ID from Milvus resumes collection"""
    try:
        # Force connection to the correct Milvus instance
        try:
            connections.disconnect("default")
        except:
            pass
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        
        if not utility.has_collection("resumes"):
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        collection = Collection("resumes")
        collection.load()
        
        # Query specific candidate by ID
        results = collection.query(
            expr=f'id == "{candidate_id}"',
            output_fields=["*"],
            limit=1
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        result = results[0]
        
        # Parse skills from the actual data structure
        skills = result.get("skills", [])
        skills_list = []
        
        # Handle skills as JSON string
        if isinstance(skills, str):
            try:
                skills = json.loads(skills)
            except (json.JSONDecodeError, TypeError):
                skills = []
        
        if isinstance(skills, list):
            for skill in skills:
                if isinstance(skill, dict):
                    skills_list.append(skill.get("name", ""))
                else:
                    skills_list.append(str(skill))
        
        # Parse JSON strings to arrays
        try:
            education = json.loads(result.get("education", "[]"))
            work_experience = json.loads(result.get("work_experience", "[]"))
        except (json.JSONDecodeError, TypeError):
            education = []
            work_experience = []
        
        # Calculate experience years from work experience
        experience_years = 0
        if isinstance(work_experience, list) and work_experience:
            # Calculate years from start dates
            for exp in work_experience:
                start_date = exp.get('start_date', '')
                if start_date and any(year in start_date for year in ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']):
                    # Extract year and calculate years
                    for year in ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']:
                        if year in start_date:
                            experience_years = max(experience_years, 2024 - int(year))
                            break
        
        candidate = {
            "id": result["id"],
            "name": result.get("full_name", "Unknown"),
            "email": result.get("email", ""),
            "phone": result.get("phone", ""),
            "location": "Remote",  # Default location
            "position": "Software Developer",  # Default position
            "experience_years": experience_years,
            "skills": skills_list,
            "jobMatchScore": 85 + (hash(result.get("id", "")) % 15),  # Generate score
            "status": "Active",  # Default status
            "lastActivity": result.get("updated_at", result.get("created_at", "")),
            "resumeText": result.get("summary", ""),
            "createdAt": result.get("created_at", ""),
            "updatedAt": result.get("updated_at", ""),
            "education": education,
            "work_experience": work_experience,
            "file_path": result.get("file_path", "")
        }
        
        return {"candidate": candidate}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching candidate {candidate_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching candidate: {str(e)}")

@router.post("")
async def create_candidate():
    """Create a new candidate (not implemented)"""
    return {"message": "Not implemented"}
