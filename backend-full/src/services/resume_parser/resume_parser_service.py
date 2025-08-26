import os
import re
from typing import BinaryIO, Optional, List, Dict, Any
from ...models.resume import ParsedResume, Contact, Education, WorkExperience, Skill
from datetime import datetime
import uuid
from fastapi import UploadFile, HTTPException
import docx
from pdfminer.high_level import extract_text
import spacy
from sentence_transformers import SentenceTransformer
from ..vector_store.milvus_service import milvus_service
import logging
import magic
from .section_parser import SectionParser

logger = logging.getLogger(__name__)

class ResumeParserService:
    def __init__(self):
        self.supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf']
        # Load spaCy model for NER
        try:
            self.nlp = spacy.load('en_core_web_lg')
        except:
            os.system('python -m spacy download en_core_web_lg')
            self.nlp = spacy.load('en_core_web_lg')
        # Load sentence transformer for embeddings
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    async def parse_resume(self, file: UploadFile) -> ParsedResume:
        """Parse a resume file and extract structured information"""
        try:
            # Check file extension
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in self.supported_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format. Supported formats: {', '.join(self.supported_extensions)}"
                )

            # Store the file
            file_path = await self._store_file(file)

            # Extract text based on file type
            text = await self._extract_text(file_path, file_ext)
            logger.info(f"Extracted text from {file.filename}: {text[:200]}...")

            if not text.strip():
                raise ValueError("No text could be extracted from the file")

            # Process text with spaCy
            doc = self.nlp(text)

            # Extract sections
            sections = SectionParser.extract_sections(text)

            # Extract information
            contact = self._extract_contact_info(doc, sections.get('contact', []))
            education = self._extract_education(sections.get('education', []))
            work_experience = self._extract_work_experience(sections.get('experience', []))
            skills = self._extract_skills(sections.get('skills', []))

            # Generate embedding
            embedding = self.model.encode(text).tolist()

            # Create ParsedResume object
            parsed_resume = ParsedResume(
                resume_id=str(uuid.uuid4()),
                full_name=contact.get('name', ''),
                contact=Contact(
                    email=contact.get('email', ''),
                    phone=contact.get('phone', ''),
                    linkedin=contact.get('linkedin', ''),
                    github=contact.get('github', ''),
                    website=contact.get('website', '')
                ),
                education=education,
                work_experience=work_experience,
                skills=skills,
                file_path=file_path,
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )

            # Store in Milvus
            try:
                await self._store_in_milvus(parsed_resume, embedding)
                logger.info(f"Successfully stored resume in Milvus: {parsed_resume.full_name}")
            except Exception as e:
                logger.error(f"Error storing in Milvus: {e}")
                raise

            return parsed_resume

        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

    def _extract_contact_info(self, doc, lines: List[str]) -> dict:
        """Extract contact information using regex and spaCy"""
        contact_info = {
            'name': '',
            'email': '',
            'phone': '',
            'linkedin': '',
            'github': '',
            'website': ''
        }

        # Extract name from first line
        if lines:
            contact_info['name'] = lines[0]

        # Extract contact info from all lines
        text = '\n'.join(lines)

        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]

        # Extract phone with multiple formats
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                contact_info['phone'] = phones[0]
                break

        # Extract LinkedIn URL
        linkedin_pattern = r'(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/in\/[A-z0-9_-]+\/?'
        linkedin = re.findall(linkedin_pattern, text, re.IGNORECASE)
        if linkedin:
            contact_info['linkedin'] = linkedin[0]

        # Extract GitHub URL
        github_pattern = r'(?:https?:)?\/\/(?:[\w]+\.)?github\.com\/[A-z0-9_-]+\/?'
        github = re.findall(github_pattern, text, re.IGNORECASE)
        if github:
            contact_info['github'] = github[0]

        return contact_info

    def _extract_education(self, lines: List[str]) -> List[Education]:
        """Extract education information"""
        education_list = []
        
        # Parse education entries
        entries = SectionParser.parse_education(lines)
        
        for entry in entries:
            education_list.append(Education(
                degree=entry.get('degree', ''),
                institution=entry.get('institution', ''),
                start_date=entry.get('start_date', ''),
                end_date=entry.get('end_date', '')
            ))
        
        return education_list

    def _extract_work_experience(self, lines: List[str]) -> List[WorkExperience]:
        """Extract work experience"""
        experience_list = []
        
        # Parse experience entries
        entries = SectionParser.parse_experience(lines)
        
        for entry in entries:
            experience_list.append(WorkExperience(
                title=entry.get('title', ''),
                company=entry.get('company', ''),
                start_date=entry.get('start_date', ''),
                end_date=entry.get('end_date', ''),
                description=entry.get('description', []),
                technologies=list(set(entry.get('technologies', [])))
            ))
        
        return experience_list

    def _extract_skills(self, lines: List[str]) -> List[Skill]:
        """Extract skills"""
        skills_list = []
        
        # Parse skills entries
        entries = SectionParser.parse_skills(lines)
        
        for entry in entries:
            skills_list.append(Skill(
                name=entry.get('name', ''),
                category=entry.get('category', '')
            ))
        
        return skills_list

    async def _store_in_milvus(self, resume: ParsedResume, embedding: List[float]):
        """Store the parsed resume in Milvus"""
        try:
            # Prepare data for Milvus
            milvus_data = {
                "resume_id": resume.resume_id,
                "full_name": resume.full_name,
                "email": resume.contact.email,
                "phone": resume.contact.phone,
                "file_path": resume.file_path,
                "skills": resume.skills,
                "education": resume.education,
                "work_experience": resume.work_experience,
                "embedding": embedding
            }
            
            # Insert into Milvus
            milvus_service.insert_resume(milvus_data)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error storing resume in Milvus: {str(e)}")

    async def _store_file(self, file: UploadFile) -> str:
        """Store the uploaded file and return the file path"""
        try:
            # Create unique filename
            file_ext = os.path.splitext(file.filename)[1].lower()
            unique_filename = f"{str(uuid.uuid4())}{file_ext}"
            
            # Ensure upload directory exists
            upload_dir = "uploads/resumes"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Create file path
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Write file
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            return file_path
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error storing file: {str(e)}")

    async def _extract_text(self, file_path: str, file_ext: str) -> str:
        """Extract text from the resume file based on its type"""
        try:
            if file_ext == '.pdf':
                return extract_text(file_path)
            elif file_ext in ['.docx', '.doc']:
                doc = docx.Document(file_path)
                return "\n".join([paragraph.text for paragraph in doc.paragraphs])
            elif file_ext in ['.txt', '.rtf']:
                with open(file_path, 'r', encoding='utf-8') as file:
                    return file.read()
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")

resume_parser_service = ResumeParserService()