import sys
import os
from pymilvus import MilvusClient, DataType, Function, FunctionType
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
    return MilvusClient(
        uri=f"http://{HOST}:{PORT}",
        token="root:Milvus"
    )

def create_collection():
    """Create a collection with proper schema for full-text search."""
    client = get_milvus_client()
    
    # Drop collection if it exists
    if COLLECTION_NAME in client.list_collections():
        print(f"[INFO] Dropping existing collection {COLLECTION_NAME}")
        client.drop_collection(COLLECTION_NAME)
    
    # Create schema
    schema = MilvusClient.create_schema()
    
    # Add fields
    schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True, auto_id=True)
    schema.add_field(field_name="text", datatype=DataType.VARCHAR, max_length=65535, enable_analyzer=True)
    schema.add_field(field_name="sparse", datatype=DataType.SPARSE_FLOAT_VECTOR, is_nullable=True)
    schema.add_field(field_name="filename", datatype=DataType.VARCHAR, max_length=256)
    schema.add_field(field_name="source", datatype=DataType.VARCHAR, max_length=32)
    
    # Add BM25 function
    bm25_function = Function(
        name="text_bm25_emb",
        input_field_names=["text"],
        output_field_names=["sparse"],
        function_type=FunctionType.BM25
    )
    schema.add_function(bm25_function)
    
    # Create collection
    try:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            schema=schema
        )
        print(f"[INFO] Created collection {COLLECTION_NAME}")
        
        # Create index after collection creation
        index_params = MilvusClient.prepare_index_params()
        index_params.add_index(
            field_name="sparse",
            index_type="SPARSE_INVERTED_INDEX",
            metric_type="BM25",
            params={
                "inverted_index_algo": "DAAT_MAXSCORE",
                "bm25_k1": 1.2,
                "bm25_b": 0.75
            }
        )
        client.create_index(COLLECTION_NAME, index_params)
        print("[INFO] Created index for sparse field")
        
        # Verify collection was created with correct schema
        collection_info = client.describe_collection(COLLECTION_NAME)
        print("\nCollection Schema:")
        for field in collection_info['fields']:
            print(field)  # Print the whole field dict for debugging
        
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
    client = get_milvus_client()
    data = load_resume_data()
    if not data:
        print("[ERROR] No data found to insert")
        return False

    print(f"[INFO] Starting data insertion process")
    print(f"[INFO] Raw data count: {len(data)}")
    
    insert_data = []
    skipped_count = 0
    for item in data:
        if 'text' not in item or not item['text']:
            skipped_count += 1
            continue
        insert_data.append({
            'text': item['text'],
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
        result = client.insert(COLLECTION_NAME, batch)
        total_inserted += result['insert_count']
    
    # Force flush to ensure data is persisted
    client.flush(COLLECTION_NAME)
    
    # Verify insertion
    stats = client.get_collection_stats(COLLECTION_NAME)
    print(f"[INFO] Successfully inserted {total_inserted} documents")
    
    if stats['row_count'] == 0:
        print("[ERROR] Insertion appeared to succeed but collection is empty")
        return False
        
    # Load collection to make it searchable
    client.load_collection(COLLECTION_NAME)
    
    return True

def ensure_collection_ready():
    """Ensure the collection exists and has proper index."""
    client = get_milvus_client()
    
    # Check if collection exists
    if COLLECTION_NAME not in client.list_collections():
        print(f"[INFO] Collection {COLLECTION_NAME} does not exist. Creating...")
        if not create_collection():
            return False
        if not insert_resume_data():
            return False
    
    # Check if index exists
    try:
        index_info = client.describe_index(COLLECTION_NAME, "sparse")
        if not index_info:
            print("[INFO] Index not found. Creating...")
            index_params = MilvusClient.prepare_index_params()
            index_params.add_index(
                field_name="sparse",
                index_type="SPARSE_INVERTED_INDEX",
                metric_type="BM25",
                params={
                    "inverted_index_algo": "DAAT_MAXSCORE",
                    "bm25_k1": 1.2,
                    "bm25_b": 0.75
                }
            )
            client.create_index(COLLECTION_NAME, index_params)
            print("[INFO] Index created successfully")
    except Exception as e:
        print(f"[ERROR] Failed to check/create index: {e}")
        return False
    
    # Load collection only if not already loaded
    try:
        load_state = client.get_load_state(COLLECTION_NAME)
        if load_state != "Loaded":
            print(f"[INFO] Loading collection {COLLECTION_NAME}...")
            client.load_collection(COLLECTION_NAME)
            print("[INFO] Collection loaded successfully")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load collection: {e}")
        return False

def search_resumes(query, top_k=10, source=None):
    """Search resumes using full-text search."""
    client = get_milvus_client()
    
    # Ensure collection is ready
    if not ensure_collection_ready():
        return []
    
    # Search parameters for BM25
    search_params = {
        'metric_type': 'BM25',
        'params': {
            'drop_ratio_search': 0.1,
            'search_mode': 'BM25',
            'bm25_k1': 1.5,
            'bm25_b': 0.8
        }
    }
    
    try:
        # First get all results
        results = client.search(
            collection_name=COLLECTION_NAME,
            data=[query],
            anns_field='sparse',
            limit=top_k * 3,  # Get more results to allow for better filtering
            search_params=search_params,
            output_fields=['text', 'filename', 'source']
        )
        
        # Format and filter results
        formatted_results = []
        seen_filenames = set()  # Track unique filenames
        
        for hits in results:
            for hit in hits:
                filename = hit.entity.get('filename', '')
                # Skip if we've already seen this filename
                if filename in seen_filenames:
                    continue
                    
                text = hit.entity.get('text', '')
                # Find the most relevant snippet containing the search terms
                snippet = get_relevant_snippet(text, query)
                
                result = {
                    'filename': filename,
                    'source': hit.entity.get('source', ''),
                    'content': snippet,
                    'score': hit.score
                }
                
                # Filter by source if specified
                if source is None or result['source'].lower() == source.lower():
                    formatted_results.append(result)
                    seen_filenames.add(filename)
                    if len(formatted_results) >= top_k:
                        break
        
        return formatted_results[:top_k]  # Return only top_k results
        
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []

def get_relevant_snippet(text, query, window=200):
    """Get the most relevant snippet of text containing the search terms."""
    # Split query into terms
    terms = query.lower().split()
    
    # Find the best position that contains the most search terms
    best_pos = 0
    max_terms = 0
    
    # Look for each term in the text
    for term in terms:
        pos = text.lower().find(term)
        if pos != -1:
            # Count how many other terms are within window size
            term_count = sum(1 for t in terms if t in text[max(0, pos-window):min(len(text), pos+window)].lower())
            if term_count > max_terms:
                max_terms = term_count
                best_pos = pos
    
    # If no terms found, return start of text
    if max_terms == 0:
        return text[:window*2].replace('\n', ' ')
    
    # Get snippet around best position
    start = max(0, best_pos - window)
    end = min(len(text), best_pos + window)
    snippet = text[start:end].replace('\n', ' ')
    
    # Add ellipsis if we're not at the start/end
    if start > 0:
        snippet = '...' + snippet
    if end < len(text):
        snippet = snippet + '...'
        
    return snippet

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
    for source in ["csv", "docx", "pdf", "other"]:
        header = f"{source.upper()} RESULTS"
        print(f"{'='*20} {header} {'='*20}\n")
        if not grouped[source]:
            print("No results found for this source.\n")
            continue
        for i, r in enumerate(grouped[source], 1):
            snippet = get_snippet(r['content'], query)
            print(f"[{i}] Filename: {r['filename']} | Score: {r['score']:.2f}")
            print(f"Snippet: {snippet}...\n")
            print("-" * 60 + "\n")

if __name__ == "__main__":
    main()
