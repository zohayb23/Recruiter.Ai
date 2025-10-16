#!/usr/bin/env python3
"""
Script to create Marketing & CRM collections with proper schemas
"""

import os
from pymilvus import connections, utility, Collection, FieldSchema, CollectionSchema, DataType

# Milvus connection settings
MILVUS_HOST = os.getenv("MILVUS_HOST", "34.135.232.156")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")

def create_experiments_collection():
    """Create experiments collection in Milvus for A/B testing data"""
    try:
        if utility.has_collection("experiments"):
            print("✅ Experiments collection already exists")
            return Collection("experiments")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="test_type", dtype=DataType.VARCHAR, max_length=100),
            FieldSchema(name="test_duration_hours", dtype=DataType.INT64),
            FieldSchema(name="variants", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="start_date", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="end_date", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="traffic_split", dtype=DataType.VARCHAR, max_length=1000),
            FieldSchema(name="metrics", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="results", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Experiments collection for A/B testing")
        collection = Collection("experiments", schema)
        
        # Create index for embedding field
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Experiments collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating experiments collection: {e}")
        return None

def create_segments_collection():
    """Create segments collection in Milvus for candidate segmentation data"""
    try:
        if utility.has_collection("segments"):
            print("✅ Segments collection already exists")
            return Collection("segments")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="criteria", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="rules", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="recipient_count", dtype=DataType.INT64),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="last_updated", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Segments collection for candidate segmentation")
        collection = Collection("segments", schema)
        
        # Create index for embedding field
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Segments collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating segments collection: {e}")
        return None

def create_workflows_collection():
    """Create workflows collection in Milvus for automation workflow data"""
    try:
        if utility.has_collection("workflows"):
            print("✅ Workflows collection already exists")
            return Collection("workflows")
        
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
            FieldSchema(name="triggers", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="actions", dtype=DataType.VARCHAR, max_length=10000),
            FieldSchema(name="conditions", dtype=DataType.VARCHAR, max_length=5000),
            FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="is_active", dtype=DataType.BOOL),
            FieldSchema(name="execution_count", dtype=DataType.INT64),
            FieldSchema(name="last_executed", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
        ]
        
        schema = CollectionSchema(fields, "Workflows collection for automation")
        collection = Collection("workflows", schema)
        
        # Create index for embedding field
        index_params = {
            "metric_type": "L2",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index("embedding", index_params)
        
        print("✅ Workflows collection created successfully")
        return collection
    except Exception as e:
        print(f"❌ Error creating workflows collection: {e}")
        return None

def main():
    """Create all Marketing & CRM collections"""
    try:
        # Connect to Milvus
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        print(f"✅ Connected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        
        # Create collections
        create_experiments_collection()
        create_segments_collection()
        create_workflows_collection()
        
        print("✅ All Marketing & CRM collections created successfully")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        try:
            connections.disconnect("default")
        except:
            pass

if __name__ == "__main__":
    main()
