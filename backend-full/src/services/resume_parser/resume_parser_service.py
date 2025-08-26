import os
import warnings
from typing import BinaryIO, Optional, List, Dict, Any
from ...models.resume import ParsedResume, Contact, Education, WorkExperience, Skill
from datetime import datetime
import uuid
from fastapi import UploadFile, HTTPException
import docx
from pdfminer.high_level import extract_text
from sentence_transformers import SentenceTransformer
from ..vector_store.milvus_service import milvus_service
import logging
from openai import AsyncOpenAI
import json
import shutil

logger = logging.getLogger(__name__)

class ResumeParserService:
    def __init__(self):
        self.supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf']
        # Initialize OpenAI client
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # Load sentence transformer for embeddings with local caching
        cache_folder = os.path.join(os.path.dirname(__file__), "../../../models/sentence_transformer")
        os.makedirs(cache_folder, exist_ok=True)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
            self.model = SentenceTransformer('all-MiniLM-L6-v2', cache_folder=cache_folder)
        
        # Initialize cache for processed resumes
        self.cache_dir = os.path.join(os.path.dirname(__file__), "../../../cache/resumes")
        os.makedirs(self.cache_dir, exist_ok=True)
        self._init_cache()

    def _init_cache(self):
        """Initialize the resume cache"""
        self.cache = {}
        # Load existing cache from disk
        for cache_file in os.listdir(self.cache_dir):
            if cache_file.endswith('.json'):
                with open(os.path.join(self.cache_dir, cache_file), 'r') as f:
                    try:
                        cache_data = json.load(f)
                        self.cache[cache_file[:-5]] = cache_data  # Remove .json extension
                    except:
                        continue

    def _get_cache_key(self, file_content: bytes, file_name: str) -> str:
        """Generate a unique cache key for a file"""
        import hashlib
        content_hash = hashlib.md5(file_content).hexdigest()
        name_hash = hashlib.md5(file_name.encode()).hexdigest()
        return f"{content_hash}_{name_hash}"

    def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Get parsed resume data from cache"""
        return self.cache.get(cache_key)

    def _save_to_cache(self, cache_key: str, data: Dict):
        """Save parsed resume data to cache"""
        self.cache[cache_key] = data
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.json")
        with open(cache_file, 'w') as f:
            json.dump(data, f)

    async def parse_resume(self, file: UploadFile) -> ParsedResume:
        """Parse a resume file and extract structured information using OpenAI"""
        temp_file_path = None
        try:
            # Read file content for caching
            file_content = await file.read()
            cache_key = self._get_cache_key(file_content, file.filename)
            
            # Check cache first
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                logger.info(f"Using cached parse result for {file.filename}")
                return ParsedResume(**cached_data)
            
            # Reset file position for further processing
            await file.seek(0)
            # Check file extension
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in self.supported_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format. Supported formats: {', '.join(self.supported_extensions)}"
                )

            # Create a temporary file
            temp_file_path = f"temp_{uuid.uuid4()}{file_ext}"
            
            # Save uploaded file to temp location
            try:
                contents = await file.read()
                with open(temp_file_path, 'wb') as f:
                    f.write(contents)
            except Exception as e:
                logger.error(f"Error saving temp file: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

            # Extract text based on file type
            try:
                text = await self._extract_text(temp_file_path, file_ext)
                logger.info(f"Successfully extracted text from {file.filename}")
            except Exception as e:
                logger.error(f"Error extracting text: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")

            if not text.strip():
                raise ValueError("No text could be extracted from the file")

            # Parse resume using OpenAI
            try:
                parsed_data = await self._parse_with_openai(text)
                logger.info("Successfully parsed resume with OpenAI")
                logger.info(f"Parsed data: {json.dumps(parsed_data, indent=2)}")
            except Exception as e:
                logger.error(f"Error in OpenAI parsing: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error in OpenAI parsing: {str(e)}")

            # Generate embedding for the entire text
            embedding = self.model.encode(text).tolist()

            # Store the file permanently
            permanent_file_path = await self._store_file(temp_file_path, file.filename)

            # Create ParsedResume object
            # Handle potentially null values from GPT response
            contact_info = parsed_data.get("personal_info", {})
            parsed_resume = ParsedResume(
                resume_id=str(uuid.uuid4()),
                full_name=contact_info.get("name", "Unknown"),
                contact=Contact(
                    email=contact_info.get("email", ""),
                    phone=contact_info.get("phone", ""),
                    linkedin=contact_info.get("linkedin", ""),
                    github=contact_info.get("github", "") if contact_info.get("github") is not None else "",
                    website=contact_info.get("website", "") if contact_info.get("website") is not None else ""
                ),
                education=[
                    Education(
                        degree=edu["degree"],
                        institution=edu["institution"],
                        graduation_date=edu.get("graduation_date", ""),
                        major=edu.get("major", ""),
                        gpa=edu.get("gpa", ""),
                        location=edu.get("location", "")
                    ) for edu in parsed_data.get("education", [])
                ],
                work_experience=[
                    WorkExperience(
                        title=exp["title"],
                        company=exp["company"],
                        start_date=exp["start_date"],
                        end_date=exp["end_date"],
                        description=exp["responsibilities"],
                        technologies=exp.get("technologies_used", []),
                        location=exp.get("location", "")
                    ) for exp in parsed_data.get("work_experience", [])
                ],
                skills=[
                    Skill(name=skill, category=category)
                    for category, skills in parsed_data.get("skills", {}).items()
                    for skill in skills
                ],
                file_path=permanent_file_path,
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            
            # Store in Milvus
            try:
                milvus_data = {
                    "resume_id": parsed_resume.resume_id,
                    "full_name": parsed_resume.full_name,
                    "email": parsed_resume.contact.email,
                    "phone": parsed_resume.contact.phone,
                    "linkedin": parsed_resume.contact.linkedin,
                    "github": parsed_resume.contact.github,
                    "website": parsed_resume.contact.website,
                    "skills": [{"name": skill.name, "category": skill.category} for skill in parsed_resume.skills],
                    "education": [edu.dict() for edu in parsed_resume.education],
                    "work_experience": [exp.dict() for exp in parsed_resume.work_experience],
                    "file_path": parsed_resume.file_path,
                    "created_at": parsed_resume.created_at,
                    "embedding": embedding
                }
                
                await milvus_service.insert_resume(milvus_data)
                logger.info(f"Successfully stored resume in Milvus: {parsed_resume.full_name}")
                
                # Save to cache after successful Milvus storage
                self._save_to_cache(cache_key, parsed_resume.dict())
            except Exception as e:
                error_msg = f"Error storing in Milvus: {str(e)}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)
            
            return parsed_resume
            
        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e:
                    logger.error(f"Error removing temporary file: {str(e)}")

    async def _parse_with_openai(self, text: str) -> Dict:
        """Parse resume text using GPT-4"""
        try:
            prompt = f"""Analyze this resume text and extract structured information. Pay special attention to correctly categorizing education vs work experience.

            Required format:
            {{
                "personal_info": {{
                    "name": "candidate's full name",
                    "email": "email address",
                    "phone": "phone number",
                    "linkedin": "LinkedIn URL",
                    "github": "GitHub URL",
                    "website": "website URL",
                    "location": "city, state/country"
                }},
                "summary": "professional summary if available",
                "skills": {{
                    "programming_languages": ["Python", "Java", etc.],
                    "cloud_platforms": ["AWS", "Azure", etc.],
                    "frameworks": ["React", "Django", etc.],
                    "databases": ["MySQL", "MongoDB", etc.],
                    "tools": ["Docker", "Kubernetes", etc.],
                    "methodologies": ["Agile", "DevOps", etc.]
                }},
                "work_experience": [
                    {{
                        "title": "exact job title",
                        "company": "company name",
                        "location": "city, state",
                        "start_date": "YYYY-MM",
                        "end_date": "YYYY-MM or Present",
                        "responsibilities": [
                            "key responsibility or achievement 1",
                            "key responsibility or achievement 2"
                        ],
                        "technologies_used": ["tech1", "tech2"]
                    }}
                ],
                "education": [
                    {{
                        "degree": "full degree name",
                        "institution": "school/university name",
                        "location": "city, state",
                        "graduation_date": "YYYY-MM",
                        "major": "field of study",
                        "gpa": "if available"
                    }}
                ],
                "certifications": [
                    {{
                        "name": "certification name",
                        "issuer": "issuing organization",
                        "date": "YYYY-MM",
                        "expires": "YYYY-MM if applicable"
                    }}
                ]
            }}

            Critical Instructions:
            1. Education section should ONLY include formal education (degrees, diplomas)
            2. Work experience should include all professional roles and responsibilities
            3. Skills should be properly categorized by type
            4. Dates should be in YYYY-MM format
            5. Current positions should use "Present" as end date
            6. Extract all relevant URLs (LinkedIn, GitHub, etc.)
            7. Keep descriptions clear and concise
            8. Include technologies used in each role
            9. DO NOT put work experience or skills in the education section
            10. Maintain chronological order (most recent first)

            Resume text to analyze:
            {text}
            """

            # Add explicit instruction for JSON response
            system_message = """You are an expert resume parser that extracts structured information with high accuracy and organization. 
            You are especially good at distinguishing between education and work experience.
            You MUST ALWAYS respond with valid JSON only, no additional text or explanations."""

            response = await self.client.chat.completions.create(
                model="gpt-4-1106-preview",  # Using GPT-4 Turbo which supports JSON response format
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=3000,
                response_format={ "type": "json_object" }
            )

            # Parse the response
            parsed_data = json.loads(response.choices[0].message.content)
            logger.info("Successfully parsed resume with GPT-4")
            return parsed_data

        except Exception as e:
            error_msg = f"Error parsing resume with GPT-4: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Failed to parse resume",
                    "error": str(e),
                    "type": "parsing_error"
                }
            )

    async def _store_in_milvus(self, resume: ParsedResume, embedding: List[float]):
        """Store the parsed resume in Milvus"""
        try:
            # Prepare data for Milvus
            milvus_data = {
                "resume_id": resume.resume_id,
                "full_name": resume.full_name,
                "email": resume.contact.email,
                "phone": resume.contact.phone,
                "linkedin": resume.contact.linkedin,
                "github": resume.contact.github,
                "website": resume.contact.website,
                "skills": [{"name": skill.name, "category": skill.category} for skill in resume.skills],
                "education": [edu.dict() for edu in resume.education],
                "work_experience": [exp.dict() for exp in resume.work_experience],
                "file_path": resume.file_path,
                "created_at": resume.created_at,
                "embedding": embedding
            }
            
            # Insert into Milvus
            await milvus_service.insert_resume(milvus_data)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error storing resume in Milvus: {str(e)}")

    async def _store_file(self, temp_file_path: str, original_filename: str) -> str:
        """Store the file permanently and return the file path"""
        try:
            # Create unique filename
            file_ext = os.path.splitext(original_filename)[1].lower()
            unique_filename = f"{str(uuid.uuid4())}{file_ext}"
            
            # Ensure upload directory exists
            upload_dir = "uploads/resumes"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Create permanent file path
            permanent_file_path = os.path.join(upload_dir, unique_filename)
            
            # Copy file to permanent location
            shutil.copy2(temp_file_path, permanent_file_path)
            
            return permanent_file_path
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