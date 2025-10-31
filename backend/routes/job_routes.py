from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from ..services.job_service import job_service
from ..models.job import (
    JobGenerationRequest, JobGenerationResponse, JobSearchRequest,
    JobDescription, JobMatchRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/job-descriptions", tags=["Job Descriptions"])

# Also handle /api/jobs endpoints
router_jobs = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "job-description-service",
        "version": "1.0.0"
    }

@router.post("/generate")
async def generate_job_description(request_data: dict):
    """
    Generate AI-powered job description - EXACT COPY from monolithic backend
    """
    import os
    import json
    import uuid
    from datetime import datetime
    import openai
    
    print(f"🚀 [JobGeneration] Received request: {request_data}")
    
    # Get OpenAI API key from environment
    openai_api_key = os.getenv("OPENAI_API_KEY")
    print(f"🚀 [JobGeneration] OpenAI API Key available: {bool(openai_api_key)}")
    
    # Quick test return
    if request_data.get("title") == "TEST":
        return {"success": True, "message": "Test endpoint working", "data": request_data}
    
    try:
        title = request_data.get("title", "Software Engineer")
        company = request_data.get("company", "Company Name")
        department = request_data.get("department", "Engineering")
        location_type = request_data.get("location_type", "remote")
        location = request_data.get("location", "Anywhere")
        experience_level = request_data.get("experience_level", "Senior Level")
        key_skills = request_data.get("key_skills", [])
        
        skills_text = ", ".join(key_skills) if key_skills else "relevant technical skills"
        
        try:
            # Try OpenAI first
            prompt = f"""
            Create an EXTREMELY DETAILED, REALISTIC job description for a {title} position at {company}. This should be as comprehensive and specific as a real job posting from a top tech company.

            COMPANY: {company}
            ROLE: {title}
            DEPARTMENT: {department}
            LOCATION: {location} ({location_type})
            EXPERIENCE: {experience_level}
            KEY SKILLS: {skills_text if skills_text else "industry-relevant technical skills"}

            CRITICAL REQUIREMENTS:
            1. Make this ULTRA-SPECIFIC to the {title} role - NOT generic software development tasks
            2. Create DETAILED responsibilities that a {title} would actually do at {company}
            3. Include SPECIFIC technical requirements and tools for {title} role
            4. Add REALISTIC qualifications that match the {title} role and company's standards
            5. Include AUTHENTIC company benefits and culture details
            6. Write in the tone and style of a real {company} job posting
            7. Use EXACT values: {company}, {title}, {department}, {location}, {location_type}, {experience_level}

            ROLE-SPECIFIC REQUIREMENTS:
            - If {title} is "Data Scientist": Focus on data analysis, machine learning, statistics, data visualization, A/B testing, model building
            - If {title} is "Business Consultant": Focus on business strategy, client consulting, process improvement, stakeholder management, business analysis
            - If {title} is "Software Engineer": Focus on software development, coding, system design, debugging, testing
            - If {title} is "Product Manager": Focus on product strategy, roadmap planning, stakeholder management, market research, feature prioritization
            - If {title} is "Marketing Manager": Focus on marketing campaigns, brand management, digital marketing, analytics, content strategy
            - If {title} is "Sales Manager": Focus on sales strategy, team management, client relationships, revenue targets, business development
            - If {title} is "HR Manager": Focus on talent acquisition, employee relations, performance management, policy development, culture building
            - If {title} is "Finance Manager": Focus on financial planning, budgeting, analysis, reporting, compliance, risk management
            - If {title} is "Operations Manager": Focus on process optimization, supply chain, quality control, team management, efficiency improvement
            - If {title} is "Designer": Focus on user experience, visual design, prototyping, user research, design systems

            JOB DESCRIPTION STRUCTURE:

            **About the Company:**
            - Write 2-3 paragraphs about {company}'s mission, culture, and what makes it unique
            - Include company size, industry position, and key products/services
            - Mention company values and work environment
            - Explain why someone would want to work at {company}

            **About the Team:**
            - Describe the {department} department and its role at {company}
            - Explain what the team does and how it contributes to company goals
            - Mention team size, structure, and collaboration style

            **Role Overview:**
            - 2-3 sentences explaining the {title} role and its importance
            - What the person will accomplish and impact they'll have
            - How this role fits into the broader {company} mission

            **Tech Stack:**
            - List specific technologies, frameworks, and tools used for {title} role at {company}
            - Include programming languages, databases, cloud platforms, etc.
            - Be specific about versions and tools (e.g., "Python 3.9+", "AWS Lambda", "Kubernetes")

            **Key Responsibilities:**
            - 10-15 SPECIFIC, DETAILED responsibilities for {title} role
            - Include specific tasks, deliverables, and outcomes
            - Mention specific technologies and tools
            - Include collaboration and leadership aspects
            - Be specific about what success looks like
            - Include metrics and KPIs where relevant
            - Mention specific projects and initiatives
            - Include cross-functional collaboration details

            **Requirements - Must Have:**
            - 8-12 SPECIFIC requirements for {title} role
            - Exact education requirements (degree, field, GPA if relevant)
            - Specific years of experience in relevant areas
            - Required technical skills with proficiency levels
            - Required certifications or licenses
            - Industry experience requirements
            - Soft skills and competencies
            - Specific project experience requirements
            - Leadership and management experience
            - Communication and presentation skills

            **Requirements - Nice to Have:**
            - 6-10 additional skills that would make a candidate stand out
            - Specific technologies or frameworks
            - Industry experience or domain knowledge
            - Leadership or management experience
            - Advanced certifications or degrees
            - Open source contributions
            - Conference speaking experience
            - Patent or publication experience
            - Mentoring or teaching experience

            **Benefits & Perks:**
            - 8-12 REALISTIC benefits that {company} would actually offer
            - Include specific compensation details (salary ranges, equity, bonuses)
            - Health, dental, vision insurance details
            - Work-life balance perks (flexible hours, remote work, PTO)
            - Professional development opportunities
            - Company-specific perks and culture benefits
            - Stock options and equity details
            - Retirement and savings plans
            - Wellness and fitness programs
            - Learning and development budgets

            Format as JSON with these EXACT keys:
            {{
                "title": "{title}",
                "company": "{company}",
                "department": "{department}",
                "location_type": "{location_type}",
                "location": "{location}",
                "experience_level": "{experience_level}",
                "overview": "Detailed role overview specific to {company}",
                "responsibilities": ["Specific, detailed responsibility 1", "Specific, detailed responsibility 2", ...],
                "qualifications": ["Specific qualification 1", "Specific qualification 2", ...],
                "required_skills": ["Specific technical skill 1", "Specific technical skill 2", ...],
                "preferred_skills": ["Preferred skill 1", "Preferred skill 2", ...],
                "benefits": ["Specific benefit 1", "Specific benefit 2", ...],
                "company_description": "Detailed description of {company} as a real company"
            }}
            """
            
            client = openai.OpenAI(api_key=openai_api_key)
            response = client.chat.completions.create(
                model="gpt-4o",  # Use more powerful model for better quality
                messages=[
                    {"role": "system", "content": "You are an expert job description writer who creates EXTREMELY DETAILED, REALISTIC job postings for top tech companies. Your job descriptions are comprehensive, specific, and authentic - they read like real job postings from actual companies. You excel at creating detailed technical requirements, specific responsibilities, authentic company culture descriptions, and realistic benefits. Each job description is unique and tailored to the specific company, role, and industry. Focus on ULTRA-SPECIFICITY, authenticity, and EXTREME detail. Use EXACTLY the provided company name, job title, department, location, and experience level. Return ONLY valid JSON, no markdown formatting or additional text."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},  # Force JSON response
                max_tokens=6000,  # Significantly increased for extremely detailed descriptions
                temperature=0.8,  # More creative for realistic descriptions
                timeout=60  # Add timeout
            )
            
            generated_text = response.choices[0].message.content
            
            try:
                start_idx = generated_text.find('{')
                end_idx = generated_text.rfind('}') + 1
                json_str = generated_text[start_idx:end_idx]
                job_data = json.loads(json_str)
            except:
                job_data = {
                    "title": title,
                    "company": company,
                    "department": department,
                    "location_type": location_type,
                    "location": location,
                    "experience_level": experience_level,
                    "overview": generated_text[:500] + "...",
                    "responsibilities": ["Generated by AI - see full description above"],
                    "qualifications": ["Generated by AI - see full description above"],
                    "required_skills": key_skills,
                    "preferred_skills": [],
                    "benefits": ["Competitive salary", "Health insurance", "401k", "Flexible work arrangements"],
                    "company_description": f"{company} is a leading company in the industry."
                }
        except Exception as e:
            print(f"OpenAI failed, using fallback job generation: {e}")
            # Fallback job description
            job_data = {
                "title": title,
                "company": company,
                "department": department or "Engineering",
                "location_type": location_type,
                "location": location or "Remote",
                "experience_level": experience_level,
                "overview": f"We are looking for a {title} to join our {company} team. This position offers an exciting opportunity to work on cutting-edge projects and contribute to our company's success.",
                "responsibilities": [
                    f"Develop and maintain {title.lower()} solutions",
                    "Collaborate with cross-functional teams",
                    "Write clean, maintainable code",
                    "Participate in code reviews",
                    "Contribute to technical documentation"
                ],
                "qualifications": [
                    f"Bachelor's degree in Computer Science or related field",
                    f"3+ years of experience in {title.lower()}",
                    f"Strong programming skills in {', '.join(key_skills) if key_skills else 'relevant technologies'}",
                    "Excellent problem-solving abilities",
                    "Strong communication skills"
                ],
                "required_skills": key_skills if key_skills else ["Programming", "Problem Solving", "Team Collaboration"],
                "preferred_skills": ["Cloud Computing", "Agile Development", "Version Control"],
                "benefits": [
                    "Competitive salary and equity",
                    "Comprehensive health insurance",
                    "401k matching",
                    "Flexible work arrangements",
                    "Professional development opportunities"
                ],
                "company_description": f"{company} is a leading company in the industry, known for innovation and excellence."
            }
        
        # Format the job description as a readable text
        try:
            job_description = f"""# {job_data['title']}

## Company: {job_data['company']}
**Department:** {job_data['department']}
**Location:** {job_data['location']} ({job_data['location_type']})
**Experience Level:** {job_data['experience_level']}

## Job Overview
{job_data['overview']}

## Key Responsibilities
{chr(10).join([f"• {resp}" for resp in job_data['responsibilities']])}

## Required Qualifications
{chr(10).join([f"• {qual}" for qual in job_data['qualifications']])}

## Required Skills
{chr(10).join([f"• {skill}" for skill in job_data['required_skills']])}

## Preferred Skills
{chr(10).join([f"• {skill}" for skill in job_data['preferred_skills']]) if job_data['preferred_skills'] else "• None specified"}

## Benefits
{chr(10).join([f"• {benefit}" for benefit in job_data['benefits']])}

## About {job_data['company']}
{job_data['company_description']}
"""

            return {
                "job_description": job_description,
                "job_data": job_data,
                "success": True
            }
        except Exception as format_error:
            print(f"❌ Error formatting job description: {format_error}")
            # Fallback to simple format
            job_description = f"# {job_data['title']}\n\n## Company: {job_data['company']}\n\n## Overview\n{job_data['overview']}"
            return {
                "job_description": job_description,
                "job_data": job_data,
                "success": True
            }
        
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to generate job description",
            "success": False
        }

@router.post("/save")
async def save_job_description(job_data: dict):
    """
    Save job description - EXACT COPY from monolithic backend
    """
    import uuid
    from datetime import datetime
    from ..services.milvus_service import store_job_in_milvus
    from ..storage import stored_job_descriptions
    
    job_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    # Add metadata to job data
    job_with_metadata = {
        "job_id": job_id,
        "created_at": current_time,
        "updated_at": current_time,
        "status": "published",
        **job_data
    }
    
    # Store in memory
    stored_job_descriptions.append(job_with_metadata)
    
    # Store in Milvus
    store_job_in_milvus(job_with_metadata, job_id)
    
    print(f"✅ Job description stored with ID: {job_id}")
    print(f"✅ Stored job: {job_data.get('title', 'Unknown')} at {job_data.get('company', 'Unknown Company')}")
    print(f"✅ Total jobs in memory: {len(stored_job_descriptions)}")
    
    return {
        "success": True,
        "message": "Job description saved successfully!",
        "job_id": job_id,
        "job": job_with_metadata
    }

@router.post("/", response_model=JobDescription)
async def create_job_description(job_data: Dict[str, Any]):
    """
    Create a new job description (alias for save)
    """
    return await save_job_description(job_data)

@router.get("/")
async def get_job_descriptions():
    """
    Get all job descriptions - EXACT COPY from monolithic backend
    """
    from ..services.milvus_service import get_jobs_from_milvus
    
    jobs = get_jobs_from_milvus()
    return {
        "job_descriptions": jobs,
        "total": len(jobs),
        "message": f"Found {len(jobs)} published jobs"
    }

@router.get("/{job_id}")
async def get_job_description_by_id(job_id: str):
    """
    Get a specific job description by ID - EXACT COPY from monolithic backend
    """
    from ..services.milvus_service import get_jobs_from_milvus
    
    # Handle undefined job_id
    if job_id == "undefined" or not job_id:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    jobs = get_jobs_from_milvus()
    for job in jobs:
        if job.get("job_id") == job_id:
            return job
    
    raise HTTPException(status_code=404, detail="Job not found")

@router.put("/{job_id}", response_model=JobDescription)
async def update_job_description(job_id: str, job_data: Dict[str, Any]):
    """
    Update an existing job description
    """
    try:
        logger.info(f"Updating job description: {job_id}")
        
        updated_job = await job_service.update_job_description(job_id, job_data)
        if not updated_job:
            raise HTTPException(status_code=404, detail="Job description not found")
        
        logger.info(f"Successfully updated job description: {job_id}")
        return updated_job
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating job description {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating job description: {str(e)}")

@router.delete("/{job_id}")
async def delete_job_description(job_id: str):
    """
    Delete a job description by ID
    """
    try:
        logger.info(f"Deleting job description: {job_id}")
        
        success = await job_service.delete_job_description(job_id)
        if not success:
            raise HTTPException(status_code=404, detail="Job description not found")
        
        logger.info(f"Successfully deleted job description: {job_id}")
        return {
            "success": True,
            "message": f"Job description {job_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting job description {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting job description: {str(e)}")

@router.post("/search")
async def search_job_descriptions(request: JobSearchRequest):
    """
    Search job descriptions using semantic search
    """
    try:
        logger.info(f"Searching job descriptions with query: {request.query}")
        
        results = await job_service.search_jobs(request)
        
        return {
            "results": results,
            "total": len(results),
            "query": request.query,
            "message": f"Found {len(results)} matching job descriptions"
        }
        
    except Exception as e:
        logger.error(f"Error searching job descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching job descriptions: {str(e)}")

@router.post("/match")
async def match_jobs_with_resume(request: JobMatchRequest):
    """
    Match jobs with a resume
    """
    try:
        logger.info(f"Matching jobs for resume: {request.resume_id}")
        
        matches = await job_service.match_jobs_with_resume(request)
        
        return {
            "matches": matches,
            "total": len(matches),
            "resume_id": request.resume_id,
            "message": f"Found {len(matches)} matching jobs"
        }
        
    except Exception as e:
        logger.error(f"Error matching jobs with resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error matching jobs with resume: {str(e)}")

@router.get("/drafts")
async def get_job_description_drafts():
    """
    Get all draft job descriptions
    """
    try:
        # TODO: Implement draft filtering
        jobs = await job_service.get_all_job_descriptions()
        drafts = [job for job in jobs if job.status == "draft"]
        
        return {
            "job_descriptions": drafts,
            "total": len(drafts),
            "message": f"Found {len(drafts)} draft job descriptions"
        }
    except Exception as e:
        logger.error(f"Error retrieving draft job descriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving draft job descriptions: {str(e)}")

# /api/jobs endpoints (for compatibility with existing frontend)
@router_jobs.get("")
async def get_jobs():
    """Get all jobs - alias for /api/job-descriptions"""
    try:
        jobs = await job_service.get_all_job_descriptions(limit=1000)
        return {"jobs": [job.dict() for job in jobs], "total": len(jobs)}
    except Exception as e:
        logger.error(f"Error retrieving jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving jobs: {str(e)}")

@router_jobs.get("/{job_id}")
async def get_job(job_id: str):
    """Get a single job by ID - alias for /api/job-descriptions/{job_id}"""
    try:
        job = await job_service.get_job_description(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"job": job.dict()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving job: {str(e)}")

@router_jobs.post("")
async def create_job(job_data: Dict[str, Any]):
    """Create a new job - alias for /api/job-descriptions"""
    try:
        job_description = await job_service.create_job_description(job_data)
        return {
            "message": "Job created successfully",
            "job_id": job_description.id,
            "job": job_description.dict()
        }
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating job: {str(e)}")
