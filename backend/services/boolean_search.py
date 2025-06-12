import os
import re
import docx
import pdfplumber
from typing import List, Dict, Any

def load_resumes() -> List[Dict[str, Any]]:
    """Load resumes from all available sources."""
    resumes = []
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Load DOCX resumes
    docx_dir = os.path.join(parent_dir, "..", "docx_resumes")
    if os.path.exists(docx_dir):
        for filename in os.listdir(docx_dir):
            if filename.endswith(".docx"):
                try:
                    doc = docx.Document(os.path.join(docx_dir, filename))
                    content = " ".join([para.text for para in doc.paragraphs])
                    resumes.append({
                        "filename": filename,
                        "source": "docx",
                        "content": content
                    })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Load PDF resumes
    pdf_dir = os.path.join(parent_dir, "..", "pdf_resumes")
    if os.path.exists(pdf_dir):
        for filename in os.listdir(pdf_dir):
            if filename.endswith(".pdf"):
                try:
                    with pdfplumber.open(os.path.join(pdf_dir, filename)) as pdf:
                        content = " ".join([page.extract_text() or "" for page in pdf.pages])
                        resumes.append({
                            "filename": filename,
                            "source": "pdf",
                            "content": content
                        })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    return resumes

def parse_boolean_expression(terms: List[str]) -> List[Dict[str, Any]]:
    """Parse boolean expression into structured format."""
    operators = {"AND", "OR", "NOT"}
    current_group = {"operator": "AND", "terms": []}
    groups = [current_group]
    
    i = 0
    while i < len(terms):
        term = terms[i]
        
        if term == "(":
            # Start new group
            new_group = {"operator": "AND", "terms": [], "parentheses": True}
            groups.append(new_group)
            current_group = new_group
        elif term == ")":
            # Close current group
            if len(groups) > 1:
                groups.pop()
                current_group = groups[-1]
        elif term in operators:
            if term == "NOT":
                # Handle NOT operator
                if i + 1 < len(terms):
                    current_group["terms"].append({"value": terms[i + 1], "operator": "NOT"})
                    i += 1
            else:
                # Set operator for next term
                current_group["operator"] = term
        else:
            # Add term to current group
            current_group["terms"].append({"value": term, "operator": "AND"})
        i += 1
    
    return groups

def evaluate_boolean_expression(content: str, groups: List[Dict[str, Any]]) -> float:
    """Evaluate boolean expression against content."""
    content_lower = content.lower()
    
    def evaluate_group(group: Dict[str, Any]) -> bool:
        terms = group["terms"]
        operator = group["operator"]
        
        if not terms:
            return False
        
        results = []
        for term in terms:
            if isinstance(term, dict) and "terms" in term:
                # Evaluate nested group
                result = evaluate_group(term)
            else:
                # Evaluate single term
                value = term["value"].lower()
                if term["operator"] == "NOT":
                    result = value not in content_lower
                else:
                    result = value in content_lower
            results.append(result)
        
        # Combine results based on operator
        if operator == "AND":
            return all(results)
        elif operator == "OR":
            return any(results)
        return False
    
    # Evaluate all groups
    score = 0
    for group in groups:
        if evaluate_group(group):
            score += 1
    
    return score / len(groups) if groups else 0

def boolean_search(terms: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
    """Perform boolean search on resumes."""
    resumes = load_resumes()
    results = []
    
    # Parse boolean expression
    groups = parse_boolean_expression(terms)
    
    # Evaluate each resume
    for resume in resumes:
        score = evaluate_boolean_expression(resume["content"], groups)
        if score > 0:
            results.append({
                "filename": resume["filename"],
                "source": resume["source"],
                "content": resume["content"],
                "score": score,
                "match_details": {
                    "matched_terms": [term["value"] for group in groups for term in group["terms"] if isinstance(term, dict) and "value" in term],
                    "operator_groups": [group["operator"] for group in groups]
                }
            })
    
    # Sort by score and return top results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k] 