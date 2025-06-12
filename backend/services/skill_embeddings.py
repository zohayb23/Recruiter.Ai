from typing import List

class SkillEmbeddingsService:
    def __init__(self):
        # Mock skills database
        self._skills_db = {
            "python": ["python programming", "django", "flask", "fastapi"],
            "java": ["java programming", "spring", "hibernate", "maven"],
            "javascript": ["javascript", "typescript", "node.js", "react", "angular"],
            "database": ["sql", "mysql", "postgresql", "mongodb"],
            "cloud": ["aws", "azure", "gcp", "cloud computing"]
        }
    
    def get_skill_suggestions(self, skill: str) -> List[str]:
        """Get suggestions for a given skill."""
        skill = skill.lower()
        suggestions = []
        for key, values in self._skills_db.items():
            if skill in key or any(skill in v.lower() for v in values):
                suggestions.extend(values)
        return list(set(suggestions))[:5]  # Return up to 5 unique suggestions
    
    def get_similar_skills(self, skill: str, top_k: int = 5) -> List[str]:
        """Get similar skills for a given skill."""
        return self.get_skill_suggestions(skill)[:top_k] 