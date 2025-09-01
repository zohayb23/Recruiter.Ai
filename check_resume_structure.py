#!/usr/bin/env python3

import sys
import os

try:
    # Add the current directory to Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Import the service
    from src.services.vector_store.milvus_service import milvus_service
    print("✅ Successfully imported milvus_service")
    
    resumes = milvus_service.list_all_resumes()
    print(f"📊 Found {len(resumes)} resumes")
    
    if resumes:
        first_resume = resumes[0]
        print("\n🔍 First resume structure:")
        for key, value in first_resume.items():
            print(f"  {key}: {type(value)} = {repr(value)}")
            
        # Check specific fields that might be causing issues
        skills = first_resume.get('skills')
        education = first_resume.get('education')
        
        print(f"\n🎯 Skills field: {type(skills)} = {repr(skills)}")
        print(f"🎓 Education field: {type(education)} = {repr(education)}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
