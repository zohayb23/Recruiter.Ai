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
    processor = ResumeEmbeddingProcessor()
    data = processor.load_data(
        csv_path="csv_resumes",
        pdf_dir="pdf_resumes",
        docx_dir="docx_resumes"
    )
    # Patch: assign unique filenames to each CSV resume
    csv_counter = 0
    for item in data:
        if item.get('source', '').lower() == 'csv':
            csv_counter += 1
            item['filename'] = f"{item.get('filename', 'csv')}_{csv_counter}"
    print(f"[DEBUG] Loaded {len(data)} resumes for fulltext collection")
    print(f"[DEBUG] Source counts: {Counter([item.get('source', '').lower() for item in data])}")
    # Print a sample DOCX and PDF resume text
    for src in ['docx', 'pdf']:
        for item in data:
            if item.get('source', '').lower() == src:
                print(f"[DEBUG] {src.upper()} sample: {item.get('filename', '')} length={len(item.get('text', ''))} snippet={item.get('text', '')[:300]}")
                break
    # Count how many DOCX/PDF resumes actually contain 'java'
    for src in ['docx', 'pdf']:
        count = sum(1 for item in data if item.get('source', '').lower() == src and 'java' in item.get('text', '').lower())
        print(f"[DEBUG] {src.upper()} resumes containing 'java': {count}")
    # CSV-specific debug
    csv_java_count = sum(1 for item in data if item.get('source', '').lower() == 'csv' and 'java' in item.get('text', '').lower())
    print(f"[DEBUG] CSV resumes containing 'java': {csv_java_count}")
    return data

def insert_resume_data():
    client = get_milvus_client()
    data = load_resume_data()
    if not data:
        print("[ERROR] No data found to insert")
        return False

    insert_data = []
    for item in data:
        if 'text' not in item or not item['text']:
            print(f"[WARNING] Skipping item with missing or empty 'text': {item}")
            continue
        insert_data.append({
            'text': item['text'],
            'filename': item.get('filename', ''),
            'source': item.get('source', '')
        })
    print(f"[DEBUG] Prepared {len(insert_data)} items for insertion into fulltext collection")

    try:
        if not insert_data:
            print("[ERROR] No valid data to insert after filtering.")
            return False
        result = client.insert(COLLECTION_NAME, insert_data)
        stats = client.get_collection_stats(COLLECTION_NAME)
        print(f"[INFO] Collection now contains {stats['row_count']} documents")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to insert data: {e}")
        return False

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
    
    # Load collection
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

def search_resumes(query, top_k=10):
    """Search resumes using full-text search."""
    client = get_milvus_client()
    
    # Ensure collection is ready
    if not ensure_collection_ready():
        return []
    
    # Search parameters for BM25
    search_params = {
        'metric_type': 'BM25',
        'params': {
            'drop_ratio_search': 0.2,
            'search_mode': 'BM25'
        }
    }
    
    try:
        print(f"\n[INFO] Searching for: {query}")
        print(f"[INFO] Using search parameters: {search_params}")
        
        results = client.search(
            collection_name=COLLECTION_NAME,
            data=[query],
            anns_field='sparse',
            limit=top_k,
            search_params=search_params,
            output_fields=['text', 'filename', 'source']
        )
        
        print(f"[INFO] Search returned {len(results[0]) if results else 0} results")
        
        # Format results
        formatted_results = []
        for hits in results:
            for hit in hits:
                formatted_results.append({
                    'filename': hit.entity.get('filename', ''),
                    'source': hit.entity.get('source', ''),
                    'content': hit.entity.get('text', '')[:200],
                    'score': hit.score
                })
        
        return formatted_results
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
