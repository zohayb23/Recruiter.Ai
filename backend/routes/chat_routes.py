"""
Chat Routes - Handle candidate chat endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import openai
import copy

from ..models.chat import CandidateChatRequest
from ..models.evaluation import EvaluationRubric
from ..services.candidate_service import get_candidate_by_id, find_matching_job_for_candidate
from ..services.milvus_service import get_jobs_from_milvus, milvus_connected
from ..config.settings import settings

router = APIRouter(prefix="/api", tags=["Chat"])

# Initialize OpenAI
openai.api_key = settings.OPENAI_API_KEY

@router.post("/candidate-chat")
async def candidate_chat(request: CandidateChatRequest):
    """AI-powered candidate conversation endpoint with intelligent follow-up system"""
    try:
        print(f"🤖 [Chat] Processing chat for candidate: {request.candidateId}")
        
        # Get candidate data if not provided
        if not request.candidateData:
            candidate_result = await get_candidate_by_id(request.candidateId)
            if not candidate_result:
                raise HTTPException(status_code=404, detail="Candidate not found")
            # Convert to expected format
            candidate_data = {
                "id": candidate_result.get("id", ""),
                "name": candidate_result.get("full_name", ""),
                "full_name": candidate_result.get("full_name", ""),
                "email": candidate_result.get("email", ""),
                "skills": candidate_result.get("skills", []),
                "education": candidate_result.get("education", []),
                "work_experience": candidate_result.get("work_experience", [])
            }
        else:
            candidate_data = request.candidateData
        
        # Get job description if not provided
        job_description = request.jobDescription
        if not job_description or not job_description.get('title'):
            matched_job = await find_matching_job_for_candidate(candidate_data)
            if matched_job:
                job_description = copy.deepcopy(matched_job)
        
        # Initialize the evaluation rubric with job description
        rubric = EvaluationRubric(job_description)
        
        # Determine if this is the first message
        is_first_message = len(request.conversationHistory) == 0 or all(
            msg.get('role') == 'assistant' for msg in request.conversationHistory
        )
        
        if is_first_message:
            # First message - personalized greeting
            seniority = rubric.determine_seniority(candidate_data)
            first_question = rubric.get_next_question(candidate_data, request.conversationHistory)
            
            candidate_name = candidate_data.get('name', 'there')
            job_title = job_description.get('title', 'this position') if job_description else 'this position'
            company = job_description.get('company', 'our company') if job_description else 'our company'
            
            greeting = f"Hello {candidate_name}! Thanks for taking the time to speak with me today. I'm here to interview you for the **{job_title}** position at **{company}**. "
            
            if seniority == "junior":
                greeting += "I'm excited to learn about your background and what you're looking to achieve in your career. "
            elif seniority in ["senior", "lead", "principal"]:
                greeting += "I'm looking forward to discussing your extensive experience and the insights you can bring to our team. "
            else:
                greeting += "I'm excited to learn about your background and experience. "
            
            ai_response = greeting + first_question["question"]
            
            job_info = {
                "title": job_title,
                "company": company,
                "description": job_description.get('description', '') if job_description else '',
                "overview": job_description.get('overview', '') if job_description else '',
                "responsibilities": job_description.get('responsibilities', []) if job_description else [],
                "qualifications": job_description.get('qualifications', []) if job_description else [],
                "benefits": job_description.get('benefits', []) if job_description else [],
                "mustHaveSkills": job_description.get('required_skills', []) if job_description else [],
                "flexibleSkills": job_description.get('preferred_skills', []) if job_description else []
            }
            
            return {
                "success": True,
                "response": ai_response,
                "confidence": 0.9,
                "matchedSkills": [],
                "followUpSuggestions": [],
                "jobInfo": job_info,
                "analysis": {
                    "seniority": seniority,
                    "category": first_question["category"],
                    "slot": first_question["slot"],
                    "score": first_question["score"],
                    "uncertainty": first_question["uncertainty"],
                    "isMustHave": first_question.get("is_must_have", False)
                },
                "aiAnalysis": f"Generated personalized greeting and first question for {seniority} level candidate for {job_title} position"
            }
        else:
            # Response to candidate - generate intelligent follow-up
            user_message_lower = request.message.lower()
            
            # Check if user is asking about the position
            if any(phrase in user_message_lower for phrase in [
                "what is the position", "what position", "what job", "tell me about the position",
                "what role", "what are you interviewing me for"
            ]):
                job_title = job_description.get('title', 'this position') if job_description else 'this position'
                company = job_description.get('company', 'our company') if job_description else 'our company'
                job_description_text = job_description.get('description', '') if job_description else ''
                
                position_response = f"Great question! You're being interviewed for the **{job_title}** position at **{company}**. "
                
                if job_description_text:
                    short_desc = job_description_text[:200] + "..." if len(job_description_text) > 200 else job_description_text
                    position_response += f"Here's a brief overview: {short_desc} "
                
                next_question_data = rubric.get_next_question(candidate_data, request.conversationHistory)
                position_response += f"Now, let's dive into your experience: {next_question_data['question']}"
                
                return {
                    "success": True,
                    "response": position_response,
                    "confidence": 0.9,
                    "matchedSkills": [],
                    "followUpSuggestions": [],
                    "jobInfo": {
                        "title": job_title,
                        "company": company,
                        "description": job_description_text,
                        "overview": job_description.get('overview', '') if job_description else '',
                        "responsibilities": job_description.get('responsibilities', []) if job_description else [],
                        "qualifications": job_description.get('qualifications', []) if job_description else [],
                        "benefits": job_description.get('benefits', []) if job_description else [],
                        "mustHaveSkills": job_description.get('required_skills', []) if job_description else [],
                        "flexibleSkills": job_description.get('preferred_skills', []) if job_description else []
                    },
                    "analysis": {
                        "seniority": next_question_data["seniority"],
                        "category": next_question_data["category"],
                        "slot": next_question_data["slot"],
                        "score": next_question_data["score"],
                        "uncertainty": next_question_data["uncertainty"],
                        "isMustHave": next_question_data.get("is_must_have", False)
                    }
                }
            
            # Build context for AI
            context_parts = [f"Candidate: {candidate_data.get('name', 'Unknown')}"]
            
            skills = candidate_data.get('skills', [])
            if isinstance(skills, str):
                try:
                    skills = json.loads(skills)
                except:
                    skills = []
            if skills:
                context_parts.append(f"Skills: {', '.join(skills[:10])}")
            
            work_exp = candidate_data.get('work_experience', [])
            if isinstance(work_exp, str):
                try:
                    work_exp = json.loads(work_exp)
                except:
                    work_exp = []
            
            context = "\n".join(context_parts)
            conversation_context = ""
            for msg in request.conversationHistory[-5:]:
                role = "Interviewer" if msg.get('role') == 'assistant' else "Candidate"
                content = msg.get('content', '')
                conversation_context += f"{role}: {content}\n"
            
            # Get next intelligent question
            next_question_data = rubric.get_next_question(candidate_data, request.conversationHistory)
            
            # Create prompt for AI response
            prompt = f"""You are an AI interviewer. The candidate just responded.
            
Candidate Information:
{context}

Recent Conversation:
{conversation_context}

Candidate's Response: {request.message}

Next Question: {next_question_data["question"]}

Acknowledge their response briefly and ask the next question naturally:"""
            
            # Get AI response
            if openai.api_key:
                try:
                    response = openai.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": "You are an experienced technical interviewer. Acknowledge briefly and ask the next question naturally."},
                            {"role": "user", "content": prompt}
                        ],
                        max_tokens=200,
                        temperature=0.7
                    )
                    ai_response = response.choices[0].message.content
                except Exception as e:
                    print(f"❌ [OpenAI] Error: {e}")
                    ai_response = f"That's great! {next_question_data['question']}"
            else:
                ai_response = f"Thanks for sharing that! {next_question_data['question']}"
            
            skills_mentioned = [skill for skill in skills if skill.lower() in request.message.lower()] if skills else []
            
            return {
                "success": True,
                "response": ai_response,
                "confidence": 0.85,
                "matchedSkills": skills_mentioned,
                "followUpSuggestions": [],
                "jobInfo": {
                    "title": job_description.get('title', 'this position') if job_description else 'this position',
                    "company": job_description.get('company', 'our company') if job_description else 'our company',
                    "description": job_description.get('description', '') if job_description else '',
                    "overview": job_description.get('overview', '') if job_description else '',
                    "responsibilities": job_description.get('responsibilities', []) if job_description else [],
                    "qualifications": job_description.get('qualifications', []) if job_description else [],
                    "benefits": job_description.get('benefits', []) if job_description else [],
                    "mustHaveSkills": job_description.get('required_skills', []) if job_description else [],
                    "flexibleSkills": job_description.get('preferred_skills', []) if job_description else []
                },
                "analysis": {
                    "seniority": next_question_data["seniority"],
                    "category": next_question_data["category"],
                    "slot": next_question_data["slot"],
                    "score": next_question_data["score"],
                    "uncertainty": next_question_data["uncertainty"],
                    "isMustHave": next_question_data.get("is_must_have", False)
                }
            }
        
    except Exception as e:
        print(f"❌ Error in candidate chat: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing candidate chat: {str(e)}")

