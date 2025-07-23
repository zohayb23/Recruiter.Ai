import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.main import app
from src.database import get_db
from src.models.assessment import (
    Assessment, CandidateAssessment,
    AssessmentType, DifficultyLevel, AssessmentStatus,
    AssessmentDeliveryMethod, CandidateAssessmentStatus,
    QuestionType
)
from src.services.assessment_service import AssessmentService

client = TestClient(app)

# Test data
test_assessment_data = {
    "title": "Python Backend Developer Assessment",
    "description": "Technical assessment for Python backend role",
    "assessment_type": AssessmentType.TECHNICAL,
    "difficulty_level": DifficultyLevel.INTERMEDIATE,
    "time_limit_minutes": 60,
    "passing_score": 70.0,
    "delivery_method": AssessmentDeliveryMethod.ONLINE_PROCTORED,
    "questions": [
        {
            "question_text": "What is dependency injection?",
            "question_type": QuestionType.FREE_TEXT,
            "points": 10,
            "evaluation_criteria": [
                "Understanding of IoC",
                "Benefits explanation",
                "Real-world examples"
            ]
        },
        {
            "question_text": "Which of these is not a valid HTTP method?",
            "question_type": QuestionType.MULTIPLE_CHOICE,
            "points": 5,
            "options": ["GET", "POST", "FETCH", "DELETE"],
            "correct_answer": "FETCH"
        }
    ]
}

test_candidate_assessment_data = {
    "candidate_id": 1,
    "assessment_id": 1,
    "job_id": 1
}

@pytest.fixture
def db_session():
    # This should be replaced with your actual test database session
    session = next(get_db())
    yield session
    session.close()

@pytest.fixture
def assessment_service(db_session):
    return AssessmentService(db_session)

def test_create_assessment(assessment_service):
    """Test creating a new assessment"""
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    assert assessment.id is not None
    assert assessment.title == test_assessment_data["title"]
    assert assessment.status == AssessmentStatus.DRAFT

def test_get_assessment(assessment_service):
    """Test retrieving an assessment"""
    # Create test assessment
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    
    # Retrieve it
    retrieved = assessment_service.get_assessment(assessment.id)
    assert retrieved is not None
    assert retrieved.id == assessment.id
    assert retrieved.title == test_assessment_data["title"]

def test_list_assessments(assessment_service):
    """Test listing assessments with filters"""
    # Create test assessments
    assessment1 = assessment_service.create_assessment(test_assessment_data, created_by=1)
    assessment2 = assessment_service.create_assessment({
        **test_assessment_data,
        "assessment_type": AssessmentType.CODING
    }, created_by=1)
    
    # Test listing all
    assessments = assessment_service.list_assessments()
    assert len(assessments) >= 2
    
    # Test filtering by type
    filtered = assessment_service.list_assessments(assessment_type=AssessmentType.CODING)
    assert all(a.assessment_type == AssessmentType.CODING for a in filtered)

def test_update_assessment(assessment_service):
    """Test updating an assessment"""
    # Create test assessment
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    
    # Update it
    updated = assessment_service.update_assessment(assessment.id, {
        "title": "Updated Title",
        "status": AssessmentStatus.ACTIVE
    })
    
    assert updated.title == "Updated Title"
    assert updated.status == AssessmentStatus.ACTIVE

def test_delete_assessment(assessment_service):
    """Test deleting an assessment"""
    # Create test assessment
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    
    # Delete it
    success = assessment_service.delete_assessment(assessment.id)
    assert success
    
    # Verify deletion
    retrieved = assessment_service.get_assessment(assessment.id)
    assert retrieved is None

def test_assign_assessment(assessment_service):
    """Test assigning an assessment to a candidate"""
    # Create test assessment
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    
    # Assign it
    assignment = assessment_service.assign_assessment({
        **test_candidate_assessment_data,
        "assessment_id": assessment.id
    })
    
    assert assignment.id is not None
    assert assignment.assessment_id == assessment.id
    assert assignment.status == CandidateAssessmentStatus.ASSIGNED

def test_submit_assessment(assessment_service):
    """Test submitting an assessment"""
    # Create and assign assessment
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    assignment = assessment_service.assign_assessment({
        **test_candidate_assessment_data,
        "assessment_id": assessment.id
    })
    
    # Submit answers
    answers = {
        "1": "Dependency injection is a design pattern...",
        "2": "FETCH"
    }
    
    submitted = assessment_service.submit_assessment(assignment.id, answers)
    assert submitted.status == CandidateAssessmentStatus.COMPLETED
    assert submitted.completion_time is not None
    assert submitted.score is not None

def test_get_assessment_statistics(assessment_service):
    """Test getting assessment statistics"""
    # Create assessment and submissions
    assessment = assessment_service.create_assessment(test_assessment_data, created_by=1)
    
    # Create multiple submissions with different scores
    for i in range(3):
        assignment = assessment_service.assign_assessment({
            **test_candidate_assessment_data,
            "assessment_id": assessment.id,
            "candidate_id": i + 1
        })
        assessment_service.submit_assessment(assignment.id, {
            "1": f"Answer {i}",
            "2": "FETCH"
        })
    
    # Get statistics
    stats = assessment_service.get_assessment_statistics(assessment.id)
    assert stats["total_attempts"] == 3
    assert "average_score" in stats
    assert "completion_rate" in stats
    assert "pass_rate" in stats

# API Integration Tests

def test_create_assessment_api():
    """Test creating an assessment through the API"""
    response = client.post(
        "/api/assessments",
        json=test_assessment_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_assessment_data["title"]

def test_get_assessment_api():
    """Test getting an assessment through the API"""
    # First create an assessment
    create_response = client.post(
        "/api/assessments",
        json=test_assessment_data
    )
    assessment_id = create_response.json()["id"]
    
    # Then get it
    response = client.get(f"/api/assessments/{assessment_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == assessment_id

def test_list_assessments_api():
    """Test listing assessments through the API"""
    response = client.get("/api/assessments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_update_assessment_api():
    """Test updating an assessment through the API"""
    # First create an assessment
    create_response = client.post(
        "/api/assessments",
        json=test_assessment_data
    )
    assessment_id = create_response.json()["id"]
    
    # Then update it
    response = client.put(
        f"/api/assessments/{assessment_id}",
        json={
            "title": "Updated Title",
            "status": AssessmentStatus.ACTIVE
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["status"] == AssessmentStatus.ACTIVE

def test_assign_assessment_api():
    """Test assigning an assessment through the API"""
    # First create an assessment
    create_response = client.post(
        "/api/assessments",
        json=test_assessment_data
    )
    assessment_id = create_response.json()["id"]
    
    # Then assign it
    response = client.post(
        "/api/assessments/assign",
        json={
            **test_candidate_assessment_data,
            "assessment_id": assessment_id
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["assessment_id"] == assessment_id
    assert data["status"] == CandidateAssessmentStatus.ASSIGNED

def test_submit_assessment_api():
    """Test submitting an assessment through the API"""
    # Create and assign assessment
    create_response = client.post(
        "/api/assessments",
        json=test_assessment_data
    )
    assessment_id = create_response.json()["id"]
    
    assign_response = client.post(
        "/api/assessments/assign",
        json={
            **test_candidate_assessment_data,
            "assessment_id": assessment_id
        }
    )
    candidate_assessment_id = assign_response.json()["id"]
    
    # Submit answers
    response = client.post(
        f"/api/assessments/candidate/{candidate_assessment_id}/submit",
        json={
            "answers": {
                "1": "Test answer",
                "2": "FETCH"
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == CandidateAssessmentStatus.COMPLETED
    assert data["score"] is not None 