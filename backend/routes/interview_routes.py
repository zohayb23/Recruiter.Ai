"""
Interview Results Routes - Handle interview result storage and retrieval
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import uuid
from datetime import datetime
from pymilvus import Collection

from ..services.milvus_service import milvus_connected
from ..utils.embeddings import get_embedding

router = APIRouter(prefix="/api/interview-results", tags=["Interview Results"])

@router.post("")
async def store_interview_result(result_data: dict):
    """Store AI evaluation results in the interview_results collection"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        # Validate required fields
        required_fields = ["candidate_id", "candidate_name", "job_id", "job_title", "company_name", "overall_score"]
        for field in required_fields:
            if field not in result_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Generate unique ID
        result_id = str(uuid.uuid4())
        
        # Prepare data for storage
        interview_data = {
            "id": result_id,
            "candidate_id": result_data["candidate_id"],
            "candidate_name": result_data["candidate_name"],
            "job_id": result_data["job_id"],
            "job_title": result_data["job_title"],
            "company_name": result_data["company_name"],
            "overall_score": float(result_data["overall_score"]),
            "category_scores": json.dumps(result_data.get("category_scores", {})),
            "ai_feedback": result_data.get("ai_feedback", ""),
            "detailed_analysis": json.dumps(result_data.get("detailed_analysis", {})),
            "skill_match_analysis": json.dumps(result_data.get("skill_match_analysis", {})),
            "experience_analysis": json.dumps(result_data.get("experience_analysis", {})),
            "fit_assessment": json.dumps(result_data.get("fit_assessment", {})),
            "interview_recommendations": json.dumps(result_data.get("interview_recommendations", [])),
            "hiring_recommendation": result_data.get("hiring_recommendation", "unknown"),
            "confidence_level": float(result_data.get("confidence_level", 0)),
            "reasoning": result_data.get("reasoning", ""),
            "evaluation_date": result_data.get("evaluation_date", datetime.now().isoformat()),
            "evaluated_by": result_data.get("evaluated_by", "AI System"),
            "model_used": result_data.get("model_used", "gpt-4o-mini"),
            "status": result_data.get("status", "completed"),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Generate embedding for the result
        embedding_text = f"{result_data['candidate_name']} {result_data['job_title']} {result_data['company_name']} {result_data.get('ai_feedback', '')}"
        embedding = get_embedding(embedding_text)
        interview_data["embedding"] = embedding
        
        # Store in Milvus
        collection = Collection("interview_results")
        collection.load()
        collection.insert([interview_data])
        collection.flush()
        
        return {
            "success": True,
            "result_id": result_id,
            "message": "Interview result stored successfully"
        }
        
    except Exception as e:
        print(f"❌ Error storing interview result: {e}")
        raise HTTPException(status_code=500, detail=f"Error storing interview result: {str(e)}")

@router.get("")
async def get_interview_results(candidate_id: Optional[str] = None, job_id: Optional[str] = None, limit: int = 50):
    """Get interview results with optional filtering"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        collection = Collection("interview_results")
        collection.load()
        
        # Build query expression
        expr_parts = []
        if candidate_id:
            expr_parts.append(f'candidate_id == "{candidate_id}"')
        if job_id:
            expr_parts.append(f'job_id == "{job_id}"')
        
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
            json_fields = ["category_scores", "detailed_analysis", "skill_match_analysis", 
                          "experience_analysis", "fit_assessment", "interview_recommendations"]
            for field in json_fields:
                if field in parsed_result and parsed_result[field]:
                    try:
                        parsed_result[field] = json.loads(parsed_result[field])
                    except:
                        pass  # Keep as string if parsing fails
            parsed_results.append(parsed_result)
        
        return {
            "success": True,
            "results": parsed_results,
            "count": len(parsed_results)
        }
        
    except Exception as e:
        print(f"❌ Error getting interview results: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting interview results: {str(e)}")

@router.get("/{result_id}")
async def get_interview_result(result_id: str):
    """Get a specific interview result by ID"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        collection = Collection("interview_results")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{result_id}"',
            output_fields=["*"]
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Interview result not found")
        
        result = results[0]
        # Parse JSON fields
        json_fields = ["category_scores", "detailed_analysis", "skill_match_analysis", 
                      "experience_analysis", "fit_assessment", "interview_recommendations"]
        for field in json_fields:
            if field in result and result[field]:
                try:
                    result[field] = json.loads(result[field])
                except:
                    pass  # Keep as string if parsing fails
        
        return {
            "success": True,
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting interview result: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting interview result: {str(e)}")

