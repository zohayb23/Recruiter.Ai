import numpy as np
from sentence_transformers import SentenceTransformer
from pymilvus import Collection, connections
import re
from collections import defaultdict

# Configuration
COLLECTION_NAME = "resume_embeddings"
MILVUS_HOST = "localhost"
MILVUS_PORT = "19530"
MODEL_NAME = "all-MiniLM-L6-v2"

# Major keyword sets with weights
TECH_KEYWORDS = {
    'rust': 1.5, 'backend': 1.2, 'api': 1.0, 'system design': 1.5, 'distributed systems': 1.5,
    'performance': 1.2, 'scalability': 1.2, 'security': 1.0, 'testing': 0.8, 'documentation': 0.5,
    'fintech': 1.2, 'trading': 1.2, 'low-latency': 1.5, 'real-time': 1.2, 'infrastructure': 1.2
}

EXP_KEYWORDS = {
    'years': 1.0, 'experience': 1.0, 'lead': 1.2, 'manager': 1.2, 'senior': 1.2,
    'architect': 1.5, 'developer': 1.0, 'engineer': 1.0, 'director': 1.2
}

EDU_KEYWORDS = {
    'bachelor': 0.8, 'master': 1.0, 'phd': 1.2, 'computer science': 1.0,
    'engineering': 1.0, 'university': 0.5, 'degree': 0.5
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

def extract_sections(text):
    """Extract different sections from resume text."""
    sections = {
        'experience': '',
        'education': '',
        'skills': '',
        'summary': ''
    }
    
    # Simple section detection
    text_lower = text.lower()
    if 'experience' in text_lower:
        exp_idx = text_lower.find('experience')
        sections['experience'] = text[exp_idx:].split('\n\n')[0]
    if 'education' in text_lower:
        edu_idx = text_lower.find('education')
        sections['education'] = text[edu_idx:].split('\n\n')[0]
    if 'skills' in text_lower:
        skills_idx = text_lower.find('skills')
        sections['skills'] = text[skills_idx:].split('\n\n')[0]
    if 'summary' in text_lower:
        summary_idx = text_lower.find('summary')
        sections['summary'] = text[summary_idx:].split('\n\n')[0]
    
    return sections

def compute_match_scores(job_description, resumes):
    """Compute and normalize match scores for each resume with detailed breakdown."""
    job_emb = embed_text(job_description)
    scores = []
    
    for resume in resumes:
        resume_emb = np.array(resume["embedding"])
        # Semantic similarity score (0-100)
        sim = np.dot(job_emb, resume_emb) / (np.linalg.norm(job_emb) * np.linalg.norm(resume_emb))
        semantic_score = int((sim + 1) * 50)
        
        # Extract sections
        sections = extract_sections(resume.get("text", ""))
        
        # Keyword matching scores
        tech_matches = extract_keywords(sections['skills'] + sections['experience'], TECH_KEYWORDS)
        exp_matches = extract_keywords(sections['experience'], EXP_KEYWORDS)
        edu_matches = extract_keywords(sections['education'], EDU_KEYWORDS)
        
        # Calculate weighted scores
        tech_score = sum(TECH_KEYWORDS.get(k, 1.0) for k in tech_matches)
        exp_score = sum(EXP_KEYWORDS.get(k, 1.0) for k in exp_matches)
        edu_score = sum(EDU_KEYWORDS.get(k, 1.0) for k in edu_matches)
        
        # Normalize scores
        max_possible_tech = sum(TECH_KEYWORDS.values())
        max_possible_exp = sum(EXP_KEYWORDS.values())
        max_possible_edu = sum(EDU_KEYWORDS.values())
        
        tech_score = (tech_score / max_possible_tech) * 100 if max_possible_tech > 0 else 0
        exp_score = (exp_score / max_possible_exp) * 100 if max_possible_exp > 0 else 0
        edu_score = (edu_score / max_possible_edu) * 100 if max_possible_edu > 0 else 0
        
        # Calculate overall score (weighted average)
        overall_score = int(0.4 * semantic_score + 0.4 * tech_score + 0.15 * exp_score + 0.05 * edu_score)
        
        scores.append({
            "filename": resume["filename"],
            "source": resume["source"],
            "score": overall_score,
            "text": resume.get("text", ""),
            "name": resume.get("name", ""),
            "scores": {
                "semantic": semantic_score,
                "technical": int(tech_score),
                "experience": int(exp_score),
                "education": int(edu_score)
            },
            "matches": {
                "technical": tech_matches,
                "experience": exp_matches,
                "education": edu_matches
            },
            "sections": sections
        })
    
    # Sort by overall score descending
    scores.sort(key=lambda x: x["score"], reverse=True)
    return scores

def extract_keywords(text, keyword_dict):
    """Extract matching keywords from text with weights."""
    text = text.lower()
    matches = []
    for keyword in keyword_dict:
        if keyword.lower() in text:
            matches.append(keyword)
    return matches

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
    
    # Remove duplicates (keep highest score)
    seen_filenames = set()
    unique_scores = []
    for r in scores:
        if r['source'] == 'csv':
            identifier = r.get('name', r['filename'])
        else:
            identifier = r['filename']
            
        if identifier not in seen_filenames:
            seen_filenames.add(identifier)
            unique_scores.append(r)
    
    # Print top 10 matches
    print("\nTop 10 Matches:")
    for i, r in enumerate(unique_scores[:10], 1):
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
        print(f"   - Technical Skills: {r['scores']['technical']}")
        print(f"   - Experience: {r['scores']['experience']}")
        print(f"   - Education: {r['scores']['education']}")
        
        # Print matching keywords
        print("\n   Matching Keywords:")
        if r['matches']['technical']:
            print(f"   - Technical: {', '.join(r['matches']['technical'])}")
        if r['matches']['experience']:
            print(f"   - Experience: {', '.join(r['matches']['experience'])}")
        if r['matches']['education']:
            print(f"   - Education: {', '.join(r['matches']['education'])}")
        
        # Print relevant experience snippet
        if r['sections']['experience']:
            print(f"\n   Relevant Experience: {r['sections']['experience'][:200]}...")
        
        print("-" * 80)

if __name__ == "__main__":
    main() 