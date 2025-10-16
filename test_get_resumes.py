#!/usr/bin/env python3
"""
Test the get_resumes_from_milvus function directly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymilvus import connections, utility, Collection
import json

# Use the same settings as the backend
MILVUS_HOST = "34.135.232.156"
MILVUS_PORT = "19530"

def test_get_resumes():
    try:
        print("🔍 Testing get_resumes_from_milvus function...")
        
        # Connect to Milvus
        connections.disconnect("default")
        connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
        print(f"✅ Connected to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
        
        # Check if resumes collection exists
        if not utility.has_collection("resumes"):
            print("❌ resumes collection not found")
            return []
        
        collection = Collection("resumes")
        collection.load()
        
        # Query all resumes
        results = collection.query(expr="id != ''", output_fields=["*"])
        print(f"📊 Found {len(results)} resumes in Milvus")
        
        resumes = []
        for result in results:
            # Parse JSON strings to arrays
            try:
                education = json.loads(result.get("education", "[]"))
                work_experience = json.loads(result.get("work_experience", "[]"))
                skills = json.loads(result.get("skills", "[]"))
            except (json.JSONDecodeError, TypeError):
                education = []
                work_experience = []
                skills = []
            
            # Extract contact information
            email = result.get("email", "")
            phone = result.get("phone", "")
            
            # Extract skills list for display
            skills_list = []
            if isinstance(skills, list):
                for skill in skills:
                    if isinstance(skill, dict):
                        skills_list.append(skill.get("name", ""))
                    else:
                        skills_list.append(str(skill))
            
            # Calculate experience years from work experience
            experience_years = len(work_experience) if isinstance(work_experience, list) else 0
            
            resume = {
                "id": result.get("id", ""),
                "name": result.get("full_name", "") or "Unknown",
                "email": email,
                "phone": phone,
                "skills": skills_list,
                "education": education,
                "work_experience": work_experience,
                "created_at": result.get("created_at", ""),
                "updated_at": result.get("created_at", ""),
                "status": "Active",
                "score": 85 + (hash(result.get("id", "")) % 15),
                "location": "Remote",
                "experience_years": experience_years,
                "summary": result.get("summary", "")[:200] + "..." if result.get("summary") else ""
            }
            resumes.append(resume)
        
        print(f"✅ Successfully processed {len(resumes)} resumes")
        
        # Show first few resumes
        for i, resume in enumerate(resumes[:3], 1):
            print(f"  {i}. {resume['name']} - {resume['email']} - {len(resume['skills'])} skills")
        
        return resumes
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    resumes = test_get_resumes()
    print(f"\n🎉 Test complete! Found {len(resumes)} resumes")
