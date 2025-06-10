from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict
import json
import os

class SkillEmbeddingsService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.skills_file = 'data/skills.json'
        self.skills_data = self._load_skills()
        self.skill_embeddings = self._compute_embeddings()

    def _load_skills(self) -> Dict[str, List[str]]:
        if not os.path.exists(self.skills_file):
            # Default skills data if file doesn't exist
            return {
                "JavaScript": ["JS", "ECMAScript", "Node.js", "Frontend Development"],
                "Python": ["Programming", "Scripting", "Backend Development", "Data Science"],
                "Java": ["Backend Development", "Enterprise Software", "Spring Framework"],
                "SQL": ["Database", "PostgreSQL", "MySQL", "Data Management"],
                "React": ["Frontend Development", "Web Development", "UI Development"],
                "Docker": ["Containerization", "DevOps", "Deployment"],
                "AWS": ["Cloud Computing", "Amazon Web Services", "Cloud Infrastructure"],
                "Machine Learning": ["AI", "Data Science", "Neural Networks", "Deep Learning"],
                "Git": ["Version Control", "Source Control", "GitHub", "GitLab"],
                "CI/CD": ["Continuous Integration", "Continuous Deployment", "DevOps"],
                "Agile": ["Scrum", "Kanban", "Project Management"],
                "REST API": ["Web Services", "API Development", "HTTP"],
                "GraphQL": ["API Development", "Query Language", "Web Services"],
                "MongoDB": ["NoSQL", "Database", "Document Store"],
                "PostgreSQL": ["SQL", "Database", "RDBMS"]
            }
        
        with open(self.skills_file, 'r') as f:
            return json.load(f)

    def _compute_embeddings(self) -> Dict[str, np.ndarray]:
        embeddings = {}
        for skill, related in self.skills_data.items():
            # Compute embedding for the skill and its related terms
            text = f"{skill} {' '.join(related)}"
            embedding = self.model.encode(text, convert_to_tensor=False)
            embeddings[skill] = embedding
        return embeddings

    def get_similar_skills(self, query: str, top_k: int = 5) -> List[Dict[str, float]]:
        # Compute query embedding
        query_embedding = self.model.encode(query, convert_to_tensor=False)
        
        # Calculate similarities
        similarities = []
        for skill, embedding in self.skill_embeddings.items():
            similarity = np.dot(query_embedding, embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(embedding)
            )
            similarities.append((skill, float(similarity)))
        
        # Sort by similarity and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [
            {"skill": skill, "similarity": similarity}
            for skill, similarity in similarities[:top_k]
        ]

    def get_skill_suggestions(self, query: str) -> List[str]:
        """Get skill suggestions based on partial input"""
        suggestions = []
        query_lower = query.lower()
        
        # Direct matches first
        for skill in self.skills_data.keys():
            if query_lower in skill.lower():
                suggestions.append(skill)
        
        # If we have few direct matches, add semantic suggestions
        if len(suggestions) < 5:
            semantic_matches = self.get_similar_skills(query)
            for match in semantic_matches:
                skill = match["skill"]
                if skill not in suggestions:
                    suggestions.append(skill)
        
        return suggestions[:10]  # Limit to 10 suggestions 