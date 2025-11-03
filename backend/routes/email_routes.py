"""
Email management routes for Recruiter.AI
API endpoints to view and manage emails stored by the Gmail Agent
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pymilvus import Collection, connections
import json
from datetime import datetime

router = APIRouter(prefix="/api/emails", tags=["emails"])


@router.get("/list")
async def list_emails(
    limit: int = Query(50, description="Number of emails to return"),
    email_type: Optional[str] = Query(None, description="Filter by email type"),
    priority: Optional[str] = Query(None, description="Filter by priority (high/medium/low)"),
    is_resume: Optional[bool] = Query(None, description="Filter emails with resumes"),
    sender: Optional[str] = Query(None, description="Filter by sender email")
):
    """
    List all emails stored in the database
    
    Example: GET /api/emails/list?limit=20&priority=high&is_resume=true
    """
    try:
        collection = Collection("emails")
        collection.load()
        
        # Build filter expression
        filters = []
        if email_type:
            filters.append(f'email_type == "{email_type}"')
        if priority:
            filters.append(f'priority == "{priority}"')
        if is_resume is not None:
            filters.append(f'is_resume == {str(is_resume).lower()}')
        if sender:
            filters.append(f'sender_email like "%{sender}%"')
        
        expr = " && ".join(filters) if filters else ""
        
        # Query emails
        results = collection.query(
            expr=expr if expr else "id != ''",
            output_fields=[
                "id", "sender_email", "sender_name", "subject", 
                "body", "received_date", "email_type", "is_resume",
                "is_job_inquiry", "priority", "extracted_data", "created_at"
            ],
            limit=limit
        )
        
        # Parse extracted_data JSON
        for result in results:
            if "extracted_data" in result:
                try:
                    result["extracted_data"] = json.loads(result["extracted_data"])
                except:
                    pass
            # Truncate body for list view
            if "body" in result and len(result["body"]) > 200:
                result["body_preview"] = result["body"][:200] + "..."
                result.pop("body")
        
        return {
            "success": True,
            "count": len(results),
            "emails": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching emails: {str(e)}")


@router.get("/{email_id}")
async def get_email(email_id: str):
    """
    Get full details of a specific email
    
    Example: GET /api/emails/12345
    """
    try:
        collection = Collection("emails")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{email_id}"',
            output_fields=[
                "id", "sender_email", "sender_name", "subject", 
                "body", "received_date", "email_type", "is_resume",
                "is_job_inquiry", "priority", "extracted_data", "created_at"
            ]
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="Email not found")
        
        email = results[0]
        
        # Parse extracted_data JSON
        if "extracted_data" in email:
            try:
                email["extracted_data"] = json.loads(email["extracted_data"])
            except:
                pass
        
        return {
            "success": True,
            "email": email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching email: {str(e)}")


@router.get("/search/semantic")
async def search_emails(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Number of results")
):
    """
    Semantic search through emails using AI embeddings
    
    Example: GET /api/emails/search/semantic?query=software engineer resume&limit=5
    """
    try:
        from sentence_transformers import SentenceTransformer
        
        # Generate query embedding
        model = SentenceTransformer('all-MiniLM-L6-v2')
        query_embedding = model.encode(query).tolist()
        
        collection = Collection("emails")
        collection.load()
        
        # Search by similarity
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            output_fields=[
                "id", "sender_email", "sender_name", "subject",
                "body", "email_type", "priority", "extracted_data"
            ]
        )
        
        emails = []
        for hits in results:
            for hit in hits:
                email_data = {
                    "id": hit.entity.get("id"),
                    "sender_email": hit.entity.get("sender_email"),
                    "sender_name": hit.entity.get("sender_name"),
                    "subject": hit.entity.get("subject"),
                    "body_preview": hit.entity.get("body", "")[:200] + "...",
                    "email_type": hit.entity.get("email_type"),
                    "priority": hit.entity.get("priority"),
                    "similarity_score": hit.distance
                }
                
                # Parse extracted_data
                extracted_data = hit.entity.get("extracted_data")
                if extracted_data:
                    try:
                        email_data["extracted_data"] = json.loads(extracted_data)
                    except:
                        pass
                
                emails.append(email_data)
        
        return {
            "success": True,
            "query": query,
            "count": len(emails),
            "emails": emails
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching emails: {str(e)}")


@router.get("/stats/overview")
async def get_email_stats():
    """
    Get email statistics and analytics
    
    Example: GET /api/emails/stats/overview
    """
    try:
        collection = Collection("emails")
        collection.load()
        
        # Get all emails
        all_emails = collection.query(
            expr="id != ''",
            output_fields=["email_type", "priority", "is_resume", "is_job_inquiry"]
        )
        
        total = len(all_emails)
        
        # Count by type
        type_counts = {}
        priority_counts = {}
        resume_count = 0
        job_inquiry_count = 0
        
        for email in all_emails:
            email_type = email.get("email_type", "unknown")
            type_counts[email_type] = type_counts.get(email_type, 0) + 1
            
            priority = email.get("priority", "low")
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
            
            if email.get("is_resume"):
                resume_count += 1
            if email.get("is_job_inquiry"):
                job_inquiry_count += 1
        
        return {
            "success": True,
            "total_emails": total,
            "emails_with_resume": resume_count,
            "job_inquiries": job_inquiry_count,
            "by_type": type_counts,
            "by_priority": priority_counts,
            "high_priority_count": priority_counts.get("high", 0),
            "medium_priority_count": priority_counts.get("medium", 0),
            "low_priority_count": priority_counts.get("low", 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")


@router.delete("/{email_id}")
async def delete_email(email_id: str):
    """
    Delete a specific email from the database
    
    Example: DELETE /api/emails/12345
    """
    try:
        collection = Collection("emails")
        collection.load()
        
        # Delete by ID
        collection.delete(f'id == "{email_id}"')
        collection.flush()
        
        return {
            "success": True,
            "message": f"Email {email_id} deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting email: {str(e)}")


@router.get("/health/agent-status")
async def get_agent_status():
    """
    Check if the Gmail agent is running and get its status
    
    Example: GET /api/emails/health/agent-status
    """
    import os
    
    # Check if processed_emails.json exists
    processed_file = "processed_emails.json"
    
    status = {
        "agent_configured": bool(os.getenv("GMAIL_USER") and os.getenv("GMAIL_APP_PASSWORD")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "gmail_user": os.getenv("GMAIL_USER", "Not configured"),
    }
    
    if os.path.exists(processed_file):
        try:
            with open(processed_file, "r") as f:
                processed_emails = json.load(f)
            status["processed_emails_count"] = len(processed_emails)
            status["last_run"] = "Active"
        except:
            status["processed_emails_count"] = 0
            status["last_run"] = "Unknown"
    else:
        status["processed_emails_count"] = 0
        status["last_run"] = "Not started"
    
    return {
        "success": True,
        "status": status
    }

