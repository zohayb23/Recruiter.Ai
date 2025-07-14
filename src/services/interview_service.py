from typing import Dict, List, Optional
from sqlalchemy.orm import Session
import openai
from datetime import datetime
import json
import os

from ..database.models import Job, Candidate, InterviewQuestions
from ..models.interview import QuestionRequest, QuestionType, DifficultyLevel

class InterviewService:
    def __init__(self):
        """Initialize the interview service with OpenAI client"""
        self.openai_client = openai.OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    def generate_questions(
        self,
        db: Session,
        request: QuestionRequest
    ) -> Dict:
        """Generate interview questions based on job and candidate profile"""
        
        # Get job and candidate details if IDs provided
        job = None
        candidate = None
        
        if request.job_id:
            job = db.query(Job).filter(Job.id == request.job_id).first()
        if request.candidate_id:
            candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()

        # Prepare the prompt for AI
        prompt = self._build_prompt(request, job, candidate)

        # Generate questions using OpenAI
        response = self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert technical interviewer and recruiter.
                    Generate challenging but fair interview questions that assess both
                    technical skills and soft skills. Include example good/bad answers
                    and evaluation criteria for each question."""
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        # Parse the AI response
        content = json.loads(response.choices[0].message.content)
        
        # Store in database
        db_questions = InterviewQuestions(
            job_id=request.job_id,
            candidate_id=request.candidate_id,
            question_type=request.question_type,
            difficulty=request.difficulty,
            questions=content,
            created_at=datetime.utcnow()
        )
        
        db.add(db_questions)
        db.commit()
        db.refresh(db_questions)
        
        return {
            "id": db_questions.id,
            "questions": content
        }

    def _build_prompt(
        self,
        request: QuestionRequest,
        job: Optional[Job] = None,
        candidate: Optional[Candidate] = None
    ) -> str:
        """Build the prompt for question generation"""
        
        # Base prompt structure
        prompt = f"""
        Generate {request.num_questions} interview questions for a {request.role_title} position.
        
        Question Type: {request.question_type.value}
        Difficulty Level: {request.difficulty.value}
        Focus Areas: {', '.join(request.focus_areas)}
        
        For each question, provide:
        1. The question text
        2. Expected answer points
        3. Evaluation criteria
        4. Example good answer
        5. Example bad answer
        6. Follow-up questions
        
        Additional Requirements:
        - Questions should be {request.difficulty.value} difficulty
        - Include a mix of theoretical and practical questions
        - Focus on real-world scenarios
        - Include questions that assess both technical knowledge and problem-solving
        """

        # Add job-specific context if available
        if job:
            prompt += f"""
            Job Context:
            - Required Skills: {', '.join(job.required_skills)}
            - Experience Level: {job.experience_level}
            - Job Description: {job.description}
            """

        # Add candidate-specific context if available
        if candidate:
            prompt += f"""
            Candidate Context:
            - Current Title: {candidate.current_title}
            - Years of Experience: {candidate.years_of_experience}
            - Skills: {', '.join(candidate.skills or [])}
            """

        # Add format instructions
        prompt += """
        Format the response as a JSON object with this structure:
        {
            "questions": [
                {
                    "question": "Question text",
                    "type": "question type",
                    "difficulty": "difficulty level",
                    "expected_answer": ["point 1", "point 2", ...],
                    "evaluation_criteria": ["criterion 1", "criterion 2", ...],
                    "good_answer_example": "example of a good answer",
                    "bad_answer_example": "example of a bad answer",
                    "follow_up_questions": ["question 1", "question 2", ...]
                }
            ]
        }
        """

        return prompt

    def get_questions_by_id(
        self,
        db: Session,
        question_set_id: str
    ) -> Dict:
        """Retrieve a specific set of interview questions"""
        questions = (
            db.query(InterviewQuestions)
            .filter(InterviewQuestions.id == question_set_id)
            .first()
        )
        
        if not questions:
            raise ValueError("Question set not found")
            
        return {
            "id": questions.id,
            "questions": questions.questions
        }

    def generate_feedback_form(
        self,
        db: Session,
        question_set_id: str
    ) -> Dict:
        """Generate an interview feedback form for a question set"""
        questions = self.get_questions_by_id(db, question_set_id)
        
        feedback_form = {
            "question_set_id": question_set_id,
            "sections": []
        }
        
        for question in questions["questions"]["questions"]:
            section = {
                "question": question["question"],
                "evaluation_criteria": question["evaluation_criteria"],
                "score_options": [1, 2, 3, 4, 5],
                "notes": "",
                "red_flags": [],
                "strengths": []
            }
            feedback_form["sections"].append(section)
            
        return feedback_form 