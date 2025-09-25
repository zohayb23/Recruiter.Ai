from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import re
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import json
from dateutil import parser
import docx
import PyPDF2
import io

app = FastAPI(title="Recruiter.AI Gap Detection Backend", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
stored_resumes = []

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

def parse_date(date_str: str) -> Optional[date]:
    """Parse various date formats"""
    if not date_str or date_str.lower() in ['present', 'current', 'now', 'ongoing']:
        return date.today()
    
    try:
        # Try common date formats
        date_formats = [
            '%Y-%m',      # 2020-01
            '%Y',         # 2020
            '%m/%Y',      # 01/2020
            '%m-%Y',      # 01-2020
            '%B %Y',      # January 2020
            '%b %Y',      # Jan 2020
            '%Y-%m-%d',   # 2020-01-15
            '%m/%d/%Y',   # 01/15/2020
            '%d/%m/%Y',   # 15/01/2020
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        
        # Try dateutil parser for complex formats
        return parser.parse(date_str).date()
    except:
        return None

def extract_education_timeline(resume_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract education timeline with gap detection"""
    education_timeline = []
    
    for edu in resume_data.get('education', []):
        start_date = None
        end_date = None
        
        # Try to extract dates from various fields
        if 'start_date' in edu:
            start_date = parse_date(edu['start_date'])
        elif 'year' in edu:
            end_date = parse_date(edu['year'])
        
        if 'end_date' in edu:
            end_date = parse_date(edu['end_date'])
        elif 'year' in edu and not start_date:
            end_date = parse_date(edu['year'])
        
        education_timeline.append({
            'type': 'education',
            'title': edu.get('degree', 'Unknown Degree'),
            'institution': edu.get('institution', 'Unknown Institution'),
            'start_date': start_date,
            'end_date': end_date,
            'duration_months': None,
            'gap_before': None,
            'gap_after': None
        })
    
    return education_timeline

def extract_work_timeline(resume_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract work experience timeline with gap detection"""
    work_timeline = []
    
    for work in resume_data.get('work_experience', []):
        start_date = parse_date(work.get('start_date', ''))
        end_date = parse_date(work.get('end_date', ''))
        
        work_timeline.append({
            'type': 'work',
            'title': work.get('title', 'Unknown Position'),
            'company': work.get('company', 'Unknown Company'),
            'start_date': start_date,
            'end_date': end_date,
            'duration_months': None,
            'gap_before': None,
            'gap_after': None
        })
    
    return work_timeline

def calculate_duration_months(start_date: Optional[date], end_date: Optional[date]) -> Optional[int]:
    """Calculate duration in months between two dates"""
    if not start_date or not end_date:
        return None
    
    if start_date > end_date:
        return None
    
    return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)

def detect_gaps_in_timeline(timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Detect gaps in timeline and calculate durations"""
    # Sort timeline by start date
    sorted_timeline = sorted(
        [item for item in timeline if item['start_date']],
        key=lambda x: x['start_date']
    )
    
    # Calculate durations and gaps
    for i, item in enumerate(sorted_timeline):
        # Calculate duration
        item['duration_months'] = calculate_duration_months(
            item['start_date'], 
            item['end_date']
        )
        
        # Calculate gap before (if not first item)
        if i > 0:
            prev_item = sorted_timeline[i-1]
            if prev_item['end_date'] and item['start_date']:
                gap_months = calculate_duration_months(prev_item['end_date'], item['start_date'])
                if gap_months and gap_months > 0:
                    item['gap_before'] = gap_months
                    prev_item['gap_after'] = gap_months
    
    return sorted_timeline

def analyze_education_gaps(education_timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze education gaps and patterns"""
    gaps = []
    total_education_months = 0
    degree_levels = []
    
    for edu in education_timeline:
        if edu['duration_months']:
            total_education_months += edu['duration_months']
        
        # Detect degree level
        degree = edu['title'].lower()
        if any(keyword in degree for keyword in ['phd', 'doctorate', 'doctoral']):
            degree_levels.append('PhD')
        elif any(keyword in degree for keyword in ['master', 'ms', 'ma', 'mba']):
            degree_levels.append('Master')
        elif any(keyword in degree for keyword in ['bachelor', 'bs', 'ba', 'btech']):
            degree_levels.append('Bachelor')
        elif any(keyword in degree for keyword in ['associate', 'diploma', 'certificate']):
            degree_levels.append('Associate')
        
        # Detect gaps
        if edu['gap_before'] and edu['gap_before'] > 6:  # Gap > 6 months
            gaps.append({
                'type': 'education_gap',
                'duration_months': edu['gap_before'],
                'before': edu['title'],
                'after': 'Previous education',
                'severity': 'high' if edu['gap_before'] > 24 else 'medium'
            })
    
    return {
        'total_education_months': total_education_months,
        'degree_levels': degree_levels,
        'highest_degree': max(degree_levels) if degree_levels else 'Unknown',
        'gaps': gaps,
        'gap_count': len(gaps),
        'total_gap_months': sum(gap['duration_months'] for gap in gaps)
    }

def analyze_career_gaps(work_timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze career gaps and patterns"""
    gaps = []
    total_work_months = 0
    career_progression = []
    
    for work in work_timeline:
        if work['duration_months']:
            total_work_months += work['duration_months']
        
        # Detect career progression
        title = work['title'].lower()
        if any(keyword in title for keyword in ['senior', 'lead', 'principal', 'director', 'manager']):
            career_progression.append('Senior')
        elif any(keyword in title for keyword in ['junior', 'associate', 'entry']):
            career_progression.append('Junior')
        else:
            career_progression.append('Mid')
        
        # Detect gaps
        if work['gap_before'] and work['gap_before'] > 3:  # Gap > 3 months
            gaps.append({
                'type': 'career_gap',
                'duration_months': work['gap_before'],
                'before': work['title'],
                'after': 'Previous position',
                'severity': 'high' if work['gap_before'] > 12 else 'medium' if work['gap_before'] > 6 else 'low'
            })
    
    return {
        'total_work_months': total_work_months,
        'career_progression': career_progression,
        'current_level': career_progression[-1] if career_progression else 'Unknown',
        'gaps': gaps,
        'gap_count': len(gaps),
        'total_gap_months': sum(gap['duration_months'] for gap in gaps),
        'average_job_duration': total_work_months / len(work_timeline) if work_timeline else 0
    }

def generate_gap_insights(education_analysis: Dict[str, Any], career_analysis: Dict[str, Any]) -> List[str]:
    """Generate insights about gaps and career patterns"""
    insights = []
    
    # Education insights
    if education_analysis['gap_count'] > 0:
        total_edu_gaps = education_analysis['total_gap_months']
        if total_edu_gaps > 24:
            insights.append(f"⚠️ Significant education gaps detected ({total_edu_gaps} months total)")
        elif total_edu_gaps > 12:
            insights.append(f"📚 Moderate education gaps detected ({total_edu_gaps} months total)")
        else:
            insights.append(f"📖 Minor education gaps detected ({total_edu_gaps} months total)")
    
    # Career insights
    if career_analysis['gap_count'] > 0:
        total_career_gaps = career_analysis['total_gap_months']
        if total_career_gaps > 24:
            insights.append(f"🚨 Significant career gaps detected ({total_career_gaps} months total)")
        elif total_career_gaps > 12:
            insights.append(f"⏸️ Moderate career gaps detected ({total_career_gaps} months total)")
        else:
            insights.append(f"⏱️ Minor career gaps detected ({total_career_gaps} months total)")
    
    # Career progression insights
    if career_analysis['career_progression']:
        progression = career_analysis['career_progression']
        if len(progression) >= 3:
            if progression[-1] == 'Senior' and 'Junior' in progression:
                insights.append("📈 Positive career progression detected (Junior → Senior)")
            elif progression[-1] == 'Junior' and 'Senior' in progression:
                insights.append("📉 Career regression detected (Senior → Junior)")
    
    # Job stability insights
    avg_duration = career_analysis['average_job_duration']
    if avg_duration > 0:
        if avg_duration < 12:
            insights.append("🔄 High job mobility detected (average < 1 year)")
        elif avg_duration > 36:
            insights.append("🏢 High job stability detected (average > 3 years)")
    
    # Education level insights
    highest_degree = education_analysis['highest_degree']
    if highest_degree == 'PhD':
        insights.append("🎓 Advanced education level (PhD)")
    elif highest_degree == 'Master':
        insights.append("🎓 Graduate education level (Master's)")
    elif highest_degree == 'Bachelor':
        insights.append("🎓 Undergraduate education level (Bachelor's)")
    
    return insights

def parse_resume_with_gap_detection(text: str, filename: str) -> Dict[str, Any]:
    """Parse resume and detect gaps using rule-based logic"""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Extract basic info (same as before)
    name = "Unknown"
    if filename:
        name_from_file = filename.replace('.pdf', '').replace('.docx', '').replace('.doc', '')
        if len(name_from_file.split()) >= 2:
            name = name_from_file
    
    for line in lines[:5]:
        if len(line.split()) >= 2 and len(line.split()) <= 4:
            if not any(char in line.lower() for char in ['@', 'http', 'www', '.com', 'phone', 'email']):
                name = line
                break
    
    # Extract email and phone
    email = ""
    phone = ""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}'
    ]
    
    for line in lines:
        email_match = re.search(email_pattern, line)
        if email_match:
            email = email_match.group()
        
        for pattern in phone_patterns:
            phone_match = re.search(pattern, line)
            if phone_match:
                phone = phone_match.group()
                break
        if email and phone:
            break
    
    # Extract education (with date parsing)
    education = []
    degree_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college']
    for i, line in enumerate(lines):
        if any(keyword in line.lower() for keyword in degree_keywords):
            # Look for dates in nearby lines
            start_date = None
            end_date = None
            
            # Check current line and next few lines for dates
            for j in range(i, min(i+3, len(lines))):
                date_line = lines[j]
                # Look for year patterns
                year_match = re.search(r'\b(19|20)\d{2}\b', date_line)
                if year_match:
                    if not end_date:
                        end_date = year_match.group()
                    elif not start_date:
                        start_date = year_match.group()
            
            education.append({
                "degree": line,
                "institution": lines[i+1] if i+1 < len(lines) else "See resume",
                "start_date": start_date,
                "end_date": end_date,
                "year": end_date or start_date,
                "gpa": "",
                "location": ""
            })
            break
    
    # Extract work experience (with date parsing)
    work_experience = []
    job_keywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'specialist']
    for i, line in enumerate(lines):
        if any(keyword in line.lower() for keyword in job_keywords):
            # Look for dates in nearby lines
            start_date = None
            end_date = None
            
            # Check current line and next few lines for dates
            for j in range(i, min(i+3, len(lines))):
                date_line = lines[j]
                # Look for date patterns
                date_patterns = [
                    r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(19|20)\d{2}\b',
                    r'\b(19|20)\d{2}\b',
                    r'\b\d{1,2}/\d{4}\b',
                    r'\b\d{4}-\d{2}\b'
                ]
                
                for pattern in date_patterns:
                    matches = re.findall(pattern, date_line, re.IGNORECASE)
                    if matches:
                        if not start_date:
                            start_date = matches[0] if isinstance(matches[0], str) else matches[0][0] + ' ' + matches[0][1]
                        elif not end_date:
                            end_date = matches[0] if isinstance(matches[0], str) else matches[0][0] + ' ' + matches[0][1]
            
            work_experience.append({
                "title": line,
                "company": lines[i+1] if i+1 < len(lines) else "See resume",
                "start_date": start_date,
                "end_date": end_date,
                "location": "",
                "description": text[:200] + "...",
                "achievements": [],
                "technologies": []
            })
            break
    
    # Extract skills
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
    
    return {
        "full_name": name,
        "email": email,
        "phone": phone,
        "linkedin": "",
        "github": "",
        "website": "",
        "summary": text[:500] + "..." if len(text) > 500 else text,
        "skills": [{"name": skill, "category": "Technical"} for skill in found_skills[:10]],
        "education": education,
        "work_experience": work_experience,
        "certifications": [],
        "languages": []
    }

@app.get("/")
async def root():
    return {
        "message": "Recruiter.AI Gap Detection Backend",
        "status": "healthy",
        "features": [
            "Education gap detection",
            "Career gap analysis",
            "Timeline reconstruction",
            "Career progression analysis",
            "Job stability assessment",
            "No OpenAI credits required"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gap-detection-backend"}

@app.post("/api/resume-parser/parse-with-gaps")
async def parse_resume_with_gaps(file: UploadFile = File(...)):
    """Parse resume and detect education/career gaps"""
    try:
        print(f"Starting gap detection parsing for: {file.filename}")
        
        file_content = await file.read()
        text = extract_text_from_file(file_content, file.filename)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Parse resume data
        parsed_data = parse_resume_with_gap_detection(text, file.filename)
        
        # Extract timelines
        education_timeline = extract_education_timeline(parsed_data)
        work_timeline = extract_work_timeline(parsed_data)
        
        # Combine and sort timeline
        full_timeline = education_timeline + work_timeline
        timeline_with_gaps = detect_gaps_in_timeline(full_timeline)
        
        # Analyze gaps
        education_analysis = analyze_education_gaps(education_timeline)
        career_analysis = analyze_career_gaps(work_timeline)
        
        # Generate insights
        insights = generate_gap_insights(education_analysis, career_analysis)
        
        # Create comprehensive response
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
            "languages": parsed_data.get("languages", []),
            
            # Gap detection results
            "gap_analysis": {
                "timeline": timeline_with_gaps,
                "education_analysis": education_analysis,
                "career_analysis": career_analysis,
                "insights": insights,
                "summary": {
                    "total_education_gaps": education_analysis['gap_count'],
                    "total_career_gaps": career_analysis['gap_count'],
                    "total_gap_months": education_analysis['total_gap_months'] + career_analysis['total_gap_months'],
                    "highest_degree": education_analysis['highest_degree'],
                    "current_career_level": career_analysis['current_level'],
                    "job_stability_score": "High" if career_analysis['average_job_duration'] > 24 else "Medium" if career_analysis['average_job_duration'] > 12 else "Low"
                }
            }
        }
        
        stored_resumes.append(resume_data)
        
        print(f"✅ Resume with gap analysis stored with ID: {resume_id}")
        print(f"✅ Gap analysis completed for: {resume_data['full_name']}")
        print(f"✅ Education gaps: {education_analysis['gap_count']}")
        print(f"✅ Career gaps: {career_analysis['gap_count']}")
        
        return resume_data
        
    except Exception as e:
        print(f"Error parsing resume with gap detection: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@app.get("/api/gap-analysis/summary")
async def get_gap_analysis_summary():
    """Get summary of all gap analyses"""
    try:
        print(f"Debug: stored_resumes count = {len(stored_resumes)}")
        summaries = []
        for resume in stored_resumes:
            print(f"Debug: Processing resume {resume.get('resume_id', 'unknown')}")
            if 'gap_analysis' in resume:
                summary = resume['gap_analysis']['summary']
                summaries.append({
                    "resume_id": resume['resume_id'],
                    "full_name": resume['full_name'],
                    "total_gaps": summary['total_education_gaps'] + summary['total_career_gaps'],
                    "total_gap_months": summary['total_gap_months'],
                    "highest_degree": summary['highest_degree'],
                    "career_level": summary['current_career_level'],
                    "job_stability": summary['job_stability_score']
                })
        
        return {
            "success": True,
            "summaries": summaries,
            "total_resumes": len(summaries),
            "total_education_gaps": sum(s['total_gaps'] for s in summaries),
            "total_career_gaps": sum(s['total_gaps'] for s in summaries),
            "average_gap_duration": sum(s['total_gap_months'] for s in summaries) / len(summaries) if summaries else 0,
            "message": f"Found gap analysis for {len(summaries)} resumes"
        }
        
    except Exception as e:
        print(f"Error in gap analysis summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get gap analysis summary: {str(e)}")

@app.get("/api/resume-parser/stored-resumes")
async def get_stored_resumes():
    """Get all stored resumes with gap analysis"""
    return {
        "resumes": stored_resumes,
        "total": len(stored_resumes),
        "message": f"Found {len(stored_resumes)} stored resumes with gap analysis"
    }

@app.get("/api/gap-analysis/{resume_id}")
async def get_gap_analysis(resume_id: str):
    """Get gap analysis for a specific resume"""
    try:
        for resume in stored_resumes:
            if resume.get('resume_id') == resume_id:
                return {
                    "success": True,
                    "resume_id": resume_id,
                    "gap_analysis": resume.get('gap_analysis', {}),
                    "message": "Gap analysis found"
                }
        
        raise HTTPException(status_code=404, detail="Resume not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get gap analysis: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8808)
