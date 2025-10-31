# Candidate Pool Ingestion Guide

## Overview
This script ingests 1000 candidates from `candidate_pool_1000.csv` into your Milvus database.

## Prerequisites
1. Ensure you have the required Python packages:
```bash
pip install pymilvus sentence-transformers
```

2. Make sure your Milvus connection is set up (the script uses the same connection as your main backend)

## How to Run

### Option 1: Simple Run (Default Settings)
```bash
cd backend
python3 ingest_new_candidate_pool_from_csv.py
```

### Option 2: Custom Configuration
```bash
cd backend
# Use different CSV file
CSV_PATH="your_file.csv" python3 ingest_new_candidate_pool_from_csv.py

# Use different collection name
NEW_COLLECTION="candidate_pool_v2" python3 ingest_new_candidate_pool_from_csv.py

# Force CPU embedding (safer for memory)
EMBED_DEVICE="cpu" python3 ingest_new_candidate_pool_from_csv.py
```

## What the Script Does
1. **Reads** the CSV file (`candidate_pool_1000.csv`)
2. **Generates embeddings** using `intfloat/e5-base-v2` model
3. **Maps fields** from CSV to Milvus schema
4. **Categorizes candidates** by role (frontend, backend, devops, etc.)
5. **Checks for duplicates** and updates existing records
6. **Inserts new candidates** into Milvus in batches of 256

## Environment Variables
- `MILVUS_URI`: Milvus connection URI (default: `http://34.135.232.156:19530`)
- `MILVUS_DB`: Database name (default: `default`)
- `NEW_COLLECTION`: Collection name (default: `new_candidate_pool`)
- `CSV_PATH`: Path to CSV file (default: `candidate_pool_1000.csv`)
- `EMBED_DEVICE`: Device for embeddings (default: `cpu` - use `cuda` if GPU available)
- `BATCH`: Batch size for Milvus insert (default: `256`)

## Expected Output
```
[info] encoding summary texts on cpu (max_len=256) …
[info] encoding skills texts on cpu …
[done] upserted: new=1000 updated=0
```

## Troubleshooting
- **Out of Memory**: Use `EMBED_DEVICE="cpu"` to force CPU mode
- **Collection not found**: Create the collection first using `create_new_candidate_pool.py`
- **Connection errors**: Ensure your Milvus server is running and accessible

## After Running
The candidates will be available in your Milvus database and can be queried through your application!
