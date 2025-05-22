from sentence_transformers import SentenceTransformer
from pymilvus import Collection, connections

# Connect to Milvus (adjust host and port as needed)
connections.connect(alias="default", host="localhost", port="19530")

model = SentenceTransformer('all-MiniLM-L6-v2')
query = "Java"  # Change this to your search phrase
embedding = model.encode([query])

collection = Collection("resume_embeddings")
# Load the collection into memory before searching
collection.load()

# Set this to True to only search pdf and docx resumes, False to search all
ONLY_PDF_AND_DOCX = False

expr = None
if ONLY_PDF_AND_DOCX:
    expr = 'source in ["pdf", "docx"]'

results = collection.search(
    data=embedding,
    anns_field="embedding",
    param={"metric_type": "L2", "params": {"nprobe": 10}},
    limit=100,
    output_fields=["filename", "source"],
    expr=expr
)

print(f"Top 100 results for query '{query}':")
filenames = set()
for idx, hit in enumerate(results[0]):
    print(f"Result {idx+1}:")
    for field in hit.entity.keys():
        print(f"  {field}: {hit.entity.get(field)}")
    print(f"  Score: {hit.distance}")
    print("-" * 40)
    filenames.add(hit.entity.get("filename"))
if len(filenames) == 1:
    print("[WARNING] All returned results have the same filename. This may indicate duplicate embeddings or data issues.") 