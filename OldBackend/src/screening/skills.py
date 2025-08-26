from typing import List, Dict, Set
import json
import os
from pathlib import Path
import re
from collections import defaultdict

class SkillMatcher:
    def __init__(self, skill_synonyms_path: str = None):
        """
        Initialize SkillMatcher with optional path to skill synonyms JSON file
        Format of skill_synonyms.json:
        {
            "python": ["python3", "python2", "py"],
            "javascript": ["js", "ecmascript", "node.js", "nodejs"],
            ...
        }
        """
        self.skill_synonyms = self._load_skill_synonyms(skill_synonyms_path)
        self.patterns = self._compile_skill_patterns()  # Changed from skill_patterns to patterns
        
    def _load_skill_synonyms(self, file_path: str = None) -> Dict[str, List[str]]:
        """Load skill synonyms from JSON file or use default minimal set"""
        if file_path and os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        
        # Default minimal set of synonyms
        return {
            "python": ["python3", "python2", "py"],
            "javascript": ["js", "ecmascript", "node.js", "nodejs"],
            "java": ["core java", "java se", "java ee"],
            "c++": ["cpp", "c plus plus"],
            "react": ["reactjs", "react.js"],
            "node.js": ["nodejs", "node"],
            "machine learning": ["ml", "machine-learning"],
            "artificial intelligence": ["ai", "artificial-intelligence"],
        }
        
    def _compile_skill_patterns(self) -> Dict[str, re.Pattern]:
        """Compile regex patterns for skills and their synonyms"""
        patterns = {}
        for skill, synonyms in self.skill_synonyms.items():
            # Create pattern that matches the skill or any of its synonyms
            pattern_str = r'\b(?:' + '|'.join([re.escape(skill)] + [re.escape(s) for s in synonyms]) + r')\b'
            patterns[skill] = re.compile(pattern_str, re.IGNORECASE)
        return patterns
        
    def match_skills(self, resume_text: str, required_skills: List[str], 
                    preferred_skills: List[str]) -> Dict:
        """
        Match skills in resume against required and preferred skills
        Returns:
        {
            'matched_required': List[str],
            'matched_preferred': List[str],
            'missing_required': List[str],
            'skills_score': float,  # 0-100
            'has_all_required': bool,
            'preferred_skills': List[str]  # Added this
        }
        """
        # Normalize resume text
        resume_text = resume_text.lower()
        
        # Match required skills
        matched_required = set()
        for skill in required_skills:
            skill_lower = skill.lower()
            # Check if skill or any of its synonyms are in the text
            if skill_lower in self.patterns:
                if self.patterns[skill_lower].search(resume_text):
                    matched_required.add(skill)
            else:
                # For skills without synonyms, do direct matching
                if re.search(r'\b' + re.escape(skill_lower) + r'\b', resume_text):
                    matched_required.add(skill)
                    
        # Match preferred skills
        matched_preferred = set()
        for skill in preferred_skills:
            skill_lower = skill.lower()
            if skill_lower in self.patterns:
                if self.patterns[skill_lower].search(resume_text):
                    matched_preferred.add(skill)
            else:
                if re.search(r'\b' + re.escape(skill_lower) + r'\b', resume_text):
                    matched_preferred.add(skill)
                    
        # Calculate scores
        required_score = len(matched_required) / len(required_skills) if required_skills else 1.0
        preferred_score = len(matched_preferred) / len(preferred_skills) if preferred_skills else 1.0
        
        # Weight required skills more heavily (70% required, 30% preferred)
        total_score = (required_score * 0.7 + preferred_score * 0.3) * 100
        
        return {
            'matched_required': list(matched_required),
            'matched_preferred': list(matched_preferred),
            'missing_required': list(set(required_skills) - matched_required),
            'skills_score': round(total_score, 2),
            'has_all_required': len(matched_required) == len(required_skills),
            'preferred_skills': preferred_skills  # Added this line
        }
        
    def extract_all_skills(self, resume_text: str) -> Set[str]:
        """Extract all recognized skills from resume text"""
        found_skills = set()
        resume_text = resume_text.lower()
        
        for skill in self.patterns:
            if self.patterns[skill].search(resume_text):
                found_skills.add(skill)
                
        return found_skills
        
    def get_skill_frequency(self, resume_text: str) -> Dict[str, int]:
        """Get frequency of each skill mention in the resume"""
        frequencies = defaultdict(int)
        resume_text = resume_text.lower()
        
        for skill in self.patterns:
            matches = self.patterns[skill].findall(resume_text)
            if matches:
                frequencies[skill] = len(matches)
                
        return dict(frequencies) 