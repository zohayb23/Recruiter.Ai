import io
import docx
import PyPDF2
from typing import Dict, Any
import json
import openai
from ..config.settings import settings

# Simple cache for parsed resumes to avoid re-parsing identical content
resume_cache = {}

# Initialize OpenAI
openai.api_key = settings.OPENAI_API_KEY
openai_client = openai.OpenAI(api_key=openai.api_key) if openai.api_key else None

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from uploaded file based on file extension"""
    try:
        if filename.lower().endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        elif filename.lower().endswith('.docx'):
            doc = docx.Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        else:
            return file_content.decode('utf-8')
    except Exception as e:
        print(f"Error extracting text from file: {e}")
        return ""

def parse_resume_with_ai(text: str) -> Dict[str, Any]:
    """Use OpenAI to parse resume text and extract structured data - OPTIMIZED VERSION"""
    try:
        # Check cache first to avoid re-parsing identical content
        text_hash = hash(text[:1000])  # Use first 1000 chars as cache key
        if text_hash in resume_cache:
            print(f"🚀 [Cache] Using cached result for resume parsing")
            return resume_cache[text_hash]
        
        # Use more text for better accuracy - increase to 8000 characters
        optimized_text = text[:8000]  # Increased for better parsing
        print(f"🤖 [OpenAI] Starting resume parsing with {len(optimized_text)} characters (enhanced)")
        
        # Enhanced prompt for detailed extraction
        prompt = f"""Extract comprehensive resume data as JSON. Return ONLY valid JSON with detailed information:

{{
    "full_name": "Full Name",
    "email": "email@domain.com",
    "phone": "phone number",
    "linkedin": "linkedin url",
    "github": "github url",
    "summary": "Detailed professional summary (2-3 sentences)",
    "skills": ["specific technical skill 1", "specific technical skill 2", "tool name", "technology"],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "Institution Name",
            "year": "graduation year",
            "gpa": "GPA if mentioned",
            "location": "location if mentioned"
        }}
    ],
    "work_experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "start_date": "start date",
            "end_date": "end date or Present",
            "location": "work location",
            "description": "Detailed job description with key responsibilities",
            "achievements": ["achievement 1", "achievement 2"],
            "technologies": ["technology 1", "technology 2"]
        }}
    ],
    "certifications": [
        {{
            "name": "Certification Name",
            "issuer": "Issuing Organization",
            "date": "date obtained"
        }}
    ]
}}

IMPORTANT: Extract ALL skills mentioned, ALL work experience with full descriptions, and ALL education details. Be thorough and detailed.

Resume:
{optimized_text}
"""
        
        print(f"🚀 [OpenAI] Making API call...")
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Extract resume data accurately. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,  # Increased for detailed extraction
            temperature=0.0,
            timeout=30  # Increased timeout for detailed processing
        )
        
        generated_text = response.choices[0].message.content
        print(f"📝 [OpenAI] Raw response: {generated_text[:200]}...")
        
        # Clean up the response to extract JSON
        start_idx = generated_text.find('{')
        end_idx = generated_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("No JSON found in response")
            
        json_str = generated_text[start_idx:end_idx]
        print(f"🔍 [OpenAI] Extracted JSON: {json_str[:200]}...")
        
        parsed_data = json.loads(json_str)
        print(f"✅ [OpenAI] Successfully parsed resume for: {parsed_data.get('full_name', 'Unknown')}")
        
        # Cache the result for future use
        resume_cache[text_hash] = parsed_data
        print(f"💾 [Cache] Cached parsed result")
        
        return parsed_data
        
    except Exception as e:
        print(f"❌ [OpenAI] Failed with error: {str(e)}")
        print(f"🔄 [OpenAI] Using enhanced fallback parsing...")
        
        # Enhanced fallback parsing
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        name = "Unknown"
        email = ""
        phone = ""
        skills = []
        education = []
        work_experience = []
        
        # Extract name (usually first non-empty line)
        for line in lines[:5]:
            if len(line.split()) >= 2 and len(line.split()) <= 4:
                if not any(char in line.lower() for char in ['@', 'http', 'www', '.com', 'experience', 'education', 'skills']):
                    name = line
                    break
        
        # Extract email and phone
        for line in lines:
            if '@' in line and '.' in line:
                email = line.strip()
            elif any(char.isdigit() for char in line) and len(line.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) >= 10:
                phone = line.strip()
        
        # Extract skills (look for skills section)
        in_skills_section = False
        for line in lines:
            if 'skill' in line.lower():
                in_skills_section = True
                continue
            elif in_skills_section and line and not any(word in line.lower() for word in ['experience', 'education', 'certification']):
                # Extract individual skills
                skill_items = [item.strip() for item in line.replace(',', ' ').replace('-', ' ').split() if item.strip()]
                for skill in skill_items:
                    if len(skill) > 2 and skill.isalpha():
                        skills.append({"name": skill, "category": "Other"})
            elif any(word in line.lower() for word in ['experience', 'education', 'certification']):
                in_skills_section = False
        
        # Extract education
        in_education_section = False
        for line in lines:
            if 'education' in line.lower() or 'degree' in line.lower():
                in_education_section = True
                continue
            elif in_education_section and line and not any(word in line.lower() for word in ['experience', 'skill', 'certification']):
                if any(word in line.lower() for word in ['bachelor', 'master', 'phd', 'degree', 'university', 'college']):
                    education.append({
                        "degree": line,
                        "institution": "See resume",
                        "year": "",
                        "gpa": "",
                        "location": ""
                    })
            elif any(word in line.lower() for word in ['experience', 'skill', 'certification']):
                in_education_section = False
        
        # Extract work experience
        in_experience_section = False
        for line in lines:
            if 'experience' in line.lower() and 'work' in line.lower():
                in_experience_section = True
                continue
            elif in_experience_section and line and not any(word in line.lower() for word in ['education', 'skill', 'certification']):
                if any(word in line.lower() for word in ['developer', 'engineer', 'manager', 'analyst', 'consultant', 'specialist']):
                    work_experience.append({
                        "title": line,
                        "company": "See resume",
                        "start_date": "",
                        "end_date": "",
                        "location": "",
                        "description": line,
                        "achievements": [],
                        "technologies": []
                    })
            elif any(word in line.lower() for word in ['education', 'skill', 'certification']):
                in_experience_section = False
        
        return {
            "full_name": name,
            "contact": {
                "email": email,
                "phone": phone,
                "linkedin": "",
                "github": "",
                "website": ""
            },
            "summary": text[:500] + "..." if len(text) > 500 else text,
            "skills": skills if skills else [{"name": "Extracted from resume", "category": "Other"}],
            "education": education if education else [],
            "work_experience": work_experience if work_experience else [],
            "certifications": [],
            "languages": []
        }

