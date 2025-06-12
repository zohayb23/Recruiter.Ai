from services.full_text_search import search_resumes
from services.dense_search import dense_search
from services.skill_ratings import SkillRatingSystem

def test_full_text_search():
    print("\n=== Testing Full Text Search ===")
    query = "Python developer"
    results = search_resumes(query, top_k=3)
    
    print(f"\nSearch Results for '{query}':")
    for i, result in enumerate(results, 1):
        print(f"\nResult {i}:")
        print(f"Filename: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Score: {result['score']}")
        print(f"Content: {result['content']}")

def test_semantic_search():
    print("\n=== Testing Semantic Search ===")
    query = "Machine learning expert"
    results = dense_search(query, threshold=0.1, top_k=3)  # Lower threshold for testing
    
    print(f"\nSearch Results for '{query}':")
    for i, result in enumerate(results, 1):
        print(f"\nResult {i}:")
        print(f"Filename: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Similarity: {result['embedding_similarity']:.2f}")
        print(f"Content: {result['content']}")

def test_skill_rating():
    print("\n=== Testing Skill Rating ===")
    rater = SkillRatingSystem()
    
    # Test with specific skills
    required_skills = ["python", "cloud", "database"]
    print(f"\nRating resumes for skills: {required_skills}")
    results = rater.rate_resumes(required_skills=required_skills)
    
    for i, result in enumerate(results, 1):
        print(f"\nCandidate {i}:")
        print(f"Filename: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Overall Score: {result['overall_score']}%")
        print("Skill Scores:")
        for skill, score in result['skill_scores'].items():
            print(f"  - {skill}: {score}%")

if __name__ == "__main__":
    test_full_text_search()
    test_semantic_search()
    test_skill_rating() 