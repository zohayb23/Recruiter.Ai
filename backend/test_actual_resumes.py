from services.full_text_search import search_resumes
from services.dense_search import semantic_search
from services.skill_ratings import rate_skills

def test_resume_search():
    print("\n=== Testing Full Text Search ===")
    # Test full text search
    query = "Python developer"
    results = search_resumes(query, top_k=5)
    print(f"\nSearching for: {query}")
    print(f"Found {len(results)} results")
    for idx, result in enumerate(results, 1):
        print(f"\n{idx}. {result['filename']} ({result['source']})")
        print(f"Score: {result['score']}")
        print(f"Preview: {result['content'][:200]}...")

    print("\n=== Testing Semantic Search ===")
    # Test semantic search
    query = "Machine learning expert"
    results = semantic_search(query, top_k=5)
    print(f"\nSearching for: {query}")
    print(f"Found {len(results)} results")
    for idx, result in enumerate(results, 1):
        print(f"\n{idx}. {result['filename']} ({result['source']})")
        print(f"Score: {result['score']}")
        print(f"Preview: {result['content'][:200]}...")

    print("\n=== Testing Skills Rating ===")
    # Test skills rating
    required_skills = ["Python", "Machine Learning", "SQL", "Data Analysis"]
    results = rate_skills(required_skills)
    print(f"\nRequired skills: {', '.join(required_skills)}")
    print(f"Found {len(results)} resumes")
    for idx, result in enumerate(results, 1):
        print(f"\n{idx}. {result['filename']} ({result['source']})")
        print(f"Score: {result['score']}")
        print(f"Matched skills: {', '.join(result['matched_skills'])}")
        print(f"Preview: {result['content'][:200]}...")

if __name__ == "__main__":
    test_resume_search() 