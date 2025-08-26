import os
import re
from typing import BinaryIO, Optional, List
from ...models.resume import ParsedResume, Contact, Education, WorkExperience, Skill
from datetime import datetime
import uuid
from fastapi import UploadFile, HTTPException
import docx
from pdfminer.high_level import extract_text
import spacy
from sentence_transformers import SentenceTransformer
from ..vector_store.milvus_service import milvus_service

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
        """
        Parse a resume file and extract structured information
        """
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

            # Process text with spaCy
            doc = self.nlp(text)

            # Extract contact information
            contact = self._extract_contact_info(doc, text)

            # Extract education
            education = self._extract_education(doc)

            # Extract work experience
            work_experience = self._extract_work_experience(doc)
            
            # Extract skills
            skills = self._extract_skills(doc)

            # Generate embedding for the entire text
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
            await self._store_in_milvus(parsed_resume, embedding)
            
            return parsed_resume
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

    def _extract_contact_info(self, doc, text: str) -> dict:
        """Extract contact information using regex and spaCy"""
        contact_info = {
            'name': '',
            'email': '',
            'phone': '',
            'linkedin': '',
            'github': '',
            'website': ''
        }

        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]

        # Extract phone
        phone_pattern = r'\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact_info['phone'] = phones[0]

        # Extract LinkedIn URL
        linkedin_pattern = r'(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/in\/[A-z0-9_-]+\/?'
        linkedin = re.findall(linkedin_pattern, text)
        if linkedin:
            contact_info['linkedin'] = linkedin[0]

        # Extract GitHub URL
        github_pattern = r'(?:https?:)?\/\/(?:[\w]+\.)?github\.com\/[A-z0-9_-]+\/?'
        github = re.findall(github_pattern, text)
        if github:
            contact_info['github'] = github[0]

        # Extract name using spaCy NER
        for ent in doc.ents:
            if ent.label_ == 'PERSON' and not contact_info['name']:
                contact_info['name'] = ent.text
                break

        return contact_info

    def _extract_education(self, doc) -> List[Education]:
        """Extract education information using spaCy"""
        education_list = []
        education_keywords = ['degree', 'university', 'college', 'school', 'institute', 'academy']
        
        for sent in doc.sents:
            if any(keyword in sent.text.lower() for keyword in education_keywords):
                # Extract degree and institution using NER
                degree = ''
                institution = ''
                dates = []
                
                for ent in sent.ents:
                    if ent.label_ == 'ORG':
                        institution = ent.text
                    elif ent.label_ == 'DATE':
                        dates.append(ent.text)
                
                # Extract degree from the sentence
                degree = sent.text.split(',')[0] if ',' in sent.text else sent.text
                
                if institution:
                    education_list.append(Education(
                        degree=degree,
                        institution=institution,
                        start_date=dates[0] if len(dates) > 0 else None,
                        end_date=dates[-1] if len(dates) > 1 else None
                    ))

        return education_list

    def _extract_work_experience(self, doc) -> List[WorkExperience]:
        """Extract work experience using spaCy"""
        experience_list = []
        work_keywords = ['experience', 'work', 'employment', 'job', 'position']
        
        current_experience = None
        
        for sent in doc.sents:
            sent_lower = sent.text.lower()
            
            # Start new experience entry if work-related keywords found
            if any(keyword in sent_lower for keyword in work_keywords):
                if current_experience:
                    experience_list.append(current_experience)
                
                # Extract company and title using NER
                company = ''
                title = ''
                dates = []
                
                for ent in sent.ents:
                    if ent.label_ == 'ORG':
                        company = ent.text
                    elif ent.label_ == 'DATE':
                        dates.append(ent.text)
                
                # Extract title from the sentence
                title = sent.text.split('at')[0] if 'at' in sent.text else sent.text
                
                current_experience = WorkExperience(
                    title=title.strip(),
                    company=company,
                    start_date=dates[0] if dates else '',
                    end_date=dates[-1] if len(dates) > 1 else 'Present',
                    description=[sent.text],
                    technologies=[]
                )
            elif current_experience:
                # Add sentence to current experience description
                current_experience.description.append(sent.text)
                
                # Extract technologies
                tech_pattern = r'\b(?:Python|Java|JavaScript|React|Angular|Vue|Node\.js|AWS|Azure|GCP|Docker|Kubernetes|SQL|MongoDB)\b'
                technologies = re.findall(tech_pattern, sent.text)
                if technologies:
                    current_experience.technologies.extend(technologies)
        
        # Add the last experience
        if current_experience:
            experience_list.append(current_experience)
        
        return experience_list

    def _extract_skills(self, doc) -> List[Skill]:
        """Extract skills using spaCy and regex"""
        skills_list = []
        skill_patterns = {
            'Programming': r'\b(?:Python|Java|JavaScript|TypeScript|C\+\+|Ruby|PHP|Swift|Kotlin|Go)\b',
            'Web': r'\b(?:HTML|CSS|React|Angular|Vue|Node\.js|Express|Django|Flask|Spring)\b',
            'Database': r'\b(?:SQL|MongoDB|PostgreSQL|MySQL|Oracle|Redis|Elasticsearch)\b',
            'Cloud': r'\b(?:AWS|Azure|GCP|Docker|Kubernetes|Terraform|Jenkins|Git)\b',
            'Machine Learning': r'\b(?:TensorFlow|PyTorch|scikit-learn|NLP|Computer Vision|Deep Learning)\b'
        }
        
        for category, pattern in skill_patterns.items():
            matches = re.findall(pattern, doc.text)
            for skill in matches:
                skills_list.append(Skill(
                    name=skill,
                    category=category
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