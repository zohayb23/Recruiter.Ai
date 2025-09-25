from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import openai
from typing import List, Dict, Any
import json
import uuid
from datetime import datetime
import docx
import PyPDF2
import io
import re

app = FastAPI(title="Recruiter.AI Enhanced Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# In-memory storage
stored_resumes = []
stored_job_descriptions = []

# Enhanced job description templates
JOB_TEMPLATES = {
    "software_engineer": {
        "title": "Software Engineer",
        "overview": "We are seeking a talented Software Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining high-quality software solutions that drive our business forward.",
        "responsibilities": [
            "Design and develop scalable software applications using modern technologies",
            "Collaborate with cross-functional teams to define, design, and ship new features",
            "Write clean, maintainable, and efficient code following best practices",
            "Participate in code reviews and provide constructive feedback",
            "Debug and resolve software defects and performance issues",
            "Contribute to technical documentation and knowledge sharing",
            "Stay updated with emerging technologies and industry trends"
        ],
        "qualifications": [
            "Bachelor's degree in Computer Science, Engineering, or related field",
            "3+ years of professional software development experience",
            "Proficiency in multiple programming languages (Python, Java, JavaScript, etc.)",
            "Experience with modern frameworks and libraries",
            "Strong understanding of software development lifecycle",
            "Excellent problem-solving and analytical skills",
            "Strong communication and teamwork abilities"
        ],
        "benefits": [
            "Competitive salary and equity package",
            "Comprehensive health, dental, and vision insurance",
            "401(k) retirement plan with company matching",
            "Flexible work arrangements and remote work options",
            "Professional development and training opportunities",
            "Generous paid time off and holidays",
            "Modern office environment with latest technology"
        ]
    },
    "data_scientist": {
        "title": "Data Scientist",
        "overview": "Join our data science team to extract insights from complex datasets and build machine learning models that drive business decisions. You'll work with cutting-edge tools and technologies to solve challenging problems.",
        "responsibilities": [
            "Analyze large datasets to identify trends, patterns, and insights",
            "Develop and implement machine learning models and algorithms",
            "Create data visualizations and reports for stakeholders",
            "Collaborate with engineering teams to deploy models in production",
            "Design and conduct A/B tests to validate hypotheses",
            "Maintain and improve existing data pipelines and processes",
            "Present findings and recommendations to technical and non-technical audiences"
        ],
        "qualifications": [
            "Master's degree in Data Science, Statistics, Mathematics, or related field",
            "3+ years of experience in data science or machine learning",
            "Proficiency in Python, R, SQL, and statistical analysis tools",
            "Experience with machine learning frameworks (scikit-learn, TensorFlow, PyTorch)",
            "Strong knowledge of statistics, probability, and experimental design",
            "Experience with data visualization tools (Tableau, Power BI, matplotlib)",
            "Excellent communication and presentation skills"
        ],
        "benefits": [
            "Competitive salary and performance bonuses",
            "Comprehensive health and wellness benefits",
            "401(k) with generous company matching",
            "Flexible work schedule and remote work options",
            "Access to latest data science tools and cloud platforms",
            "Conference attendance and professional development budget",
            "Collaborative and innovative work environment"
        ]
    },
    "product_manager": {
        "title": "Product Manager",
        "overview": "Lead the development and execution of product strategy, working closely with engineering, design, and business teams to deliver exceptional user experiences and drive business growth.",
        "responsibilities": [
            "Define product vision, strategy, and roadmap based on market research and user feedback",
            "Collaborate with engineering and design teams to prioritize features and requirements",
            "Conduct market research and competitive analysis to identify opportunities",
            "Gather and analyze user feedback to inform product decisions",
            "Create detailed product specifications and user stories",
            "Coordinate cross-functional teams to ensure successful product launches",
            "Monitor product performance and iterate based on data and feedback"
        ],
        "qualifications": [
            "Bachelor's degree in Business, Engineering, or related field",
            "3+ years of product management experience in technology companies",
            "Strong analytical and problem-solving skills",
            "Experience with agile development methodologies",
            "Excellent communication and stakeholder management skills",
            "Proficiency in product management tools (Jira, Confluence, Figma)",
            "Understanding of user experience principles and design thinking"
        ],
        "benefits": [
            "Competitive salary and equity participation",
            "Comprehensive health, dental, and vision coverage",
            "401(k) retirement plan with company matching",
            "Flexible work arrangements and unlimited PTO",
            "Professional development and conference budget",
            "Modern office with collaborative workspaces",
            "Team building events and company retreats"
        ]
    }
}

def get_job_template(title: str, key_skills: List[str]) -> Dict[str, Any]:
    """Get appropriate job template based on title and skills"""
    title_lower = title.lower()
    
    if any(keyword in title_lower for keyword in ['data', 'analyst', 'scientist', 'ml', 'ai']):
        return JOB_TEMPLATES["data_scientist"]
    elif any(keyword in title_lower for keyword in ['product', 'manager', 'pm']):
        return JOB_TEMPLATES["product_manager"]
    else:
        return JOB_TEMPLATES["software_engineer"]

def enhance_fallback_job_description(request_data: dict) -> Dict[str, Any]:
    """Create enhanced fallback job description using templates"""
    title = request_data.get("title", "Software Engineer")
    company = request_data.get("company", "Company Name")
    department = request_data.get("department", "Engineering")
    location_type = request_data.get("location_type", "remote")
    location = request_data.get("location", "Anywhere")
    experience_level = request_data.get("experience_level", "Mid Level")
    key_skills = request_data.get("key_skills", [])
    
    # Get appropriate template
    template = get_job_template(title, key_skills)
    
    # Customize template with user inputs
    skills_text = ", ".join(key_skills) if key_skills else "relevant technical skills"
    
    # Enhanced company description based on company name
    company_descriptions = {
        "apple": "Apple is a multinational technology company that designs, develops, and sells consumer electronics, computer software, and online services. Known for innovation and design excellence.",
        "google": "Google is a multinational technology company specializing in Internet-related services and products, including search, cloud computing, and software.",
        "microsoft": "Microsoft is a multinational technology corporation that develops, manufactures, licenses, supports, and sells computer software, consumer electronics, and personal computers.",
        "amazon": "Amazon is a multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.",
        "meta": "Meta is a technology company that builds products to help people connect, share, and build communities through virtual and augmented reality technologies.",
        "tesla": "Tesla is an electric vehicle and clean energy company that designs, manufactures, and sells electric vehicles, energy storage systems, and solar panels.",
        "netflix": "Netflix is a streaming entertainment service with over 200 million paid memberships in over 190 countries enjoying TV series, documentaries, and feature films.",
        "spotify": "Spotify is a digital music, podcast, and video service that gives you access to millions of songs and other content from creators all over the world."
    }
    
    company_lower = company.lower()
    company_description = company_descriptions.get(company_lower, f"{company} is a leading company in the industry, known for innovation, excellence, and commitment to delivering exceptional products and services.")
    
    # Customize responsibilities based on skills
    base_responsibilities = template["responsibilities"].copy()
    if key_skills:
        skill_responsibilities = [
            f"Utilize expertise in {', '.join(key_skills[:3])} to develop innovative solutions",
            f"Apply {key_skills[0]} best practices to ensure high-quality deliverables"
        ]
        base_responsibilities = skill_responsibilities + base_responsibilities[:5]
    
    # Customize qualifications based on experience level
    base_qualifications = template["qualifications"].copy()
    if "senior" in experience_level.lower():
        base_qualifications.insert(1, "5+ years of relevant professional experience")
        base_qualifications.append("Proven leadership and mentoring capabilities")
    elif "junior" in experience_level.lower() or "entry" in experience_level.lower():
        base_qualifications[1] = "1-2 years of relevant experience or recent graduate"
        base_qualifications.append("Strong desire to learn and grow in the role")
    
    return {
        "title": title,
        "company": company,
        "department": department,
        "location_type": location_type,
        "location": location,
        "experience_level": experience_level,
        "overview": f"At {company}, we are looking for a {title} to join our {department} team. {template['overview']}",
        "responsibilities": base_responsibilities,
        "qualifications": base_qualifications,
        "required_skills": key_skills if key_skills else ["Problem Solving", "Team Collaboration", "Communication"],
        "preferred_skills": ["Cloud Computing", "Agile Development", "Version Control", "API Development"],
        "benefits": template["benefits"],
        "company_description": company_description
    }

def extract_resume_info_enhanced(text: str, filename: str) -> Dict[str, Any]:
    """Enhanced resume parsing with better text extraction"""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Extract name (usually first non-empty line or from filename)
    name = "Unknown"
    if filename:
        # Try to extract name from filename
        name_from_file = filename.replace('.pdf', '').replace('.docx', '').replace('.doc', '')
        if len(name_from_file.split()) >= 2:
            name = name_from_file
    
    # Look for name in first few lines
    for line in lines[:5]:
        if len(line.split()) >= 2 and len(line.split()) <= 4:
            if not any(char in line.lower() for char in ['@', 'http', 'www', '.com', 'phone', 'email']):
                name = line
                break
    
    # Extract email
    email = ""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    for line in lines:
        email_match = re.search(email_pattern, line)
        if email_match:
            email = email_match.group()
            break
    
    # Extract phone
    phone = ""
    phone_patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}'
    ]
    for line in lines:
        for pattern in phone_patterns:
            phone_match = re.search(pattern, line)
            if phone_match:
                phone = phone_match.group()
                break
        if phone:
            break
    
    # Extract skills (look for common skill keywords)
    skill_keywords = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
        'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'gcp', 'docker',
        'kubernetes', 'git', 'agile', 'scrum', 'machine learning', 'ai',
        'data analysis', 'tableau', 'power bi', 'excel', 'project management'
    ]
    
    found_skills = []
    for line in lines:
        line_lower = line.lower()
        for skill in skill_keywords:
            if skill in line_lower and skill not in found_skills:
                found_skills.append(skill.title())
    
    # Extract education (look for degree keywords)
    education = []
    degree_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college']
    for i, line in enumerate(lines):
        if any(keyword in line.lower() for keyword in degree_keywords):
            education.append({
                "degree": line,
                "institution": lines[i+1] if i+1 < len(lines) else "See resume",
                "year": "See resume",
                "gpa": "",
                "location": ""
            })
            break
    
    # Extract work experience (look for job title patterns)
    work_experience = []
    job_keywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'specialist']
    for i, line in enumerate(lines):
        if any(keyword in line.lower() for keyword in job_keywords):
            work_experience.append({
                "title": line,
                "company": lines[i+1] if i+1 < len(lines) else "See resume",
                "start_date": "See resume",
                "end_date": "See resume",
                "location": "",
                "description": text[:200] + "...",
                "achievements": [],
                "technologies": found_skills[:5]
            })
            break
    
    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "linkedin": "",
        "github": "",
        "website": "",
        "summary": text[:500] + "..." if len(text) > 500 else text,
        "skills": [{"name": skill, "category": "Technical"} for skill in found_skills[:10]],
        "education": education if education else [{"degree": "See resume", "institution": "See resume", "year": "", "gpa": "", "location": ""}],
        "work_experience": work_experience if work_experience else [{"title": "See resume", "company": "See resume", "start_date": "", "end_date": "", "location": "", "description": text[:200] + "...", "achievements": [], "technologies": []}],
        "certifications": [],
        "languages": []
    }

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from uploaded file"""
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

@app.get("/")
async def root():
    return {
        "message": "Recruiter.AI Enhanced Backend with Improved Fallback Parsing",
        "status": "healthy",
        "features": [
            "Enhanced job description templates",
            "Improved resume parsing",
            "Better data extraction",
            "Professional fallback content"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "recruiter-ai-enhanced-backend"}

@app.post("/api/job-descriptions/generate")
async def generate_job_description(request_data: dict):
    try:
        # Try OpenAI first
        try:
            title = request_data.get("title", "Software Engineer")
            company = request_data.get("company", "Company Name")
            department = request_data.get("department", "Engineering")
            location_type = request_data.get("location_type", "remote")
            location = request_data.get("location", "Anywhere")
            experience_level = request_data.get("experience_level", "Mid Level")
            key_skills = request_data.get("key_skills", [])
            
            skills_text = ", ".join(key_skills) if key_skills else "relevant technical skills"
            
            prompt = f"""
            Generate a comprehensive job description for a {title} position at {company}.
            
            Company: {company}
            Department: {department}
            Location: {location} ({location_type})
            Experience Level: {experience_level}
            Key Skills: {skills_text}
            
            Return a JSON object with these exact fields:
            {{
                "title": "{title}",
                "company": "{company}",
                "department": "{department}",
                "location_type": "{location_type}",
                "location": "{location}",
                "experience_level": "{experience_level}",
                "overview": "Job overview paragraph",
                "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
                "qualifications": ["Qualification 1", "Qualification 2", ...],
                "required_skills": ["Skill 1", "Skill 2", ...],
                "preferred_skills": ["Skill 1", "Skill 2", ...],
                "benefits": ["Benefit 1", "Benefit 2", ...],
                "company_description": "Brief company description of {company}"
            }}
            """
            
            response = openai.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {"role": "system", "content": "You are an expert HR professional. Generate professional, detailed job descriptions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            generated_text = response.choices[0].message.content
            start_idx = generated_text.find('{')
            end_idx = generated_text.rfind('}') + 1
            json_str = generated_text[start_idx:end_idx]
            job_data = json.loads(json_str)
            
            print("✅ OpenAI job generation successful")
            return job_data
            
        except Exception as e:
            print(f"OpenAI failed, using enhanced fallback: {e}")
            return enhance_fallback_job_description(request_data)
            
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to generate job description"
        }

@app.post("/api/resume-parser/parse")
async def parse_resume(file: UploadFile = File(...)):
    try:
        print(f"Starting enhanced resume parsing for: {file.filename}")
        
        file_content = await file.read()
        text = extract_text_from_file(file_content, file.filename)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Try OpenAI first
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
            
            response = openai.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {"role": "system", "content": "You are an expert resume parser. Extract ALL available information with maximum detail."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.1
            )
            
            generated_text = response.choices[0].message.content
            start_idx = generated_text.find('{')
            end_idx = generated_text.rfind('}') + 1
            json_str = generated_text[start_idx:end_idx]
            parsed_data = json.loads(json_str)
            
            print("✅ OpenAI resume parsing successful")
            
        except Exception as e:
            print(f"OpenAI failed, using enhanced fallback parsing: {e}")
            parsed_data = extract_resume_info_enhanced(text, file.filename)
        
        resume_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        resume_data = {
            "resume_id": resume_id,
            "full_name": parsed_data.get("full_name", ""),
            "contact": {
                "email": parsed_data.get("email", ""),
                "phone": parsed_data.get("phone", ""),
                "linkedin": parsed_data.get("linkedin", ""),
                "github": parsed_data.get("github", ""),
                "website": parsed_data.get("website", "")
            },
            "education": parsed_data.get("education", []),
            "work_experience": parsed_data.get("work_experience", []),
            "skills": parsed_data.get("skills", []),
            "file_path": file.filename,
            "created_at": current_time,
            "summary": parsed_data.get("summary", ""),
            "certifications": parsed_data.get("certifications", []),
            "languages": parsed_data.get("languages", [])
        }
        
        stored_resumes.append(resume_data)
        
        print(f"✅ Enhanced resume stored with ID: {resume_id}")
        print(f"✅ Stored data for: {resume_data['full_name']}")
        print(f"✅ Total resumes in memory: {len(stored_resumes)}")
        
        return resume_data
        
    except Exception as e:
        print(f"Error parsing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@app.post("/api/job-descriptions/save")
async def save_job_description(job_data: dict):
    job_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    job_with_metadata = {
        "job_id": job_id,
        "created_at": current_time,
        "updated_at": current_time,
        "status": "published",
        **job_data
    }
    
    stored_job_descriptions.append(job_with_metadata)
    
    print(f"✅ Enhanced job description stored with ID: {job_id}")
    print(f"✅ Stored job: {job_data.get('title', 'Unknown')} at {job_data.get('company', 'Unknown Company')}")
    print(f"✅ Total jobs in memory: {len(stored_job_descriptions)}")
    
    return {
        "success": True,
        "message": "Job description saved successfully!",
        "job_id": job_id,
        "job": job_with_metadata
    }

@app.get("/api/job-descriptions")
async def get_job_descriptions():
    return {
        "job_descriptions": stored_job_descriptions,
        "total": len(stored_job_descriptions),
        "message": f"Found {len(stored_job_descriptions)} published jobs"
    }

@app.get("/api/candidates")
async def get_candidates():
    return {
        "candidates": stored_resumes,
        "total": len(stored_resumes),
        "message": f"Found {len(stored_resumes)} candidates"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8804)
