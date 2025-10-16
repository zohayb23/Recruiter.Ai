#!/usr/bin/env python3
"""
Test the candidates endpoint directly
"""

import requests
import json

def test_candidates_endpoint():
    try:
        print("🔍 Testing candidates endpoint...")
        
        response = requests.get("http://localhost:8804/api/candidates")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            candidates = data.get("candidates", [])
            print(f"Number of candidates: {len(candidates)}")
            
            if len(candidates) > 0:
                print(f"First candidate: {candidates[0]}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_candidates_endpoint()
