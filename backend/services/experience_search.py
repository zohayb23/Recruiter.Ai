from typing import List, Dict, Any
import re
from datetime import datetime

def extract_experience_sections(content: str) -> List[Dict[str, Any]]:
    """Extract structured experience sections from resume content."""
    sections = []
    current_section = None
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Look for date patterns
        date_pattern = r'(\d{4})\s*[-–]\s*(?:(\d{4})|present|current)'
        dates = re.search(date_pattern, line, re.IGNORECASE)
        
        # Look for role/company headers
        if dates or re.match(r'^[A-Z][^a-z]{0,20}$', line):
            if current_section:
                sections.append(current_section)
            current_section = {
                'title': line,
                'start_year': int(dates.group(1)) if dates else None,
                'end_year': int(dates.group(2)) if dates and dates.group(2) else datetime.now().year if dates else None,
                'duration': 0,
                'description': '',
                'skills': set()
            }
        elif current_section:
            current_section['description'] += line + ' '
            
    if current_section:
        sections.append(current_section)
    
    # Calculate durations and extract skills
    for section in sections:
        if section['start_year'] and section['end_year']:
            section['duration'] = section['end_year'] - section['start_year']
        
        # Extract skills from description
        skill_pattern = r'\b(?:Python|Java(?:Script)?|React|Node\.?js|AWS|Docker|Kubernetes|SQL|HTML5?|CSS3?|TypeScript|Angular|Vue\.?js|PHP|Ruby|C\+\+|C#|\.NET|Go(?:lang)?|Rust|Swift|Kotlin|Spring|Django|Flask|Express\.js|MongoDB|PostgreSQL|MySQL|Redis|Git|CI/CD|DevOps|Agile|Scrum)\b'
        section['skills'] = set(re.findall(skill_pattern, section['description'], re.IGNORECASE))
        
    return sections

def calculate_experience_score(experience_sections: List[Dict[str, Any]], required_skills: List[str]) -> Dict[str, Any]:
    """Calculate experience score based on relevant experience and skills."""
    if not experience_sections or not required_skills:
        return {
            "score": 0,
            "relevant_experience": [],
            "total_years": 0
        }
    
    required_skills_lower = [skill.lower() for skill in required_skills]
    relevant_sections = []
    total_years = 0
    weighted_score = 0
    
    for section in experience_sections:
        # Check if section mentions required skills
        section_skills = {skill.lower() for skill in section['skills']}
        matching_skills = [skill for skill in required_skills_lower if skill in section_skills]
        
        if matching_skills:
            relevance = len(matching_skills) / len(required_skills)
            duration_weight = min(1.0, section['duration'] / 5)  # Cap at 5 years per position
            recency_weight = 1.0 if section['end_year'] == datetime.now().year else 0.8  # Favor current positions
            
            section_score = relevance * duration_weight * recency_weight
            weighted_score += section_score
            total_years += section['duration']
            
            relevant_sections.append({
                'title': section['title'],
                'duration': section['duration'],
                'matching_skills': matching_skills,
                'relevance_score': section_score
            })
    
    # Normalize score to 0-1 range
    final_score = min(1.0, weighted_score / len(experience_sections))
    
    return {
        "score": final_score,
        "relevant_experience": sorted(relevant_sections, key=lambda x: x['relevance_score'], reverse=True),
        "total_years": total_years
    }

def search_by_experience(content: str, required_skills: List[str]) -> Dict[str, Any]:
    """Search and score resume based on relevant experience."""
    try:
        # Extract experience sections
        experience_sections = extract_experience_sections(content)
        
        # Calculate experience score
        experience_match = calculate_experience_score(experience_sections, required_skills)
        
        return {
            "experience_score": experience_match["score"],
            "relevant_experience": experience_match["relevant_experience"],
            "total_years": experience_match["total_years"]
        }
    except Exception as e:
        print(f"Error in experience search: {str(e)}")
        return {
            "experience_score": 0,
            "relevant_experience": [],
            "total_years": 0
        } 