from services.full_text_search import search_resumes, create_collection, insert_resume_data

def test_full_text_search():
    print("Initializing full text search collection...")
    create_collection()
    insert_resume_data()
    
    print("\nTesting Full Text Search...")
    queries = ["Python developer", "Java engineer", "DevOps specialist"]
    
    for query in queries:
        print(f"\nSearching for: '{query}'")
        results = search_resumes(query, top_k=3)
        
        if results:
            for i, result in enumerate(results, 1):
                print(f"\nResult {i}:")
                print(f"Filename: {result['filename']}")
                print(f"Source: {result['source']}")
                print(f"Score: {result['score']}")
                print(f"Content snippet: {result['content'][:200]}...")
        else:
            print("No results found.")

if __name__ == "__main__":
    test_full_text_search() 