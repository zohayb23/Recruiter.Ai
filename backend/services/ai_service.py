"""
AI Service - OpenAI operations for parsing, scoring, and AI-powered features
"""
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import openai

from ..config.settings import settings
from ..services.milvus_service import milvus_connected, MILVUS_HOST, MILVUS_PORT
from ..utils.embeddings import get_embedding
from pymilvus import Collection, connections

# Initialize OpenAI
openai.api_key = settings.OPENAI_API_KEY

async def get_candidate_by_id(candidate_id: str) -> Optional[Dict[str, Any]]:
    """Get candidate data by ID from Milvus"""
    try:
        if not milvus_connected:
            return None
        
        collection = Collection("resumes")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{candidate_id}"',
            output_fields=["*"]
        )
        
        if results:
            result = results[0]
            return {
                "id": result.get("id", ""),
                "full_name": result.get("full_name", ""),
                "name": result.get("full_name", ""),
                "email": result.get("email", ""),
                "phone": result.get("phone", ""),
                "summary": result.get("summary", ""),
                "skills": json.loads(result.get("skills", "[]")),
                "education": json.loads(result.get("education", "[]")),
                "work_experience": json.loads(result.get("work_experience", "[]"))
            }
        return None
    except Exception as e:
        print(f"Error getting candidate: {e}")
        return None

async def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job data by ID from Milvus"""
    try:
        if not milvus_connected:
            return None
        
        collection = Collection("job_descriptions")
        collection.load()
        
        results = collection.query(
            expr=f'id == "{job_id}"',
            output_fields=["*"]
        )
        
        if results:
            result = results[0]
            return {
                "id": result.get("id", ""),
                "title": result.get("title", ""),
                "company": result.get("company", ""),
                "department": result.get("department", ""),
                "overview": result.get("overview", ""),
                "description": result.get("overview", ""),
                "required_skills": json.loads(result.get("required_skills", "[]")),
                "preferred_skills": json.loads(result.get("preferred_skills", "[]")),
                "responsibilities": json.loads(result.get("responsibilities", "[]")),
                "qualifications": json.loads(result.get("qualifications", "[]")),
                "benefits": json.loads(result.get("benefits", "[]")),
                "experience_level": result.get("experience_level", ""),
                "location": result.get("location", "")
            }
        return None
    except Exception as e:
        print(f"Error getting job: {e}")
        return None

async def perform_ai_candidate_scoring(candidate_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Use AI to score candidate against job requirements"""
    try:
        # Prepare candidate information
        candidate_info = f"""
        Candidate: {candidate_data.get('full_name', candidate_data.get('name', 'Unknown'))}
        Summary: {candidate_data.get('summary', '')}
        Skills: {', '.join(candidate_data.get('skills', []))}
        Education: {json.dumps(candidate_data.get('education', []), indent=2)}
        Work Experience: {json.dumps(candidate_data.get('work_experience', []), indent=2)}
        """
        
        # Prepare job information
        job_info = f"""
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Overview: {job_data.get('overview', job_data.get('description', ''))}
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

Guidelines:
- Overall score: 0-100 (100 being perfect match)
- Category scores: 0-100 for each category
- Strengths: 3-5 key strengths of the candidate
- Weaknesses: 2-3 areas for improvement
- Missing requirements: Skills/experience the candidate lacks
- Recommendations: How to improve the candidate's profile
- Skill match: Percentage of required/preferred skills matched
- Experience analysis: How well experience aligns with requirements
- Fit assessment: Overall compatibility with the role
- Interview recommendations: Specific questions to ask
- Hiring recommendation: Overall hiring decision
- Confidence level: How confident you are in this assessment (0-100)
- Reasoning: Detailed explanation of your scoring

Candidate Information:
{candidate_info}

Job Information:
{job_info}"""

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

async def fallback_candidate_scoring(candidate_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback scoring when AI is not available"""
    print(f"🔄 [AIScoring] Using fallback scoring")
    
    # Basic scoring based on skill matching
    candidate_skills = [skill.lower() if isinstance(skill, str) else str(skill).lower() for skill in candidate_data.get("skills", [])]
    required_skills = [skill.lower() if isinstance(skill, str) else str(skill).lower() for skill in job_data.get("required_skills", [])]
    preferred_skills = [skill.lower() if isinstance(skill, str) else str(skill).lower() for skill in job_data.get("preferred_skills", [])]
    
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
        "model_used": "fallback",
        "scored_at": datetime.now().isoformat()
    }

async def store_interview_result(result_data: Dict[str, Any]) -> bool:
    """Store interview result in Milvus"""
    try:
        if not milvus_connected:
            return False
        
        collection = Collection("interview_results")
        collection.load()
        
        # Generate embedding
        embedding_text = f"{result_data.get('candidate_name', '')} {result_data.get('job_title', '')} {result_data.get('company_name', '')} {str(result_data.get('ai_feedback', ''))}"
        embedding = get_embedding(embedding_text)
        
        # Prepare data for insertion
        interview_data Garantias = {
            "id": str(uuid.uuid4()),
            "candidate_id": result_data.get("candidate_id", ""),
            "candidate_name": result_data.get("candidate_name", ""),
            "job_id": result_data.get("job_id", ""),
            "job_title": result_data.get("job_title", ""),
            "company_name": result_data.get("company_name", ""),
            "overall_score": result_data.get("overall_score", 0),
            "category_scores": json.dumps(result_data.get("category_scores", {})),
            "ai_feedback": str(result_data.get("ai_feedback", "")),
            "detailed_analysis": json.dumps(result_data.get("detailed_analysis", {})),
            "skill_match_analysis": json.dumps(result_data.get("skill_match_analysis", {})),
            "experience_analysis": json.dumps(result_data.get("experience_analysis", {})),
            "fit_assessment": json.dumps(result_data.get("fit_assessment", {})),
            "interview_recommendations": json.dumps(result_data.get("interview_recommendations", [])),
            "hiring_recommendation": result_data.get("hiring_recommendation", "unknown"),
            "confidence_level": result_data.get("confidence_level", 0),
            "reasoning": result_data.get("reasoning", ""),
            "evaluation_date": result_data.get("evaluation_date", datetime.now().isoformat()),
            "evaluated_by": result_data.get("evaluated_by", "AI System"),
            "model_used": result_data.get("model_used", "gpt-4o-mini"),
            "status": result_data.get("status", "completed"),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "embedding": embedding
        }
        
        collection.insert([interview_data])
        collection.flush()
        print(f"✅ [AIScoring] Result stored in interview_results collection")
        return True
        
    except Exception as e:
        print(f"⚠️ [AIScoring] Failed to store result in collection: {e}")
        return False

