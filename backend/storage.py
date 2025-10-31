"""
In-memory storage for data persistence
This module provides global storage for resumes, jobs, CRM data, etc.
Eventually this could be replaced with a proper database
"""
from datetime import datetime

# In-memory storage for resumes and job descriptions (backup)
stored_resumes = []
stored_job_descriptions = []

# Add some sample job data as fallback
if not stored_job_descriptions:
    stored_job_descriptions = [
        {
            "job_id": "sample-job-1",
            "id": "sample-job-1",
            "title": "Senior Software Engineer",
            "company": "Tech Corp",
            "department": "Engineering",
            "location": "San Francisco, CA",
            "location_type": "Hybrid",
            "experience_level": "Senior Level (5-8 years)",
            "status": "PUBLISHED",
            "overview": "We are looking for a senior software engineer to join our dynamic team.",
            "responsibilities": ["Design and develop scalable applications", "Lead technical projects", "Mentor junior developers"],
            "qualifications": ["Bachelor's degree in Computer Science", "5+ years of experience", "Strong problem-solving skills"],
            "required_skills": ["Python", "JavaScript", "React", "Node.js"],
            "preferred_skills": ["AWS", "Docker", "Kubernetes"],
            "benefits": ["Health insurance", "401k matching", "Flexible work hours"],
            "company_description": "Tech Corp is a leading technology company focused on innovation.",
            "created_at": "2025-10-13T15:28:54.574362",
            "updated_at": "2025-10-13T15:28:54.574362"
        }
    ]

# Add some sample data as fallback
if not stored_resumes:
    stored_resumes = [
        {
            "id": "sample-1",
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "+1-555-0123",
            "skills": ["Python", "JavaScript", "React", "Node.js"],
            "education": [{"degree": "Bachelor of Computer Science", "institution": "Stanford University"}],
            "work_experience": [{"title": "Software Engineer", "company": "Tech Corp", "period": "2020-2023"}],
            "created_at": "2025-10-13T15:28:54.574362",
            "updated_at": "2025-10-13T15:28:54.574362",
            "status": "Active",
            "score": 85,
            "location": "Remote",
            "experience_years": 3,
            "summary": "Experienced software engineer with 3 years of experience in full-stack development."
        }
    ]

# In-memory storage for CRM and Mass Mailing
crm_pipeline = {
    "stages": [
        {"id": "applied", "name": "Applied", "candidates": []},
        {"id": "screening", "name": "Screening", "candidates": []},
        {"id": "interview", "name": "Interview", "candidates": []},
        {"id": "offer", "name": "Offer", "candidates": []},
        {"id": "hired", "name": "Hired", "candidates": []}
    ]
}

email_campaigns = []
email_templates = []

# Data persistence storage
ab_testing_experiments = []
segmentation_segments = []
automation_workflows = []
candidate_notes = {}  # candidate_id -> list of notes
candidate_tags = {}   # candidate_id -> list of tags
engagement_history = []  # list of engagement events

# Candidate Evaluation & Analytics storage
interview_summaries = {}  # candidate_id -> list of summaries
candidate_scores = {}     # candidate_id -> scoring data
analytics_metrics = {    # analytics dashboard data
    "total_candidates": 0,
    "interviewed_candidates": 0,
    "average_scores": {},
    "score_distribution": {},
    "department_breakdown": {},
    "hiring_timeline": []
}

