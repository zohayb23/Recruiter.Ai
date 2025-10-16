#!/usr/bin/env python3

import sys
from pymilvus import connections, utility, Collection, FieldSchema, CollectionSchema, DataType

def create_missing_collections():
    """Create the missing collections in Milvus"""
    try:
        print("🔗 Connecting to Milvus...")
        
        # Connect to the same Milvus instance the backend uses
        connections.connect("default", host="34.135.232.156", port="19530")
        print("✅ Connected to Milvus")
        
        # Create campaigns collection
        if not utility.has_collection("campaigns"):
            print("📧 Creating campaigns collection...")
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
                FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="subject", dtype=DataType.VARCHAR, max_length=500),
                FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=10000),
                FieldSchema(name="recipients", dtype=DataType.VARCHAR, max_length=10000),
                FieldSchema(name="status", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="template_id", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="sent_at", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="open_rate", dtype=DataType.FLOAT),
                FieldSchema(name="click_rate", dtype=DataType.FLOAT),
                FieldSchema(name="reply_rate", dtype=DataType.FLOAT),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536)
            ]
            schema = CollectionSchema(fields, "Campaigns collection for mass mailing")
            collection = Collection("campaigns", schema)
            
            # Create index for embedding field
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            collection.create_index("embedding", index_params)
            print("✅ Campaigns collection created")
        else:
            print("✅ Campaigns collection already exists")
        
        # Create experiments collection
        if not utility.has_collection("experiments"):
            print("🧪 Creating experiments collection...")
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
                FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
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
            print("✅ Experiments collection created")
        else:
            print("✅ Experiments collection already exists")
        
        # Create segments collection
        if not utility.has_collection("segments"):
            print("🎯 Creating segments collection...")
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
            print("✅ Segments collection created")
        else:
            print("✅ Segments collection already exists")
        
        # Create workflows collection
        if not utility.has_collection("workflows"):
            print("⚙️ Creating workflows collection...")
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
            print("✅ Workflows collection created")
        else:
            print("✅ Workflows collection already exists")
        
        # List all collections to verify
        print("\n📊 All collections in Milvus:")
        collections = utility.list_collections()
        for collection_name in collections:
            try:
                collection = Collection(collection_name)
                count = collection.num_entities
                print(f"  ✅ {collection_name}: {count} entities")
            except Exception as e:
                print(f"  ❌ {collection_name}: Error getting count - {e}")
        
        print("\n🎉 All collections created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        try:
            connections.disconnect("default")
        except:
            pass
    
    return True

if __name__ == "__main__":
    create_missing_collections()
