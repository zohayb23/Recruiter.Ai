from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class SkillCategory(str, Enum):
    TECHNICAL = "technical"
    SOFT = "soft"
    DOMAIN = "domain"
    TOOLS = "tools"
    METHODOLOGIES = "methodologies"
    CERTIFICATIONS = "certifications"

class SkillLevel(str, Enum):
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class SkillRelationType(str, Enum):
    PARENT = "parent"
    CHILD = "child"
    PREREQUISITE = "prerequisite"
    COMPLEMENTARY = "complementary"
    PROGRESSION = "progression"

class TaxonomyRequest(BaseModel):
    categories: List[str] = Field(..., min_items=1)
    include_resources: bool = True
    update_existing: bool = False

class CategoryMetadata(BaseModel):
    name: str
    description: str
    industry_alignment: List[str]
    common_roles: List[str]
    learning_resources: Optional[List[str]] = None

class SkillMetadata(BaseModel):
    name: str
    category: str
    sub_categories: List[str]
    level: SkillLevel
    related_skills: List[str]
    prerequisites: List[str]
    industry_relevance: List[str]

class SkillRelationship(BaseModel):
    from_skill: str
    to_skill: str
    relation_type: SkillRelationType
    description: str

class TaxonomyResponse(BaseModel):
    categories: List[CategoryMetadata]
    skills: List[SkillMetadata]
    relationships: List[SkillRelationship]

class SkillDetails(BaseModel):
    skill: SkillMetadata
    relationships: List[SkillRelationship]

    class Config:
        from_attributes = True

class SkillPath(BaseModel):
    path: List[SkillDetails]
    total_steps: int
    estimated_duration: str  # e.g., "6 months"

    class Config:
        from_attributes = True 