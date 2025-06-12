from services.dense_search import dense_search

def test_semantic_search():
    print("Testing Semantic Search...")
    query = "Machine learning expert with Python experience"
    results = dense_search(query, threshold=0.7, top_k=5)
    
    print(f"\nSemantic Search Results for '{query}':")
    if results:
        for i, result in enumerate(results, 1):
            print(f"\nResult {i}:")
            print(f"Filename: {result['filename']}")
            print(f"Source: {result['source']}")
            print(f"Embedding Similarity: {result['embedding_similarity']}")
            print(f"Content: {result['content'][:200]}...")
    else:
        print("No results found.")

if __name__ == "__main__":
    test_semantic_search() 