import os
import asyncio
from src.services.resume_parser.resume_parser_service import ResumeParserService
from src.services.vector_store.milvus_service import milvus_service
from src.services.vector_store.milvus_loadbalancer_service import milvus_loadbalancer_service

async def reprocess_resumes():
    # Initialize services
    resume_parser = ResumeParserService()
    
    # Get all files in the uploads/resumes directory
    upload_dir = "uploads/resumes"
    resume_files = [f for f in os.listdir(upload_dir) if not f.startswith('.')]
    
    print(f"Found {len(resume_files)} resumes to process")
    
    # Process each resume
    for file_name in resume_files:
        file_path = os.path.join(upload_dir, file_name)
        print(f"\nProcessing {file_name}...")
        
        try:
            with open(file_path, 'rb') as file:
                # Process the resume
                result = await resume_parser.parse_resume(file)
                print(f"Successfully processed {file_name}")
        except Exception as e:
            print(f"Error processing {file_name}: {e}")

if __name__ == "__main__":
    asyncio.run(reprocess_resumes()) 