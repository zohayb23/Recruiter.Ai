from typing import List, Dict, Any
import os
import docx
import pdfplumber
from fuzzywuzzy import fuzz

def calculate_skill_score(found_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
    """Calculate detailed skill scores with fuzzy matching and variations."""
    skill_variations = {
        'javascript': ['js', 'es6', 'ecmascript'],
        'python': ['py', 'python3'],
        'react': ['reactjs', 'react.js'],
        'node': ['nodejs', 'node.js'],
        'typescript': ['ts'],
        'java': ['java8', 'java11', 'jvm'],
        'aws': ['amazon web services', 'aws cloud'],
        'docker': ['containerization', 'docker container'],
        'kubernetes': ['k8s', 'kube'],
    }
    
    matching_skills = []
    skill_scores = {}
    
    for required in required_skills:
        req_lower = required.lower()
        # Check for direct match
        direct_match = any(skill.lower() == req_lower for skill in found_skills)
        if direct_match:
            matching_skills.append(required)
            skill_scores[required] = 1.0
            continue
            
        # Check for variations
        for main_skill, variations in skill_variations.items():
            if req_lower == main_skill or req_lower in variations:
                if any(var in [s.lower() for s in found_skills] for var in [main_skill] + variations):
                    matching_skills.append(required)
                    skill_scores[required] = 0.9
                    break
                    
        # If no match found yet, try fuzzy matching
        if required not in skill_scores:
            best_ratio = 0
            for skill in found_skills:
                ratio = fuzz.ratio(req_lower, skill.lower())
                if ratio > 80:  # 80% similarity threshold
                    best_ratio = max(best_ratio, ratio)
            if best_ratio > 0:
                matching_skills.append(required)
                skill_scores[required] = best_ratio / 100

    # Calculate overall score
    total_score = sum(skill_scores.values()) / len(required_skills) if required_skills else 0
    
    return {
        "matching_skills": matching_skills,
        "skill_scores": skill_scores,
        "total_score": total_score
    }

def search_by_skills(required_skills: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
    """Search resumes by required skills with improved matching."""
    results = []
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Load and search DOCX resumes
    docx_dir = os.path.join(parent_dir, "..", "docx_resumes")
    if os.path.exists(docx_dir):
        for filename in os.listdir(docx_dir):
            if filename.endswith(".docx"):
                try:
                    doc = docx.Document(os.path.join(docx_dir, filename))
                    content = " ".join([para.text for para in doc.paragraphs])
                    found_skills = extract_skills(content)
                    
                    # Calculate detailed skill scores
                    skill_match = calculate_skill_score(found_skills, required_skills)
                    
                    if skill_match["total_score"] > 0:
                        results.append({
                            "filename": filename,
                            "source": "docx",
                            "content": content,
                            "score": skill_match["total_score"],
                            "match_details": {
                                "skills_score": skill_match["total_score"],
                                "matching_skills": skill_match["matching_skills"],
                                "skill_scores": skill_match["skill_scores"]
                            }
                        })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Load and search PDF resumes
    pdf_dir = os.path.join(parent_dir, "..", "pdf_resumes")
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            if filename.endswith(".pdf"):
                try:
                    with pdfplumber.open(os.path.join(pdf_dir, filename)) as pdf:
                        content = " ".join([page.extract_text() or "" for page in pdf.pages])
                        found_skills = extract_skills(content)
                        
                        # Calculate detailed skill scores
                        skill_match = calculate_skill_score(found_skills, required_skills)
                        
                        if skill_match["total_score"] > 0:
                            results.append({
                                "filename": filename,
                                "source": "pdf",
                                "content": content,
                                "score": skill_match["total_score"],
                                "match_details": {
                                    "skills_score": skill_match["total_score"],
                                    "matching_skills": skill_match["matching_skills"],
                                    "skill_scores": skill_match["skill_scores"]
                                }
                            })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Sort by score and return top results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k] 