from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

app = FastAPI(title="Recruiter.AI Simple Search", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (this would normally come from your main backend)
stored_resumes = []
stored_job_descriptions = []

def simple_text_search(text: str, query: str) -> float:
    """Simple text-based search scoring"""
    if not query or not text:
        return 0.0
    
    query_lower = query.lower()
    text_lower = text.lower()
    
    # Exact match gets highest score
    if query_lower in text_lower:
        # Count occurrences
        occurrences = text_lower.count(query_lower)
        # Base score for presence
        score = 1.0
        # Bonus for multiple occurrences
        score += (occurrences - 1) * 0.1
        return min(score, 2.0)  # Cap at 2.0
    
    # Partial word matches
    query_words = query_lower.split()
    text_words = text_lower.split()
    
    word_matches = 0
    for query_word in query_words:
        for text_word in text_words:
            if query_word in text_word or text_word in query_word:
                word_matches += 1
                break
    
    if word_matches > 0:
        return word_matches / len(query_words) * 0.5
    
    return 0.0

def search_resumes(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search resumes using simple text matching"""
    if not query:
        return stored_resumes[:limit]
    
    scored_resumes = []
    
    for resume in stored_resumes:
        score = 0.0
        
        # Search in different fields with different weights
        name = resume.get('full_name', '')
        email = resume.get('contact', {}).get('email', '')
        summary = resume.get('summary', '')
        skills = json.dumps(resume.get('skills', []))
        education = json.dumps(resume.get('education', []))
        experience = json.dumps(resume.get('work_experience', []))
        
        # Weighted scoring
        score += simple_text_search(name, query) * 3.0  # Name is most important
        score += simple_text_search(email, query) * 2.0
        score += simple_text_search(summary, query) * 2.0
        score += simple_text_search(skills, query) * 1.5
        score += simple_text_search(education, query) * 1.0
        score += simple_text_search(experience, query) * 1.0
        
        if score > 0:
            resume_with_score = resume.copy()
            resume_with_score['search_score'] = score
            scored_resumes.append(resume_with_score)
    
    # Sort by score (highest first)
    scored_resumes.sort(key=lambda x: x['search_score'], reverse=True)
    
    return scored_resumes[:limit]

def search_jobs(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search job descriptions using simple text matching"""
    if not query:
        return stored_job_descriptions[:limit]
    
    scored_jobs = []
    
    for job in stored_job_descriptions:
        score = 0.0
        
        # Search in different fields with different weights
        title = job.get('title', '')
        company = job.get('company', '')
        overview = job.get('overview', '')
        responsibilities = json.dumps(job.get('responsibilities', []))
        qualifications = json.dumps(job.get('qualifications', []))
        required_skills = json.dumps(job.get('required_skills', []))
        location = job.get('location', '')
        department = job.get('department', '')
        
        # Weighted scoring
        score += simple_text_search(title, query) * 3.0  # Title is most important
        score += simple_text_search(company, query) * 2.5
        score += simple_text_search(overview, query) * 2.0
        score += simple_text_search(responsibilities, query) * 1.5
        score += simple_text_search(qualifications, query) * 1.5
        score += simple_text_search(required_skills, query) * 2.0
        score += simple_text_search(location, query) * 1.0
        score += simple_text_search(department, query) * 1.0
        
        if score > 0:
            job_with_score = job.copy()
            job_with_score['search_score'] = score
            scored_jobs.append(job_with_score)
    
    # Sort by score (highest first)
    scored_jobs.sort(key=lambda x: x['search_score'], reverse=True)
    
    return scored_jobs[:limit]

def filter_resumes(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Filter resumes based on criteria"""
    filtered = stored_resumes.copy()
    
    # Filter by skills
    if filters.get('skills'):
        required_skills = [skill.lower() for skill in filters['skills']]
        filtered = [r for r in filtered if any(
            any(required_skill in skill.get('name', '').lower() for required_skill in required_skills)
            for skill in r.get('skills', [])
        )]
    
    # Filter by experience level (based on work experience count)
    if filters.get('experience_level'):
        exp_level = filters['experience_level'].lower()
        if exp_level == 'entry':
            filtered = [r for r in filtered if len(r.get('work_experience', [])) <= 1]
        elif exp_level == 'mid':
            filtered = [r for r in filtered if 2 <= len(r.get('work_experience', [])) <= 4]
        elif exp_level == 'senior':
            filtered = [r for r in filtered if len(r.get('work_experience', [])) >= 5]
    
    # Filter by education level
    if filters.get('education_level'):
        edu_level = filters['education_level'].lower()
        filtered = [r for r in filtered if any(
            edu_level in edu.get('degree', '').lower()
            for edu in r.get('education', [])
        )]
    
    return filtered

def filter_jobs(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Filter job descriptions based on criteria"""
    filtered = stored_job_descriptions.copy()
    
    # Filter by company
    if filters.get('company'):
        company = filters['company'].lower()
        filtered = [j for j in filtered if company in j.get('company', '').lower()]
    
    # Filter by location type
    if filters.get('location_type'):
        location_type = filters['location_type'].lower()
        filtered = [j for j in filtered if location_type == j.get('location_type', '').lower()]
    
    # Filter by experience level
    if filters.get('experience_level'):
        exp_level = filters['experience_level'].lower()
        filtered = [j for j in filtered if exp_level in j.get('experience_level', '').lower()]
    
    # Filter by department
    if filters.get('department'):
        department = filters['department'].lower()
        filtered = [j for j in filtered if department in j.get('department', '').lower()]
    
    # Filter by required skills
    if filters.get('required_skills'):
        required_skills = [skill.lower() for skill in filters['required_skills']]
        filtered = [j for j in filtered if any(
            any(required_skill in skill.lower() for required_skill in required_skills)
            for skill in j.get('required_skills', [])
        )]
    
    return filtered

@app.get("/")
async def root():
    return {
        "message": "Recruiter.AI Simple Search Backend",
        "status": "healthy",
        "features": [
            "Text-based search for resumes and jobs",
            "Filtering by multiple criteria",
            "Weighted scoring system",
            "No external dependencies required"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "simple-search-backend"}

@app.get("/api/search/resumes")
async def search_resumes_endpoint(
    q: Optional[str] = Query(None, description="Search query"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    experience_level: Optional[str] = Query(None, description="Experience level: entry, mid, senior"),
    education_level: Optional[str] = Query(None, description="Education level: bachelor, master, phd"),
    limit: int = Query(10, description="Maximum number of results")
):
    """Search and filter resumes"""
    try:
        # Build filters
        filters = {}
        if skills:
            filters['skills'] = [skill.strip() for skill in skills.split(',')]
        if experience_level:
            filters['experience_level'] = experience_level
        if education_level:
            filters['education_level'] = education_level
        
        # Apply filters first
        if filters:
            filtered_resumes = filter_resumes(filters)
        else:
            filtered_resumes = stored_resumes
        
        # Then apply search
        if q:
            # Temporarily replace stored_resumes with filtered ones for search
            original_resumes = stored_resumes.copy()
            stored_resumes.clear()
            stored_resumes.extend(filtered_resumes)
            
            results = search_resumes(q, limit)
            
            # Restore original resumes
            stored_resumes.clear()
            stored_resumes.extend(original_resumes)
        else:
            results = filtered_resumes[:limit]
        
        return {
            "results": results,
            "total": len(results),
            "query": q,
            "filters": filters,
            "message": f"Found {len(results)} resumes"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/search/jobs")
async def search_jobs_endpoint(
    q: Optional[str] = Query(None, description="Search query"),
    company: Optional[str] = Query(None, description="Company name"),
    location_type: Optional[str] = Query(None, description="Location type: remote, onsite, hybrid"),
    experience_level: Optional[str] = Query(None, description="Experience level"),
    department: Optional[str] = Query(None, description="Department"),
    required_skills: Optional[str] = Query(None, description="Comma-separated required skills"),
    limit: int = Query(10, description="Maximum number of results")
):
    """Search and filter job descriptions"""
    try:
        # Build filters
        filters = {}
        if company:
            filters['company'] = company
        if location_type:
            filters['location_type'] = location_type
        if experience_level:
            filters['experience_level'] = experience_level
        if department:
            filters['department'] = department
        if required_skills:
            filters['required_skills'] = [skill.strip() for skill in required_skills.split(',')]
        
        # Apply filters first
        if filters:
            filtered_jobs = filter_jobs(filters)
        else:
            filtered_jobs = stored_job_descriptions
        
        # Then apply search
        if q:
            # Temporarily replace stored_job_descriptions with filtered ones for search
            original_jobs = stored_job_descriptions.copy()
            stored_job_descriptions.clear()
            stored_job_descriptions.extend(filtered_jobs)
            
            results = search_jobs(q, limit)
            
            # Restore original jobs
            stored_job_descriptions.clear()
            stored_job_descriptions.extend(original_jobs)
        else:
            results = filtered_jobs[:limit]
        
        return {
            "results": results,
            "total": len(results),
            "query": q,
            "filters": filters,
            "message": f"Found {len(results)} job descriptions"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/search/suggestions")
async def get_search_suggestions(
    type: str = Query(..., description="Type: skills, companies, locations, departments"),
    q: Optional[str] = Query(None, description="Partial query for autocomplete")
):
    """Get search suggestions for autocomplete"""
    try:
        suggestions = set()
        
        if type == "skills":
            for resume in stored_resumes:
                for skill in resume.get('skills', []):
                    skill_name = skill.get('name', '')
                    if skill_name and (not q or q.lower() in skill_name.lower()):
                        suggestions.add(skill_name)
            
            for job in stored_job_descriptions:
                for skill in job.get('required_skills', []):
                    if skill and (not q or q.lower() in skill.lower()):
                        suggestions.add(skill)
        
        elif type == "companies":
            for job in stored_job_descriptions:
                company = job.get('company', '')
                if company and (not q or q.lower() in company.lower()):
                    suggestions.add(company)
        
        elif type == "locations":
            for job in stored_job_descriptions:
                location = job.get('location', '')
                if location and (not q or q.lower() in location.lower()):
                    suggestions.add(location)
        
        elif type == "departments":
            for job in stored_job_descriptions:
                department = job.get('department', '')
                if department and (not q or q.lower() in department.lower()):
                    suggestions.add(department)
        
        # Convert to sorted list and limit results
        suggestions_list = sorted(list(suggestions))[:20]
        
        return {
            "suggestions": suggestions_list,
            "type": type,
            "query": q,
            "total": len(suggestions_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

@app.get("/api/search/stats")
async def get_search_stats():
    """Get search statistics"""
    try:
        stats = {
            "total_resumes": len(stored_resumes),
            "total_jobs": len(stored_job_descriptions),
            "unique_skills": len(set(
                skill.get('name', '') for resume in stored_resumes
                for skill in resume.get('skills', [])
            )),
            "unique_companies": len(set(
                job.get('company', '') for job in stored_job_descriptions
                if job.get('company')
            )),
            "unique_locations": len(set(
                job.get('location', '') for job in stored_job_descriptions
                if job.get('location')
            )),
            "unique_departments": len(set(
                job.get('department', '') for job in stored_job_descriptions
                if job.get('department')
            ))
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get search stats: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8806)
