from services.skill_ratings import SkillRatingSystem

def test_skills_rating():
    print("Testing Skills Rating...")
    rater = SkillRatingSystem()
    
    # Test with job description
    job_description = """
    Senior Software Engineer position:
    - Strong Python programming skills
    - Experience with web frameworks (Django/Flask)
    - Database expertise (PostgreSQL, MongoDB)
    - Cloud platforms (AWS/Azure)
    - DevOps practices
    """
    
    print("\nTesting with job description:")
    results = rater.rate_resumes(job_description=job_description, top_k=5)
    
    if results:
        for i, result in enumerate(results, 1):
            print(f"\nCandidate {i}:")
            print(f"Filename: {result['filename']}")
            print(f"Source: {result['source']}")
            print(f"Overall Score: {result['overall_score']}%")
            print("Individual Skill Scores:")
            for skill, score in result['skill_scores'].items():
                print(f"  - {skill}: {score}%")
    else:
        print("No results found.")
    
    # Test with specific skills
    required_skills = ['python', 'aws', 'docker', 'sql']
    print("\nTesting with specific skills:", required_skills)
    results = rater.rate_resumes(required_skills=required_skills, top_k=5)
    
    if results:
        for i, result in enumerate(results, 1):
            print(f"\nCandidate {i}:")
            print(f"Filename: {result['filename']}")
            print(f"Source: {result['source']}")
            print(f"Overall Score: {result['overall_score']}%")
            print("Individual Skill Scores:")
            for skill, score in result['skill_scores'].items():
                print(f"  - {skill}: {score}%")
    else:
        print("No results found.")

if __name__ == "__main__":
    test_skills_rating() 