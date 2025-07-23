from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.resume_parser.resume_parser_service import resume_parser_service
from ..services.vector_store.milvus_service import milvus_service
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/resume-parser", tags=["resume-parser"])

@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """Parse a resume file and extract structured information"""
    try:
        parsed_data = await resume_parser_service.parse_resume(file)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stored-resumes")
async def get_stored_resumes():
    """Get all resumes stored in the vector database"""
    try:
        raw_resumes = milvus_service.list_all_resumes()
        
        # Format the resumes in a cleaner way
        formatted_resumes = []
        for resume in raw_resumes:
            # Parse skills into a list
            skills = resume.get('skills', '').split(', ') if resume.get('skills') else []
            skills = [skill.strip() for skill in skills if skill.strip()]
            
            # Parse education into a list
            education = resume.get('education', '').split('|') if resume.get('education') else []
            education = [edu.strip() for edu in education if edu.strip()]
            
            # Format created_at date
            created_at = resume.get('created_at', '')
            try:
                if created_at:
                    dt = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
                    created_at = dt.strftime('%B %d, %Y at %I:%M %p')
            except:
                pass

            formatted_resume = {
                "basic_information": {
                    "name": resume.get('full_name', ''),
                    "contact": {
                        "email": resume.get('email', ''),
                        "phone": resume.get('phone', '')
                    },
                    "current_position": resume.get('last_position', ''),
                    "years_of_experience": resume.get('experience_years', 0)
                },
                "skills": {
                    "total_count": len(skills),
                    "list": skills
                },
                "education": {
                    "total_count": len(education),
                    "list": education
                },
                "metadata": {
                    "resume_id": resume.get('resume_id', ''),
                    "file_path": resume.get('file_path', ''),
                    "uploaded_at": created_at
                }
            }
            formatted_resumes.append(formatted_resume)

        return {
            "total_resumes": len(formatted_resumes),
            "resumes": formatted_resumes
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving stored resumes: {str(e)}"
        ) 