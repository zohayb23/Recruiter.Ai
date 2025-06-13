from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import docx
import pdfplumber
import aiofiles
from datetime import datetime
import uvicorn
from fastapi.responses import JSONResponse, FileResponse
import logging
import sys
import io
from docx2pdf import convert
import tempfile
from pathlib import Path
import nltk

from services.full_text_search import search_resumes
from services.dense_search import semantic_search
from services.skill_ratings import rate_skills
from services.boolean_search import boolean_search
from services.search_utils import process_search_result

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('averaged_perceptron_tagger')
except Exception as e:
    logging.error(f"Error downloading NLTK data: {str(e)}")

app = FastAPI(title="Recruiter.AI API")

# Enable CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "*"  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handling middleware
@app.middleware("http")
async def add_error_handling(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Error handling request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)},
        )

# Ensure directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("../csv_resumes", exist_ok=True)
os.makedirs("../docx_resumes", exist_ok=True)
os.makedirs("../pdf_resumes", exist_ok=True)

# Models
class SearchRequest(BaseModel):
    query: str
    use_boolean: bool = False
    terms: Optional[List[str]] = None
    top_k: Optional[int] = Field(default=10, ge=1)

class CombinedSearchRequest(BaseModel):
    query: str
    searchTypes: Dict[str, bool] = Field(default_factory=lambda: {
        "fulltext": True,
        "semantic": False,
        "skills": False
    })
    weights: Dict[str, float] = Field(default_factory=lambda: {
        "fulltext": 1.0,
        "semantic": 0.0,
        "skills": 0.0
    })
    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=10, ge=1, le=100)
    top_k: Optional[int] = Field(default=None)

class SkillRatingRequest(BaseModel):
    required_skills: List[str]

# Full Text Search Endpoint
@app.post("/api/search/fulltext")
async def fulltext_search(request: SearchRequest):
    try:
        logger.info(f"Full text search request received for query: {request.query}")
        logger.info(f"Boolean search: {request.use_boolean}, Terms: {request.terms}")
        
        results = search_resumes(
            query=request.query,
            use_boolean=request.use_boolean,
            terms=request.terms if request.use_boolean else None,
            top_k=request.top_k
        )
        return results
    except Exception as e:
        logger.error(f"Error in full text search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Semantic Search Endpoint
@app.post("/api/search/semantic")
async def semantic_search_endpoint(request: SearchRequest):
    try:
        logger.info(f"Semantic search request received for query: {request.query}")
        results = semantic_search(request.query, top_k=request.top_k)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error in semantic search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Boolean Search Endpoint
@app.post("/api/search/boolean")
async def boolean_search_endpoint(request: SearchRequest):
    try:
        logger.info(f"Boolean search request received for query: {request.query}")
        if not request.terms:
            raise HTTPException(status_code=400, detail="Terms are required for boolean search")
        results = boolean_search(request.terms, top_k=request.top_k)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error in boolean search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Combined Search Endpoint
@app.post("/api/search/combined")
async def combined_search(request: CombinedSearchRequest):
    try:
        logger.info(f"Combined search request received: {request}")
        results = []
        final_results = {}
        query = request.query.strip()
        top_k = request.top_k or request.pageSize

        if not query:
            return {
                "results": [],
                "total": 0,
                "page": request.page,
                "pageSize": request.pageSize
            }

        # Extract skills from query for matching
        query_skills = [skill.strip() for skill in query.split() if len(skill.strip()) > 2]

        # Perform searches based on enabled types
        if request.searchTypes.get("fulltext", False):
            weight = request.weights.get("fulltext", 0)
            if weight > 0:
                try:
                    from services.full_text_search import search_resumes as fulltext_search
                    fulltext_results = fulltext_search(query=query, top_k=top_k)
                    logger.info(f"Fulltext search found {len(fulltext_results)} results")
                    for result in fulltext_results:
                        if not isinstance(result, dict):
                            continue
                        result["match_score"] = float(result.get("score", 0)) * weight
                        result = process_search_result(result, query_skills)
                        key = result["filename"]
                        if key not in final_results:
                            final_results[key] = result
                        else:
                            final_results[key]["match_score"] += result["match_score"]
                except Exception as e:
                    logger.error(f"Fulltext search error: {str(e)}")

        if request.searchTypes.get("semantic", False):
            weight = request.weights.get("semantic", 0)
            if weight > 0:
                try:
                    from services.dense_search import semantic_search
                    semantic_results = semantic_search(query=query, top_k=top_k)
                    logger.info(f"Semantic search found {len(semantic_results)} results")
                    for result in semantic_results:
                        if not isinstance(result, dict):
                            continue
                        result["match_score"] = float(result.get("score", 0)) * weight
                        result = process_search_result(result, query_skills)
                        key = result["filename"]
                        if key not in final_results:
                            final_results[key] = result
                        else:
                            final_results[key]["match_score"] += result["match_score"]
                except Exception as e:
                    logger.error(f"Semantic search error: {str(e)}")

        if request.searchTypes.get("skills", False):
            weight = request.weights.get("skills", 0)
            if weight > 0:
                try:
                    from services.skill_ratings import rate_skills
                    skills_results = rate_skills(query.split(), top_k=top_k)
                    logger.info(f"Skills search found {len(skills_results)} results")
                    for result in skills_results:
                        if not isinstance(result, dict):
                            continue
                        result["match_score"] = float(result.get("score", 0)) * weight
                        result = process_search_result(result, query_skills)
                        key = result["filename"]
                        if key not in final_results:
                            final_results[key] = result
                        else:
                            final_results[key]["match_score"] += result["match_score"]
                except Exception as e:
                    logger.error(f"Skills search error: {str(e)}")

        # Convert final_results to list and sort by score
        results = list(final_results.values())
        results.sort(key=lambda x: x["match_score"], reverse=True)

        # Calculate total results and paginate
        total_results = len(results)
        start_idx = (request.page - 1) * request.pageSize
        end_idx = start_idx + request.pageSize
        paginated_results = results[start_idx:end_idx] if results else []

        response_data = {
            "results": paginated_results,
            "total": total_results,
            "page": request.page,
            "pageSize": request.pageSize
        }
        
        logger.info(f"Returning {len(paginated_results)} results (total: {total_results})")
        return response_data

    except Exception as e:
        logger.error(f"Combined search error: {str(e)}")
        return {
            "results": [],
            "total": 0,
            "page": request.page,
            "pageSize": request.pageSize,
            "error": str(e)
        }

# Skills Rating Endpoint
@app.post("/api/search/skills")
async def skills_rating(request: SkillRatingRequest):
    try:
        logger.info(f"Skills rating request received for skills: {request.required_skills}")
        results = rate_skills(request.required_skills)
        return {"results": results}
    except Exception as e:
        logger.error(f"Error in skills rating: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Resume View Endpoint
@app.get("/api/resume/view/{filename}")
async def view_resume(filename: str):
    try:
        # Clean the filename and decode URL encoding
        filename = filename.replace("%20", " ")
        
        # Get absolute paths to resume directories
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_dir = os.path.join(parent_dir, "pdf_resumes")
        docx_dir = os.path.join(parent_dir, "docx_resumes")
        temp_dir = os.path.join(parent_dir, "temp")
        
        # Ensure directories exist
        os.makedirs(pdf_dir, exist_ok=True)
        os.makedirs(docx_dir, exist_ok=True)
        os.makedirs(temp_dir, exist_ok=True)

        # Determine file path and type
        if filename.lower().endswith('.pdf'):
            file_path = os.path.join(pdf_dir, filename)
            media_type = 'application/pdf'
            needs_conversion = False
        elif filename.lower().endswith('.docx'):
            file_path = os.path.join(docx_dir, filename)
            pdf_filename = filename.rsplit('.', 1)[0] + '.pdf'
            output_path = os.path.join(temp_dir, pdf_filename)
            media_type = 'application/pdf'
            needs_conversion = True
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # Verify original file exists
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"Resume not found: {filename}")
        
        if not (file_path.startswith(pdf_dir) or file_path.startswith(docx_dir)):
            raise HTTPException(status_code=403, detail="Access denied")

        if needs_conversion:
            try:
                # Convert DOCX to PDF using python-docx-pdf
                if not os.path.exists(output_path):
                    logger.info(f"Converting {filename} to PDF...")
                    convert(file_path, output_path)
                file_path = output_path
            except Exception as e:
                logger.error(f"Error converting file {filename}: {str(e)}")
                # If conversion fails, try to serve the original DOCX
                file_path = os.path.join(docx_dir, filename)
                media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

        # Return file response with inline content disposition
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=filename,
            headers={
                'Content-Disposition': 'inline',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Expose-Headers': 'Content-Disposition'
            }
        )

    except Exception as e:
        logger.error(f"Error serving resume file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 