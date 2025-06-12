from typing import List, Dict, Any
import os
import docx
import pdfplumber
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def calculate_semantic_score(text: str, query: str) -> tuple[float, Dict[str, str]]:
    """Calculate semantic similarity score between text and query."""
    # Create TF-IDF vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    
    # Fit and transform the documents
    try:
        tfidf_matrix = vectorizer.fit_transform([text.lower(), query.lower()])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        # Get important terms from query
        query_terms = set(query.lower().split())
        text_terms = set(text.lower().split())
        common_terms = query_terms.intersection(text_terms)
        
        # Calculate coverage
        coverage = len(common_terms) / len(query_terms) if query_terms else 0
        
        # Calculate term frequency
        term_freq = sum(1 for term in query_terms if term in text.lower()) / len(query_terms)
        
        # Calculate final score
        final_score = (0.4 * similarity + 0.3 * coverage + 0.3 * term_freq)
        
        # Generate match details
        match_details = {
            "coverage": f"Found {len(common_terms)} out of {len(query_terms)} key terms",
            "frequency": f"Terms appear {term_freq:.0%} frequently in context",
            "proximity": f"Semantic similarity score: {similarity:.0%}"
        }
        
        return final_score, match_details
        
    except Exception as e:
        print(f"Error calculating semantic score: {str(e)}")
        return 0.0, {
            "coverage": "Error analyzing coverage",
            "frequency": "Error analyzing frequency",
            "proximity": "Error analyzing proximity"
        }

def semantic_search(query: str, top_k: int = 10) -> List[Dict[str, Any]]:
    """Search through resumes using semantic search."""
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
                    score, match_details = calculate_semantic_score(content, query)
                    if score > 0:
                        results.append({
                            "filename": filename,
                            "source": "docx",
                            "content": content,
                            "score": score,
                            "match_details": match_details
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
                        score, match_details = calculate_semantic_score(content, query)
                        if score > 0:
                            results.append({
                                "filename": filename,
                                "source": "pdf",
                                "content": content,
                                "score": score,
                                "match_details": match_details
                            })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Sort by score and return top_k results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k] 