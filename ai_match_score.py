import numpy as np
from sentence_transformers import SentenceTransformer
from pymilvus import Collection, connections
import re
from collections import defaultdict
from difflib import SequenceMatcher
import hashlib
import spacy
import json

# Configuration
COLLECTION_NAME = "resume_embeddings"
MILVUS_HOST = "localhost"
MILVUS_PORT = "19530"
MODEL_NAME = "all-MiniLM-L6-v2"

# Load spaCy model for NLP processing
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("[INFO] Downloading spaCy model...")
    import subprocess
    subproces
    s.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

# Required skills with higher weights
REQUIRED_SKILLS = {
    'rust': {'weight': 3.0, 'variations': ['rust', 'rustlang', 'rust programming', 'rust developer']},
    'backend': {'weight': 2.0, 'variations': ['backend', 'back-end', 'server-side', 'server development']},
    'distributed systems': {'weight': 2.0, 'variations': ['distributed systems', 'distributed computing', 'distributed architecture']},
    'system design': {'weight': 2.0, 'variations': ['system design', 'architecture', 'system architecture', 'software architecture']},
    'api': {'weight': 1.5, 'variations': ['api', 'rest api', 'graphql', 'microservices']},
    'performance': {'weight': 1.5, 'variations': ['performance', 'optimization', 'efficiency', 'high-performance']},
    'scalability': {'weight': 1.5, 'variations': ['scalability', 'scaling', 'scale', 'high-scale']},
    'real-time': {'weight': 1.5, 'variations': ['real-time', 'realtime', 'real time', 'low-latency']},
    'low-latency': {'weight': 1.5, 'variations': ['low-latency', 'low latency', 'high-performance']},
    'security': {'weight': 1.0, 'variations': ['security', 'cybersecurity', 'secure']},
    'testing': {'weight': 0.8, 'variations': ['testing', 'unit testing', 'integration testing']},
    'documentation': {'weight': 0.5, 'variations': ['documentation', 'docs', 'technical writing']}
}

# Domain-specific keywords with weights
DOMAIN_KEYWORDS = {
    'fintech': {'weight': 2.0, 'variations': ['fintech', 'financial technology', 'finance', 'banking']},
    'trading': {'weight': 2.0, 'variations': ['trading', 'trading systems', 'trading platform', 'trading software']},
    'financial': {'weight': 1.5, 'variations': ['financial', 'finance', 'banking', 'investment']},
    'trading platform': {'weight': 2.0, 'variations': ['trading platform', 'trading system', 'trading software']},
    'high-frequency': {'weight': 2.0, 'variations': ['high-frequency', 'high frequency', 'hft', 'high-frequency trading']}
}

# Seniority levels with weights
SENIORITY_LEVELS = {
    'senior': {'weight': 2.0, 'variations': ['senior', 'sr', 'lead', 'principal']},
    'architect': {'weight': 2.0, 'variations': ['architect', 'architecture', 'architectural']},
    'lead': {'weight': 1.8, 'variations': ['lead', 'leading', 'led', 'team lead']},
    'manager': {'weight': 1.5, 'variations': ['manager', 'management', 'managing']},
    'developer': {'weight': 1.0, 'variations': ['developer', 'dev', 'programmer']},
    'engineer': {'weight': 1.0, 'variations': ['engineer', 'engineering', 'engineered']},
    'junior': {'weight': 0.5, 'variations': ['junior', 'jr', 'entry level', 'entry-level']}
}

# Experience keywords with weights
EXP_KEYWORDS = {
    'years': {'weight': 1.0, 'variations': ['years', 'yrs', 'year']},
    'experience': {'weight': 1.0, 'variations': ['experience', 'exp', 'experienced']},
    '5+': {'weight': 1.5, 'variations': ['5+', 'five+', '5 plus', 'five plus']},
    '10+': {'weight': 2.0, 'variations': ['10+', 'ten+', '10 plus', 'ten plus']}
}

# Education keywords with weights
EDU_KEYWORDS = {
    'bachelor': {'weight': 0.8, 'variations': ['bachelor', 'bachelors', 'bs', 'b.s.']},
    'master': {'weight': 1.0, 'variations': ['master', 'masters', 'ms', 'm.s.']},
    'phd': {'weight': 1.2, 'variations': ['phd', 'ph.d.', 'doctorate']},
    'computer science': {'weight': 1.0, 'variations': ['computer science', 'cs', 'computing']},
    'engineering': {'weight': 1.0, 'variations': ['engineering', 'engineer', 'eng']},
    'university': {'weight': 0.5, 'variations': ['university', 'univ', 'college']},
    'degree': {'weight': 0.5, 'variations': ['degree', 'bachelor', 'master']}
}

# Connect to Milvus
connections.connect(alias="default", host=MILVUS_HOST, port=MILVUS_PORT)

# Load the sentence transformer model
model = SentenceTransformer(MODEL_NAME)

def embed_text(text):
    """Generate embedding for a given text."""
    return model.encode(text)

def get_resume_embeddings():
    """Fetch all resume embeddings and metadata from Milvus."""
    collection = Collection(COLLECTION_NAME)
    collection.load()
    results = collection.query(expr="", output_fields=["embedding", "filename", "source", "name", "text"], limit=1000)
    return results

def extract_requirements_from_text(text):
    """Dynamically extract requirements from job description using NLP."""
    doc = nlp(text.lower())
    
    # Extract sections
    sections = {
        'requirements': [],
        'nice_to_have': [],
        'responsibilities': [],
        'tech_stack': []
    }
    
    current_section = None
    for line in text.split('\n'):
        line = line.strip().lower()
        if not line:
            continue
            
        # Detect section headers
        if 'requirements' in line or 'qualifications' in line:
            current_section = 'requirements'
            continue
        elif 'nice to have' in line or 'preferred' in line or 'bonus' in line:
            current_section = 'nice_to_have'
            continue
        elif 'responsibilities' in line or 'duties' in line:
            current_section = 'responsibilities'
            continue
        elif 'tech stack' in line or 'technologies' in line or 'tools' in line:
            current_section = 'tech_stack'
            continue
            
        if current_section and line.startswith('-'):
            sections[current_section].append(line[1:].strip())
    
    # Extract skills and technologies
    skills = defaultdict(list)
    
    # Common technology patterns with improved matching
    tech_patterns = {
        'programming': r'\b(python|java|javascript|typescript|js|ts|rust|go|ruby|php|swift|kotlin|c\+\+|c#|scala|perl)\b',
        'frameworks': r'\b(react|react\.js|reactjs|angular|vue|next\.js|nextjs|django|flask|spring|express|rails|laravel|asp\.net|tensorflow|pytorch)\b',
        'frontend': r'\b(frontend|front-end|front end|web development|ui development|user interface|html5|css3|html|css|responsive design)\b',
        'state_management': r'\b(redux|context api|mobx|recoil|zustand|vuex|ngrx)\b',
        'testing': r'\b(jest|react testing library|rtl|enzyme|cypress|selenium|testing library|unit testing|integration testing)\b',
        'build_tools': r'\b(webpack|babel|vite|rollup|parcel|gulp|grunt)\b',
        'styling': r'\b(styled components|emotion|sass|scss|less|tailwind|bootstrap|material-ui|mui)\b',
        'apis': r'\b(rest|graphql|restful|api|axios|fetch|apollo)\b',
        'databases': r'\b(mysql|postgresql|mongodb|cassandra|redis|elasticsearch|dynamodb|oracle|sql server)\b',
        'cloud': r'\b(aws|azure|gcp|cloud|kubernetes|docker|terraform|ansible|jenkins|gitlab|github)\b',
        'ml_ai': r'\b(machine learning|ml|artificial intelligence|ai|deep learning|neural networks|nlp|computer vision)\b',
        'data': r'\b(data science|data analysis|big data|spark|hadoop|pandas|numpy|scipy|tableau|power bi)\b',
        'devops': r'\b(devops|ci/cd|jenkins|gitlab|github actions|ansible|puppet|chef|terraform)\b',
        'security': r'\b(security|cybersecurity|penetration testing|vulnerability assessment|security compliance)\b',
        'mobile': r'\b(ios|android|react native|flutter|mobile development|app development)\b',
        'web': r'\b(frontend|backend|full stack|web development|responsive design|progressive web apps)\b'
    }
    
    # Extract skills from all sections
    for section_name, section_lines in sections.items():
        for line in section_lines:
            # First, try to extract skills from parentheses
            parentheses_pattern = r'\((.*?)\)'
            parentheses_matches = re.finditer(parentheses_pattern, line)
            for match in parentheses_matches:
                content = match.group(1)
                for category, pattern in tech_patterns.items():
                    skills_matches = re.finditer(pattern, content.lower())
                    for skill_match in skills_matches:
                        skill = skill_match.group()
                        if skill not in skills[category]:
                            skills[category].append(skill)
            
            # Then extract skills from the main text
            for category, pattern in tech_patterns.items():
                matches = re.finditer(pattern, line.lower())
                for match in matches:
                    skill = match.group()
                    if skill not in skills[category]:
                        skills[category].append(skill)
    
    # Extract years of experience
    exp_patterns = [
        r'(\d+)[\+]?\s*(?:years?|yrs?)\s*(?:of)?\s*experience',
        r'(\d+)[\+]?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:development|engineering|programming)',
        r'experience:\s*(\d+)[\+]?\s*(?:years?|yrs?)'
    ]
    
    years_exp = []
    for pattern in exp_patterns:
        matches = re.finditer(pattern, text.lower())
        years_exp.extend([int(match.group(1)) for match in matches])
    
    # Extract education requirements
    edu_patterns = [
        r'(bachelor|master|phd|b\.s\.|m\.s\.|bachelor\'s|master\'s|doctorate)',
        r'(computer science|software engineering|information technology|it|computer engineering)',
        r'(cs|se|it|cis|ce)'
    ]
    
    education = []
    for pattern in edu_patterns:
        matches = re.finditer(pattern, text.lower())
        education.extend([match.group(1) for match in matches])
    
    # Determine required vs nice-to-have skills
    required_skills = defaultdict(list)
    nice_to_have_skills = defaultdict(list)
    
    # First, add skills from tech stack as required
    for category, skills_list in skills.items():
        for skill in skills_list:
            if any(skill in tech for tech in sections['tech_stack']):
                required_skills[category].append(skill)
    
    # Then, add skills from requirements section
    for category, skills_list in skills.items():
        for skill in skills_list:
            if any(skill in req for req in sections['requirements']):
                if skill not in required_skills[category]:
                    required_skills[category].append(skill)
    
    # Finally, add remaining skills to nice-to-have
    for category, skills_list in skills.items():
        for skill in skills_list:
            if skill not in required_skills[category]:
                if any(skill in nice for nice in sections['nice_to_have']):
                    nice_to_have_skills[category].append(skill)
    
    return {
        'required_skills': dict(required_skills),
        'nice_to_have_skills': dict(nice_to_have_skills),
        'years_experience': max(years_exp) if years_exp else 0,
        'education': list(set(education)),
        'sections': sections
    }

def calculate_content_hash(text):
    """Calculate a hash of the content for duplicate detection."""
    normalized = re.sub(r'\s+', ' ', text.lower().strip())
    return hashlib.md5(normalized.encode()).hexdigest()

def calculate_similarity(text1, text2):
    """Calculate similarity between two texts using SequenceMatcher."""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

def extract_sections(text):
    """Extract different sections from resume text with improved detection."""
    sections = {
        'experience': '',
        'education': '',
        'skills': '',
        'summary': ''
    }
    
    section_headers = {
        'experience': ['experience', 'work experience', 'employment', 'professional experience', 'work history'],
        'education': ['education', 'academic', 'qualification', 'degree', 'university'],
        'skills': ['skills', 'technical skills', 'expertise', 'competencies', 'technologies'],
        'summary': ['summary', 'profile', 'objective', 'about', 'overview']
    }
    
    text_lower = text.lower()
    lines = text.split('\n')
    
    current_section = None
    section_content = []
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Check if line is a section header
        for section, headers in section_headers.items():
            if any(header in line_lower for header in headers):
                if current_section:
                    sections[current_section] = '\n'.join(section_content)
                current_section = section
                section_content = []
                break
        else:
            if current_section:
                section_content.append(line)
    
    # Add the last section
    if current_section and section_content:
        sections[current_section] = '\n'.join(section_content)
    
    return sections

def compute_match_scores(job_description, resumes):
    """Compute and normalize match scores with dynamic skill matching."""
    # Extract requirements from job description
    job_requirements = extract_requirements_from_text(job_description)
    job_emb = embed_text(job_description)
    scores = []
    seen_hashes = set()
    
    for resume in resumes:
        # Calculate content hash for duplicate detection
        content_hash = calculate_content_hash(resume.get("text", ""))
        if content_hash in seen_hashes:
            continue
        seen_hashes.add(content_hash)
        
        resume_emb = np.array(resume["embedding"])
        # Semantic similarity score (0-100)
        sim = np.dot(job_emb, resume_emb) / (np.linalg.norm(job_emb) * np.linalg.norm(resume_emb))
        semantic_score = int((sim + 1) * 50)
        
        # Extract sections
        sections = extract_sections(resume.get("text", ""))
        
        # Extract skills from resume
        resume_skills = extract_requirements_from_text(resume.get("text", ""))
        
        # Calculate skill match scores
        required_matches = defaultdict(list)
        nice_to_have_matches = defaultdict(list)
        
        # Match required skills
        total_required = 0
        matched_required = 0
        for category, skills in job_requirements['required_skills'].items():
            total_required += len(skills)
            for skill in skills:
                # Check for exact match or close match
                if any(skill.lower() in s.lower() or s.lower() in skill.lower() 
                      for s in resume_skills['required_skills'].get(category, [])):
                    matched_required += 1
                    required_matches[category].append(skill)
        
        # Match nice-to-have skills
        total_nice_to_have = 0
        matched_nice_to_have = 0
        for category, skills in job_requirements['nice_to_have_skills'].items():
            total_nice_to_have += len(skills)
            for skill in skills:
                # Check for exact match or close match
                if any(skill.lower() in s.lower() or s.lower() in skill.lower() 
                      for s in resume_skills['required_skills'].get(category, [])):
                    matched_nice_to_have += 1
                    nice_to_have_matches[category].append(skill)
        
        # Calculate weighted skill score
        required_score = (matched_required / total_required * 100) if total_required > 0 else 0
        nice_to_have_score = (matched_nice_to_have / total_nice_to_have * 100) if total_nice_to_have > 0 else 0
        skill_score = (0.7 * required_score + 0.3 * nice_to_have_score)
        
        # Calculate experience match with improved scoring
        exp_score = 0
        if resume_skills['years_experience'] >= job_requirements['years_experience']:
            exp_score = 100
        elif resume_skills['years_experience'] > 0:
            ratio = resume_skills['years_experience'] / job_requirements['years_experience']
            if ratio >= 0.8:
                exp_score = 90
            elif ratio >= 0.6:
                exp_score = 75
            elif ratio >= 0.4:
                exp_score = 50
            else:
                exp_score = 25
        
        # Calculate education match
        edu_score = 0
        if job_requirements['education']:
            edu_matches = sum(1 for edu in job_requirements['education'] 
                            if any(edu.lower() in e.lower() for e in resume_skills['education']))
            edu_score = (edu_matches / len(job_requirements['education'])) * 100
        
        # Calculate overall score with adjusted weights
        overall_score = int(0.25 * semantic_score + 0.45 * skill_score + 0.2 * exp_score + 0.1 * edu_score)
        
        scores.append({
            "filename": resume["filename"],
            "source": resume["source"],
            "score": overall_score,
            "text": resume.get("text", ""),
            "name": resume.get("name", ""),
            "scores": {
                "semantic": semantic_score,
                "skills": int(skill_score),
                "experience": int(exp_score),
                "education": int(edu_score)
            },
            "matches": {
                "required_skills": dict(required_matches),
                "nice_to_have_skills": dict(nice_to_have_matches),
                "years_experience": resume_skills['years_experience'],
                "education": resume_skills['education']
            },
            "sections": sections
        })
    
    # Sort by overall score descending
    scores.sort(key=lambda x: x["score"], reverse=True)
    return scores

def main():
    # Get job description from user
    print("Paste job description: ", end="")
    job_description = input()
    
    # Get all resumes from Milvus
    print("[INFO] Fetching resumes from Milvus...")
    resumes = get_resume_embeddings()
    print(f"[INFO] {len(resumes)} resumes loaded.")
    
    # Calculate match scores
    print("[INFO] Calculating match scores...")
    scores = compute_match_scores(job_description, resumes)
    
    # Print top 10 matches
    print("\nTop 10 Matches:")
    for i, r in enumerate(scores[:10], 1):
        # Format the output
        print(f"\n{i}. ", end="")
        if r['source'] == 'csv':
            if r['name']:
                print(f"{r['name']} (from {r['filename']})")
            else:
                print(f"Resume #{r['filename'].split('_')[-1]} from {r['filename']}")
        else:
            if r['name']:
                print(f"{r['name']} ({r['filename']})")
            else:
                print(f"{r['filename']}")
        
        print(f"   Overall Score: {r['score']}")
        print(f"   Source: {r['source']}")
        
        # Print detailed scores
        print("\n   Score Breakdown:")
        print(f"   - Semantic Match: {r['scores']['semantic']}")
        print(f"   - Skills Match: {r['scores']['skills']}")
        print(f"   - Experience Match: {r['scores']['experience']}")
        print(f"   - Education Match: {r['scores']['education']}")
        
        # Print matching skills
        print("\n   Required Skills:")
        for category, skills in r['matches']['required_skills'].items():
            if skills:
                print(f"   - {category.title()}: {', '.join(skills)}")
        
        print("\n   Nice-to-Have Skills:")
        for category, skills in r['matches']['nice_to_have_skills'].items():
            if skills:
                print(f"   - {category.title()}: {', '.join(skills)}")
        
        # Print experience and education
        print(f"\n   Years of Experience: {r['matches']['years_experience']}")
        if r['matches']['education']:
            print(f"   Education: {', '.join(r['matches']['education'])}")
        
        # Print relevant experience snippet
        if r['sections']['experience']:
            print(f"\n   Relevant Experience: {r['sections']['experience'][:200]}...")
        
        print("-" * 80)

if __name__ == "__main__":
    main() 