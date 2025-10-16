#!/usr/bin/env python3
"""
Test Milvus connection to find the correct IP with 10 candidates
"""

from pymilvus import connections, utility, Collection
import os

# Test different Milvus IPs
milvus_ips = [
    "34.63.125.128",  # Your Attu interface IP
    "34.135.232.156",  # Previous LoadBalancer IP
    "136.112.242.98",  # Original working IP
    "my-milvus",  # Internal service name
]

def test_milvus_connection(host, port=19530):
    try:
        print(f"\n🔍 Testing connection to {host}:{port}")
        
        # Disconnect any existing connections
        connections.disconnect("default")
        
        # Try to connect
        connections.connect("default", host=host, port=port)
        print(f"✅ Connected to {host}:{port}")
        
        # Check if resumes collection exists
        if utility.has_collection("resumes"):
            collection = Collection("resumes")
            collection.load()
            count = collection.num_entities
            print(f"📊 Found resumes collection with {count} entities")
            
            if count > 0:
                # Query a few records to see the data
                results = collection.query(
                    expr="id != ''",
                    output_fields=["id", "full_name", "email"],
                    limit=5
                )
                print(f"📋 Sample data:")
                for i, result in enumerate(results, 1):
                    print(f"  {i}. ID: {result.get('id', 'N/A')[:8]}...")
                    print(f"     Name: {result.get('full_name', 'N/A')}")
                    print(f"     Email: {result.get('email', 'N/A')}")
            
            return count
        else:
            print("❌ resumes collection not found")
            return 0
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return 0

def main():
    print("🚀 Testing Milvus connections to find the correct IP with 10 candidates...")
    
    for ip in milvus_ips:
        count = test_milvus_connection(ip)
        if count == 10:
            print(f"\n🎉 FOUND THE CORRECT MILVUS IP: {ip}")
            print(f"   This IP has {count} candidates (matches your Attu interface)")
            break
        elif count > 0:
            print(f"⚠️  {ip} has {count} candidates (not the expected 10)")
        else:
            print(f"❌ {ip} has no candidates or connection failed")
    
    print("\n✅ Test complete!")

if __name__ == "__main__":
    main()
