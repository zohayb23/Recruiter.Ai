from typing import Dict, List, Optional, Set
from sqlalchemy.orm import Session
import openai
from datetime import datetime
import json
import os
from collections import defaultdict

from ..database.models import Job, Candidate, SkillTaxonomy, SkillRelation
from ..models.taxonomy import (
    TaxonomyRequest,
    SkillCategory,
    SkillLevel,
    SkillRelationType
)

class TaxonomyService:
    def __init__(self):
        """Initialize the taxonomy service with OpenAI client"""
        self.openai_client = openai.OpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    def build_taxonomy(
        self,
        db: Session,
        request: TaxonomyRequest
    ) -> Dict:
        """Build or update the skills taxonomy"""
        
        # Collect skills from jobs and candidates
        skills = self._collect_skills(db)
        
        # Generate taxonomy using AI
        taxonomy = self._generate_taxonomy(skills, request)
        
        # Store in database
        self._store_taxonomy(db, taxonomy)
        
        return taxonomy

    def _collect_skills(self, db: Session) -> Set[str]:
        """Collect all unique skills from jobs and candidates"""
        skills = set()
        
        # Get skills from jobs
        jobs = db.query(Job).all()
        for job in jobs:
            if job.required_skills:
                skills.update(job.required_skills)
            if job.preferred_skills:
                skills.update(job.preferred_skills)
        
        # Get skills from candidates
        candidates = db.query(Candidate).all()
        for candidate in candidates:
            if candidate.skills:
                skills.update(candidate.skills)
        
        return skills

    def _generate_taxonomy(
        self,
        skills: Set[str],
        request: TaxonomyRequest
    ) -> Dict:
        """Generate skills taxonomy using AI"""
        
        # Prepare the prompt
        prompt = f"""
        Create a comprehensive skills taxonomy for these skills:
        {', '.join(sorted(skills))}
        
        Requirements:
        1. Categorize skills into these areas: {', '.join(request.categories)}
        2. For each skill, provide:
           - Primary category
           - Sub-categories (if applicable)
           - Skill level (Basic, Intermediate, Advanced)
           - Related skills
           - Prerequisites
           - Industry relevance
        
        3. Create skill relationships:
           - Parent/Child relationships
           - Complementary skills
           - Skill progression paths
           
        4. Include for each category:
           - Description
           - Industry alignment
           - Common job roles
           - Learning resources
        
        Format as JSON with this structure:
        {
            "categories": [
                {
                    "name": "category name",
                    "description": "category description",
                    "industry_alignment": ["industry 1", "industry 2"],
                    "common_roles": ["role 1", "role 2"],
                    "learning_resources": ["resource 1", "resource 2"]
                }
            ],
            "skills": [
                {
                    "name": "skill name",
                    "category": "primary category",
                    "sub_categories": ["sub-category 1", "sub-category 2"],
                    "level": "skill level",
                    "related_skills": ["skill 1", "skill 2"],
                    "prerequisites": ["prerequisite 1", "prerequisite 2"],
                    "industry_relevance": ["industry 1", "industry 2"]
                }
            ],
            "relationships": [
                {
                    "from_skill": "skill name",
                    "to_skill": "skill name",
                    "type": "relationship type",
                    "description": "relationship description"
                }
            ]
        }
        """

        # Generate taxonomy using OpenAI
        response = self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert in skills taxonomy and career development.
                    Create detailed, accurate skill categorizations and relationships."""
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        # Parse and validate the response
        return json.loads(response.choices[0].message.content)

    def _store_taxonomy(self, db: Session, taxonomy: Dict):
        """Store the generated taxonomy in the database"""
        
        # Store categories
        for category in taxonomy["categories"]:
            db_category = SkillTaxonomy(
                name=category["name"],
                description=category["description"],
                industry_alignment=category["industry_alignment"],
                common_roles=category["common_roles"],
                learning_resources=category["learning_resources"],
                created_at=datetime.utcnow()
            )
            db.add(db_category)
        
        # Store skills and their metadata
        for skill in taxonomy["skills"]:
            db_skill = SkillTaxonomy(
                name=skill["name"],
                category=skill["category"],
                sub_categories=skill["sub_categories"],
                level=SkillLevel[skill["level"].upper()],
                related_skills=skill["related_skills"],
                prerequisites=skill["prerequisites"],
                industry_relevance=skill["industry_relevance"],
                created_at=datetime.utcnow()
            )
            db.add(db_skill)
        
        # Store relationships
        for rel in taxonomy["relationships"]:
            db_relation = SkillRelation(
                from_skill=rel["from_skill"],
                to_skill=rel["to_skill"],
                relation_type=SkillRelationType[rel["type"].upper()],
                description=rel["description"],
                created_at=datetime.utcnow()
            )
            db.add(db_relation)
        
        db.commit()

    def get_skill_details(
        self,
        db: Session,
        skill_name: str
    ) -> Dict:
        """Get detailed information about a specific skill"""
        skill = (
            db.query(SkillTaxonomy)
            .filter(SkillTaxonomy.name == skill_name)
            .first()
        )
        
        if not skill:
            raise ValueError(f"Skill '{skill_name}' not found in taxonomy")
        
        # Get relationships
        relationships = (
            db.query(SkillRelation)
            .filter(
                (SkillRelation.from_skill == skill_name) |
                (SkillRelation.to_skill == skill_name)
            )
            .all()
        )
        
        return {
            "skill": {
                "name": skill.name,
                "category": skill.category,
                "sub_categories": skill.sub_categories,
                "level": skill.level.value,
                "related_skills": skill.related_skills,
                "prerequisites": skill.prerequisites,
                "industry_relevance": skill.industry_relevance
            },
            "relationships": [
                {
                    "from_skill": rel.from_skill,
                    "to_skill": rel.to_skill,
                    "type": rel.relation_type.value,
                    "description": rel.description
                }
                for rel in relationships
            ]
        }

    def get_skill_path(
        self,
        db: Session,
        from_skill: str,
        to_skill: str
    ) -> List[Dict]:
        """Find the learning path between two skills"""
        
        def find_path(current: str, target: str, visited: Set[str], path: List[str]) -> Optional[List[str]]:
            if current == target:
                return path
                
            visited.add(current)
            
            # Get all related skills
            relations = (
                db.query(SkillRelation)
                .filter(SkillRelation.from_skill == current)
                .all()
            )
            
            for rel in relations:
                if rel.to_skill not in visited:
                    new_path = find_path(rel.to_skill, target, visited, path + [rel.to_skill])
                    if new_path:
                        return new_path
            
            return None
        
        path = find_path(from_skill, to_skill, set(), [from_skill])
        
        if not path:
            raise ValueError(f"No path found from '{from_skill}' to '{to_skill}'")
        
        # Get details for each skill in the path
        return [
            self.get_skill_details(db, skill)
            for skill in path
        ] 