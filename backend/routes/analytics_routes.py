"""
Analytics Routes - Handle dashboard and trend analytics
"""
from fastapi import APIRouter, HTTPException
import json
from datetime import datetime, timedelta
from pymilvus import Collection, utility

from ..services.milvus_service import milvus_connected

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics():
    """Get comprehensive dashboard analytics with real data"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        analytics = {}
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        # 1. Candidates Analytics
        try:
            resumes_collection = Collection("resumes")
            resumes_collection.load()
            
            all_candidates = resumes_collection.query(
                expr="id != ''",
                output_fields=["id", "full_name", "created_at", "skills", "work_experience"],
                limit=10000
            )
            
            total_candidates = len(all_candidates)
            recent_candidates = [c for c in all_candidates if c.get("created_at", "") > thirty_days_ago]
            
            # Skills analysis
            all_skills = []
            for candidate in all_candidates:
                if candidate.get("skills"):
                    try:
                        skills = json.loads(candidate["skills"]) if isinstance(candidate["skills"], str) else candidate["skills"]
                        all_skills.extend([skill.get("name", "") for skill in skills if skill.get("name")])
                    except:
                        pass
            
            skill_counts = {}
            for skill in all_skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
            
            top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            
            analytics["candidates"] = {
                "total": total_candidates,
                "recent_30_days": len(recent_candidates),
                "top_skills": [{"skill": skill, "count": count} for skill, count in top_skills]
            }
            
        except Exception as e:
            print(f"⚠️ Error getting candidates analytics: {e}")
            analytics["candidates"] = {"error": str(e)}
        
        # 2. Jobs Analytics
        try:
            jobs_collection = Collection("job_descriptions")
            jobs_collection.load()
            
            all_jobs = jobs_collection.query(
                expr="id != ''",
                output_fields=["id", "title", "company", "created_at", "status"],
                limit=10000
            )
            
            total_jobs = len(all_jobs)
            recent_jobs = [j for j in all_jobs if j.get("created_at", "") > thirty_days_ago]
            
            status_counts = {}
            for job in all_jobs:
                status = job.get("status", "Unknown")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            analytics["jobs"] = {
                "total": total_jobs,
                "recent_30_days": len(recent_jobs),
                "status_distribution": status_counts
            }
            
        except Exception as e:
            print(f"⚠️ Error getting jobs analytics: {e}")
            analytics["jobs"] = {"error": str(e)}
        
        # 3. Interview Results Analytics
        try:
            interview_collection = Collection("interview_results")
            interview_collection.load()
            
            all_interviews = interview_collection.query(
                expr="id != ''",
                output_fields=["id", "overall_score", "hiring_recommendation", "created_at"],
                limit=10000
            )
            
            total_interviews = len(all_interviews)
            
            if total_interviews > 0:
                scores = [interview.get("overall_score", 0) for interview in all_interviews if interview.get("overall_score")]
                avg_score = sum(scores) / len(scores) if scores else 0
                
                hiring_recs = {}
                for interview in all_interviews:
                    rec = interview.get("hiring_recommendation", "Unknown")
                    hiring_recs[rec] = hiring_recs.get(rec, 0) + 1
                
                analytics["interviews"] = {
                    "total": total_interviews,
                    "average_score": round(avg_score, 2),
                    "hiring_recommendations": hiring_recs
                }
            else:
                analytics["interviews"] = {"total": 0, "average_score": 0, "hiring_recommendations": {}}
                
        except Exception as e:
            print(f"⚠️ Error getting interview analytics: {e}")
            analytics["interviews"] = {"error": str(e)}
        
        # 4. System Health
        analytics["system"] = {
            "milvus_connected": milvus_connected,
            "collections_count": len(utility.list_collections()),
            "last_updated": datetime.now().isoformat()
        }
        
        return {
            "status": "success",
            "analytics": analytics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error getting dashboard analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting dashboard analytics: {str(e)}")

@router.get("/trends")
async def get_analytics_trends(days: int = 30):
    """Get trend analytics over time"""
    try:
        if not milvus_connected:
            raise HTTPException(status_code=500, detail="Milvus not connected")
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        trends = {}
        
        # Candidates trend
        try:
            resumes_collection = Collection("resumes")
            resumes_collection.load()
            
            candidates_by_day = {}
            for i in range(days):
                date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                candidates_by_day[date] = 0
            
            all_candidates = resumes_collection.query(
                expr="id != ''",
                output_fields=["created_at"],
                limit=10000
            )
            
            for candidate in all_candidates:
                created_at = candidate.get("created_at", "")
                if created_at:
                    try:
                        candidate_date = datetime.fromisoformat(created_at.replace('Z', '+00:00')).strftime("%Y-%m-%d")
                        if candidate_date in candidates_by_day:
                            candidates_by_day[candidate_date] += 1
                    except:
                        pass
            
            trends["candidates"] = [
                {"date": date, "count": count} 
                for date, count in sorted(candidates_by_day.items())
            ]
            
        except Exception as e:
            print(f"⚠️ Error getting candidates trend: {e}")
            trends["candidates"] = []
        
        # Jobs trend
        try:
            jobs_collection = Collection("job_descriptions")
            jobs_collection.load()
            
            jobs_by_day = {}
            for i in range(days):
                date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
                jobs_by_day[date] = 0
            
            all_jobs = jobs_collection.query(
                expr="id != ''",
                output_fields=["created_at"],
                limit=10000
            )
            
            for job in all_jobs:
                created_at = job.get("created_at", "")
                if created_at:
                    try:
                        job_date = datetime.fromisoformat(created_at.replace('Z', '+00:00')).strftime("%Y-%m-%d")
                        if job_date in jobs_by_day:
                            jobs_by_day[job_date] += 1
                    except:
                        pass
            
            trends["jobs"] = [
                {"date": date, "count": count} 
                for date, count in sorted(jobs_by_day.items())
            ]
            
        except Exception as e:
            print(f"⚠️ Error getting jobs trend: {e}")
            trends["jobs"] = []
        
        return {
            "status": "success",
            "trends": trends,
            "period_days": days,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error getting analytics trends: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting analytics trends: {str(e)}")

