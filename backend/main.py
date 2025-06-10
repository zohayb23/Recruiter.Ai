from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn

from services.search import SearchService
from services.skill_embeddings import SkillEmbeddingsService, SkillSuggestionService

app = FastAPI(title="Recruiter.AI API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
search_service = SearchService()
skill_service = SkillEmbeddingsService()
skill_suggestion_service = SkillSuggestionService()

# Models
class QueryTerm(BaseModel):
    value: str
    operator: str  # AND, OR, NOT

class QueryGroup(BaseModel):
    terms: List[QueryTerm]
    operator: str  # AND, OR
    parentheses: Optional[bool] = False

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

class SkillQuery(BaseModel):
    skill: str
    threshold: Optional[float] = 0.7

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Recruiter.AI API"}

@app.post("/api/search", response_model=SearchResponse)
async def search(query: List[QueryGroup], page: int = 1, size: int = 20):
    try:
        return await search_service.search_candidates(
            [group.dict() for group in query],
            page=page,
            size=size
        )
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

@app.post("/api/skills/suggestions")
async def get_skill_suggestions(query: SkillQuery):
    """Get skill suggestions including synonyms and related skills"""
    try:
        suggestions = skill_suggestion_service.get_skill_suggestions(
            query.skill,
            query.threshold
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/skills/did-you-mean")
async def get_did_you_mean(query: SkillQuery):
    """Get 'Did you mean...' suggestions for potentially misspelled skills"""
    try:
        suggestions = skill_suggestion_service.did_you_mean(
            query.skill,
            query.threshold
        )
        return {"suggestions": suggestions}
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 