from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

app = FastAPI(title="Recruiter.AI Optimized API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage with caching
stored_resumes = []
stored_job_descriptions = []

# Simple cache for frequently accessed data
cache = {
    "resumes_stats": None,
    "jobs_stats": None,
    "last_cache_update": None
}

CACHE_DURATION = 300  # 5 minutes

def get_cached_data(key: str):
    """Get data from cache if it's still valid"""
    if key in cache and cache["last_cache_update"]:
        if time.time() - cache["last_cache_update"] < CACHE_DURATION:
            return cache[key]
    return None

def set_cached_data(key: str, data: Any):
    """Set data in cache"""
    cache[key] = data
    cache["last_cache_update"] = time.time()

def paginate_data(data: List[Any], page: int, page_size: int) -> Dict[str, Any]:
    """Paginate data and return pagination info"""
    total = len(data)
    total_pages = (total + page_size - 1) // page_size
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    paginated_data = data[start_idx:end_idx]
    
    return {
        "data": paginated_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
            "next_page": page + 1 if page < total_pages else None,
            "previous_page": page - 1 if page > 1 else None
        }
    }

def validate_pagination_params(page: int, page_size: int) -> tuple:
    """Validate and normalize pagination parameters"""
    # Ensure page is at least 1
    page = max(1, page)
    
    # Limit page size to prevent abuse
    page_size = min(max(1, page_size), 100)
    
    return page, page_size

def get_resume_stats():
    """Get resume statistics with caching"""
    cached_stats = get_cached_data("resumes_stats")
    if cached_stats:
        return cached_stats
    
    stats = {
        "total_resumes": len(stored_resumes),
        "with_email": len([r for r in stored_resumes if r.get('contact', {}).get('email')]),
        "with_phone": len([r for r in stored_resumes if r.get('contact', {}).get('phone')]),
        "with_skills": len([r for r in stored_resumes if r.get('skills')]),
        "with_education": len([r for r in stored_resumes if r.get('education')]),
        "with_experience": len([r for r in stored_resumes if r.get('work_experience')]),
        "unique_skills": len(set(
            skill.get('name', '') for resume in stored_resumes
            for skill in resume.get('skills', [])
        )),
        "last_updated": datetime.now().isoformat()
    }
    
    set_cached_data("resumes_stats", stats)
    return stats

def get_job_stats():
    """Get job statistics with caching"""
    cached_stats = get_cached_data("jobs_stats")
    if cached_stats:
        return cached_stats
    
    stats = {
        "total_jobs": len(stored_job_descriptions),
        "published": len([j for j in stored_job_descriptions if j.get('status') == 'published']),
        "draft": len([j for j in stored_job_descriptions if j.get('status') == 'draft']),
        "remote": len([j for j in stored_job_descriptions if j.get('location_type') == 'remote']),
        "onsite": len([j for j in stored_job_descriptions if j.get('location_type') == 'onsite']),
        "hybrid": len([j for j in stored_job_descriptions if j.get('location_type') == 'hybrid']),
        "unique_companies": len(set(
            job.get('company', '') for job in stored_job_descriptions
            if job.get('company')
        )),
        "unique_departments": len(set(
            job.get('department', '') for job in stored_job_descriptions
            if job.get('department')
        )),
        "last_updated": datetime.now().isoformat()
    }
    
    set_cached_data("jobs_stats", stats)
    return stats

@app.get("/")
async def root():
    return {
        "message": "Recruiter.AI Optimized API Backend",
        "status": "healthy",
        "features": [
            "Pagination for large datasets",
            "Response caching",
            "Input validation",
            "Performance optimization",
            "Rate limiting ready"
        ],
        "endpoints": {
            "resumes": "/api/resumes?page=1&page_size=10",
            "jobs": "/api/jobs?page=1&page_size=10",
            "stats": "/api/stats",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "optimized-api-backend",
        "timestamp": datetime.now().isoformat(),
        "cache_status": "active" if cache["last_cache_update"] else "inactive"
    }

@app.get("/api/resumes")
async def get_resumes_paginated(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page (max 100)"),
    search: Optional[str] = Query(None, description="Search term"),
    sort_by: Optional[str] = Query("created_at", description="Sort field: created_at, full_name, email"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc, desc")
):
    """Get resumes with pagination, search, and sorting"""
    try:
        # Validate pagination parameters
        page, page_size = validate_pagination_params(page, page_size)
        
        # Start with all resumes
        filtered_resumes = stored_resumes.copy()
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            filtered_resumes = [
                r for r in filtered_resumes
                if (search_lower in r.get('full_name', '').lower() or
                    search_lower in r.get('contact', {}).get('email', '').lower() or
                    search_lower in r.get('summary', '').lower())
            ]
        
        # Apply sorting
        if sort_by == "full_name":
            filtered_resumes.sort(
                key=lambda x: x.get('full_name', '').lower(),
                reverse=(sort_order == "desc")
            )
        elif sort_by == "email":
            filtered_resumes.sort(
                key=lambda x: x.get('contact', {}).get('email', '').lower(),
                reverse=(sort_order == "desc")
            )
        else:  # created_at
            filtered_resumes.sort(
                key=lambda x: x.get('created_at', ''),
                reverse=(sort_order == "desc")
            )
        
        # Apply pagination
        result = paginate_data(filtered_resumes, page, page_size)
        
        return {
            "success": True,
            "resumes": result["data"],
            "pagination": result["pagination"],
            "filters": {
                "search": search,
                "sort_by": sort_by,
                "sort_order": sort_order
            },
            "message": f"Retrieved {len(result['data'])} resumes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get resumes: {str(e)}")

@app.get("/api/jobs")
async def get_jobs_paginated(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page (max 100)"),
    search: Optional[str] = Query(None, description="Search term"),
    company: Optional[str] = Query(None, description="Filter by company"),
    location_type: Optional[str] = Query(None, description="Filter by location type"),
    status: Optional[str] = Query("published", description="Filter by status"),
    sort_by: Optional[str] = Query("created_at", description="Sort field: created_at, title, company"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc, desc")
):
    """Get job descriptions with pagination, search, and filtering"""
    try:
        # Validate pagination parameters
        page, page_size = validate_pagination_params(page, page_size)
        
        # Start with all jobs
        filtered_jobs = stored_job_descriptions.copy()
        
        # Apply filters
        if company:
            filtered_jobs = [
                j for j in filtered_jobs
                if company.lower() in j.get('company', '').lower()
            ]
        
        if location_type:
            filtered_jobs = [
                j for j in filtered_jobs
                if j.get('location_type', '').lower() == location_type.lower()
            ]
        
        if status:
            filtered_jobs = [
                j for j in filtered_jobs
                if j.get('status', '').lower() == status.lower()
            ]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            filtered_jobs = [
                j for j in filtered_jobs
                if (search_lower in j.get('title', '').lower() or
                    search_lower in j.get('company', '').lower() or
                    search_lower in j.get('overview', '').lower())
            ]
        
        # Apply sorting
        if sort_by == "title":
            filtered_jobs.sort(
                key=lambda x: x.get('title', '').lower(),
                reverse=(sort_order == "desc")
            )
        elif sort_by == "company":
            filtered_jobs.sort(
                key=lambda x: x.get('company', '').lower(),
                reverse=(sort_order == "desc")
            )
        else:  # created_at
            filtered_jobs.sort(
                key=lambda x: x.get('created_at', ''),
                reverse=(sort_order == "desc")
            )
        
        # Apply pagination
        result = paginate_data(filtered_jobs, page, page_size)
        
        return {
            "success": True,
            "jobs": result["data"],
            "pagination": result["pagination"],
            "filters": {
                "search": search,
                "company": company,
                "location_type": location_type,
                "status": status,
                "sort_by": sort_by,
                "sort_order": sort_order
            },
            "message": f"Retrieved {len(result['data'])} job descriptions"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get jobs: {str(e)}")

@app.get("/api/stats")
async def get_statistics():
    """Get comprehensive statistics with caching"""
    try:
        resume_stats = get_resume_stats()
        job_stats = get_job_stats()
        
        return {
            "success": True,
            "resumes": resume_stats,
            "jobs": job_stats,
            "cache_info": {
                "cache_active": cache["last_cache_update"] is not None,
                "last_cache_update": cache["last_cache_update"],
                "cache_duration": CACHE_DURATION
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@app.get("/api/resumes/{resume_id}")
async def get_resume_by_id(resume_id: str):
    """Get a specific resume by ID"""
    try:
        for resume in stored_resumes:
            if resume.get('resume_id') == resume_id:
                return {
                    "success": True,
                    "resume": resume,
                    "message": "Resume found"
                }
        
        raise HTTPException(status_code=404, detail="Resume not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get resume: {str(e)}")

@app.get("/api/jobs/{job_id}")
async def get_job_by_id(job_id: str):
    """Get a specific job by ID"""
    try:
        for job in stored_job_descriptions:
            if job.get('job_id') == job_id:
                return {
                    "success": True,
                    "job": job,
                    "message": "Job found"
                }
        
        raise HTTPException(status_code=404, detail="Job not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job: {str(e)}")

@app.get("/api/companies")
async def get_companies():
    """Get list of unique companies"""
    try:
        companies = list(set(
            job.get('company', '') for job in stored_job_descriptions
            if job.get('company')
        ))
        companies.sort()
        
        return {
            "success": True,
            "companies": companies,
            "total": len(companies),
            "message": f"Found {len(companies)} unique companies"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get companies: {str(e)}")

@app.get("/api/departments")
async def get_departments():
    """Get list of unique departments"""
    try:
        departments = list(set(
            job.get('department', '') for job in stored_job_descriptions
            if job.get('department')
        ))
        departments.sort()
        
        return {
            "success": True,
            "departments": departments,
            "total": len(departments),
            "message": f"Found {len(departments)} unique departments"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get departments: {str(e)}")

@app.get("/api/skills")
async def get_skills():
    """Get list of unique skills"""
    try:
        skills = set()
        
        # Get skills from resumes
        for resume in stored_resumes:
            for skill in resume.get('skills', []):
                skill_name = skill.get('name', '')
                if skill_name:
                    skills.add(skill_name)
        
        # Get skills from jobs
        for job in stored_job_descriptions:
            for skill in job.get('required_skills', []):
                if skill:
                    skills.add(skill)
        
        skills_list = sorted(list(skills))
        
        return {
            "success": True,
            "skills": skills_list,
            "total": len(skills_list),
            "message": f"Found {len(skills_list)} unique skills"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get skills: {str(e)}")

@app.post("/api/cache/clear")
async def clear_cache():
    """Clear the cache (admin endpoint)"""
    try:
        cache.clear()
        cache["last_cache_update"] = None
        
        return {
            "success": True,
            "message": "Cache cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8807)
