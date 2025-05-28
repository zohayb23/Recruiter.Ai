from skill_ratings import SkillRatingSystem

def test_different_roles():
    rater = SkillRatingSystem()
    
    # Test Case 1: Senior Software Engineer - Full Stack
    senior_swe_job = """
    Senior Software Engineer - Full Stack

    Job Description:
    Tech Innovations Inc. is seeking a Senior Software Engineer with strong full-stack development experience. The ideal candidate will be responsible for developing and maintaining web applications, designing system architecture, and collaborating with cross-functional teams.

    Key Technical Requirements:
    - Strong proficiency in JavaScript/TypeScript, React, and Node.js
    - Experience with MongoDB, PostgreSQL, and database design
    - Experience with RESTful APIs and GraphQL
    - Knowledge of cloud platforms (AWS, GCP, Azure)
    - Experience with Docker, Kubernetes, and microservices
    - Strong background in software design patterns
    - Experience with Git and CI/CD pipelines
    - Ability to write efficient, secure, and testable code
    """
    
    print("\n=== Testing Senior Software Engineer Role ===")
    print("Job Description:")
    print(senior_swe_job)
    results = rater.rate_resumes(job_description=senior_swe_job)
    
    print("\nTop Matches:")
    for idx, result in enumerate(results, 1):
        print(f"\nCandidate #{idx}:")
        print(f"Resume: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Overall Match: {result['overall_score']}%")
        print("Individual Skill Matches:")
        for skill, score in result['skill_scores'].items():
            print(f"  {skill}: {score}%")
        print("-" * 50)
    
    # Test Case 2: Specific Skills Search focusing on key technical requirements
    print("\n=== Testing Specific Technical Skills ===")
    specific_skills = ['javascript', 'typescript', 'react', 'nodejs', 'mongodb', 'postgresql', 'docker', 'kubernetes', 'aws', 'microservices']
    print(f"Required Skills: {', '.join(specific_skills)}")
    
    results = rater.rate_resumes(required_skills=specific_skills)
    
    print("\nTop Matches:")
    for idx, result in enumerate(results, 1):
        print(f"\nCandidate #{idx}:")
        print(f"Resume: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Overall Match: {result['overall_score']}%")
        print("Individual Skill Matches:")
        for skill, score in result['skill_scores'].items():
            print(f"  {skill}: {score}%")
        print("-" * 50)

if __name__ == "__main__":
    test_different_roles() 