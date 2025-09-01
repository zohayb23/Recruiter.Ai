from fastapi import APIRouter, UploadFile, File, HTTPException
try:
    # Try relative imports first
    from ..services.resume_parser.resume_parser_service import resume_parser_service
    from ..services.vector_store.milvus_service import milvus_service
except ImportError:
    # Fall back to absolute imports
    from src.services.resume_parser.resume_parser_service import resume_parser_service
    from src.services.vector_store.milvus_service import milvus_service
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/resume-parser", tags=["resume-parser"])

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
            # Parse skills into a list - handle any data type safely
            skills = resume.get('skills', [])
            if isinstance(skills, str):
                skills = skills.split(', ') if skills else []
            elif not isinstance(skills, list):
                skills = []
            
            # Clean and extract skill names from any data type
            cleaned_skills = []
            for skill in skills:
                if skill:
                    try:
                        if isinstance(skill, str):
                            # Handle string representations like "{'name': 'Python', 'category': 'programming_languages'}"
                            if skill.startswith('{') and skill.endswith('}'):
                                try:
                                    # Extract just the skill name from the string representation
                                    import ast
                                    skill_dict = ast.literal_eval(skill)
                                    skill_name = skill_dict.get('name', skill.strip())
                                    cleaned_skills.append(str(skill_name).strip())
                                except:
                                    # Fallback: just use the cleaned string
                                    cleaned_skills.append(skill.strip())
                            else:
                                cleaned_skills.append(skill.strip())
                        elif isinstance(skill, dict):
                            # Handle actual dictionary objects
                            skill_name = skill.get('name', str(skill))
                            cleaned_skills.append(str(skill_name).strip())
                        else:
                            # Handle any other type by converting to string
                            cleaned_skills.append(str(skill).strip())
                    except Exception as e:
                        # If anything goes wrong, just skip this skill
                        print(f"Warning: Could not process skill {skill}: {e}")
                        continue
            
            # Parse education into a list - handle any data type safely
            education = resume.get('education', [])
            if isinstance(education, str):
                education = education.split('|') if education else []
            elif not isinstance(education, list):
                education = []
            
            # Clean education entries safely
            cleaned_education = []
            for edu in education:
                if edu:
                    try:
                        if isinstance(edu, dict):
                            # Handle dictionary format
                            degree = edu.get('degree', '')
                            institution = edu.get('institution', '')
                            if degree and institution:
                                cleaned_education.append(f"{degree} at {institution}")
                            elif degree:
                                cleaned_education.append(str(degree))
                            elif institution:
                                cleaned_education.append(str(institution))
                        else:
                            # Handle any other type by converting to string
                            cleaned_education.append(str(edu).strip())
                    except Exception as e:
                        # If anything goes wrong, just skip this education entry
                        print(f"Warning: Could not process education {edu}: {e}")
                        continue
            
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
                    "total_count": len(cleaned_skills),
                    "list": cleaned_skills
                },
                "education": {
                    "total_count": len(cleaned_education),
                    "list": cleaned_education
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