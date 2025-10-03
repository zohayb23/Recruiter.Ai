import openai
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import docx
import PyPDF2
import io

from ..models.resume import (
    ParsedResume, ResumeDocument, ResumeSearchRequest, 
    ResumeSearchResult, ResumeUploadResponse
)
from ..config.settings import settings

class ResumeParsingService:
    """Service for resume parsing and management"""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def parse_resume_with_ai(self, text: str) -> ParsedResume:
        """Use OpenAI to parse resume text and extract structured data"""
        try:
            prompt = f"""
            Parse the following resume text and extract structured data. Return a JSON object with these exact fields:

            {{
                "full_name": "Full Name",
                "email": "email@example.com",
                "phone": "+1234567890",
                "linkedin": "https://linkedin.com/in/username",
                "github": "https://github.com/username",
                "website": "https://website.com",
                "summary": "Professional summary paragraph",
                "skills": [
                    {{
                        "name": "Skill Name",
                        "category": "Programming Languages" | "Frameworks" | "Databases" | "Tools" | "Cloud" | "Other"
                    }}
                ],
                "education": [
                    {{
                        "degree": "Degree Name",
                        "institution": "University Name",
                        "year": "2020",
                        "gpa": "3.8",
                        "location": "City, State"
                    }}
                ],
                "work_experience": [
                    {{
                        "title": "Job Title",
                        "company": "Company Name",
                        "start_date": "Jan 2020",
                        "end_date": "Dec 2023",
                        "location": "City, State",
                        "description": "Detailed job description",
                        "achievements": ["Achievement 1", "Achievement 2"],
                        "technologies": ["Tech 1", "Tech 2"]
                    }}
                ],
                "certifications": [
                    {{
                        "name": "Certification Name",
                        "issuer": "Issuing Organization",
                        "date": "2020",
                        "expiry": "2023"
                    }}
                ],
                "languages": [
                    {{
                        "language": "English",
                        "proficiency": "Native" | "Fluent" | "Intermediate" | "Basic"
                    }}
                ]
            }}

            Resume text:
            {text[:5000]}
            """
            
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert resume parser. Extract ALL available information with maximum detail."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE
            )
            
            parsed_text = response.choices[0].message.content.strip()
            
            # Clean up the response to extract JSON
            if parsed_text.startswith("```json"):
                parsed_text = parsed_text[7:]
            if parsed_text.endswith("```"):
                parsed_text = parsed_text[:-3]
            
            parsed_data = json.loads(parsed_text)
            return ParsedResume(**parsed_data)
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            # Fallback parsing
            return self._fallback_parse(text)
        except Exception as e:
            print(f"OpenAI parsing error: {e}")
            return self._fallback_parse(text)
    
    def _fallback_parse(self, text: str) -> ParsedResume:
        """Fallback parsing when AI parsing fails"""
        lines = text.split('\n')
        
        # Simple extraction
        email = None
        phone = None
        name = "Unknown"
        
        for line in lines:
            if '@' in line and not email:
                email = line.strip()
            elif any(char.isdigit() for char in line) and len(line.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) >= 10:
                phone = line.strip()
            elif len(line.split()) >= 2 and not name:
                name = line.strip()
        
        return ParsedResume(
            full_name=name,
            email=email,
            phone=phone,
            summary=text[:500] if len(text) > 500 else text
        )
    
    async def extract_text_from_file(self, file: UploadFile) -> str:
        """Extract text from uploaded file (PDF, DOCX, TXT)"""
        try:
            content = await file.read()
            
            if file.filename.endswith('.pdf'):
                return self._extract_pdf_text(content)
            elif file.filename.endswith(('.docx', '.doc')):
                return self._extract_docx_text(content)
            elif file.filename.endswith('.txt'):
                return content.decode('utf-8')
            else:
                raise HTTPException(status_code=400, detail="Unsupported file type")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
    
    def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")
    
    def _extract_docx_text(self, content: bytes) -> str:
        """Extract text from DOCX content"""
        try:
            doc = docx.Document(io.BytesIO(content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading DOCX: {str(e)}")
    
    async def process_resume_upload(self, file: UploadFile) -> ResumeUploadResponse:
        """Process uploaded resume file"""
        try:
            # Extract text
            raw_text = await self.extract_text_from_file(file)
            
            # Parse with AI
            parsed_data = await self.parse_resume_with_ai(raw_text)
            
            # Create resume document
            resume_id = str(uuid.uuid4())
            resume_doc = ResumeDocument(
                id=resume_id,
                filename=file.filename,
                file_type=file.content_type or "application/octet-stream",
                file_size=len(raw_text),
                raw_text=raw_text,
                parsed_data=parsed_data,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # TODO: Store in Milvus database
            # milvus_stored = await self.store_in_milvus(resume_doc)
            
            return ResumeUploadResponse(
                success=True,
                message="Resume parsed successfully",
                resume_id=resume_id,
                parsed_data=parsed_data,
                milvus_stored=False  # TODO: Implement Milvus storage
            )
            
        except Exception as e:
            return ResumeUploadResponse(
                success=False,
                message=f"Error processing resume: {str(e)}",
                resume_id="",
                parsed_data=ParsedResume(full_name="Error")
            )
    
    async def search_resumes(self, request: ResumeSearchRequest) -> List[ResumeSearchResult]:
        """Search resumes using semantic search"""
        # TODO: Implement Milvus semantic search
        return []
    
    async def get_resume_by_id(self, resume_id: str) -> Optional[ResumeDocument]:
        """Get resume by ID"""
        # TODO: Implement database retrieval
        return None
    
    async def get_all_resumes(self, limit: int = 50, offset: int = 0) -> List[ResumeDocument]:
        """Get all resumes with pagination"""
        # TODO: Implement database retrieval
        return []

# Global service instance
resume_service = ResumeParsingService()
