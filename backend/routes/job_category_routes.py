"""
Job Category Routes - Handle job categorization endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import uuid
from datetime import datetime
from pymilvus import Collection

from ..services.milvus_service import milvus_connected
from ..utils.embeddings import get_embedding

router = APIRouter(prefix="/api/job-categories", tags=["Job Categories"])

@router.post("")
async def store_job_category(category_data: dict):
    """Store job category information in the job_categories collection"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        # Validate required fields
        required_fields = ["job_id", "job_title", "company_name", "category"]
        for field in required_fields:
            if field not in category_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Generate unique ID
        category_id = str(uuid.uuid4())
        
        # Prepare data for storage
        job_category_data = {
            "id": category_id,
            "job_id": category_data["job_id"],
            "job_title": category_data["job_title"],
            "company_name": category_data["company_name"],
            "category": category_data["category"],
            "subcategory": category_data.get("subcategory", ""),
            "industry": category_data.get("industry", ""),
            "department": category_data.get("department", ""),
            "experience_level": category_data.get("experience_level", ""),
            "employment_type": category_data.get("employment_type", ""),
            "location": category_data.get("location", ""),
            "remote_friendly": category_data.get("remote_friendly", False),
            "salary_range_min": category_data.get("salary_range_min", 0),
            "salary_range_max": category_data.get("salary_range_max", 0),
            "required_skills": json.dumps(category_data.get("required_skills", [])),
            "preferred_skills": json.dumps(category_data.get("preferred_skills", [])),
            "keywords": json.dumps(category_data.get("keywords", [])),
            "job_description_summary": category_data.get("job_description_summary", ""),
            "status": category_data.get("status", "active"),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Generate embedding for the job category
        embedding_text = f"{category_data['job_title']} {category_data['company_name']} {category_data['category']} {category_data.get('job_description_summary', '')}"
        embedding = get_embedding(embedding_text)
        job_category_data["embedding"] = embedding
        
        # Store in Milvus
        collection = Collection("job_categories")
        collection.load()
        collection.insert([job_category_data])
        collection.flush()
        
        return {
            "success": True,
            "category_id": category_id,
            "message": "Job category stored successfully"
        }
        
    except Exception as e:
        print(f"❌ Error storing job category: {e}")
        raise HTTPException(status_code=500, detail=f"Error storing job category: {str(e)}")

@router.get("")
async def get_job_categories(category: Optional[str] = None, company: Optional[str] = None, limit: int = 50):
    """Get job categories with optional filtering"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        collection = Collection("job_categories")
        collection.load()
        
        # Build query expression
        expr_parts = []
        if category:
            expr_parts.append(f'category == "{category}"')
        if company:
            expr_parts.append(f'company_name == "{company}"')
        
        expr = " and ".join(expr_parts) if expr_parts else ""
        
        # Query results
        results = collection.query(
            expr=expr if expr else None,
            output_fields=["*"],
            limit=limit
        )
        
        # Parse JSON fields
        parsed_results = []
        for result in results:
            parsed_result = dict(result)
            # Parse JSON string fields
            json_fields = ["required_skills", "preferred_skills", "keywords"]
            for field in json_fields:
                if field in parsed_result and parsed_result[field]:
                    try:
                        parsed_result[field] = json.loads(parsed_result[field])
                    except:
                        pass  # Keep as string if parsing fails
            parsed_results.append(parsed_result)
        
        return {
            "success": True,
            "categories": parsed_results,
            "count": len(parsed_results)
        }
        
    except Exception as e:
        print(f"❌ Error getting job categories: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting job categories: {str(e)}")

@router.get("/{category_id}")
async def get_job_category(category_id: str):
    """Get a specific job category by ID"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        collection = Collection("job_categories")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{category_id}"',
            output_fields=["*"]
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Job category not found")
        
        result = results[0]
        # Parse JSON fields
        json_fields = ["required_skills", "preferred_skills", "keywords"]
        for field in json_fields:
            if field in result and result[field]:
                try:
                    result[field] = json.loads(result[field])
                except:
                    pass  # Keep as string if parsing fails
        
        return {
            "success": True,
            "category": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting job category: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting job category: {str(e)}")

