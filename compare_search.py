from dense_search import dense_search
from full_text_search import bm25_search
from pymilvus import Collection

QUERY = "Python Developer"
TOP_K = 5

def print_results(title, results):
    print(f"\n{title}")
    for idx, hit in enumerate(results):
        print(f"Result {idx+1}:")
        text = hit.entity.get("text")
        if text:
            print(f"  text: {text[:200]}...")
        if hasattr(hit, 'score'):
            print(f"  Score: {hit.score}")
        if hasattr(hit, 'distance'):
            print(f"  Distance: {hit.distance}")
        print("-" * 40)

if __name__ == "__main__":
    # Ensure both collections are loaded before searching
    Collection('resume_embeddings').load()
    Collection('resume_fulltext').load()
    dense_results = dense_search(QUERY, top_k=TOP_K)
    bm25_results = bm25_search(QUERY, top_k=TOP_K)
    print_results("Dense Search Results", dense_results)
    print_results("BM25 Full Text Search Results", bm25_results) 