import sys
import os
from pymilvus import connections, Collection, DataType, utility, CollectionSchema, FieldSchema
from sentence_transformers import SentenceTransformer
from collections import Counter
import re
import time

# Add 'src' to Python path to import ResumeEmbeddingProcessor
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))
from embedding_processor import ResumeEmbeddingProcessor

# Configuration
COLLECTION_NAME = "resume_fulltext"
HOST = "localhost"
PORT = "19530"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

def get_milvus_client():
    """Get a Milvus client instance with retries."""
    for attempt in range(MAX_RETRIES):
        try:
            # Disconnect if there's an existing connection
            try:
                connections.disconnect("default")
            except:
                pass

            print(f"[INFO] Attempting to connect to Milvus (attempt {attempt + 1}/{MAX_RETRIES})")
            connections.connect(
                alias="default",
                host=HOST,
                port=PORT,
                timeout=30  # Increase timeout to 30 seconds
            )
            
            # Test the connection by listing collections
            utility.list_collections()
            
            print("[INFO] Successfully connected to Milvus")
            return True
            
        except Exception as e:
            print(f"[WARNING] Connection attempt {attempt + 1} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"[INFO] Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                print("[ERROR] Failed to connect to Milvus after all retries")
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
                "params": {"nlist": 1024}
            }
            collection.create_index("sparse", index_params)
            print("[INFO] Created index")
        
        # Load collection
        collection.load()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to check/create index: {e}")
        return False

def get_relevant_snippet(text: str, query: str, context_words: int = 50) -> str:
    """Get a relevant snippet of text containing the query terms."""
    # Convert query to lowercase for case-insensitive matching
    text_lower = text.lower()
    query_lower = query.lower()
    
    # Find the first occurrence of any query term
    best_pos = -1
    query_terms = query_lower.split()
    for term in query_terms:
        pos = text_lower.find(term)
        if pos != -1:
            best_pos = pos if best_pos == -1 else min(best_pos, pos)
    
    if best_pos == -1:
        # If no query terms found, return the start of the text
        return text[:200] + "..."
    
    # Get context around the match
    words = text.split()
    total_chars = 0
    start_idx = 0
    for idx, word in enumerate(words):
        total_chars += len(word) + 1  # +1 for space
        if total_chars > best_pos:
            start_idx = max(0, idx - context_words)
            break
    
    end_idx = min(len(words), start_idx + context_words * 2)
    snippet = ' '.join(words[start_idx:end_idx])
    
    return snippet + "..."

def search_resumes(query, top_k=10, source=None):
    """Search resumes using the query text."""
    try:
        # Try to connect to Milvus
        if not get_milvus_client():
            print("[ERROR] Could not establish connection to Milvus")
            return []

        # Check if collection exists
        if not utility.has_collection(COLLECTION_NAME):
            print(f"[INFO] Collection {COLLECTION_NAME} does not exist. Creating...")
            if not create_collection():
                return []
            if not insert_resume_data():
                return []

        collection = Collection(COLLECTION_NAME)
        
        try:
            collection.load()
        except Exception as e:
            print(f"[WARNING] Error loading collection: {e}")
            try:
                # Try to recreate and load
                create_collection()
                insert_resume_data()
                collection = Collection(COLLECTION_NAME)
                collection.load()
            except Exception as e:
                print(f"[ERROR] Failed to recreate collection: {e}")
                return []

        # Initialize the model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Generate query embedding
        query_embedding = model.encode(query)
        
        # Prepare search parameters
        search_params = {
            "metric_type": "L2",
            "params": {"nprobe": 10}
        }
        
        # Execute search
        results = collection.search(
            data=[query_embedding.tolist()],
            anns_field="sparse",
            param=search_params,
            limit=top_k,
            output_fields=["text", "filename", "source"]
        )

        # Process results
        processed_results = []
        for hits in results:
            for hit in hits:
                result = {
                    'text': hit.entity.get('text'),
                    'filename': hit.entity.get('filename'),
                    'source': hit.entity.get('source'),
                    'score': hit.distance
                }
                if source is None or result['source'].lower() == source.lower():
                    processed_results.append(result)

        return processed_results[:top_k]

    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []
    finally:
        # Always try to disconnect cleanly
        try:
            connections.disconnect("default")
        except:
            pass

def main():
    """Main function for testing."""
    # Example search
    query = "python developer with machine learning experience"
    print(f"\nSearching for: {query}")
    
    results = search_resumes(query, top_k=5)
    
    if not results:
        print("No results found.")
        return
    
    print("\nSearch Results:")
    print("=" * 80)
    
    def highlight(text, term):
        """Highlight search terms in text."""
        return text.replace(term, f"\033[1m{term}\033[0m")
    
    for idx, result in enumerate(results, 1):
        print(f"\nResult {idx}:")
        print(f"File: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Score: {result['score']:.4f}")
        print("\nSnippet:")
        snippet = result['snippet']
        # Highlight query terms
        for term in query.lower().split():
            snippet = highlight(snippet, term)
        print(snippet)
        print("-" * 80)

if __name__ == "__main__":
    main()
