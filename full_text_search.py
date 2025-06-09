import sys
import os
from pymilvus import connections, Collection, DataType, utility, CollectionSchema, FieldSchema
from sentence_transformers import SentenceTransformer
from collections import Counter
import re

# Add 'src' to Python path to import ResumeEmbeddingProcessor
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))
from embedding_processor import ResumeEmbeddingProcessor

# Configuration
COLLECTION_NAME = "resume_fulltext"
HOST = "localhost"
PORT = "19530"

def get_milvus_client():
    """Get a Milvus client instance."""
    try:
        connections.connect(
            alias="default",
            host=HOST,
            port=PORT
        )
        print("[INFO] Client connected successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to connect to Milvus: {e}")
        return False

def create_collection():
    """Create the collection with proper schema."""
    try:
        # Drop existing collection if it exists
        if utility.has_collection(COLLECTION_NAME):
            print(f"[INFO] Dropping existing collection {COLLECTION_NAME}")
            utility.drop_collection(COLLECTION_NAME)
        
        # Define collection schema
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
            FieldSchema(name="sparse", dtype=DataType.FLOAT_VECTOR, dim=384),
            FieldSchema(name="filename", dtype=DataType.VARCHAR, max_length=256),
            FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=32)
        ]
        schema = CollectionSchema(fields=fields, description="Resume collection for full-text search")
        
        # Create collection
        collection = Collection(name=COLLECTION_NAME, schema=schema)
        print(f"[INFO] Created collection {COLLECTION_NAME}")
        
        # Create index
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 1024}
        }
        collection.create_index("sparse", index_params)
        print("[INFO] Created index for sparse field")
        
        # Print schema for verification
        print("\nCollection Schema:")
        for field in collection.schema.fields:
            print(field)
            
        return True
    except Exception as e:
        print(f"[ERROR] Failed to create collection: {e}")
        return False

def load_resume_data():
    """Load resume data from all sources."""
    print("[DEBUG] Starting to load resume data...")
    processor = ResumeEmbeddingProcessor()
    
    # Check if directories exist
    print("[DEBUG] Checking data directories...")
    for path in ["csv_resumes", "pdf_resumes", "docx_resumes"]:
        if os.path.exists(path):
            print(f"[DEBUG] Found directory: {path}")
        else:
            print(f"[WARNING] Directory not found: {path}")
    
    data = processor.load_data(
        csv_path="csv_resumes",
        pdf_dir="pdf_resumes",
        docx_dir="docx_resumes"
    )
    
    if not data:
        print("[ERROR] No data loaded from any source!")
        return []
    
    print(f"[DEBUG] Loaded {len(data)} resumes for fulltext collection")
    print(f"[DEBUG] Source counts: {Counter([item.get('source', '').lower() for item in data])}")
    
    # Print sample data from each source
    for src in ['docx', 'pdf', 'csv']:
        sample = next((item for item in data if item.get('source', '').lower() == src), None)
        if sample:
            print(f"\n[DEBUG] {src.upper()} sample:")
            print(f"  Filename: {sample.get('filename', 'unknown')}")
            print(f"  Text length: {len(sample.get('text', ''))}")
            print(f"  Text preview: {sample.get('text', '')[:200]}...")
        else:
            print(f"\n[WARNING] No {src.upper()} samples found!")
    
    # Count resumes with specific terms
    terms = ['java', 'python', 'developer', 'manager']
    for term in terms:
        count = sum(1 for item in data if term in item.get('text', '').lower())
        print(f"[DEBUG] Resumes containing '{term}': {count}")
    
    return data

def insert_resume_data():
    """Insert resume data into the collection."""
    get_milvus_client()
    collection = Collection(COLLECTION_NAME)
    data = load_resume_data()
    if not data:
        print("[ERROR] No data found to insert")
        return False

    print(f"[INFO] Starting data insertion process")
    print(f"[INFO] Raw data count: {len(data)}")
    
    # Initialize the sentence transformer model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    insert_data = []
    skipped_count = 0
    for item in data:
        if 'text' not in item or not item['text']:
            skipped_count += 1
            continue
            
        # Generate embedding for the text
        text_embedding = model.encode(item['text'])
        
        insert_data.append({
            'text': item['text'],
            'sparse': text_embedding.tolist(),  # Convert numpy array to list
            'filename': item.get('filename', ''),
            'source': item.get('source', '')
        })
    
    if not insert_data:
        print("[ERROR] No valid data to insert after filtering.")
        return False
        
    print(f"[INFO] Inserting {len(insert_data)} items...")
    
    # Insert in smaller batches to avoid memory issues
    batch_size = 100
    total_inserted = 0
    for i in range(0, len(insert_data), batch_size):
        batch = insert_data[i:i + batch_size]
        result = collection.insert(batch)
        total_inserted += result.insert_count
    
    # Force flush to ensure data is persisted
    collection.flush()
    
    # Verify insertion
    num_entities = collection.num_entities
    print(f"[INFO] Successfully inserted {total_inserted} documents")
    
    if num_entities == 0:
        print("[ERROR] Insertion appeared to succeed but collection is empty")
        return False
        
    # Load collection to make it searchable
    collection.load()
    
    return True

def ensure_collection_ready():
    """Ensure the collection exists and has proper index."""
    get_milvus_client()
    collection = Collection(COLLECTION_NAME)
    
    # Check if collection exists
    if COLLECTION_NAME not in utility.list_collections():
        print(f"[INFO] Collection {COLLECTION_NAME} does not exist. Creating...")
        if not create_collection():
            return False
        if not insert_resume_data():
            return False
    
    # Check if index exists
    try:
        index = collection.index()
        if not index:
            print("[INFO] Index not found. Creating...")
            index_params = {
                "index_type": "IVF_FLAT",
                "metric_type": "L2",
                "params": {
                    "nlist": 1024
                }
            }
            collection.create_index("sparse", index_params)
            print("[INFO] Index created successfully")
    except Exception as e:
        print(f"[ERROR] Failed to check/create index: {e}")
        return False
    
    # Load collection
    try:
        print(f"[INFO] Loading collection {COLLECTION_NAME}...")
        collection.load()
        print("[INFO] Collection loaded successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load collection: {e}")
        return False

def get_relevant_snippet(text: str, query: str, context_words: int = 50) -> str:
    """Extract the most relevant snippet from the text containing the query terms."""
    # Clean and normalize the text
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Split query into terms
    query_terms = [term.lower() for term in query.split()]
    
    # Find the best matching position
    best_position = 0
    best_score = 0
    
    # Split text into words
    words = text.split()
    
    for i in range(len(words)):
        score = 0
        # Check how many query terms appear near this position
        for term in query_terms:
            # Look for the term in a window around the current position
            window_start = max(0, i - context_words)
            window_end = min(len(words), i + context_words)
            window = ' '.join(words[window_start:window_end]).lower()
            if term in window:
                score += 1
        if score > best_score:
            best_score = score
            best_position = i
    
    # Extract the snippet
    start = max(0, best_position - context_words)
    end = min(len(words), best_position + context_words)
    snippet = ' '.join(words[start:end])
    
    # Add ellipsis if needed
    if start > 0:
        snippet = '...' + snippet
    if end < len(words):
        snippet = snippet + '...'
    
    return snippet

def search_resumes(query, top_k=10, source=None):
    """Search resumes using full-text search."""
    # Handle empty or whitespace-only queries
    if not query or not query.strip():
        return []
        
    get_milvus_client()
    
    # Ensure collection is ready
    if not ensure_collection_ready():
        return []
    
    # Initialize the sentence transformer model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Generate embedding for the query
    query_embedding = model.encode(query)
    
    # Search parameters for vector search
    search_params = {
        "metric_type": "L2",
        "params": {
            "nprobe": 10  # Number of clusters to search
        }
    }
    
    try:
        collection = Collection(COLLECTION_NAME)
        # First get all results
        results = collection.search(
            data=[query_embedding.tolist()],
            anns_field='sparse',
            param=search_params,
            limit=top_k * 3,  # Get more results to allow for better filtering
            output_fields=['text', 'filename', 'source']
        )
        
        # Format and filter results
        formatted_results = []
        seen_filenames = set()  # Track unique filenames for non-CSV files
        
        # In pymilvus 2.3.3, results is a list of hits
        for hit in results[0]:  # Get first query's results
            try:
                # Access entity fields directly
                filename = hit.entity.filename
                source = hit.entity.source.lower()
                
                # Only deduplicate non-CSV files
                if source != 'csv' and filename in seen_filenames:
                    continue
                    
                text = hit.entity.text
                # Find the most relevant snippet containing the search terms
                snippet = get_relevant_snippet(text, query)
                
                result = {
                    'filename': filename,
                    'source': hit.entity.source,
                    'content': snippet,
                    'score': hit.score
                }
                
                # Filter by source if specified
                if source is None or result['source'].lower() == source.lower():
                    formatted_results.append(result)
                    if source != 'csv':  # Only track seen filenames for non-CSV files
                        seen_filenames.add(filename)
                    if len(formatted_results) >= top_k:
                        break
            except Exception as e:
                print(f"[WARNING] Skipping result due to error: {e}")
                continue
        
        return formatted_results[:top_k]  # Return only top_k results
        
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []

def main():
    # Always drop, recreate, and insert data for debugging
    create_collection()
    insert_resume_data()
    # Example search query
    query = "Salesforce professional with 50+ years"
    results = search_resumes(query, top_k=500)  # Get more results to allow filtering by source

    if not results:
        print("No results found.")
        return

    # Print unique source values for debugging
    unique_sources = set(r.get("source", "").lower() for r in results)
    print(f"[DEBUG] Unique sources in results: {unique_sources}")

    # Deduplicate by filename
    seen_filenames = set()
    deduped_results = []
    for r in results:
        fname = r.get("filename", "")
        if fname not in seen_filenames:
            deduped_results.append(r)
            seen_filenames.add(fname)

    # Group results by source (case-insensitive, handle unknowns)
    grouped = {"csv": [], "docx": [], "pdf": [], "other": []}
    for r in deduped_results:
        source = r.get("source", "").lower()
        if source in grouped and len(grouped[source]) < 50:
            grouped[source].append(r)
        elif source not in grouped and len(grouped["other"]) < 50:
            grouped["other"].append(r)

    def highlight(text, term):
        # Highlight all case-insensitive occurrences of the search term
        return re.sub(f"({re.escape(term)})", r"\033[1;31m\1\033[0m", text, flags=re.IGNORECASE)

    def get_snippet(text, term, window=200):
        # Find the first occurrence of the term (case-insensitive)
        match = re.search(re.escape(term), text, re.IGNORECASE)
        if match:
            start = max(match.start() - window, 0)
            end = min(match.end() + window, len(text))
            snippet = text[start:end].replace('\n', ' ')
        else:
            snippet = text[:2*window].replace('\n', ' ')
        return highlight(snippet, term)

    print(f"\n{'='*25} SEARCH RESULTS FOR: '{query}' {'='*25}\n")

    # Print results by source
    for source in ["csv", "docx", "pdf", "other"]:
        print(f"\n{'='*20} {source.upper()} RESULTS {'='*20}\n")
        if not grouped[source]:
            print("No results found for this source.")
            continue
        for i, result in enumerate(grouped[source], 1):
            print(f"[{i}] Filename: {result['filename']} | Score: {result['score']:.2f}")
            print(f"Snippet: {result['content']}")
            print("-" * 60)

if __name__ == "__main__":
    main()
