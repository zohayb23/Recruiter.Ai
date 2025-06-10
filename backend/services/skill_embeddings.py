from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Set
import json
import os
from collections import defaultdict

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

class SkillSuggestionService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.skill_embeddings = {}
        self.skill_synonyms = self._initialize_skill_synonyms()
        self.related_skills = self._initialize_related_skills()
        
    def _initialize_skill_synonyms(self) -> Dict[str, Set[str]]:
        """Initialize static skill synonyms mapping"""
        return {
            "javascript": {"js", "ecmascript", "node.js", "nodejs"},
            "python": {"py", "python3", "python2"},
            "java": {"core java", "java programming"},
            "react": {"reactjs", "react.js", "react native"},
            "angular": {"angularjs", "angular2+", "angular framework"},
            "vue": {"vuejs", "vue.js"},
            "machine learning": {"ml", "deep learning", "ai"},
            "artificial intelligence": {"ai", "machine learning", "deep learning"},
            "aws": {"amazon web services", "amazon aws", "aws cloud"},
            "devops": {"devsecops", "development operations"},
            "ci/cd": {"continuous integration", "continuous deployment", "jenkins"},
            "docker": {"containerization", "docker container"},
            "kubernetes": {"k8s", "container orchestration"},
            "sql": {"mysql", "postgresql", "database"},
            "nosql": {"mongodb", "dynamodb", "non-relational database"}
        }
    
    def _initialize_related_skills(self) -> Dict[str, Set[str]]:
        """Initialize static related skills mapping"""
        return {
            "javascript": {"typescript", "react", "node.js", "html", "css"},
            "python": {"django", "flask", "pandas", "numpy", "machine learning"},
            "java": {"spring", "hibernate", "maven", "junit", "microservices"},
            "react": {"redux", "javascript", "typescript", "html", "css"},
            "angular": {"typescript", "rxjs", "javascript", "html", "css"},
            "vue": {"javascript", "vuex", "nuxt.js", "html", "css"},
            "machine learning": {"python", "tensorflow", "pytorch", "scikit-learn", "data science"},
            "aws": {"cloud computing", "ec2", "s3", "lambda", "devops"},
            "devops": {"docker", "kubernetes", "jenkins", "aws", "terraform"},
            "docker": {"kubernetes", "devops", "containerization", "microservices"},
            "sql": {"database", "postgresql", "mysql", "oracle", "data modeling"},
            "nosql": {"mongodb", "cassandra", "redis", "database", "big data"}
        }

    def get_skill_suggestions(self, input_skill: str, threshold: float = 0.7) -> Dict[str, List[str]]:
        """Get skill suggestions including synonyms and related skills"""
        input_skill = input_skill.lower()
        
        # Direct matches in synonyms
        synonyms = set()
        for skill, syn_set in self.skill_synonyms.items():
            if input_skill in skill or input_skill in syn_set:
                synonyms.update(syn_set)
                synonyms.add(skill)
        
        # Direct matches in related skills
        related = set()
        for skill, rel_set in self.related_skills.items():
            if input_skill in skill or input_skill in rel_set:
                related.update(rel_set)
                related.add(skill)
        
        # Use embeddings for fuzzy matching if no direct matches
        if not synonyms and not related:
            input_embedding = self.model.encode([input_skill])[0]
            
            # Get embeddings for all skills if not cached
            if not self.skill_embeddings:
                all_skills = set()
                for s, syns in self.skill_synonyms.items():
                    all_skills.add(s)
                    all_skills.update(syns)
                for s, rels in self.related_skills.items():
                    all_skills.add(s)
                    all_skills.update(rels)
                
                self.skill_embeddings = {
                    skill: self.model.encode([skill])[0]
                    for skill in all_skills
                }
            
            # Find similar skills using cosine similarity
            similarities = {
                skill: np.dot(input_embedding, emb) / (np.linalg.norm(input_embedding) * np.linalg.norm(emb))
                for skill, emb in self.skill_embeddings.items()
            }
            
            for skill, similarity in similarities.items():
                if similarity > threshold:
                    if skill in self.skill_synonyms:
                        synonyms.update(self.skill_synonyms[skill])
                        synonyms.add(skill)
                    if skill in self.related_skills:
                        related.update(self.related_skills[skill])
                        related.add(skill)
        
        return {
            "synonyms": list(synonyms - {input_skill}),
            "related_skills": list(related - {input_skill} - synonyms)
        }

    def did_you_mean(self, input_skill: str, threshold: float = 0.7) -> List[str]:
        """Get 'Did you mean...' suggestions for potentially misspelled skills"""
        suggestions = self.get_skill_suggestions(input_skill, threshold)
        all_suggestions = suggestions["synonyms"] + suggestions["related_skills"]
        
        # Sort by similarity to input
        input_embedding = self.model.encode([input_skill])[0]
        suggestion_scores = [
            (suggestion, np.dot(input_embedding, self.model.encode([suggestion])[0]))
            for suggestion in all_suggestions
        ]
        
        # Return top 3 most similar suggestions
        return [s[0] for s in sorted(suggestion_scores, key=lambda x: x[1], reverse=True)[:3]] 