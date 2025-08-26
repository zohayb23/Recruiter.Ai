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
import logging

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
        """Extract contact information using regex and spaCy with improved URL detection"""
        contact_info = {
            'name': '',
            'email': '',
            'phone': '',
            'linkedin': '',
            'github': '',
            'website': ''
        }

        # Extract email with better pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]

        # Extract phone with better patterns
        phone_patterns = [
            r'\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',  # (123) 456-7890
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # 123-456-7890
            r'\b\+\d{1,2}[-\s.]?\d{3}[-\s.]?\d{3}[-\s.]?\d{4}\b'  # +1 123 456 7890
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                contact_info['phone'] = phones[0]
                break

        # Extract LinkedIn URL with better patterns
        linkedin_patterns = [
            r'(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/in\/[A-z0-9_-]+\/?',
            r'linkedin\.com\/in\/[A-z0-9_-]+\/?',
            r'(?:https?:)?\/\/(?:[\w]+\.)?linkedin\.com\/[A-z0-9_-]+\/?'
        ]
        for pattern in linkedin_patterns:
            linkedin = re.findall(pattern, text, re.IGNORECASE)
            if linkedin:
                # Ensure URL has https:// prefix
                url = linkedin[0]
                if not url.startswith('http'):
                    url = 'https://' + url.lstrip('/')
                contact_info['linkedin'] = url
                break

        # Extract GitHub URL with better patterns
        github_patterns = [
            r'(?:https?:)?\/\/(?:[\w]+\.)?github\.com\/[A-z0-9_-]+\/?',
            r'github\.com\/[A-z0-9_-]+\/?',
            r'@[A-z0-9_-]+\s+(?:on\s+)?github'  # Match GitHub handles
        ]
        for pattern in github_patterns:
            github = re.findall(pattern, text, re.IGNORECASE)
            if github:
                url = github[0]
                if url.startswith('@'):
                    # Convert GitHub handle to URL
                    url = f'https://github.com/{url[1:].split()[0]}'
                elif not url.startswith('http'):
                    url = 'https://' + url.lstrip('/')
                contact_info['github'] = url
                break

        # Extract website URL with better patterns
        website_patterns = [
            r'(?:https?:)?\/\/(?:www\.)?[A-z0-9-]+\.[A-z0-9.-]+(?:\/[A-z0-9._-]+)*\/?',  # Full URLs
            r'(?:www\.)?[A-z0-9-]+\.(?:com|org|net|io|dev|me|tech|ai|co|us|uk)(?:\/[A-z0-9._-]+)*\/?',  # Common TLDs
            r'portfolio:\s*(?:https?:)?\/\/[^\s]+',  # Portfolio links
            r'website:\s*(?:https?:)?\/\/[^\s]+'  # Website links
        ]
        for pattern in website_patterns:
            websites = re.findall(pattern, text, re.IGNORECASE)
            if websites:
                url = websites[0]
                if ':' in url:
                    url = url.split(':', 1)[1].strip()
                if not url.startswith('http'):
                    url = 'https://' + url.lstrip('/')
                # Skip if it's a LinkedIn or GitHub URL
                if 'linkedin.com' not in url.lower() and 'github.com' not in url.lower():
                    contact_info['website'] = url
                    break

        # Extract name using spaCy NER with improved logic
        person_names = []
        for ent in doc.ents:
            if ent.label_ == 'PERSON':
                person_names.append(ent.text)

        # Try to identify the most likely name
        if person_names:
            # Prefer names that appear at the start of the document
            first_occurrence = None
            min_pos = float('inf')
            for name in person_names:
                pos = text.lower().find(name.lower())
                if pos != -1 and pos < min_pos:
                    min_pos = pos
                    first_occurrence = name
            
            if first_occurrence:
                contact_info['name'] = first_occurrence

        # Log extracted information for debugging
        logger.info(f"Extracted contact info: {contact_info}")
        return contact_info

    def _extract_education(self, doc) -> List[Education]:
        """Extract education information using spaCy with improved accuracy"""
        education_list = []
        education_keywords = [
            'degree', 'university', 'college', 'school', 'institute', 'academy',
            'bachelor', 'master', 'phd', 'doctorate', 'bs', 'ba', 'msc', 'bsc'
        ]
        
        # First pass: identify education blocks
        education_blocks = []
        current_block = []
        in_education_section = False
        
        for sent in doc.sents:
            sent_lower = sent.text.lower()
            
            # Check if this is the start of an education section
            if any(keyword in sent_lower for keyword in education_keywords):
                in_education_section = True
                if current_block:
                    education_blocks.append(current_block)
                current_block = [sent]
            elif in_education_section:
                if len(sent.text.strip()) > 0:  # Skip empty lines
                    current_block.append(sent)
                else:
                    if current_block:
                        education_blocks.append(current_block)
                    current_block = []
                    in_education_section = False
        
        # Add the last block if it exists
        if current_block:
            education_blocks.append(current_block)
        
        # Second pass: parse each education block
        for block in education_blocks:
            if not block:
                continue
                
            # Join the block text
            block_text = ' '.join([sent.text for sent in block])
            block_doc = self.nlp(block_text)
            
            # Extract degree and institution
            degree = ''
            institution = ''
            dates = []
            
            # Extract dates
            date_pattern = r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+\d{4}\b'
            dates = re.findall(date_pattern, block_text)
            
            # Extract institution using NER
            for ent in block_doc.ents:
                if ent.label_ == 'ORG':
                    institution = ent.text
                    break
            
            # Extract degree
            degree_patterns = [
                r'\b(?:Bachelor|Master|PhD|Doctorate|BS|BA|MSc|BSc|MBA)(?:\sof\s(?:Science|Arts|Engineering|Business Administration))?\b',
                r'\b(?:B\.S\.|M\.S\.|Ph\.D\.|M\.B\.A\.)\b'
            ]
            
            for pattern in degree_patterns:
                matches = re.findall(pattern, block_text)
                if matches:
                    degree = matches[0]
                    break
            
            if not degree:
                # Use the first line as degree if no specific degree found
                degree = block[0].text
            
            if institution:
                education_list.append(Education(
                    degree=degree.strip(),
                    institution=institution.strip(),
                    start_date=dates[0] if dates else None,
                    end_date=dates[-1] if len(dates) > 1 else None
                ))
        
        return education_list

    def _extract_work_experience(self, doc) -> List[WorkExperience]:
        """Extract work experience using spaCy with improved accuracy"""
        experience_list = []
        work_keywords = ['experience', 'work', 'employment', 'job', 'position', 'career']
        current_experience = None
        
        # First pass: identify experience blocks
        experience_blocks = []
        current_block = []
        in_experience_section = False
        
        for sent in doc.sents:
            sent_lower = sent.text.lower()
            
            # Check if this is the start of an experience section
            if any(keyword in sent_lower for keyword in work_keywords):
                in_experience_section = True
                if current_block:
                    experience_blocks.append(current_block)
                current_block = [sent]
            elif in_experience_section:
                # Check if we're still in an experience section
                if len(sent.text.strip()) > 0:  # Skip empty lines
                    current_block.append(sent)
                else:
                    if current_block:
                        experience_blocks.append(current_block)
                    current_block = []
                    in_experience_section = False
        
        # Add the last block if it exists
        if current_block:
            experience_blocks.append(current_block)
        
        # Second pass: parse each experience block
        for block in experience_blocks:
            if not block:
                continue
            
            # Join the block text
            block_text = ' '.join([sent.text for sent in block])
            block_doc = self.nlp(block_text)
            
            # Extract company and title
            company = ''
            title = ''
            dates = []
            description = []
            technologies = set()
            
            # Extract dates
            date_pattern = r'\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+\d{4}\b'
            dates = re.findall(date_pattern, block_text)
            
            # Extract title and company
            first_line = block[0].text
            if ' at ' in first_line:
                title, company = first_line.split(' at ', 1)
            elif ' - ' in first_line:
                title, company = first_line.split(' - ', 1)
            else:
                title = first_line
            
            # Clean up title and company
            title = title.strip()
            company = company.strip()
            
            # Extract technologies
            tech_pattern = r'\b(?:Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|SQL|MongoDB|PostgreSQL|MySQL|AWS|Azure|GCP|Docker|Kubernetes)\b'
            for sent in block:
                technologies.update(re.findall(tech_pattern, sent.text))
                if sent != block[0]:  # Skip the title line
                    description.append(sent.text)
            
            experience_list.append(WorkExperience(
                title=title,
                company=company,
                start_date=dates[0] if dates else '',
                end_date=dates[-1] if len(dates) > 1 else 'Present',
                description=description,
                technologies=list(technologies)
            ))
        
        return experience_list

    def _extract_skills(self, doc) -> List[Skill]:
        """Extract skills using spaCy and regex with improved accuracy"""
        skills_list = []
        skill_patterns = {
            'Programming Languages': r'\b(?:Python|Java|JavaScript|TypeScript|C\+\+|Ruby|PHP|Swift|Kotlin|Go|Rust|Scala|R|MATLAB)\b',
            'Web Technologies': r'\b(?:HTML5?|CSS3?|React(?:\.js)?|Angular(?:JS)?|Vue(?:\.js)?|Node(?:\.js)?|Express(?:\.js)?|Django|Flask|Spring(?:Boot)?|Laravel|Ruby on Rails|jQuery|Bootstrap|Sass|Less|Webpack|Babel)\b',
            'Databases': r'\b(?:SQL|MySQL|PostgreSQL|MongoDB|Redis|Cassandra|Oracle|SQLite|MariaDB|DynamoDB|Elasticsearch|Neo4j)\b',
            'Cloud & DevOps': r'\b(?:AWS|Amazon Web Services|Azure|GCP|Google Cloud|Docker|Kubernetes|Jenkins|Git|GitHub|GitLab|Bitbucket|Terraform|Ansible|Chef|Puppet|CircleCI|Travis CI)\b',
            'AI & Machine Learning': r'\b(?:TensorFlow|PyTorch|scikit-learn|Keras|OpenCV|NLTK|spaCy|Machine Learning|Deep Learning|Neural Networks|Computer Vision|NLP|Natural Language Processing|AI|Artificial Intelligence)\b',
            'Mobile Development': r'\b(?:iOS|Android|React Native|Flutter|Swift|Kotlin|Objective-C|Mobile App Development|Xamarin|Ionic)\b',
            'Tools & Frameworks': r'\b(?:Visual Studio Code|IntelliJ|Eclipse|PyCharm|Postman|Jira|Confluence|Slack|Trello|Agile|Scrum|Kanban)\b'
        }
        
        # Create a set to avoid duplicates
        unique_skills = set()
        
        for category, pattern in skill_patterns.items():
            matches = re.findall(pattern, doc.text, re.IGNORECASE)
            for skill in matches:
                if skill.lower() not in [s.lower() for s in unique_skills]:
                    unique_skills.add(skill)
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