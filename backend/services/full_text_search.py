from typing import List, Dict, Any
import os
import docx
import pdfplumber
import pandas as pd
import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import PyPDF2
from .boolean_search import parse_boolean_expression, evaluate_boolean_expression

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using a predefined list of common skills."""
    common_skills = [
        'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js',
        'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'AWS', 'Azure', 'GCP',
        'Docker', 'Kubernetes', 'CI/CD', 'Git', 'SQL', 'MongoDB', 'PostgreSQL',
        'Redis', 'GraphQL', 'REST', 'Microservices', 'Machine Learning', 'AI',
        'Data Science', 'TensorFlow', 'PyTorch', 'NLP', 'Agile', 'Scrum',
        'HTML', 'CSS', 'Bootstrap', 'Sass', 'jQuery', 'Redux', 'Next.js',
        'PHP', 'Laravel', 'Ruby', 'Rails', 'C++', 'C#', '.NET', 'Unity',
        'Swift', 'Kotlin', 'Android', 'iOS', 'Mobile Development',
        'DevOps', 'Jenkins', 'Terraform', 'Ansible', 'Linux', 'Unix',
        'Blockchain', 'Ethereum', 'Solidity', 'Smart Contracts',
        'Data Analysis', 'Pandas', 'NumPy', 'Scikit-learn', 'R',
        'UI/UX', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator'
    ]
    
    found_skills = []
    text_lower = text.lower()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
    return found_skills

def extract_experience(text: str) -> List[str]:
    """Extract relevant experience points from the text."""
    lines = text.split('\n')
    experience = []
    in_experience_section = False
    current_point = []
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_point:
                experience.append(' '.join(current_point))
                current_point = []
            continue
            
        line_lower = line.lower()
        if 'experience' in line_lower or 'work history' in line_lower:
            in_experience_section = True
            continue
            
        if in_experience_section:
            if any(section in line_lower for section in ['education', 'skills', 'projects', 'achievements']):
                break
                
            # Check if line starts with a bullet point or date
            if (line.startswith('•') or 
                line.startswith('-') or 
                re.match(r'^\d{4}', line) or
                re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', line)):
                if current_point:
                    experience.append(' '.join(current_point))
                    current_point = []
                current_point.append(line)
            else:
                current_point.append(line)
    
    # Add the last point if any
    if current_point:
        experience.append(' '.join(current_point))
    
    # Clean up and filter experience points
    cleaned_experience = []
    for exp in experience:
        # Remove bullet points and clean up whitespace
        exp = re.sub(r'^[•\-]\s*', '', exp).strip()
        # Only keep substantial points
        if len(exp.split()) >= 5:
            cleaned_experience.append(exp)
            
    return cleaned_experience[:5]  # Return top 5 most relevant experiences

def calculate_match_score(content: str, query: str) -> float:
    """Calculate match score between content and query using TF-IDF and cosine similarity."""
    try:
        # Create TF-IDF vectorizer
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=10000
        )
        
        # Fit and transform the documents
        tfidf_matrix = vectorizer.fit_transform([content, query])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        
        return float(similarity[0][0])
    except Exception as e:
        print(f"Error calculating match score: {str(e)}")
        return 0.0

def search_resumes(query: str, use_boolean: bool = False, terms: List[str] = None, top_k: int = 10) -> List[Dict[str, Any]]:
    """Search through resumes using full text search with boolean logic support."""
    results = []
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if use_boolean and terms:
        # Process boolean search
        boolean_groups = parse_boolean_expression(terms)
    
    # Load and search through resumes
    for source_dir, file_ext in [
        (os.path.join(parent_dir, "..", "docx_resumes"), ".docx"),
        (os.path.join(parent_dir, "..", "pdf_resumes"), ".pdf")
    ]:
        if not os.path.exists(source_dir):
            continue
            
        for filename in os.listdir(source_dir):
            if not filename.endswith(file_ext):
                continue
                
            try:
                # Read file content
                content = ""
                file_path = os.path.join(source_dir, filename)
                
                if file_ext == ".docx":
                    doc = docx.Document(file_path)
                    content = " ".join([para.text for para in doc.paragraphs])
                elif file_ext == ".pdf":
                    with open(file_path, 'rb') as file:
                        pdf_reader = PyPDF2.PdfReader(file)
                        content = " ".join([page.extract_text() for page in pdf_reader.pages])
                
                if not content.strip():
                    continue
                
                # Calculate score based on search type
                score = 0.0
                if use_boolean and terms:
                    # Use boolean evaluation
                    score = evaluate_boolean_expression(content, boolean_groups)
                else:
                    # Use regular full-text matching
                    score = calculate_match_score(content, query)
                
                if score > 0:
                    # Extract contact information
                    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', content)
                    location_match = re.search(r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s*\d{5})?)', content)
                    
                    # Extract summary
                    paragraphs = content.split('\n\n')
                    summary = next(
                        (p for p in paragraphs if len(p.split()) > 20 and 
                         ('summary' in p.lower() or 'profile' in p.lower() or 'objective' in p.lower())),
                        paragraphs[0] if paragraphs else ''
                    )
                    
                    # Extract skills
                    skills = extract_skills(content)
                    query_skills = query.lower().split()
                    matching_skills = [skill for skill in skills if any(q in skill.lower() for q in query_skills)]
                    missing_skills = [skill for skill in skills if skill not in matching_skills]
                    
                    # Extract experience
                    experience_sections = []
                    current_section = None
                    for line in content.split('\n'):
                        line = line.strip()
                        if not line:
                            continue
                            
                        # Look for company/role headers
                        if re.match(r'^[A-Z][^a-z]{0,20}$', line) or re.search(r'\d{4}\s*[-–]\s*(?:\d{4}|present)', line, re.IGNORECASE):
                            if current_section:
                                experience_sections.append(current_section)
                            current_section = {
                                'company': line,
                                'duration': re.search(r'(\d{4}\s*[-–]\s*(?:\d{4}|present))', line, re.IGNORECASE).group(1) if re.search(r'\d{4}\s*[-–]\s*(?:\d{4}|present)', line, re.IGNORECASE) else None,
                                'description': '',
                                'highlights': []
                            }
                        elif current_section:
                            if line.startswith('•') or line.startswith('-'):
                                current_section['highlights'].append(line.lstrip('•- '))
                            else:
                                current_section['description'] += line + ' '
                    
                    if current_section:
                        experience_sections.append(current_section)
                    
                    # Calculate component scores
                    skills_score = len(matching_skills) / (len(query_skills) if query_skills else 1)
                    experience_score = sum(1 for exp in experience_sections if any(q in exp['description'].lower() for q in query_skills)) / len(experience_sections) if experience_sections else 0
                    
                    results.append({
                        "filename": filename,
                        "source": "docx" if file_ext == ".docx" else "pdf",
                        "content": content[:1000],  # First 1000 chars as preview
                        "score": score,
                        "email": email_match.group(0) if email_match else None,
                        "location": location_match.group(1) if location_match else None,
                        "summary": summary,
                        "matching_skills": matching_skills,
                        "missing_skills": missing_skills,
                        "matching_experience": experience_sections[:5],  # Top 5 experiences
                        "match_details": {
                            "skills_score": skills_score,
                            "experience_score": experience_score,
                            "relevance": score
                        }
                    })
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
                continue
    
    # Sort results by score and return top_k
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"results": results[:top_k], "total": len(results)} 