from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn

from services.search import SearchService
from services.skill_embeddings import SkillEmbeddingsService
from services.skill_ratings import SkillRatingSystem

app = FastAPI(title="Recruiter.AI API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
search_service = SearchService()
skill_service = SkillEmbeddingsService()
skill_rating_service = SkillRatingSystem()

# Models
class QueryTerm(BaseModel):
    value: str
    operator: str  # AND, OR, NOT

class QueryGroup(BaseModel):
    operator: str  # AND, OR
    terms: List[QueryTerm]
    parentheses: bool

class SearchRequest(BaseModel):
    query_groups: List[QueryGroup]
    page: Optional[int] = 1
    size: Optional[int] = 20

class DenseSearchRequest(BaseModel):
    query: str
    threshold: Optional[float] = 0.7
    top_k: Optional[int] = 10

class SkillRatingRequest(BaseModel):
    job_description: Optional[str] = None
    required_skills: Optional[List[str]] = None

class SearchTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    groups: List[QueryGroup]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SearchResponse(BaseModel):
    total: int
    results: List[Dict[str, Any]]
    page: int
    size: int
    error: Optional[str] = None

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Recruiter.AI API"}

# Boolean Search Endpoints
@app.post("/api/search/boolean")
async def boolean_search(request: SearchRequest):
    try:
        results = await search_service.search_candidates(
            request.query_groups,
            request.page,
            request.size
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Full Text Search Endpoint
@app.get("/api/search/fulltext")
async def fulltext_search(query: str, source: Optional[str] = None, top_k: Optional[int] = 10):
    try:
        from services.full_text_search import search_resumes
        results = search_resumes(query, top_k=top_k, source=source)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dense/Semantic Search Endpoint
@app.post("/api/search/dense")
async def dense_search(request: DenseSearchRequest):
    try:
        from services.dense_search import dense_search
        results = dense_search(
            request.query,
            threshold=request.threshold,
            top_k=request.top_k
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Skills Rating Endpoint
@app.post("/api/search/skills")
async def rate_skills(request: SkillRatingRequest):
    try:
        results = skill_rating_service.rate_resumes(
            job_description=request.job_description,
            required_skills=request.required_skills
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Skills Suggestion Endpoints
@app.get("/api/skills/suggest/{skill}")
async def suggest_skills(skill: str):
    try:
        suggestions = skill_service.get_skill_suggestions(skill)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/skills/similar/{skill}")
async def similar_skills(skill: str, top_k: int = 5):
    try:
        similar = skill_service.get_similar_skills(skill, top_k=top_k)
        return {"similar_skills": similar}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For development/testing
@app.post("/api/index/candidate")
async def index_candidate(candidate: Dict[str, Any]):
    try:
        result = await search_service.index_candidate(candidate)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/templates")
async def create_template(template: SearchTemplate):
    try:
        # TODO: Implement template creation in database
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/templates")
async def get_templates():
    try:
        # TODO: Implement template retrieval from database
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 