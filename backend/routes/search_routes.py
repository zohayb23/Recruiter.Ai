"""
Search Routes - Handle all search and semantic search endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import openai
from pymilvus import Collection

from ..services.milvus_service import milvus_connected
from ..utils.embeddings import get_embedding
from ..config.settings import settings

router = APIRouter(prefix="/api", tags=["Search"])

openai.api_key = settings.OPENAI_API_KEY

# Helper functions
async def enhance_search_query(query: str, filters: dict) -> dict:
    """Use AI to understand and enhance the search query"""
    try:
        prompt = f"""Analyze this search query and provide enhanced search capabilities. Return ONLY a valid JSON object:

{{
    "original_query": "{query}",
    "enhanced_query": "enhanced version of the query",
    "search_intent": "job_search|candidate_search|skill_search|company_search|general",
    "suggested_filters": {{
        "experience_level": "entry|mid|senior|lead",
        "location": "location if mentioned",
        "industry": "industry if mentioned",
        "skills": ["skill1", "skill2"],
        "company_size": "startup|mid|enterprise"
    }},
    "related_terms": ["related term 1", "related term 2"],
    "search_tips": ["tip 1", "tip 2"]
}}

Guidelines:
- Enhanced query: Expand abbreviations, add synonyms, clarify intent
- Search intent: Determine what the user is looking for
- Suggested filters: Extract filter criteria from the query
- Related terms: Suggest alternative search terms
- Search tips: Provide helpful search suggestions

Query: "{query}"
Filters: {filters}"""

        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search analyst. Analyze search queries and provide intelligent enhancements for better search results."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.2,
            timeout=20
        )
        
        generated_text = response.choices[0].message.content
        print(f"🧠 [EnhancedSearch] AI response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        enhanced_data = json.loads(json_str)
        
        return enhanced_data
        
    except Exception as e:
        print(f"❌ [EnhancedSearch] AI enhancement failed: {e}")
        # Fallback to basic enhancement
        return {
            "original_query": query,
            "enhanced_query": query,
            "search_intent": "general",
            "suggested_filters": {},
            "related_terms": [],
            "search_tips": ["Try using more specific terms", "Consider adding location or experience level"]
        }

async def perform_enhanced_semantic_search(query: str, search_type: str, limit: int, filters: dict):
    """Perform semantic search with enhanced query"""
    try:
        # Generate embedding for the enhanced query
        query_embedding = get_embedding(query)
        
        results = {
            "query": query,
            "search_type": search_type,
            "resumes": [],
            "jobs": [],
            "total_results": 0
        }
        
        if not milvus_connected:
            return {
                "message": "Milvus not connected, using fallback search",
                "results": results
            }
        
        # Search resumes if requested
        if search_type in ["resumes", "both"]:
            try:
                collection = Collection("resumes")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                resume_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "full_name", "email", "summary", "skills", "work_experience", "education"]
                )
                
                for hit in resume_results[0]:
                    resume_data = {
                        "resume_id": hit.entity.get("id"),
                        "full_name": hit.entity.get("full_name"),
                        "email": hit.entity.get("email"),
                        "summary": hit.entity.get("summary"),
                        "skills": json.loads(hit.entity.get("skills", "[]")) if isinstance(hit.entity.get("skills"), str) else hit.entity.get("skills", []),
                        "work_experience": json.loads(hit.entity.get("work_experience", "[]")) if isinstance(hit.entity.get("work_experience"), str) else hit.entity.get("work_experience", []),
                        "education": json.loads(hit.entity.get("education", "[]")) if isinstance(hit.entity.get("education"), str) else hit.entity.get("education", []),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance),
                        "ai_relevance_score": float(hit.score)
                    }
                    results["resumes"].append(resume_data)
                    
            except Exception as e:
                print(f"Error searching resumes: {e}")
        
        # Search jobs if requested
        if search_type in ["jobs", "both"]:
            try:
                collection = Collection("job_descriptions")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                job_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "title", "company", "overview", "required_skills", "responsibilities", "location", "experience_level"]
                )
                
                for hit in job_results[0]:
                    job_data = {
                        "job_id": hit.entity.get("id"),
                        "title": hit.entity.get("title"),
                        "company": hit.entity.get("company"),
                        "overview": hit.entity.get("overview"),
                        "required_skills": json.loads(hit.entity.get("required_skills", "[]")) if isinstance(hit.entity.get("required_skills"), str) else hit.entity.get("required_skills", []),
                        "responsibilities": json.loads(hit.entity.get("responsibilities", "[]")) if isinstance(hit.entity.get("responsibilities"), str) else hit.entity.get("responsibilities", []),
                        "location": hit.entity.get("location"),
                        "experience_level": hit.entity.get("experience_level"),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance),
                        "ai_relevance_score": float(hit.score)
                    }
                    results["jobs"].append(job_data)
                    
            except Exception as e:
                print(f"Error searching jobs: {e}")
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        return results
        
    except Exception as e:
        print(f"Error in enhanced semantic search: {e}")
        raise e

async def rank_and_summarize_results(search_results: dict, query_analysis: dict) -> dict:
    """Use AI to rank results and provide intelligent summaries"""
    try:
        # Prepare data for AI ranking
        all_results = []
        
        for resume in search_results.get("resumes", []):
            all_results.append({
                "type": "resume",
                "id": resume["resume_id"],
                "title": resume["full_name"],
                "content": f"{resume.get('summary', '')} Skills: {', '.join(resume.get('skills', [])[:5])}",
                "similarity_score": resume["similarity_score"]
            })
        
        for job in search_results.get("jobs", []):
            all_results.append({
                "type": "job",
                "id": job["job_id"],
                "title": job["title"],
                "content": f"{job.get('overview', '')} Skills: {', '.join(job.get('required_skills', [])[:5])}",
                "similarity_score": job["similarity_score"]
            })
        
        if not all_results:
            return search_results
        
        # Limit results for AI processing (to avoid token limits)
        results_for_ai = all_results[:20]
        
        prompt = f"""Rank and analyze these search results based on the query analysis. Return ONLY a valid JSON object:

{{
    "ranked_results": [
        {{
            "id": "result_id",
            "type": "resume|job",
            "ai_relevance_score": 0.95,
            "relevance_explanation": "Why this result is relevant",
            "key_highlights": ["highlight1", "highlight2"]
        }}
    ],
    "search_summary": "Brief summary of search results",
    "improvement_suggestions": ["suggestion1", "suggestion2"]
}}

Query Analysis: {query_analysis}
Results to rank: {json.dumps(results_for_ai, indent=2)}

Rank based on:
1. Relevance to the original query
2. Match quality with search intent
3. Key skills and experience alignment
4. Overall fit score

Provide AI relevance scores (0.0-1.0) and brief explanations for top results."""

        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search result analyst. Rank and analyze search results to provide the most relevant matches."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1200,
            temperature=0.1,
            timeout=25
        )
        
        generated_text = response.choices[0].message.content
        print(f"📊 [EnhancedSearch] AI ranking response: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in ranking response")
            
        json_str = generated_text[start_idx:end_idx]
        ranking_data = json.loads(json_str)
        
        # Apply AI rankings to results
        ranked_results = search_results.copy()
        
        # Update resume results with AI rankings
        for ranked_item in ranking_data.get("ranked_results", []):
            if ranked_item["type"] == "resume":
                for resume in ranked_results["resumes"]:
                    if resume["resume_id"] == ranked_item["id"]:
                        resume["ai_relevance_score"] = ranked_item.get("ai_relevance_score", resume["similarity_score"])
                        resume["relevance_explanation"] = ranked_item.get("relevance_explanation", "")
                        resume["key_highlights"] = ranked_item.get("key_highlights", [])
                        break
        
        # Update job results with AI rankings
        for ranked_item in ranking_data.get("ranked_results", []):
            if ranked_item["type"] == "job":
                for job in ranked_results["jobs"]:
                    if job["job_id"] == ranked_item["id"]:
                        job["ai_relevance_score"] = ranked_item.get("ai_relevance_score", job["similarity_score"])
                        job["relevance_explanation"] = ranked_item.get("relevance_explanation", "")
                        job["key_highlights"] = ranked_item.get("key_highlights", [])
                        break
        
        # Sort results by AI relevance score
        ranked_results["resumes"].sort(key=lambda x: x.get("ai_relevance_score", 0), reverse=True)
        ranked_results["jobs"].sort(key=lambda x: x.get("ai_relevance_score", 0), reverse=True)
        
        # Add AI analysis
        ranked_results["ai_analysis"] = {
            "search_summary": ranking_data.get("search_summary", ""),
            "improvement_suggestions": ranking_data.get("improvement_suggestions", [])
        }
        
        return ranked_results
        
    except Exception as e:
        print(f"❌ [EnhancedSearch] AI ranking failed: {e}")
        return search_results

@router.post("/search/enhanced")
async def enhanced_search(request_data: dict):
    """Enhanced search with AI query processing and intelligent result ranking"""
    print(f"🔍 [EnhancedSearch] Received request: {request_data}")
    
    try:
        query = request_data.get("query", "").strip()
        search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
        limit = request_data.get("limit", 10)
        filters = request_data.get("filters", {})
        
        if not query:
            return {
                "success": False,
                "error": "Search query is required"
            }
        
        # AI-powered query understanding and enhancement
        try:
            enhanced_query_data = await enhance_search_query(query, filters)
            print(f"🧠 [EnhancedSearch] AI-enhanced query: {enhanced_query_data}")
        except Exception as e:
            print(f"⚠️ [EnhancedSearch] AI enhancement failed, using original query: {e}")
            enhanced_query_data = {
                "original_query": query,
                "enhanced_query": query,
                "search_intent": "general",
                "suggested_filters": {},
                "related_terms": []
            }
        
        # Perform semantic search with enhanced query
        search_results = await perform_enhanced_semantic_search(
            enhanced_query_data["enhanced_query"],
            search_type,
            limit,
            filters
        )
        
        # AI-powered result ranking and summarization
        try:
            ranked_results = await rank_and_summarize_results(search_results, enhanced_query_data)
            print(f"📊 [EnhancedSearch] AI-ranked results: {len(ranked_results.get('resumes', []))} resumes, {len(ranked_results.get('jobs', []))} jobs")
        except Exception as e:
            print(f"⚠️ [EnhancedSearch] AI ranking failed, using original results: {e}")
            ranked_results = search_results
        
        return {
            "success": True,
            "query_analysis": enhanced_query_data,
            "results": ranked_results,
            "total_results": ranked_results.get("total_results", 0),
            "message": f"Enhanced search completed for '{query}'"
        }
        
    except Exception as e:
        print(f"❌ [EnhancedSearch] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/search/semantic")
async def semantic_search(request_data: dict):
    """Perform semantic search across resumes and job descriptions"""
    query_text = request_data.get("query", "")
    search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
    limit = request_data.get("limit", 10)
    
    if not query_text.strip():
        raise HTTPException(status_code=400, detail="Query text is required")
    
    try:
        # Generate embedding for the query
        query_embedding = get_embedding(query_text)
        
        results = {
            "query": query_text,
            "search_type": search_type,
            "resumes": [],
            "jobs": [],
            "total_results": 0
        }
        
        if not milvus_connected:
            return {
                "message": "Milvus not connected, using fallback search",
                "results": results
            }
        
        # Search resumes if requested
        if search_type in ["resumes", "both"]:
            try:
                collection = Collection("resumes")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                resume_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "full_name", "email", "summary", "skills", "work_experience"]
                )
                
                for hit in resume_results[0]:
                    resume_data = {
                        "resume_id": hit.entity.get("id"),
                        "full_name": hit.entity.get("full_name"),
                        "email": hit.entity.get("email"),
                        "summary": hit.entity.get("summary"),
                        "skills": json.loads(hit.entity.get("skills", "[]")) if isinstance(hit.entity.get("skills"), str) else hit.entity.get("skills", []),
                        "work_experience": json.loads(hit.entity.get("work_experience", "[]")) if isinstance(hit.entity.get("work_experience"), str) else hit.entity.get("work_experience", []),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance)
                    }
                    results["resumes"].append(resume_data)
                    
            except Exception as e:
                print(f"Error searching resumes: {e}")
        
        # Search jobs if requested
        if search_type in ["jobs", "both"]:
            try:
                collection = Collection("job_descriptions")
                collection.load()
                
                search_params = {
                    "metric_type": "L2",
                    "params": {"nprobe": 10}
                }
                
                job_results = collection.search(
                    data=[query_embedding],
                    anns_field="embedding",
                    param=search_params,
                    limit=limit,
                    output_fields=["id", "title", "company", "overview", "required_skills", "responsibilities"]
                )
                
                for hit in job_results[0]:
                    job_data = {
                        "job_id": hit.entity.get("id"),
                        "title": hit.entity.get("title"),
                        "company": hit.entity.get("company"),
                        "overview": hit.entity.get("overview"),
                        "required_skills": json.loads(hit.entity.get("required_skills", "[]")) if isinstance(hit.entity.get("required_skills"), str) else hit.entity.get("required_skills", []),
                        "responsibilities": json.loads(hit.entity.get("responsibilities", "[]")) if isinstance(hit.entity.get("responsibilities"), str) else hit.entity.get("responsibilities", []),
                        "similarity_score": float(hit.score),
                        "distance": float(hit.distance)
                    }
                    results["jobs"].append(job_data)
                    
            except Exception as e:
                print(f"Error searching jobs: {e}")
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        
        return {
            "success": True,
            "results": results,
            "message": f"Found {results['total_results']} results for '{query_text}'"
        }
        
    except Exception as e:
        print(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

@router.post("/search/similar-resumes")
async def find_similar_resumes(request_data: dict):
    """Find resumes similar to a given resume"""
    try:
        resume_id = request_data.get("resume_id", "")
        limit = request_data.get("limit", 5)
        
        if not resume_id:
            raise HTTPException(status_code=400, detail="Resume ID is required")
        
        if not milvus_connected:
            return {"message": "Milvus not connected", "similar_resumes": []}
        
        # Get the target resume's embedding
        collection = Collection("resumes")
        collection.load()
        
        target_resume = collection.query(
            expr=f'id == "{resume_id}"',
            output_fields=["id", "embedding", "full_name", "summary"]
        )
        
        if not target_resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        target_embedding = target_resume[0]["embedding"]
        
        # Search for similar resumes
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        similar_results = collection.search(
            data=[target_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit + 1,  # +1 to exclude the target resume itself
            output_fields=["id", "full_name", "summary", "skills"]
        )
        
        similar_resumes = []
        for hit in similar_results[0]:
            if hit.entity.get("id") != resume_id:  # Exclude the target resume
                similar_resume = {
                    "resume_id": hit.entity.get("id"),
                    "full_name": hit.entity.get("full_name"),
                    "summary": hit.entity.get("summary"),
                    "skills": json.loads(hit.entity.get("skills", "[]")) if isinstance(hit.entity.get("skills"), str) else hit.entity.get("skills", []),
                    "similarity_score": float(hit.score),
                    "distance": float(hit.distance)
                }
                similar_resumes.append(similar_resume)
        
        return {
            "success": True,
            "target_resume_id": resume_id,
            "similar_resumes": similar_resumes,
            "message": f"Found {len(similar_resumes)} similar resumes"
        }
        
    except Exception as e:
        print(f"Error finding similar resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find similar resumes: {str(e)}")

@router.post("/search/similar-jobs")
async def find_similar_jobs(request_data: dict):
    """Find jobs similar to a given job"""
    try:
        job_id = request_data.get("job_id", "")
        limit = request_data.get("limit", 5)
        
        if not job_id:
            raise HTTPException(status_code=400, detail="Job ID is required")
        
        if not milvus_connected:
            return {"message": "Milvus not connected", "similar_jobs": []}
        
        # Get the target job's embedding
        collection = Collection("job_descriptions")
        collection.load()
        
        target_job = collection.query(
            expr=f'id == "{job_id}"',
            output_fields=["id", "embedding", "title", "overview"]
        )
        
        if not target_job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        target_embedding = target_job[0]["embedding"]
        
        # Search for similar jobs
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        similar_results = collection.search(
            data=[target_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit + 1,  # +1 to exclude the target job itself
            output_fields=["id", "title", "company", "overview", "required_skills"]
        )
        
        similar_jobs = []
        for hit in similar_results[0]:
            if hit.entity.get("id") != job_id:  # Exclude the target job
                similar_job = {
                    "job_id": hit.entity.get("id"),
                    "title": hit.entity.get("title"),
                    "company": hit.entity.get("company"),
                    "overview": hit.entity.get("overview"),
                    "required_skills": json.loads(hit.entity.get("required_skills", "[]")) if isinstance(hit.entity.get("required_skills"), str) else hit.entity.get("required_skills", []),
                    "similarity_score": float(hit.score),
                    "distance": float(hit.distance)
                }
                similar_jobs.append(similar_job)
        
        return {
            "success": True,
            "target_job_id": job_id,
            "similar_jobs": similar_jobs,
            "message": f"Found {len(similar_jobs)} similar jobs"
        }
        
    except Exception as e:
        print(f"Error finding similar jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to find similar jobs: {str(e)}")

# AI-Enhanced Semantic Search (more advanced)
async def analyze_search_query_advanced(query: str, search_type: str, filters: dict) -> dict:
    """Use AI to analyze and enhance search queries - Advanced version"""
    try:
        prompt = f"""Analyze this search query and provide intelligent search enhancement. Return ONLY a valid JSON object:

{{
    "original_query": "{query}",
    "enhanced_query": "improved version of the query",
    "search_intent": "job_search|candidate_search|skill_search|company_search|general",
    "key_concepts": ["concept1", "concept2", "concept3"],
    "extracted_skills": ["skill1", "skill2", "skill3"],
    "extracted_experience": "entry|junior|mid|senior|lead|any",
    "extracted_location": "location or remote",
    "extracted_company": "company name if mentioned",
    "suggested_filters": {{
        "experience_level": "entry|junior|mid|senior|lead",
        "location": "specific location or remote",
        "skills": ["skill1", "skill2"],
        "industry": "industry name",
        "company_size": "startup|small|medium|large|enterprise"
    }},
    "search_strategy": "semantic|keyword|hybrid",
    "related_terms": ["term1", "term2", "term3"],
    "search_tips": ["tip1", "tip2", "tip3"],
    "confidence_score": 85
}}

Guidelines:
- Enhanced query: Improve clarity, add synonyms, expand abbreviations
- Search intent: Determine what the user is looking for
- Key concepts: Extract main themes and requirements
- Extracted fields: Parse specific information from the query
- Suggested filters: Recommend filters based on query content
- Search strategy: Recommend best search approach
- Related terms: Suggest alternative search terms
- Search tips: Provide helpful suggestions for better results
- Confidence score: How confident you are in the analysis (0-100)

Query: "{query}"
Search Type: {search_type}
Filters: {filters}"""

        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search analyst and recruitment specialist. Analyze search queries to provide intelligent enhancements for better search results."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.2,
            timeout=25
        )
        
        generated_text = response.choices[0].message.content
        print(f"🧠 [SemanticSearchAI] Query analysis: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        analysis_data = json.loads(json_str)
        
        return analysis_data
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Query analysis failed: {e}")
        return {
            "original_query": query,
            "enhanced_query": query,
            "search_intent": "general",
            "key_concepts": [],
            "extracted_skills": [],
            "extracted_experience": "any",
            "extracted_location": "",
            "extracted_company": "",
            "suggested_filters": {},
            "search_strategy": "semantic",
            "related_terms": [],
            "search_tips": [],
            "confidence_score": 50
        }

async def search_resumes_enhanced(query: str, limit: int, filters: dict, search_strategy: str) -> list:
    """Enhanced resume search with AI analysis"""
    try:
        if not milvus_connected:
            print("⚠️ [SemanticSearchAI] Milvus not connected, using fallback")
            return []
        
        collection = Collection("resumes")
        collection.load()
        
        # Generate embedding for the enhanced query
        query_embedding = get_embedding(query)
        
        # Build search expression with filters
        search_expr = "id != ''"
        if filters.get("experience_level"):
            search_expr += f" AND experience_level == '{filters['experience_level']}'"
        if filters.get("location"):
            search_expr += f" AND location LIKE '%{filters['location']}%'"
        
        # Perform vector search
        search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            expr=search_expr,
            output_fields=["*"]
        )
        
        resumes = []
        for hit in results[0]:
            result = hit.entity
            resume_data = {
                "id": result.get("id", ""),
                "full_name": result.get("full_name", ""),
                "email": result.get("email", ""),
                "phone": result.get("phone", ""),
                "summary": result.get("summary", ""),
                "skills": json.loads(result.get("skills", "[]")) if isinstance(result.get("skills"), str) else result.get("skills", []),
                "education": json.loads(result.get("education", "[]")) if isinstance(result.get("education"), str) else result.get("education", []),
                "work_experience": json.loads(result.get("work_experience", "[]")) if isinstance(result.get("work_experience"), str) else result.get("work_experience", []),
                "similarity_score": float(hit.score),
                "match_reason": f"Semantic similarity: {float(hit.score):.3f}"
            }
            resumes.append(resume_data)
        
        return resumes
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Resume search failed: {e}")
        return []

async def search_jobs_enhanced(query: str, limit: int, filters: dict, search_strategy: str) -> list:
    """Enhanced job search with AI analysis"""
    try:
        if not milvus_connected:
            print("⚠️ [SemanticSearchAI] Milvus not connected, using fallback")
            return []
        
        collection = Collection("job_descriptions")
        collection.load()
        
        # Generate embedding for the enhanced query
        query_embedding = get_embedding(query)
        
        # Build search expression with filters
        search_expr = "id != ''"
        if filters.get("experience_level"):
            search_expr += f" AND experience_level == '{filters['experience_level']}'"
        if filters.get("location"):
            search_expr += f" AND location LIKE '%{filters['location']}%'"
        if filters.get("company"):
            search_expr += f" AND company LIKE '%{filters['company']}%'"
        
        # Perform vector search
        search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=limit,
            expr=search_expr,
            output_fields=["*"]
        )
        
        jobs = []
        for hit in results[0]:
            result = hit.entity
            job_data = {
                "id": result.get("id", ""),
                "title": result.get("title", ""),
                "company": result.get("company", ""),
                "location": result.get("location", ""),
                "experience_level": result.get("experience_level", ""),
                "overview": result.get("overview", ""),
                "required_skills": json.loads(result.get("required_skills", "[]")) if isinstance(result.get("required_skills"), str) else result.get("required_skills", []),
                "preferred_skills": json.loads(result.get("preferred_skills", "[]")) if isinstance(result.get("preferred_skills"), str) else result.get("preferred_skills", []),
                "responsibilities": json.loads(result.get("responsibilities", "[]")) if isinstance(result.get("responsibilities"), str) else result.get("responsibilities", []),
                "qualifications": json.loads(result.get("qualifications", "[]")) if isinstance(result.get("qualifications"), str) else result.get("qualifications", []),
                "similarity_score": float(hit.score),
                "match_reason": f"Semantic similarity: {float(hit.score):.3f}"
            }
            jobs.append(job_data)
        
        return jobs
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Job search failed: {e}")
        return []

async def perform_ai_enhanced_semantic_search(query_analysis: dict, search_type: str, limit: int, filters: dict, search_mode: str) -> dict:
    """Perform enhanced semantic search using AI analysis"""
    try:
        enhanced_query = query_analysis.get("enhanced_query", query_analysis.get("original_query", ""))
        search_strategy = query_analysis.get("search_strategy", "semantic")
        
        # Combine suggested filters with provided filters
        suggested_filters = query_analysis.get("suggested_filters", {})
        combined_filters = {**filters, **suggested_filters}
        
        results = {"resumes": [], "jobs": [], "total_results": 0}
        
        if search_type in ["resumes", "both"]:
            # Search resumes using enhanced query
            resume_results = await search_resumes_enhanced(enhanced_query, limit, combined_filters, search_strategy)
            results["resumes"] = resume_results
        
        if search_type in ["jobs", "both"]:
            # Search jobs using enhanced query
            job_results = await search_jobs_enhanced(enhanced_query, limit, combined_filters, search_strategy)
            results["jobs"] = job_results
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        
        return {
            "query": enhanced_query,
            "search_type": search_type,
            "search_strategy": search_strategy,
            "results": results,
            "total_results": results["total_results"]
        }
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Enhanced search failed: {e}")
        # Fallback to basic search
        return await perform_basic_semantic_search(query_analysis.get("original_query", ""), search_type, limit, filters)

async def perform_basic_semantic_search(query: str, search_type: str, limit: int, filters: dict) -> dict:
    """Fallback basic semantic search when AI enhancement fails"""
    print(f"🔄 [SemanticSearchAI] Using basic semantic search")
    
    try:
        if not milvus_connected:
            return {
                "query": query,
                "search_type": search_type,
                "results": {"resumes": [], "jobs": [], "total_results": 0},
                "total_results": 0,
                "message": "Milvus not connected, using fallback search"
            }
        
        results = {"resumes": [], "jobs": [], "total_results": 0}
        
        if search_type in ["resumes", "both"]:
            # Basic resume search
            resume_results = await search_resumes_enhanced(query, limit, filters, "semantic")
            results["resumes"] = resume_results
        
        if search_type in ["jobs", "both"]:
            # Basic job search
            job_results = await search_jobs_enhanced(query, limit, filters, "semantic")
            results["jobs"] = job_results
        
        results["total_results"] = len(results["resumes"]) + len(results["jobs"])
        
        return {
            "query": query,
            "search_type": search_type,
            "results": results,
            "total_results": results["total_results"],
            "message": "Basic semantic search completed"
        }
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Basic search failed: {e}")
        return {
            "query": query,
            "search_type": search_type,
            "results": {"resumes": [], "jobs": [], "total_results": 0},
            "total_results": 0,
            "error": str(e)
        }

async def enhance_search_results(search_results: dict, query_analysis: dict) -> dict:
    """Use AI to enhance and rank search results"""
    try:
        enhanced_query = query_analysis.get("enhanced_query", "")
        search_intent = query_analysis.get("search_intent", "general")
        key_concepts = query_analysis.get("key_concepts", [])
        
        # Prepare results for AI analysis
        results_summary = {
            "total_resumes": len(search_results.get("results", {}).get("resumes", [])),
            "total_jobs": len(search_results.get("results", {}).get("jobs", [])),
            "sample_resumes": search_results.get("results", {}).get("resumes", [])[:3],  # First 3 for analysis
            "sample_jobs": search_results.get("results", {}).get("jobs", [])[:3]  # First 3 for analysis
        }
        
        prompt = f"""Analyze these search results and provide intelligent ranking and insights. Return ONLY a valid JSON object:

{{
    "result_analysis": {{
        "relevance_score": 85,
        "quality_assessment": "high|medium|low",
        "coverage_analysis": "comprehensive|partial|limited",
        "key_insights": ["insight1", "insight2", "insight3"]
    }},
    "ranking_improvements": [
        {{
            "item_id": "resume_1",
            "item_type": "resume|job",
            "current_rank": 1,
            "suggested_rank": 2,
            "reason": "Better skill match found",
            "confidence": 80
        }}
    ],
    "result_summaries": {{
        "resumes": [
            {{
                "id": "resume_1",
                "summary": "Strong Python developer with 5 years experience",
                "key_highlights": ["Python expert", "Django experience", "Team lead"],
                "match_strength": "high|medium|low"
            }}
        ],
        "jobs": [
            {{
                "id": "job_1",
                "summary": "Senior Python Developer at TechCorp",
                "key_highlights": ["Remote work", "Senior level", "Python focus"],
                "match_strength": "high|medium|low"
            }}
        ]
    }},
    "search_suggestions": [
        "Try searching for 'Python Django developer' for more specific results",
        "Consider adding location filter for better targeting",
        "Look for 'Senior' level positions for more relevant matches"
    ],
    "alternative_queries": [
        "Python developer with Django experience",
        "Senior software engineer Python",
        "Full stack developer Python React"
    ],
    "confidence_metrics": {{
        "overall_confidence": 85,
        "result_quality": 80,
        "query_understanding": 90
    }}
}}

Guidelines:
- Analyze the relevance and quality of search results
- Suggest ranking improvements based on better matches
- Provide concise summaries for each result
- Offer search suggestions for better results
- Suggest alternative queries that might yield better results
- Provide confidence metrics for the analysis

Search Intent: {search_intent}
Enhanced Query: {enhanced_query}
Key Concepts: {key_concepts}

Search Results Summary:
{json.dumps(results_summary, indent=2)}"""

        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert search analyst and recruitment specialist. Analyze search results to provide intelligent insights and improvements."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.1,
            timeout=25
        )
        
        generated_text = response.choices[0].message.content
        print(f"📊 [SemanticSearchAI] AI enhancement: {generated_text[:200]}...")
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        enhancement_data = json.loads(json_str)
        
        # Apply ranking improvements to results
        enhanced_results = apply_ranking_improvements(search_results, enhancement_data)
        
        # Add AI insights to the results
        enhanced_results["ai_insights"] = enhancement_data
        
        return enhanced_results
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Result enhancement failed: {e}")
        return search_results

def apply_ranking_improvements(search_results: dict, enhancement_data: dict) -> dict:
    """Apply AI-suggested ranking improvements to search results"""
    try:
        ranking_improvements = enhancement_data.get("ranking_improvements", [])
        
        if not ranking_improvements:
            return search_results
        
        # Create a mapping of suggested improvements
        improvement_map = {}
        for improvement in ranking_improvements:
            item_id = improvement.get("item_id", "")
            suggested_rank = improvement.get("suggested_rank", 0)
            improvement_map[item_id] = suggested_rank
        
        # Apply improvements to resumes
        resumes = search_results.get("results", {}).get("resumes", [])
        if resumes:
            # Sort resumes based on AI suggestions
            resumes.sort(key=lambda x: improvement_map.get(x.get("id", ""), 999))
            search_results["results"]["resumes"] = resumes
        
        # Apply improvements to jobs
        jobs = search_results.get("results", {}).get("jobs", [])
        if jobs:
            # Sort jobs based on AI suggestions
            jobs.sort(key=lambda x: improvement_map.get(x.get("id", ""), 999))
            search_results["results"]["jobs"] = jobs
        
        return search_results
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Ranking application failed: {e}")
        return search_results

@router.post("/semantic-search/ai-enhanced")
async def ai_enhanced_semantic_search(request_data: dict):
    """AI-enhanced semantic search with intelligent query understanding and result ranking"""
    print(f"🔍 [SemanticSearchAI] Received request: {request_data}")
    
    try:
        query = request_data.get("query", "").strip()
        search_type = request_data.get("type", "both")  # "resumes", "jobs", or "both"
        limit = request_data.get("limit", 10)
        filters = request_data.get("filters", {})
        search_mode = request_data.get("search_mode", "hybrid")  # "semantic", "keyword", "hybrid"
        
        if not query:
            return {
                "success": False,
                "error": "Search query is required"
            }
        
        # AI-powered query analysis and enhancement
        try:
            query_analysis = await analyze_search_query_advanced(query, search_type, filters)
            print(f"🧠 [SemanticSearchAI] Query analysis: {query_analysis.get('search_intent', 'unknown')}")
        except Exception as e:
            print(f"⚠️ [SemanticSearchAI] Query analysis failed, using basic search: {e}")
            query_analysis = {
                "original_query": query,
                "enhanced_query": query,
                "search_intent": "general",
                "key_concepts": [],
                "suggested_filters": {},
                "search_strategy": "semantic"
            }
        
        # Perform enhanced semantic search
        search_results = await perform_ai_enhanced_semantic_search(
            query_analysis, search_type, limit, filters, search_mode
        )
        
        # AI-powered result ranking and summarization
        try:
            enhanced_results = await enhance_search_results(search_results, query_analysis)
            print(f"📊 [SemanticSearchAI] Enhanced results: {len(enhanced_results.get('results', {}).get('resumes', []))} resumes, {len(enhanced_results.get('results', {}).get('jobs', []))} jobs")
        except Exception as e:
            print(f"⚠️ [SemanticSearchAI] Result enhancement failed, using original results: {e}")
            enhanced_results = search_results
        
        return {
            "success": True,
            "query_analysis": query_analysis,
            "results": enhanced_results,
            "search_mode": search_mode,
            "total_results": enhanced_results.get("total_results", 0),
            "message": f"AI-enhanced semantic search completed for '{query}'"
        }
        
    except Exception as e:
        print(f"❌ [SemanticSearchAI] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

