from screening.criteria import ScreeningCriteria, EducationLevel
from screening.screener import CandidateScreener
from screening.communication import EmailConfig
from datetime import datetime
import os

def get_email_config():
    """Get email configuration with secure password handling"""
    return EmailConfig(
        smtp_server="smtp.gmail.com",
        smtp_port=587,
        sender_email="zohayb23@gmail.com",
        sender_password='cmlp ycrs ffyb jgnh'
    )

def test_unqualified_scenario(screener: CandidateScreener):
    """Test screening and notification for an unqualified candidate"""
    print("\nTesting UNQUALIFIED Candidate Scenario...")
    
    # Strict criteria that candidate won't meet
    strict_criteria = ScreeningCriteria(
        required_skills=["Python", "Machine Learning", "SQL", "Rust", "Golang"],
        preferred_skills=["Docker", "AWS", "React"],
        min_years_experience=8,
        preferred_years_experience=10,
        education_level=EducationLevel.PHD,
        education_fields=["Computer Science", "Data Science"],
        location_requirements="On-site",
        language_requirements=["English"],
        certifications=["AWS Certified"]
    )
    
    result = screener.screen_and_notify_candidate(
        resume_text=SAMPLE_RESUME,
        criteria=strict_criteria,
        candidate_email="fayzan23@gmail.com",
        job_details=JOB_DETAILS
    )
    
    print_screening_results(result)

def test_qualified_scenario(screener: CandidateScreener):
    """Test screening and notification for a qualified candidate"""
    print("\nTesting QUALIFIED Candidate Scenario...")
    
    # Criteria that matches candidate's profile
    matching_criteria = ScreeningCriteria(
        required_skills=["Python", "Machine Learning", "SQL"],
        preferred_skills=["Docker", "AWS", "React"],
        min_years_experience=3,
        preferred_years_experience=5,
        education_level=EducationLevel.BACHELOR,
        education_fields=["Computer Science", "Data Science"],
        location_requirements="Remote",
        language_requirements=["English"],
        certifications=["AWS Certified"]
    )
    
    result = screener.screen_and_notify_candidate(
        resume_text=SAMPLE_RESUME,
        criteria=matching_criteria,
        candidate_email="fayzan23@gmail.com",
        job_details=JOB_DETAILS
    )
    
    print_screening_results(result)
    
    # If qualified, test interview scheduling
    if result['meets_requirements']:
        print("\nTesting interview scheduling...")
        interview_details = {
            "position": JOB_DETAILS["title"],
            "date": datetime(2024, 3, 20),
            "time": "2:00 PM EST",
            "format": "virtual",
            "meeting_link": "https://meet.company.com/interview-123",
            "company": JOB_DETAILS["company"]
        }
        
        scheduling_result = screener.schedule_candidate_interview(
            candidate_email="fayzan23@gmail.com",
            interview_details=interview_details
        )
        
        print(f"Interview Scheduled: {scheduling_result}")

def print_screening_results(result: dict):
    """Helper function to print screening results"""
    print("\nScreening Results:")
    print(f"Meets Requirements: {result['meets_requirements']}")
    print(f"Overall Score: {result['overall_score']}")
    print("\nSkill Match:")
    print(f"- Matched Required: {result['skill_match']['matched_required']}")
    print(f"- Matched Preferred: {result['skill_match']['matched_preferred']}")
    print(f"- Missing Required: {result['skill_match']['missing_required']}")
    print(f"\nExperience Match:")
    print(f"- Total Years: {result['experience_match']['total_years']}")
    print(f"- Meets Minimum: {result['experience_match']['meets_minimum']}")
    print(f"- Current Role: {result['experience_match']['current_role']}")

# Sample resume text
SAMPLE_RESUME = """
JOHN DOE
Data Scientist & Machine Learning Engineer
email@example.com | (123) 456-7890

EDUCATION
Bachelor of Science in Computer Science
Stanford University, 2018-2022

EXPERIENCE
Senior Machine Learning Engineer | TechCorp
January 2022 - Present
- Developed and deployed machine learning models using Python and TensorFlow
- Implemented data pipelines using SQL and Apache Spark
- Led a team of 3 engineers in developing an AI-powered recommendation system

Data Scientist | DataCo
June 2019 - December 2021
- Built predictive models using scikit-learn and Python
- Optimized SQL queries for better performance
- Collaborated with cross-functional teams to implement ML solutions

SKILLS
Programming: Python, SQL, R
Frameworks: TensorFlow, PyTorch, React
Cloud: AWS, Docker, Kubernetes
Languages: English (Native), Spanish (Conversational)

CERTIFICATIONS
- AWS Certified Machine Learning Specialty
- Deep Learning Specialization
"""

# Job details
JOB_DETAILS = {
    "title": "Senior Machine Learning Engineer",
    "company": "AI Solutions Inc.",
    "department": "AI Research",
    "location": "Remote",
    "salary_range": "$120,000 - $180,000"
}

def main():
    # Set up email configuration
    email_config = get_email_config()

    # Initialize the screening system
    screener = CandidateScreener(
        skill_synonyms_path="data/skill_synonyms.json",
        email_config=email_config
    )

    # Test both scenarios
    test_unqualified_scenario(screener)
    test_qualified_scenario(screener)

if __name__ == "__main__":
    main() 