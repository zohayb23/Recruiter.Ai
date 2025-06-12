from typing import List, Dict, Any
import os
import docx
import pdfplumber

def search_by_skills(required_skills: List[str], top_k: int = 10) -> List[Dict[str, Any]]:
    """Search through resumes based on required skills."""
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
                    
                    # Extract skills from content
                    found_skills = extract_skills(content)
                    matching_skills = [skill for skill in found_skills if skill.lower() in [s.lower() for s in required_skills]]
                    missing_skills = [skill for skill in required_skills if skill.lower() not in [s.lower() for s in found_skills]]
                    
                    # Calculate match score based on skill coverage
                    score = len(matching_skills) / len(required_skills) if required_skills else 0
                    
                    if score > 0:
                        # Extract experience sections
                        experience = extract_experience(content)
                        
                        # Find the most relevant summary
                        paragraphs = content.split('\n\n')
                        summary = next(
                            (p for p in paragraphs if len(p.split()) > 20 and 
                             ('summary' in p.lower() or 'profile' in p.lower() or 'objective' in p.lower())),
                            paragraphs[0] if paragraphs else ''
                        )
                        
                        results.append({
                            "filename": filename,
                            "source": "docx",
                            "content": content,
                            "score": score,
                            "summary": summary,
                            "matching_skills": matching_skills,
                            "missing_skills": missing_skills,
                            "matching_experience": experience
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
                        
                        # Extract skills from content
                        found_skills = extract_skills(content)
                        matching_skills = [skill for skill in found_skills if skill.lower() in [s.lower() for s in required_skills]]
                        missing_skills = [skill for skill in required_skills if skill.lower() not in [s.lower() for s in found_skills]]
                        
                        # Calculate match score based on skill coverage
                        score = len(matching_skills) / len(required_skills) if required_skills else 0
                        
                        if score > 0:
                            # Extract experience sections
                            experience = extract_experience(content)
                            
                            # Find the most relevant summary
                            paragraphs = content.split('\n\n')
                            summary = next(
                                (p for p in paragraphs if len(p.split()) > 20 and 
                                 ('summary' in p.lower() or 'profile' in p.lower() or 'objective' in p.lower())),
                                paragraphs[0] if paragraphs else ''
                            )
                            
                            results.append({
                                "filename": filename,
                                "source": "pdf",
                                "content": content,
                                "score": score,
                                "summary": summary,
                                "matching_skills": matching_skills,
                                "missing_skills": missing_skills,
                                "matching_experience": experience
                            })
                except Exception as e:
                    print(f"Error reading {filename}: {str(e)}")
    
    # Sort by score and return top_k results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k] 