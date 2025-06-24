from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType, utility

def create_document_collection():
    try:
        # Connect to Milvus
        print("Connecting to Milvus...")
        connections.connect(
            alias="default",
            host='localhost',
            port='19530'
        )
        
        collection_name = "document_store"
        dim = 1536  # Dimension for text-embedding-ada-002 model

        # Drop collection if it exists
        if utility.has_collection(collection_name):
            print(f"Collection '{collection_name}' already exists. Dropping it...")
            utility.drop_collection(collection_name)

        # Define fields for the collection
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="doc_id", dtype=DataType.VARCHAR, max_length=100),  # Custom document identifier
            FieldSchema(name="content_vector", dtype=DataType.FLOAT_VECTOR, dim=dim),
            FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=500),
            FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=500),
            FieldSchema(name="doc_type", dtype=DataType.VARCHAR, max_length=50),  # e.g., "resume", "job_description"
        ]

        # Create collection schema
        schema = CollectionSchema(
            fields=fields,
            description="Document store for embeddings and metadata"
        )

        # Create collection
        print(f"\nCreating collection '{collection_name}'...")
        collection = Collection(name=collection_name, schema=schema)

        # Create index for vector field
        print("\nCreating index on vector field...")
        index_params = {
            "metric_type": "COSINE",  # or "L2" for euclidean distance
            "index_type": "IVF_FLAT",
            "params": {"nlist": 1024}
        }
        collection.create_index(field_name="content_vector", index_params=index_params)
        
        print("\nCollection created successfully!")
        print("\nCollection schema:")
        print(collection.schema)
        
        # Show collection statistics
        print("\nCollection statistics:")
        print(f"Number of entities: {collection.num_entities}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        if connections.has_connection("default"):
            print("\nClosing connection...")
            connections.disconnect("default")

if __name__ == "__main__":
    create_document_collection() 