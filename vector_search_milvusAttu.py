from sentence_transformers import SentenceTransformer

# Load the same model you used for resume embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')  # Confirm if this is the one you used

# Encode the search query
query = "Java"
embedding = model.encode(query)

# Print the vector for use in Milvus UI
print(embedding.tolist())  # Copy this list to the search box
