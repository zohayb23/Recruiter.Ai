#!/usr/bin/env python3
"""
Script to reset Marketing & CRM collections with updated schemas
"""

import os
from pymilvus import connections, utility, Collection

# Milvus connection settings
MILVUS_HOST = os.getenv("MILVUS_HOST", "34.135.232.156")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")

def reset_collections():
    """Drop and recreate Marketing & CRM collections"""
    try:
        # Connect to Milvus
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        print(f"✅ Connected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        
        # Collections to reset
        collections_to_reset = ["experiments", "segments", "workflows"]
        
        for collection_name in collections_to_reset:
            if utility.has_collection(collection_name):
                print(f"🗑️ Dropping collection: {collection_name}")
                utility.drop_collection(collection_name)
                print(f"✅ Dropped collection: {collection_name}")
            else:
                print(f"ℹ️ Collection {collection_name} does not exist")
        
        print("✅ All Marketing & CRM collections have been reset")
        print("🔄 Please restart the backend to recreate collections with updated schemas")
        
    except Exception as e:
        print(f"❌ Error resetting collections: {e}")
    finally:
        try:
            connections.disconnect("default")
        except:
            pass

if __name__ == "__main__":
    reset_collections()
