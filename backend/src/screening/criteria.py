from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

class EducationLevel(Enum):
    HIGH_SCHOOL = "High School"
    ASSOCIATE = "Associate's"
    BACHELOR = "Bachelor's"
    MASTER = "Master's"
    PHD = "PhD"
    
    @classmethod
    def get_level_value(cls, level: 'EducationLevel') -> int:
        """Returns numeric value for education level comparison"""
        levels = {
            cls.HIGH_SCHOOL: 1,
            cls.ASSOCIATE: 2,
            cls.BACHELOR: 3,
            cls.MASTER: 4,
            cls.PHD: 5
        }
        return levels.get(level, 0)

@dataclass
class ScreeningCriteria:
    # Required criteria
    required_skills: List[str]
    min_years_experience: float
    education_level: EducationLevel
    
    # Preferred criteria
    preferred_skills: List[str] = None
    education_fields: List[str] = None
    preferred_years_experience: float = None
    
    # Additional criteria
    location_requirements: Optional[str] = None
    language_requirements: List[str] = None
    certifications: List[str] = None
    
    def __post_init__(self):
        """Validate and set defaults for criteria"""
        # Initialize empty lists for None values
        if self.preferred_skills is None:
            self.preferred_skills = []
        if self.education_fields is None:
            self.education_fields = []
        if self.language_requirements is None:
            self.language_requirements = []
        if self.certifications is None:
            self.certifications = []
            
        # Set preferred experience to minimum if not specified
        if self.preferred_years_experience is None:
            self.preferred_years_experience = self.min_years_experience
            
        # Validate numeric fields
        if self.min_years_experience < 0:
            raise ValueError("Minimum years of experience cannot be negative")
        if self.preferred_years_experience < self.min_years_experience:
            raise ValueError("Preferred years of experience cannot be less than minimum")
            
    def to_dict(self) -> Dict:
        """Convert criteria to dictionary format"""
        return {
            "required": {
                "skills": self.required_skills,
                "years_experience": self.min_years_experience,
                "education_level": self.education_level.value
            },
            "preferred": {
                "skills": self.preferred_skills,
                "years_experience": self.preferred_years_experience,
                "education_fields": self.education_fields
            },
            "additional": {
                "location": self.location_requirements,
                "languages": self.language_requirements,
                "certifications": self.certifications
            }
        }
        
    @classmethod
    def from_dict(cls, data: Dict) -> 'ScreeningCriteria':
        """Create ScreeningCriteria instance from dictionary"""
        required = data.get("required", {})
        preferred = data.get("preferred", {})
        additional = data.get("additional", {})
        
        return cls(
            required_skills=required.get("skills", []),
            min_years_experience=required.get("years_experience", 0),
            education_level=EducationLevel(required.get("education_level", "High School")),
            preferred_skills=preferred.get("skills", []),
            education_fields=preferred.get("education_fields", []),
            preferred_years_experience=preferred.get("years_experience"),
            location_requirements=additional.get("location"),
            language_requirements=additional.get("languages", []),
            certifications=additional.get("certifications", [])
        ) 