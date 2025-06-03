from sentence_transformers import SentenceTransformer
from pymilvus import Collection, connections

# Connect to Milvus (adjust host and port as needed)
connections.connect(alias="default", host="localhost", port="19530")

model = SentenceTransformer('all-MiniLM-L6-v2')
query = "Salesforce professional with 50+ years"  # Change this to your search phrase
embedding = model.encode([query])

collection = Collection("resume_embeddings")
# Load the collection into memory before searching
collection.load()

# Search across all resume types
results = collection.search(
    data=embedding,
    anns_field="embedding",
    param={"metric_type": "L2", "params": {"nprobe": 10}},
    limit=100,
    output_fields=["filename", "source"]
)

print(f"\nTop results for query: '{query}'\n")
filenames = set()
for idx, hit in enumerate(results[0]):
    if idx >= 5:  # Only show top 5 results
        break
    print(f"Result {idx+1}:")
    filename = hit.entity.get("filename")
    source = hit.entity.get("source")
    score = hit.distance
    print(f"  File: {filename}")
    print(f"  Source: {source}")
    print(f"  Match Score: {score:.4f}")
    print("-" * 60)
    filenames.add(filename)
if len(filenames) == 1:
    print("[WARNING] All returned results have the same filename. This may indicate duplicate embeddings or data issues.") 