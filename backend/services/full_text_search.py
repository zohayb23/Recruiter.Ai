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
import logging
from whoosh.qparser import QueryParser, OrGroup
from whoosh.scoring import BM25F
from .index_manager import get_index
from .text_summarizer import summarizer

logger = logging.getLogger(__name__)

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

def search_resumes(query: str, top_k: int = 10) -> List[Dict[str, Any]]:
    """
    Search resumes using full text search.
    """
    try:
        ix = get_index()
        if not ix:
            logger.error("Index not found")
            return []

        # Create a query parser with OrGroup for better matching
        parser = QueryParser("content", ix.schema, group=OrGroup)
        q = parser.parse(query)

        # Search with the index
        with ix.searcher(weighting=BM25F) as searcher:
            results = searcher.search(q, limit=top_k)
            
            # Process results
            processed_results = []
            for hit in results:
                # Generate a relevant summary using our summarizer
                content = hit.get("content", "")
                summary = summarizer.generate_summary(content, query)
                
                result = {
                    "filename": hit.get("filename", ""),
                    "name": hit.get("name", ""),
                    "content": content,
                    "summary": summary,
                    "experience": hit.get("experience", ""),
                    "skills": hit.get("skills", []),
                    "location": hit.get("location", ""),
                    "email": hit.get("email", ""),
                    "phone": hit.get("phone", ""),
                    "score": hit.score,  # Add the search score
                }
                processed_results.append(result)

            return processed_results

    except Exception as e:
        logger.error(f"Error in full text search: {str(e)}")
        return [] 