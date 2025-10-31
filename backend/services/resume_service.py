import openai
import json
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
import docx
import PyPDF2
import io

logger = logging.getLogger(__name__)

from ..models.resume import (
    ParsedResume, ResumeDocument, ResumeSearchRequest, 
    ResumeSearchResult, ResumeUploadResponse
)
from ..config.settings import settings

class ResumeParsingService:
    """Service for resume parsing and management"""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def parse_resume_with_ai(self, text: str) -> ParsedResume:
        """Use OpenAI to parse resume text and extract structured data"""
        from ..utils.file_parser import parse_resume_with_ai as parse_resume_ai
        try:
            parsed_dict = parse_resume_ai(text)
            # Convert dict to ParsedResume
            return ParsedResume(**parsed_dict)
        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
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
        from ..utils.file_parser import extract_text_from_file as extract_text_util
        try:
            content = await file.read()
            return extract_text_util(content, file.filename or "")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")
    
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
            
            # Store in Milvus database
            milvus_stored = await self.store_in_milvus(parsed_data, resume_id, file.filename)
            
            return ResumeUploadResponse(
                success=True,
                message="Resume parsed successfully",
                resume_id=resume_id,
                parsed_data=parsed_data,
                milvus_stored=milvus_stored
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
        from ..services.milvus_service import get_resumes_from_milvus
        try:
            resumes_data = get_resumes_from_milvus()
            # Convert to ResumeDocument format
            resume_docs = []
            for resume_data in resumes_data[offset:offset+limit]:
                resume_doc = ResumeDocument(
                    id=resume_data.get("id", ""),
                    filename=resume_data.get("file_path", ""),
                    file_type="application/pdf",
                    file_size=0,
                    raw_text=resume_data.get("resumeText", ""),
                    parsed_data=ParsedResume(
                        full_name=resume_data.get("name", ""),
                        email=resume_data.get("email", ""),
                        phone=resume_data.get("phone", ""),
                        summary=resume_data.get("summary", ""),
                        skills=[{"name": s, "category": "Other"} for s in resume_data.get("skills", [])],
                        education=resume_data.get("education", []),
                        work_experience=resume_data.get("work_experience", [])
                    ),
                    created_at=datetime.fromisoformat(resume_data.get("created_at", datetime.now().isoformat())),
                    updated_at=datetime.fromisoformat(resume_data.get("updated_at", datetime.now().isoformat()))
                )
                resume_docs.append(resume_doc)
            return resume_docs
        except Exception as e:
            logger.error(f"Error getting resumes: {e}")
            return []
    
    async def store_in_milvus(self, parsed_data: ParsedResume, resume_id: str, filename: str = "") -> bool:
        """Store parsed resume in Milvus database"""
        try:
            from ..services.milvus_service import milvus_service
            
            # Convert ParsedResume to dict format expected by Milvus
            resume_data = {
                "full_name": parsed_data.full_name,
                "contact": {
                    "email": parsed_data.email or "",
                    "phone": parsed_data.phone or "",
                    "linkedin": parsed_data.linkedin or "",
                    "github": parsed_data.github or "",
                    "website": parsed_data.website or ""
                },
                "summary": parsed_data.summary or "",
                "skills": parsed_data.skills or [],
                "education": parsed_data.education or [],
                "work_experience": parsed_data.work_experience or [],
                "file_path": filename
            }
            
            # Store using milvus_service
            return milvus_service.store_resume_in_milvus(resume_data, resume_id)
        except Exception as e:
            logger.error(f"Error storing resume in Milvus: {e}")
            return False

# Global service instance
resume_service = ResumeParsingService()
