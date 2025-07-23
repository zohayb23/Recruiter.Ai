from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.assessment import (
    Assessment, AssessmentQuestion, AssessmentSubmission, QuestionResponse,
    AssessmentCreate, AssessmentUpdate, QuestionCreate, QuestionUpdate,
    SubmissionCreate, SubmissionUpdate, ResponseCreate, ResponseUpdate,
    AssessmentStatus, QuestionType
)

class AssessmentService:
    def __init__(self, db: Session):
        self.db = db

    def create_assessment(self, assessment_data: AssessmentCreate, created_by: int) -> Assessment:
        """Create a new assessment with questions"""
        # Create assessment
        questions_data = assessment_data.questions
        assessment_dict = assessment_data.model_dump(exclude={'questions'})
        assessment = Assessment(**assessment_dict, created_by=created_by)
        self.db.add(assessment)
        self.db.flush()  # Get the assessment ID

        # Create questions
        for question_data in questions_data:
            question = AssessmentQuestion(
                assessment_id=assessment.id,
                **question_data.model_dump()
            )
            self.db.add(question)

        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def get_assessment(self, assessment_id: int) -> Optional[Assessment]:
        """Get assessment by ID"""
        return self.db.query(Assessment).filter(Assessment.id == assessment_id).first()

    def get_assessments(
        self,
        assessment_type: Optional[str] = None,
        difficulty_level: Optional[str] = None,
        status: Optional[AssessmentStatus] = None,
        created_by: Optional[int] = None
    ) -> List[Assessment]:
        """Get assessments with optional filters"""
        query = self.db.query(Assessment)

        if assessment_type:
            query = query.filter(Assessment.assessment_type == assessment_type)
        if difficulty_level:
            query = query.filter(Assessment.difficulty_level == difficulty_level)
        if status:
            query = query.filter(Assessment.status == status)
        if created_by:
            query = query.filter(Assessment.created_by == created_by)

        return query.order_by(Assessment.created_at.desc()).all()

    def update_assessment(self, assessment_id: int, assessment_data: AssessmentUpdate) -> Optional[Assessment]:
        """Update assessment details"""
        assessment = self.get_assessment(assessment_id)
        if not assessment:
            return None

        update_data = assessment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(assessment, field, value)

        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def delete_assessment(self, assessment_id: int) -> bool:
        """Delete an assessment"""
        assessment = self.get_assessment(assessment_id)
        if not assessment:
            return False

        self.db.delete(assessment)
        self.db.commit()
        return True

    def create_question(self, assessment_id: int, question_data: QuestionCreate) -> AssessmentQuestion:
        """Add a question to an assessment"""
        question = AssessmentQuestion(
            assessment_id=assessment_id,
            **question_data.model_dump()
        )
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def update_question(self, question_id: int, question_data: QuestionUpdate) -> Optional[AssessmentQuestion]:
        """Update a question"""
        question = self.db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()
        if not question:
            return None

        update_data = question_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(question, field, value)

        self.db.commit()
        self.db.refresh(question)
        return question

    def delete_question(self, question_id: int) -> bool:
        """Delete a question"""
        question = self.db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()
        if not question:
            return False

        self.db.delete(question)
        self.db.commit()
        return True

    def create_submission(self, submission_data: SubmissionCreate) -> AssessmentSubmission:
        """Create a new assessment submission"""
        submission = AssessmentSubmission(
            **submission_data.model_dump(),
            started_at=datetime.utcnow()
        )
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_submission(self, submission_id: int) -> Optional[AssessmentSubmission]:
        """Get submission by ID"""
        return self.db.query(AssessmentSubmission).filter(AssessmentSubmission.id == submission_id).first()

    def get_candidate_submissions(self, candidate_id: int) -> List[AssessmentSubmission]:
        """Get all submissions for a candidate"""
        return (
            self.db.query(AssessmentSubmission)
            .filter(AssessmentSubmission.candidate_id == candidate_id)
            .order_by(AssessmentSubmission.created_at.desc())
            .all()
        )

    def submit_response(self, submission_id: int, response_data: ResponseCreate) -> QuestionResponse:
        """Submit a response to a question"""
        response = QuestionResponse(
            submission_id=submission_id,
            **response_data.model_dump()
        )
        self.db.add(response)
        self.db.commit()
        self.db.refresh(response)
        return response

    def evaluate_response(self, response_id: int, evaluation_data: ResponseUpdate) -> Optional[QuestionResponse]:
        """Evaluate a response"""
        response = self.db.query(QuestionResponse).filter(QuestionResponse.id == response_id).first()
        if not response:
            return None

        update_data = evaluation_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(response, field, value)

        self.db.commit()
        self.db.refresh(response)
        return response

    def complete_submission(self, submission_id: int, evaluation_data: SubmissionUpdate) -> Optional[AssessmentSubmission]:
        """Complete an assessment submission"""
        submission = self.get_submission(submission_id)
        if not submission:
            return None

        update_data = evaluation_data.model_dump(exclude_unset=True)
        update_data["completed_at"] = datetime.utcnow()
        for field, value in update_data.items():
            setattr(submission, field, value)

        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_submission_results(self, submission_id: int) -> Dict[str, Any]:
        """Get detailed results for a submission"""
        submission = self.get_submission(submission_id)
        if not submission:
            return {}

        results = {
            "submission_id": submission.id,
            "assessment_id": submission.assessment_id,
            "candidate_id": submission.candidate_id,
            "started_at": submission.started_at,
            "completed_at": submission.completed_at,
            "total_score": submission.total_score,
            "passed": submission.passed,
            "responses": []
        }

        for response in submission.responses:
            response_data = {
                "question_id": response.question_id,
                "question_type": response.question.question_type,
                "response_data": response.response_data,
                "is_correct": response.is_correct,
                "score": response.score,
                "feedback": response.feedback
            }
            
            # Add coding-specific data if applicable
            if response.question.question_type == QuestionType.CODING:
                response_data.update({
                    "execution_time": response.execution_time,
                    "memory_used": response.memory_used,
                    "test_results": response.test_results
                })
            
            results["responses"].append(response_data)

        return results

    def get_assessment_statistics(self, assessment_id: int) -> Dict[str, Any]:
        """Get statistics for an assessment"""
        assessment = self.get_assessment(assessment_id)
        if not assessment:
            return {}

        submissions = assessment.submissions
        total_submissions = len(submissions)
        completed_submissions = len([s for s in submissions if s.completed_at])
        passing_submissions = len([s for s in submissions if s.passed])

        statistics = {
            "total_submissions": total_submissions,
            "completed_submissions": completed_submissions,
            "passing_submissions": passing_submissions,
            "completion_rate": completed_submissions / total_submissions if total_submissions > 0 else 0,
            "pass_rate": passing_submissions / completed_submissions if completed_submissions > 0 else 0,
            "average_score": sum(s.total_score or 0 for s in submissions) / completed_submissions if completed_submissions > 0 else 0,
            "question_statistics": []
        }

        # Calculate statistics for each question
        for question in assessment.questions:
            responses = [r for s in submissions for r in s.responses if r.question_id == question.id]
            correct_responses = len([r for r in responses if r.is_correct])
            total_responses = len(responses)

            question_stats = {
                "question_id": question.id,
                "question_type": question.question_type,
                "total_responses": total_responses,
                "correct_responses": correct_responses,
                "success_rate": correct_responses / total_responses if total_responses > 0 else 0,
                "average_score": sum(r.score or 0 for r in responses) / total_responses if total_responses > 0 else 0
            }

            if question.question_type == QuestionType.CODING:
                avg_execution_time = sum(r.execution_time or 0 for r in responses) / total_responses if total_responses > 0 else 0
                avg_memory_used = sum(r.memory_used or 0 for r in responses) / total_responses if total_responses > 0 else 0
                question_stats.update({
                    "average_execution_time": avg_execution_time,
                    "average_memory_used": avg_memory_used
                })

            statistics["question_statistics"].append(question_stats)

        return statistics 