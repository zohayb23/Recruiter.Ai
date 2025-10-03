#!/usr/bin/env python3
"""
Startup script for Recruiter.AI Backend
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from config.settings import settings

def main():
    """Main startup function"""
    print("🚀 Starting Recruiter.AI Backend API")
    print(f"📊 Features enabled:")
    print(f"   - Resume Parsing: {settings.ENABLE_RESUME_PARSING}")
    print(f"   - AI Job Descriptions: {settings.ENABLE_AI_JOB_DESCRIPTIONS}")
    print(f"   - Semantic Search: {settings.ENABLE_SEMANTIC_SEARCH}")
    print(f"   - Mass Mailing: {settings.ENABLE_MASS_MAILING}")
    print(f"   - CRM Pipeline: {settings.ENABLE_CRM_PIPELINE}")
    print(f"🌐 Server will start on: http://{settings.HOST}:{settings.PORT}")
    print(f"📚 API Documentation: http://{settings.HOST}:{settings.PORT}/docs")
    print("=" * 60)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )

if __name__ == "__main__":
    main()
