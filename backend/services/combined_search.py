from typing import List, Dict, Any
from .skills_search import calculate_skill_score
from .experience_search import search_by_experience
from .dense_search import calculate_semantic_score
import os
import docx
import pdfplumber

def process_search_result(content: str, query: str, required_skills: List[str]) -> Dict[str, Any]:
    """Process a single search result with comprehensive scoring."""
    try:
        # Extract skills from content
        found_skills = extract_skills(content)
        
        # Calculate skill scores
        skill_match = calculate_skill_score(found_skills, required_skills)
        
        # Calculate experience scores
        experience_match = search_by_experience(content, required_skills)
        
        # Calculate semantic relevance
        semantic_score, semantic_details = calculate_semantic_score(content, query)
        
        # Calculate combined score with weights
        weights = {
            'skills': 0.4,
            'experience': 0.4,
            'relevance': 0.2
        }
        
        combined_score = (
            skill_match["total_score"] * weights['skills'] +
            experience_match["experience_score"] * weights['experience'] +
            semantic_score * weights['relevance']
        )
        
        return {
            "score": combined_score,
            "match_details": {
                "skills_score": skill_match["total_score"],
                "experience_score": experience_match["experience_score"],
                "relevance_score": semantic_score,
                "matching_skills": skill_match["matching_skills"],
                "skill_scores": skill_match["skill_scores"],
                "relevant_experience": experience_match["relevant_experience"],
                "total_years": experience_match["total_years"],
                "semantic_details": semantic_details
            }
        }
    except Exception as e:
        print(f"Error processing search result: {str(e)}")
        return {
            "score": 0,
            "match_details": {
                "skills_score": 0,
                "experience_score": 0,
                "relevance_score": 0,
                "matching_skills": [],
                "skill_scores": {},
                "relevant_experience": [],
                "total_years": 0,
                "semantic_details": {}
            }
        }

def combined_search(query: str, required_skills: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
    """Perform combined search with comprehensive scoring."""
    results = []
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Process DOCX resumes
    docx_dir = os.path.join(parent_dir, "..", "docx_resumes")
    if os.path.exists(docx_dir):
        for filename in os.listdir(docx_dir):
            if filename.endswith(".docx"):
                try:
                    doc = docx.Document(os.path.join(docx_dir, filename))
                    content = " ".join([para.text for para in doc.paragraphs])
                    
                    # Process content
                    result = process_search_result(content, query, required_skills)
                    
                    if result["score"] > 0:
                        results.append({
                            "filename": filename,
                            "source": "docx",
                            "content": content,
                            **result
                        })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Process PDF resumes
    pdf_dir = os.path.join(parent_dir, "..", "pdf_resumes")
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            if filename.endswith(".pdf"):
                try:
                    with pdfplumber.open(os.path.join(pdf_dir, filename)) as pdf:
                        content = " ".join([page.extract_text() or "" for page in pdf.pages])
                        
                        # Process content
                        result = process_search_result(content, query, required_skills)
                        
                        if result["score"] > 0:
                            results.append({
                                "filename": filename,
                                "source": "pdf",
                                "content": content,
                                **result
                            })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Sort by score and return top results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k] 