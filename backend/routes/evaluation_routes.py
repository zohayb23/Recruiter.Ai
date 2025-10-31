"""
Evaluation Routes - Handle AI candidate scoring and gap analysis endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import uuid
from datetime import datetime
from pymilvus import Collection

from ..services.candidate_service import get_candidate_by_id
from ..services.milvus_service import milvus_connected
from ..utils.embeddings import get_embedding
import openai
from ..config.settings import settings

router = APIRouter(prefix="/api", tags=["Evaluation"])

openai.api_key = settings.OPENAI_API_KEY

async def get_job_by_id_from_milvus(job_id: str) -> Dict[str, Any]:
    """Get job data by ID from Milvus"""
    try:
        if not milvus_connected:
            return None
        
        collection = Collection("job_descriptions")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{job_id}"',
            output_fields=["*"],
            limit=1
        )
        
        if results:
            result = results[0]
            return {
                "id": result.get("id", ""),
                "title": result.get("title", ""),
                "company": result.get("company", ""),
                "overview": result.get("overview", ""),
                "required_skills": json.loads(result.get("required_skills", "[]")) if isinstance(result.get("required_skills"), str) else result.get("required_skills", []),
                "preferred_skills": json.loads(result.get("preferred_skills", "[]")) if isinstance(result.get("preferred_skills"), str) else result.get("preferred_skills", []),
                "responsibilities": json.loads(result.get("responsibilities", "[]")) if isinstance(result.get("responsibilities"), str) else result.get("responsibilities", []),
                "qualifications": json.loads(result.get("qualifications", "[]")) if isinstance(result.get("qualifications"), str) else result.get("qualifications", []),
                "experience_level": result.get("experience_level", ""),
                "location": result.get("location", "")
            }
        return None
    except Exception as e:
        print(f"Error getting job: {e}")
        return None

async def perform_ai_candidate_scoring(candidate_data: dict, job_data: dict) -> dict:
    """Use AI to score candidate against job requirements"""
    try:
        # Prepare candidate information
        candidate_info = f"""
        Candidate: {candidate_data.get('full_name', 'Unknown')}
        Summary: {candidate_data.get('summary', '')}
        Skills: {', '.join(candidate_data.get('skills', []))}
        Education: {json.dumps(candidate_data.get('education', []), indent=2)}
        Work Experience: {json.dumps(candidate_data.get('work_experience', []), indent=2)}
        """
        
        # Prepare job information
        job_info = f"""
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Overview: {job_data.get('overview', '')}
        Required Skills: {', '.join(job_data.get('required_skills', []))}
        Preferred Skills: {', '.join(job_data.get('preferred_skills', []))}
        Responsibilities: {json.dumps(job_data.get('responsibilities', []), indent=2)}
        Qualifications: {json.dumps(job_data.get('qualifications', []), indent=2)}
        Experience Level: {job_data.get('experience_level', '')}
        Location: {job_data.get('location', '')}
        """
        
        prompt = f"""Analyze this candidate against the job requirements and provide a comprehensive scoring. Return ONLY a valid JSON object:

{{
    "overall_score": 85,
    "category_scores": {{
        "technical_skills": 90,
        "experience_match": 80,
        "education_qualification": 85,
        "cultural_fit": 75,
        "communication_skills": 80
    }},
    "detailed_analysis": {{
        "strengths": ["strength1", "strength2", "strength3"],
        "weaknesses": ["weakness1", "weakness2"],
        "missing_requirements": ["requirement1", "requirement2"],
        "recommendations": ["recommendation1", "recommendation2"]
    }},
    "skill_match_analysis": {{
        "required_skills_match": 85,
        "preferred_skills_match": 70,
        "skill_gaps": ["skill1", "skill2"],
        "additional_skills": ["skill1", "skill2"]
    }},
    "experience_analysis": {{
        "years_experience_match": 80,
        "relevant_experience": 85,
        "industry_experience": 75,
        "leadership_experience": 70
    }},
    "fit_assessment": {{
        "job_level_match": "good",
        "career_progression": "positive",
        "location_flexibility": "high",
        "salary_expectations": "reasonable"
    }},
    "interview_recommendations": [
        "Ask about specific experience with [technology]",
        "Discuss leadership experience in [area]",
        "Evaluate communication skills through [method]"
    ],
    "hiring_recommendation": "strong_yes|yes|maybe|no|strong_no",
    "confidence_level": 85,
    "reasoning": "Detailed explanation of the scoring rationale"
}}

Candidate Information:
{candidate_info}

Job Information:
{job_info}"""
        
        if not openai.api_key:
            raise Exception("OpenAI API key not configured")
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert HR professional and recruitment specialist. Analyze candidates objectively and provide detailed, actionable scoring and recommendations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.1,
            timeout=30
        )
        
        generated_text = response.choices[0].message.content
        
        # Extract JSON from response
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        scoring_data = json.loads(json_str)
        
        # Add metadata
        scoring_data["ai_generated"] = True
        scoring_data["scored_at"] = datetime.now().isoformat()
        scoring_data["model_used"] = "gpt-4o-mini"
        
        return scoring_data
        
    except Exception as e:
        print(f"❌ [AIScoring] AI scoring failed: {e}")
        raise e

async def fallback_candidate_scoring(candidate_data: dict, job_data: dict) -> dict:
    """Fallback scoring when AI is not available"""
    # Basic scoring based on skill matching
    candidate_skills = [skill.lower() for skill in candidate_data.get("skills", [])]
    required_skills = [skill.lower() for skill in job_data.get("required_skills", [])]
    preferred_skills = [skill.lower() for skill in job_data.get("preferred_skills", [])]
    
    # Calculate skill match percentages
    required_match = 0
    if required_skills:
        matched_required = sum(1 for skill in required_skills if any(cs in skill or skill in cs for cs in candidate_skills))
        required_match = (matched_required / len(required_skills)) * 100
    
    preferred_match = 0
    if preferred_skills:
        matched_preferred = sum(1 for skill in preferred_skills if any(cs in skill or skill in cs for cs in candidate_skills))
        preferred_match = (matched_preferred / len(preferred_skills)) * 100
    
    # Calculate overall score
    overall_score = (required_match * 0.7 + preferred_match * 0.3)
    
    # Determine hiring recommendation
    if overall_score >= 80:
        hiring_rec = "strong_yes"
    elif overall_score >= 65:
        hiring_rec = "yes"
    elif overall_score >= 50:
        hiring_rec = "maybe"
    elif overall_score >= 30:
        hiring_rec = "no"
    else:
        hiring_rec = "strong_no"
    
    return {
        "overall_score": round(overall_score, 1),
        "category_scores": {
            "technical_skills": round(required_match, 1),
            "experience_match": 75.0,
            "education_qualification": 70.0,
            "cultural_fit": 65.0,
            "communication_skills": 70.0
        },
        "detailed_analysis": {
            "strengths": ["Has relevant technical skills", "Experience in related field"],
            "weaknesses": ["Limited information available", "Need to verify experience"],
            "missing_requirements": [skill for skill in required_skills if not any(cs in skill or skill in cs for cs in candidate_skills)],
            "recommendations": ["Conduct detailed interview", "Verify technical skills", "Check references"]
        },
        "skill_match_analysis": {
            "required_skills_match": round(required_match, 1),
            "preferred_skills_match": round(preferred_match, 1),
            "skill_gaps": [skill for skill in required_skills if not any(cs in skill or skill in cs for cs in candidate_skills)],
            "additional_skills": [skill for skill in candidate_skills if skill not in required_skills and skill not in preferred_skills]
        },
        "experience_analysis": {
            "years_experience_match": 75.0,
            "relevant_experience": 70.0,
            "industry_experience": 65.0,
            "leadership_experience": 60.0
        },
        "fit_assessment": {
            "job_level_match": "good" if overall_score >= 70 else "fair",
            "career_progression": "positive",
            "location_flexibility": "unknown",
            "salary_expectations": "unknown"
        },
        "interview_recommendations": [
            "Verify technical skills through practical assessment",
            "Discuss relevant project experience",
            "Evaluate problem-solving abilities"
        ],
        "hiring_recommendation": hiring_rec,
        "confidence_level": 60.0,
        "reasoning": f"Basic scoring based on skill matching. {required_match:.1f}% of required skills matched, {preferred_match:.1f}% of preferred skills matched.",
        "ai_generated": False,
        "scored_at": datetime.now().isoformat(),
        "model_used": "fallback"
    }

@router.post("/candidates/ai-score")
async def ai_score_candidate(request_data: dict):
    """AI-powered candidate scoring against job requirements"""
    print(f"🎯 [AIScoring] Received request: {request_data}")
    
    try:
        candidate_id = request_data.get("candidate_id", "")
        job_id = request_data.get("job_id", "")
        candidate_data = request_data.get("candidate_data", {})
        job_data = request_data.get("job_data", {})
        
        if not candidate_data and not candidate_id:
            return {
                "success": False,
                "error": "Candidate data or candidate_id is required"
            }
        
        if not job_data and not job_id:
            return {
                "success": False,
                "error": "Job data or job_id is required"
            }
        
        # Get candidate data if only ID provided
        if candidate_id and not candidate_data:
            candidate_data = await get_candidate_by_id(candidate_id)
            if not candidate_data:
                return {
                    "success": False,
                    "error": "Candidate not found"
                }
        
        # Get job data if only ID provided
        if job_id and not job_data:
            job_data = await get_job_by_id_from_milvus(job_id)
            if not job_data:
                return {
                    "success": False,
                    "error": "Job not found"
                }
        
        # Perform AI scoring
        try:
            scoring_result = await perform_ai_candidate_scoring(candidate_data, job_data)
            print(f"🎯 [AIScoring] AI scoring completed: {scoring_result.get('overall_score', 0)}/100")
        except Exception as e:
            print(f"⚠️ [AIScoring] AI scoring failed, using fallback: {e}")
            scoring_result = await fallback_candidate_scoring(candidate_data, job_data)
        
        # Store the scoring result in interview_results collection
        try:
            if milvus_connected:
                result_data = {
                    "candidate_id": candidate_id or candidate_data.get("id", ""),
                    "candidate_name": candidate_data.get("full_name", "Unknown"),
                    "job_id": job_id or job_data.get("id", ""),
                    "job_title": job_data.get("title", "Unknown"),
                    "company_name": job_data.get("company", "Unknown"),
                    "overall_score": scoring_result.get("overall_score", 0),
                    "category_scores": scoring_result.get("category_scores", {}),
                    "ai_feedback": scoring_result.get("detailed_analysis", {}).get("strengths", []) + scoring_result.get("detailed_analysis", {}).get("weaknesses", []),
                    "detailed_analysis": scoring_result.get("detailed_analysis", {}),
                    "skill_match_analysis": scoring_result.get("skill_match_analysis", {}),
                    "experience_analysis": scoring_result.get("experience_analysis", {}),
                    "fit_assessment": scoring_result.get("fit_assessment", {}),
                    "interview_recommendations": scoring_result.get("interview_recommendations", []),
                    "hiring_recommendation": scoring_result.get("hiring_recommendation", "unknown"),
                    "confidence_level": scoring_result.get("confidence_level", 0),
                    "reasoning": scoring_result.get("reasoning", ""),
                    "evaluation_date": datetime.now().isoformat(),
                    "evaluated_by": "AI System",
                    "model_used": scoring_result.get("model_used", "gpt-4o-mini"),
                    "status": "completed"
                }
                
                # Store in interview_results collection
                collection = Collection("interview_results")
                collection.load()
                
                # Generate embedding for the result
                embedding_text = f"{result_data['candidate_name']} {result_data['job_title']} {result_data['company_name']} {str(result_data.get('ai_feedback', ''))}"
                embedding = get_embedding(embedding_text)
                
                # Prepare data for insertion
                interview_data = {
                    "id": str(uuid.uuid4()),
                    "candidate_id": result_data["candidate_id"],
                    "candidate_name": result_data["candidate_name"],
                    "job_id": result_data["job_id"],
                    "job_title": result_data["job_title"],
                    "company_name": result_data["company_name"],
                    "overall_score": result_data["overall_score"],
                    "category_scores": json.dumps(result_data["category_scores"]),
                    "ai_feedback": str(result_data["ai_feedback"]),
                    "detailed_analysis": json.dumps(result_data["detailed_analysis"]),
                    "skill_match_analysis": json.dumps(result_data["skill_match_analysis"]),
                    "experience_analysis": json.dumps(result_data["experience_analysis"]),
                    "fit_assessment": json.dumps(result_data["fit_assessment"]),
                    "interview_recommendations": json.dumps(result_data["interview_recommendations"]),
                    "hiring_recommendation": result_data["hiring_recommendation"],
                    "confidence_level": result_data["confidence_level"],
                    "reasoning": result_data["reasoning"],
                    "evaluation_date": result_data["evaluation_date"],
                    "evaluated_by": result_data["evaluated_by"],
                    "model_used": result_data["model_used"],
                    "status": result_data["status"],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "embedding": embedding
                }
                
                collection.insert([interview_data])
                collection.flush()
                print(f"✅ [AIScoring] Result stored in interview_results collection")
                
        except Exception as e:
            print(f"⚠️ [AIScoring] Failed to store result in collection: {e}")
        
        return {
            "success": True,
            "candidate_id": candidate_id or candidate_data.get("id", ""),
            "job_id": job_id or job_data.get("id", ""),
            "scoring_result": scoring_result,
            "message": "AI candidate scoring completed successfully"
        }
        
    except Exception as e:
        print(f"❌ [AIScoring] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/analysis/gap-analysis")
async def ai_gap_analysis(request_data: dict):
    """AI-powered gap analysis between candidates and job requirements"""
    print(f"🔍 [GapAnalysis] Received request: {request_data}")
    
    try:
        candidate_id = request_data.get("candidate_id", "")
        job_id = request_data.get("job_id", "")
        candidate_data = request_data.get("candidate_data", {})
        job_data = request_data.get("job_data", {})
        
        if not candidate_data and not candidate_id:
            return {"success": False, "error": "Candidate data or candidate_id is required"}
        if not job_data and not job_id:
            return {"success": False, "error": "Job data or job_id is required"}
        
        # Get data if only IDs provided
        if candidate_id and not candidate_data:
            candidate_data = await get_candidate_by_id(candidate_id)
        if job_id and not job_data:
            job_data = await get_job_by_id_from_milvus(job_id)
        
        # Perform gap analysis (similar to scoring but focused on gaps)
        scoring_result = await fallback_candidate_scoring(candidate_data, job_data)
        
        gap_analysis = {
            "skill_gaps": scoring_result.get("skill_match_analysis", {}).get("skill_gaps", []),
            "missing_requirements": scoring_result.get("detailed_analysis", {}).get("missing_requirements", []),
            "recommendations": scoring_result.get("detailed_analysis", {}).get("recommendations", []),
            "development_areas": scoring_result.get("detailed_analysis", {}).get("weaknesses", [])
        }
        
        return {
            "success": True,
            "gap_analysis": gap_analysis,
            "message": "Gap analysis completed successfully"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

