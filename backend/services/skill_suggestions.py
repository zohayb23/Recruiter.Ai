from typing import List, Dict, Set
from sentence_transformers import SentenceTransformer
import numpy as np

# Initial static skill map
SKILL_SYNONYMS = {
    "javascript": {"js", "ecmascript", "node.js", "nodejs"},
    "python": {"py", "python3", "python2"},
    "react": {"reactjs", "react.js", "react native"},
    "machine learning": {"ml", "deep learning", "ai", "artificial intelligence"},
    "aws": {"amazon web services", "amazon aws", "cloud"},
    "devops": {"devsecops", "development operations", "ci/cd"},
    "typescript": {"ts", "typed javascript"},
    "sql": {"mysql", "postgresql", "oracle", "database"},
    "frontend": {"front-end", "front end", "ui development"},
    "backend": {"back-end", "back end", "server-side"},
}

class SkillSuggestionEngine:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.skill_embeddings = {}
        self.initialize_embeddings()

    def initialize_embeddings(self):
        """Initialize embeddings for all skills and their synonyms"""
        all_skills = set()
        for main_skill, synonyms in SKILL_SYNONYMS.items():
            all_skills.add(main_skill)
            all_skills.update(synonyms)
        
        # Generate embeddings for all skills
        skills_list = list(all_skills)
        embeddings = self.model.encode(skills_list)
        self.skill_embeddings = dict(zip(skills_list, embeddings))

    def get_related_skills(self, skill: str, threshold: float = 0.7) -> List[str]:
        """Get related skills based on embedding similarity"""
        if skill.lower() in SKILL_SYNONYMS:
            return list(SKILL_SYNONYMS[skill.lower()])

        # Get embedding for input skill
        skill_embedding = self.model.encode([skill])[0]
        
        related_skills = []
        for other_skill, other_embedding in self.skill_embeddings.items():
            similarity = np.dot(skill_embedding, other_embedding)
            if similarity > threshold and other_skill.lower() != skill.lower():
                related_skills.append(other_skill)
        
        return sorted(related_skills, key=lambda x: np.dot(skill_embedding, self.skill_embeddings[x]), reverse=True)

    def get_skill_suggestions(self, partial_input: str, max_suggestions: int = 5) -> List[Dict[str, str]]:
        """Get skill suggestions based on partial input"""
        partial_input = partial_input.lower()
        suggestions = []

        # Direct matches from skill map
        for skill in SKILL_SYNONYMS:
            if skill.startswith(partial_input):
                suggestions.append({
                    "skill": skill,
                    "type": "primary",
                    "related": list(SKILL_SYNONYMS[skill])[:2]  # Show top 2 related skills
                })

        # Synonym matches
        for skill, synonyms in SKILL_SYNONYMS.items():
            for synonym in synonyms:
                if synonym.startswith(partial_input) and skill not in [s["skill"] for s in suggestions]:
                    suggestions.append({
                        "skill": synonym,
                        "type": "synonym",
                        "primary_skill": skill
                    })

        # Sort and limit suggestions
        suggestions = sorted(suggestions, key=lambda x: len(x["skill"]))[:max_suggestions]
        return suggestions

    def did_you_mean(self, skill: str) -> List[str]:
        """Get 'Did you mean...' suggestions for potentially misspelled skills"""
        from difflib import get_close_matches
        all_skills = list(SKILL_SYNONYMS.keys()) + [syn for syns in SKILL_SYNONYMS.values() for syn in syns]
        return get_close_matches(skill.lower(), all_skills, n=3, cutoff=0.6) 