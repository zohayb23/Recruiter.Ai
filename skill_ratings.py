from sentence_transformers import SentenceTransformer, util
from pymilvus import Collection, connections
import spacy
import re
from collections import defaultdict
import numpy as np

# Load spaCy model for NLP tasks
try:
    nlp = spacy.load("en_core_web_sm")
except:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

class SkillRatingSystem:
    def __init__(self, milvus_host='localhost', milvus_port='19530'):
        # Connect to Milvus
        connections.connect(alias="default", host=milvus_host, port=milvus_port)
        self.collection = Collection("resume_embeddings")
        self.collection.load()
        
        # Initialize the sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Common technical skills and their variations
        self.skill_variations = {
            'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'typescript', 'ts'],
            'react': ['react', 'react.js', 'reactjs', 'react native'],
            'node': ['node.js', 'nodejs', 'express.js', 'expressjs'],
            'database': ['sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'nosql', 'graphql'],
            'cloud': ['aws', 'azure', 'gcp', 'cloud', 'ec2', 's3', 'lambda'],
            'devops': ['docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'terraform', 'microservices'],
            'testing': ['jest', 'mocha', 'cypress', 'selenium', 'unit testing', 'e2e testing'],
            'architecture': ['system design', 'microservices', 'api design', 'rest', 'graphql', 'design patterns'],
            'version_control': ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
            'agile': ['scrum', 'kanban', 'agile', 'jira', 'sprint planning']
        }

    def extract_skills(self, text):
        """Extract skills from text using NLP and pattern matching."""
        doc = nlp(text.lower())
        
        # Extract noun phrases as potential skills
        skills = set()
        for chunk in doc.noun_chunks:
            skills.add(chunk.text)
        
        # Add individual tokens that might be skills
        for token in doc:
            if token.pos_ in ['NOUN', 'PROPN']:
                skills.add(token.text)
        
        # Match against known skill variations
        normalized_skills = defaultdict(float)
        for skill in skills:
            for category, variations in self.skill_variations.items():
                if any(var in skill for var in variations):
                    normalized_skills[category] += 1
        
        return dict(normalized_skills)

    def calculate_skill_match(self, resume_text, required_skills):
        """Calculate how well a resume matches required skills."""
        resume_skills = self.extract_skills(resume_text)
        skill_scores = {}
        
        for skill in required_skills:
            if skill in resume_skills:
                # Direct match
                skill_scores[skill] = 1.0
            else:
                # Use semantic similarity for partial matches
                skill_embedding = self.model.encode(skill, convert_to_tensor=True)
                resume_embedding = self.model.encode(resume_text, convert_to_tensor=True)
                similarity = util.pytorch_cos_sim(skill_embedding, resume_embedding)
                skill_scores[skill] = float(similarity[0][0])
        
        return skill_scores

    def rate_resumes(self, job_description=None, required_skills=None, top_k=5):
        """Rate resumes based on job description or required skills."""
        if job_description:
            required_skills = self.extract_skills(job_description)
        elif not required_skills:
            raise ValueError("Either job_description or required_skills must be provided")
        
        if isinstance(required_skills, str):
            required_skills = [skill.strip() for skill in required_skills.split(',')]
        
        # Create embedding for the job requirements
        job_embedding = self.model.encode([' '.join(required_skills)])
        
        # Search in Milvus
        results = self.collection.search(
            data=job_embedding,
            anns_field="embedding",
            param={"metric_type": "L2", "params": {"nprobe": 10}},
            limit=top_k,
            output_fields=["filename", "source"]
        )
        
        # Process and rate results
        rated_results = []
        for hits in results:
            for hit in hits:
                filename = hit.entity.get('filename', '')
                source = hit.entity.get('source', '')
                
                # Get resume text (you'll need to implement this based on your storage)
                resume_text = self.get_resume_text(filename, source)
                if not resume_text:
                    continue
                
                # Calculate detailed skill matches
                skill_scores = self.calculate_skill_match(resume_text, required_skills)
                
                # Calculate overall score
                overall_score = sum(skill_scores.values()) / len(skill_scores)
                
                rated_results.append({
                    'filename': filename,
                    'source': source,
                    'overall_score': round(overall_score * 100, 2),  # Convert to percentage
                    'skill_scores': {skill: round(score * 100, 2) for skill, score in skill_scores.items()},
                    'match_score': hit.distance
                })
        
        # Sort by overall score
        rated_results.sort(key=lambda x: x['overall_score'], reverse=True)
        return rated_results

    def get_resume_text(self, filename, source):
        """Get resume text from file."""
        try:
            if source == 'docx':
                from docx import Document
                doc = Document(f"docx_resumes/{filename}")
                return ' '.join([para.text for para in doc.paragraphs])
            elif source == 'pdf':
                import pdfplumber
                with pdfplumber.open(f"pdf_resumes/{filename}") as pdf:
                    return ' '.join([page.extract_text() or '' for page in pdf.pages])
            elif source == 'csv':
                import pandas as pd
                df = pd.read_csv(f"csv_resumes/{filename.split('_')[0]}")
                idx = int(filename.split('_')[-1])
                return df.iloc[idx]['Resume'] if 'Resume' in df.columns else ''
        except Exception as e:
            print(f"Error reading {filename} from {source}: {e}")
            return ''

def main():
    # Example usage
    rater = SkillRatingSystem()
    
    # Example 1: Rate resumes based on job description
    job_description = """
    We are looking for a Senior Cloud DevOps Engineer with:
    - Strong experience in AWS, Azure, or GCP
    - Expertise in Docker and Kubernetes
    - Python or Java programming skills
    - CI/CD pipeline experience
    - Infrastructure as Code (Terraform)
    """
    
    print("\nRating resumes based on job description:")
    results = rater.rate_resumes(job_description=job_description)
    
    print("\nTop matches:")
    for idx, result in enumerate(results, 1):
        print(f"\nMatch #{idx}:")
        print(f"File: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Overall Score: {result['overall_score']}%")
        print("Skill Scores:")
        for skill, score in result['skill_scores'].items():
            print(f"  - {skill}: {score}%")
        print("-" * 60)
    
    # Example 2: Rate resumes based on specific skills
    required_skills = ['python', 'cloud', 'devops', 'database']
    print("\nRating resumes based on specific skills:", required_skills)
    results = rater.rate_resumes(required_skills=required_skills)
    
    print("\nTop matches:")
    for idx, result in enumerate(results, 1):
        print(f"\nMatch #{idx}:")
        print(f"File: {result['filename']}")
        print(f"Source: {result['source']}")
        print(f"Overall Score: {result['overall_score']}%")
        print("Skill Scores:")
        for skill, score in result['skill_scores'].items():
            print(f"  - {skill}: {score}%")
        print("-" * 60)

if __name__ == "__main__":
    main() 