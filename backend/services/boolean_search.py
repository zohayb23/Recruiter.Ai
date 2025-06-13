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
    """Parse boolean expression into structured format with proper NOT handling and parentheses support."""
    operators = {"AND", "OR", "NOT"}
    stack = []  # Stack for handling nested groups
    current_group = {"operator": "AND", "terms": [], "parentheses": False}
    groups = [current_group]
    
    i = 0
    while i < len(terms):
        term = terms[i].upper()  # Case-insensitive operator matching
        
        if term == "(":
            # Start new group and push current to stack
            new_group = {"operator": "AND", "terms": [], "parentheses": True}
            stack.append(current_group)
            groups.append(new_group)
            current_group = new_group
        elif term == ")":
            # Close current group and pop from stack
            if stack:
                current_group = stack.pop()
        elif term in operators:
            if term == "NOT":
                # Handle NOT operator
                if i + 1 < len(terms):
                    next_term = terms[i + 1]
                    if next_term == "(":
                        # NOT applies to entire group
                        i += 1  # Skip the opening parenthesis
                        new_group = {"operator": "AND", "terms": [], "parentheses": True, "negated": True}
                        stack.append(current_group)
                        groups.append(new_group)
                        current_group = new_group
                    else:
                        current_group["terms"].append({"value": next_term, "operator": "NOT"})
                        i += 1  # Skip the next term as we've processed it
            else:
                # Set operator for next term
                current_group["operator"] = term
        else:
            # Add term to current group
            current_group["terms"].append({"value": term, "operator": "AND"})
        i += 1
    
    return groups

def evaluate_boolean_expression(content: str, groups: List[Dict[str, Any]]) -> float:
    """Evaluate boolean expression against content with enhanced NOT and parentheses support."""
    content_lower = content.lower()
    
    def evaluate_group(group: Dict[str, Any]) -> bool:
        terms = group["terms"]
        operator = group["operator"]
        is_negated = group.get("negated", False)
        
        if not terms:
            return False
        
        results = []
        for term in terms:
            if isinstance(term, dict):
                if "terms" in term:
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
        final_result = all(results) if operator == "AND" else any(results)
        
        # Apply negation if group is negated
        return not final_result if is_negated else final_result
    
    # Evaluate all groups
    score = 0
    total_groups = len(groups)
    
    for group in groups:
        if evaluate_group(group):
            score += 1
    
    return score / total_groups if total_groups else 0

def boolean_search(terms: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
    """Perform boolean search on resumes with enhanced operators."""
    resumes = load_resumes()
    results = []
    
    # Parse boolean expression
    groups = parse_boolean_expression(terms)
    
    # Evaluate each resume
    for resume in resumes:
        score = evaluate_boolean_expression(resume["content"], groups)
        if score > 0:
            # Extract matched terms and their context
            matched_terms = []
            for group in groups:
                for term in group["terms"]:
                    if isinstance(term, dict) and "value" in term:
                        value = term["value"].lower()
                        if value in resume["content"].lower():
                            # Get context around the match
                            content = resume["content"].lower()
                            start = max(0, content.find(value) - 50)
                            end = min(len(content), content.find(value) + len(value) + 50)
                            context = "..." + resume["content"][start:end].strip() + "..."
                            matched_terms.append({
                                "term": term["value"],
                                "operator": term["operator"],
                                "context": context
                            })

            results.append({
                "filename": resume["filename"],
                "source": resume["source"],
                "content": resume["content"],
                "score": score,
                "match_details": {
                    "matched_terms": matched_terms,
                    "operator_groups": [group["operator"] for group in groups],
                    "query_structure": groups
                }
            })
    
    # Sort by score and return top results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k] 