import asyncio
import aiohttp
import os
from pathlib import Path

async def test_resume_parser():
    # URL of your FastAPI endpoint
    url = "http://localhost:8804/api/resume-parser/parse"
    
    # Path to test resume
    resume_path = "fwdsampleresumes/Gary Jiang - Business Analyst.rtf"
    
    if not os.path.exists(resume_path):
        print(f"Test resume not found: {resume_path}")
        return
    
    # Prepare the file upload
    async with aiohttp.ClientSession() as session:
        with open(resume_path, 'rb') as f:
            form = aiohttp.FormData()
            form.add_field('file',
                         f,
                         filename=Path(resume_path).name,
                         content_type='application/rtf')
            
            async with session.post(url, data=form) as response:
                print(f"Status: {response.status}")
                result = await response.json()
                print("Response:", result)
                
                if response.status == 200:
                    # Verify the resume was stored in Milvus
                    stored_resumes_url = "http://localhost:8804/api/resume-parser/stored-resumes"
                    async with session.get(stored_resumes_url) as verify_response:
                        stored = await verify_response.json()
                        print("\nStored Resumes:", stored)

if __name__ == "__main__":
    asyncio.run(test_resume_parser()) 