import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.main import app
from src.database import get_db
from src.models.interview import (
    Interview, InterviewFeedback,
    InterviewType, InterviewMode, InterviewStatus, InterviewFeedbackCategory
)
from src.services.interview_service import InterviewService

client = TestClient(app)

# Test data
test_interview_data = {
    "candidate_id": 1,
    "job_id": 1,
    "interviewer_id": 1,
    "scheduled_time": datetime.utcnow() + timedelta(days=1),
    "duration_minutes": 60,
    "interview_type": InterviewType.TECHNICAL,
    "interview_mode": InterviewMode.VIDEO,
    "meeting_link": "https://meet.google.com/test",
}

test_feedback_data = {
    "category": InterviewFeedbackCategory.TECHNICAL_SKILLS,
    "rating": 4.5,
    "comments": "Great technical knowledge and problem-solving skills"
}

@pytest.fixture
def db_session():
    # This should be replaced with your actual test database session
    session = next(get_db())
    yield session
    session.close()

@pytest.fixture
def interview_service(db_session):
    return InterviewService(db_session)

def test_create_interview(interview_service):
    """Test creating a new interview"""
    interview = interview_service.create_interview(test_interview_data)
    assert interview.id is not None
    assert interview.status == InterviewStatus.SCHEDULED
    assert interview.interview_type == test_interview_data["interview_type"]

def test_get_interview(interview_service):
    """Test retrieving an interview"""
    # Create test interview
    interview = interview_service.create_interview(test_interview_data)
    
    # Retrieve it
    retrieved = interview_service.get_interview(interview.id)
    assert retrieved is not None
    assert retrieved.id == interview.id
    assert retrieved.candidate_id == test_interview_data["candidate_id"]

def test_list_interviews(interview_service):
    """Test listing interviews with filters"""
    # Create test interviews
    interview1 = interview_service.create_interview(test_interview_data)
    interview2 = interview_service.create_interview({
        **test_interview_data,
        "scheduled_time": datetime.utcnow() + timedelta(days=2)
    })
    
    # Test listing all
    interviews = interview_service.get_interviews()
    assert len(interviews) >= 2
    
    # Test filtering by candidate
    filtered = interview_service.get_interviews(candidate_id=test_interview_data["candidate_id"])
    assert all(i.candidate_id == test_interview_data["candidate_id"] for i in filtered)

def test_update_interview(interview_service):
    """Test updating an interview"""
    # Create test interview
    interview = interview_service.create_interview(test_interview_data)
    
    # Update it
    new_time = datetime.utcnow() + timedelta(days=3)
    updated = interview_service.update_interview(interview.id, {
        "scheduled_time": new_time,
        "status": InterviewStatus.RESCHEDULED
    })
    
    assert updated.scheduled_time == new_time
    assert updated.status == InterviewStatus.RESCHEDULED

def test_delete_interview(interview_service):
    """Test deleting an interview"""
    # Create test interview
    interview = interview_service.create_interview(test_interview_data)
    
    # Delete it
    success = interview_service.delete_interview(interview.id)
    assert success
    
    # Verify deletion
    retrieved = interview_service.get_interview(interview.id)
    assert retrieved is None

def test_create_feedback(interview_service):
    """Test creating interview feedback"""
    # Create test interview
    interview = interview_service.create_interview(test_interview_data)
    
    # Create feedback
    feedback = interview_service.create_feedback({
        "interview_id": interview.id,
        **test_feedback_data
    })
    
    assert feedback.id is not None
    assert feedback.interview_id == interview.id
    assert feedback.rating == test_feedback_data["rating"]

def test_get_interview_feedback(interview_service):
    """Test retrieving interview feedback"""
    # Create test interview and feedback
    interview = interview_service.create_interview(test_interview_data)
    feedback = interview_service.create_feedback({
        "interview_id": interview.id,
        **test_feedback_data
    })
    
    # Get feedback
    feedback_list = interview_service.get_interview_feedback(interview.id)
    assert len(feedback_list) == 1
    assert feedback_list[0].id == feedback.id

def test_update_feedback(interview_service):
    """Test updating interview feedback"""
    # Create test interview and feedback
    interview = interview_service.create_interview(test_interview_data)
    feedback = interview_service.create_feedback({
        "interview_id": interview.id,
        **test_feedback_data
    })
    
    # Update feedback
    updated = interview_service.update_feedback(feedback.id, {
        "rating": 5.0,
        "comments": "Updated comments"
    })
    
    assert updated.rating == 5.0
    assert updated.comments == "Updated comments"

def test_delete_feedback(interview_service):
    """Test deleting interview feedback"""
    # Create test interview and feedback
    interview = interview_service.create_interview(test_interview_data)
    feedback = interview_service.create_feedback({
        "interview_id": interview.id,
        **test_feedback_data
    })
    
    # Delete feedback
    success = interview_service.delete_feedback(feedback.id)
    assert success
    
    # Verify deletion
    feedback_list = interview_service.get_interview_feedback(interview.id)
    assert len(feedback_list) == 0

def test_get_upcoming_interviews(interview_service):
    """Test getting upcoming interviews"""
    # Create test interviews
    future_interview = interview_service.create_interview(test_interview_data)
    past_interview = interview_service.create_interview({
        **test_interview_data,
        "scheduled_time": datetime.utcnow() - timedelta(days=1)
    })
    
    # Get upcoming interviews
    upcoming = interview_service.get_upcoming_interviews(days=7)
    assert any(i.id == future_interview.id for i in upcoming)
    assert not any(i.id == past_interview.id for i in upcoming)

def test_get_interviewer_schedule(interview_service):
    """Test getting interviewer's schedule"""
    # Create test interviews
    interview = interview_service.create_interview(test_interview_data)
    
    # Get schedule
    from_date = datetime.utcnow()
    to_date = datetime.utcnow() + timedelta(days=7)
    schedule = interview_service.get_interviewer_schedule(
        test_interview_data["interviewer_id"],
        from_date,
        to_date
    )
    
    assert any(i.id == interview.id for i in schedule)

def test_cancel_interview(interview_service):
    """Test cancelling an interview"""
    # Create test interview
    interview = interview_service.create_interview(test_interview_data)
    
    # Cancel it
    cancelled = interview_service.cancel_interview(
        interview.id,
        cancellation_reason="Schedule conflict"
    )
    
    assert cancelled.status == InterviewStatus.CANCELLED
    assert "Schedule conflict" in cancelled.notes

def test_reschedule_interview(interview_service):
    """Test rescheduling an interview"""
    # Create test interview
    interview = interview_service.create_interview(test_interview_data)
    
    # Reschedule it
    new_time = datetime.utcnow() + timedelta(days=5)
    rescheduled = interview_service.reschedule_interview(interview.id, new_time)
    
    assert rescheduled.status == InterviewStatus.RESCHEDULED
    assert rescheduled.scheduled_time == new_time

# API Integration Tests

def test_create_interview_api():
    """Test creating an interview through the API"""
    response = client.post(
        "/api/interviews",
        json={
            **test_interview_data,
            "scheduled_time": test_interview_data["scheduled_time"].isoformat()
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["candidate_id"] == test_interview_data["candidate_id"]

def test_get_interview_api():
    """Test getting an interview through the API"""
    # First create an interview
    create_response = client.post(
        "/api/interviews",
        json={
            **test_interview_data,
            "scheduled_time": test_interview_data["scheduled_time"].isoformat()
        }
    )
    interview_id = create_response.json()["id"]
    
    # Then get it
    response = client.get(f"/api/interviews/{interview_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == interview_id

def test_list_interviews_api():
    """Test listing interviews through the API"""
    response = client.get("/api/interviews")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_update_interview_api():
    """Test updating an interview through the API"""
    # First create an interview
    create_response = client.post(
        "/api/interviews",
        json={
            **test_interview_data,
            "scheduled_time": test_interview_data["scheduled_time"].isoformat()
        }
    )
    interview_id = create_response.json()["id"]
    
    # Then update it
    new_time = (datetime.utcnow() + timedelta(days=3)).isoformat()
    response = client.put(
        f"/api/interviews/{interview_id}",
        json={
            "scheduled_time": new_time,
            "status": InterviewStatus.RESCHEDULED
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["scheduled_time"] == new_time
    assert data["status"] == InterviewStatus.RESCHEDULED 