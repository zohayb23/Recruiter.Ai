#!/usr/bin/env python3
"""
Test Milvus connection using the same logic as the backend
"""

import os
from pymilvus import connections, utility, Collection

# Use the same settings as the backend
MILVUS_HOST = "34.135.232.156"
MILVUS_PORT = "19530"
MILVUS_DB_NAME = "default"

def test_connection():
    try:
        print(f"🔍 Testing connection to {MILVUS_HOST}:{MILVUS_PORT}")
        
        # Disconnect any existing connections first
        try:
            connections.disconnect("default")
        except:
            pass
        
        # Connect
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        print(f"✅ Connected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        
        # Check resumes collection
        if utility.has_collection("resumes"):
            collection = Collection("resumes")
            collection.load()
            count = collection.num_entities
            print(f"📊 Found resumes collection with {count} entities")
            
            if count > 0:
                # Query some data
                results = collection.query(
                    expr="id != ''",
                    output_fields=["id", "full_name"],
                    limit=3
                )
                print(f"📋 Sample candidates:")
                for i, result in enumerate(results, 1):
                    print(f"  {i}. {result.get('full_name', 'Unknown')} (ID: {result.get('id', 'N/A')[:8]}...)")
            
            return True
        else:
            print("❌ resumes collection not found")
            return False
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if success:
        print("\n🎉 Milvus connection test successful!")
    else:
        print("\n❌ Milvus connection test failed!")
