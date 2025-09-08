import logging
from typing import Dict, List, Optional, Tuple, Set
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz, process
import re
from datetime import datetime
from collections import defaultdict

from ..services.vector_store.milvus_service import MilvusService

logger = logging.getLogger(__name__)

class DuplicateDetectionService:
    def __init__(self):
        """Initialize the duplicate detection service"""
        self.milvus_service = MilvusService()
        
        # Initialize sentence transformer for semantic similarity
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Detection thresholds
        self.thresholds = {
            'exact_match': 1.0,           # Exact matches
            'fuzzy_name': 0.80,           # Fuzzy name matching (lowered)
            'fuzzy_contact': 0.85,        # Fuzzy contact matching (lowered)
            'semantic_similarity': 0.75,  # Semantic similarity (lowered)
            'composite_score': 0.70       # Overall composite score (lowered)
        }
        
        # Scoring weights
        self.weights = {
            'exact_match': 0.40,          # 40% - Exact matches are most reliable
            'fuzzy_match': 0.25,          # 25% - Fuzzy matching
            'semantic_similarity': 0.25,  # 25% - AI semantic analysis
            'content_overlap': 0.10       # 10% - Skills/education overlap
        }
    
    async def detect_duplicates(self, resume_id: Optional[str] = None) -> Dict[str, any]:
        """
        Detect duplicate resumes in the database
        
        Args:
            resume_id: Optional specific resume to check against others
            
        Returns:
            Dictionary containing duplicate groups and detection results
        """
        try:
            # Get all resumes
            all_resumes = await self.milvus_service.get_all_resumes()
            
            if not all_resumes:
                return {
                    'total_resumes': 0,
                    'duplicate_groups': [],
                    'total_duplicates': 0,
                    'detection_summary': 'No resumes found in database'
                }
            
            logger.info(f"Analyzing {len(all_resumes)} resumes for duplicates")
            
            # If specific resume_id provided, only check that one
            if resume_id:
                target_resume = next((r for r in all_resumes if r.get('resume_id') == resume_id), None)
                if not target_resume:
                    return {'error': f'Resume {resume_id} not found'}
                
                duplicates = await self._find_duplicates_for_resume(target_resume, all_resumes)
                return {
                    'target_resume': resume_id,
                    'duplicates_found': duplicates,
                    'total_duplicates': len(duplicates)
                }
            
            # Find all duplicate groups
            duplicate_groups = await self._find_all_duplicate_groups(all_resumes)
            
            return {
                'total_resumes': len(all_resumes),
                'duplicate_groups': duplicate_groups,
                'total_duplicates': sum(len(group) - 1 for group in duplicate_groups),
                'detection_summary': f'Found {len(duplicate_groups)} duplicate groups affecting {sum(len(group) - 1 for group in duplicate_groups)} resumes'
            }
            
        except Exception as e:
            logger.error(f"Error detecting duplicates: {e}")
            raise ValueError(f"Error detecting duplicates: {e}")
    
    async def _find_all_duplicate_groups(self, resumes: List[Dict]) -> List[List[Dict]]:
        """Find all groups of duplicate resumes"""
        duplicate_groups = []
        processed_resumes = set()
        
        for i, resume in enumerate(resumes):
            if resume.get('resume_id') in processed_resumes:
                continue
                
            # Find duplicates for this resume
            duplicates = await self._find_duplicates_for_resume(resume, resumes[i+1:])
            
            if duplicates:
                # Create a group with the original resume and its duplicates
                group = [resume] + duplicates
                duplicate_groups.append(group)
                
                # Mark all resumes in this group as processed
                for dup_resume in group:
                    processed_resumes.add(dup_resume.get('resume_id'))
        
        return duplicate_groups
    
    async def _find_duplicates_for_resume(self, target_resume: Dict, candidate_resumes: List[Dict]) -> List[Dict]:
        """Find duplicates for a specific resume"""
        duplicates = []
        
        for candidate in candidate_resumes:
            similarity_score = await self._calculate_composite_similarity(target_resume, candidate)
            
            if similarity_score >= self.thresholds['composite_score']:
                duplicates.append({
                    'resume': candidate,
                    'similarity_score': similarity_score,
                    'match_details': await self._get_match_details(target_resume, candidate)
                })
        
        # Sort by similarity score (highest first)
        duplicates.sort(key=lambda x: x['similarity_score'], reverse=True)
        return [dup['resume'] for dup in duplicates]
    
    async def _calculate_composite_similarity(self, resume1: Dict, resume2: Dict) -> float:
        """Calculate composite similarity score between two resumes"""
        try:
            # Extract basic information
            info1 = self._extract_basic_info(resume1)
            info2 = self._extract_basic_info(resume2)
            
            # Calculate individual similarity scores
            exact_score = self._calculate_exact_match_score(info1, info2)
            fuzzy_score = self._calculate_fuzzy_match_score(info1, info2)
            semantic_score = await self._calculate_semantic_similarity(resume1, resume2)
            content_score = self._calculate_content_overlap_score(resume1, resume2)
            
            # Calculate weighted composite score
            composite_score = (
                exact_score * self.weights['exact_match'] +
                fuzzy_score * self.weights['fuzzy_match'] +
                semantic_score * self.weights['semantic_similarity'] +
                content_score * self.weights['content_overlap']
            )
            
            logger.debug(f"Similarity scores - Exact: {exact_score:.3f}, Fuzzy: {fuzzy_score:.3f}, "
                        f"Semantic: {semantic_score:.3f}, Content: {content_score:.3f}, "
                        f"Composite: {composite_score:.3f}")
            
            return composite_score
            
        except Exception as e:
            logger.error(f"Error calculating composite similarity: {e}")
            return 0.0
    
    def _extract_basic_info(self, resume: Dict) -> Dict:
        """Extract basic information from resume"""
        basic_info = resume.get('basic_information', {})
        contact = basic_info.get('contact', {})
        
        return {
            'name': basic_info.get('name', '').strip().lower(),
            'email': contact.get('email', '').strip().lower(),
            'phone': self._normalize_phone(contact.get('phone', '')),
            'resume_id': resume.get('metadata', {}).get('resume_id', '')
        }
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number for comparison"""
        if not phone:
            return ''
        
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Handle different phone number formats
        if len(digits) == 10:
            return digits
        elif len(digits) == 11 and digits.startswith('1'):
            return digits[1:]  # Remove country code
        else:
            return digits
    
    def _calculate_exact_match_score(self, info1: Dict, info2: Dict) -> float:
        """Calculate exact match score"""
        score = 0.0
        matches = 0
        total_fields = 0
        
        # Check email match
        if info1['email'] and info2['email']:
            total_fields += 1
            if info1['email'] == info2['email']:
                matches += 1
                score += 0.5  # Email is very strong indicator
        
        # Check phone match
        if info1['phone'] and info2['phone']:
            total_fields += 1
            if info1['phone'] == info2['phone']:
                matches += 1
                score += 0.3  # Phone is strong indicator
        
        # Check name match
        if info1['name'] and info2['name']:
            total_fields += 1
            if info1['name'] == info2['name']:
                matches += 1
                score += 0.2  # Name alone is weaker indicator
        
        # If we have exact matches, return high score
        if matches > 0:
            return min(score, 1.0)
        
        return 0.0
    
    def _calculate_fuzzy_match_score(self, info1: Dict, info2: Dict) -> float:
        """Calculate fuzzy match score"""
        score = 0.0
        
        # Fuzzy name matching
        if info1['name'] and info2['name']:
            name_similarity = fuzz.ratio(info1['name'], info2['name']) / 100.0
            if name_similarity >= self.thresholds['fuzzy_name']:
                score += 0.4
        
        # Fuzzy email matching (domain + username similarity)
        if info1['email'] and info2['email']:
            email_similarity = fuzz.ratio(info1['email'], info2['email']) / 100.0
            if email_similarity >= self.thresholds['fuzzy_contact']:
                score += 0.3
        
        # Fuzzy phone matching
        if info1['phone'] and info2['phone']:
            phone_similarity = fuzz.ratio(info1['phone'], info2['phone']) / 100.0
            if phone_similarity >= self.thresholds['fuzzy_contact']:
                score += 0.3
        
        return min(score, 1.0)
    
    async def _calculate_semantic_similarity(self, resume1: Dict, resume2: Dict) -> float:
        """Calculate semantic similarity using embeddings"""
        try:
            # Extract text content from both resumes
            text1 = self._extract_resume_text(resume1)
            text2 = self._extract_resume_text(resume2)
            
            if not text1 or not text2:
                return 0.0
            
            # Generate embeddings
            embedding1 = self.model.encode([text1])
            embedding2 = self.model.encode([text2])
            
            # Calculate cosine similarity
            similarity = cosine_similarity(embedding1, embedding2)[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {e}")
            return 0.0
    
    def _extract_resume_text(self, resume: Dict) -> str:
        """Extract text content from resume for semantic analysis"""
        try:
            text_parts = []
            
            # Basic information
            basic_info = resume.get('basic_information', {})
            if basic_info.get('name'):
                text_parts.append(basic_info['name'])
            
            # Skills
            skills = resume.get('skills', {})
            if isinstance(skills, dict) and skills.get('list'):
                for skill in skills['list']:
                    if isinstance(skill, str):
                        text_parts.append(skill)
                    elif isinstance(skill, dict) and skill.get('name'):
                        text_parts.append(skill['name'])
            elif isinstance(skills, list):
                for skill in skills:
                    if isinstance(skill, str):
                        text_parts.append(skill)
                    elif isinstance(skill, dict) and skill.get('name'):
                        text_parts.append(skill['name'])
            
            # Education
            education = resume.get('education', {})
            if isinstance(education, dict) and education.get('list'):
                for edu in education['list']:
                    if isinstance(edu, str):
                        text_parts.append(edu)
                    elif isinstance(edu, dict):
                        # Extract education details
                        parts = []
                        if edu.get('degree'):
                            parts.append(edu['degree'])
                        if edu.get('institution'):
                            parts.append(edu['institution'])
                        if parts:
                            text_parts.append(' '.join(parts))
            elif isinstance(education, list):
                for edu in education:
                    if isinstance(edu, str):
                        text_parts.append(edu)
                    elif isinstance(edu, dict):
                        # Extract education details
                        parts = []
                        if edu.get('degree'):
                            parts.append(edu['degree'])
                        if edu.get('institution'):
                            parts.append(edu['institution'])
                        if parts:
                            text_parts.append(' '.join(parts))
            
            # Work experience
            work_exp = resume.get('work_experience', [])
            if isinstance(work_exp, list):
                for exp in work_exp:
                    if isinstance(exp, dict):
                        if exp.get('title'):
                            text_parts.append(exp['title'])
                        if exp.get('company'):
                            text_parts.append(exp['company'])
                        if exp.get('description'):
                            if isinstance(exp['description'], list):
                                text_parts.extend(exp['description'])
                            else:
                                text_parts.append(str(exp['description']))
            
            return ' '.join(text_parts)
            
        except Exception as e:
            logger.error(f"Error extracting resume text: {e}")
            return ''
    
    def _calculate_content_overlap_score(self, resume1: Dict, resume2: Dict) -> float:
        """Calculate content overlap score based on skills and education"""
        try:
            # Extract skills from both resumes
            skills1 = self._extract_skills(resume1)
            skills2 = self._extract_skills(resume2)
            
            # Extract education from both resumes
            education1 = self._extract_education(resume1)
            education2 = self._extract_education(resume2)
            
            # Calculate skills overlap
            skills_score = self._calculate_set_overlap(skills1, skills2)
            
            # Calculate education overlap
            education_score = self._calculate_set_overlap(education1, education2)
            
            # Weighted combination
            content_score = (skills_score * 0.7) + (education_score * 0.3)
            
            return content_score
            
        except Exception as e:
            logger.error(f"Error calculating content overlap: {e}")
            return 0.0
    
    def _extract_skills(self, resume: Dict) -> Set[str]:
        """Extract skills from resume"""
        skills = set()
        
        skills_data = resume.get('skills', {})
        if isinstance(skills_data, dict) and skills_data.get('list'):
            for skill in skills_data['list']:
                if isinstance(skill, str):
                    skills.add(skill.lower().strip())
                elif isinstance(skill, dict) and skill.get('name'):
                    skills.add(skill['name'].lower().strip())
        elif isinstance(skills_data, list):
            for skill in skills_data:
                if isinstance(skill, str):
                    skills.add(skill.lower().strip())
                elif isinstance(skill, dict) and skill.get('name'):
                    skills.add(skill['name'].lower().strip())
        
        return skills
    
    def _extract_education(self, resume: Dict) -> Set[str]:
        """Extract education from resume"""
        education = set()
        
        education_data = resume.get('education', {})
        if isinstance(education_data, dict) and education_data.get('list'):
            for edu in education_data['list']:
                if isinstance(edu, str):
                    education.add(edu.lower().strip())
                elif isinstance(edu, dict):
                    # Extract education details
                    parts = []
                    if edu.get('degree'):
                        parts.append(edu['degree'])
                    if edu.get('institution'):
                        parts.append(edu['institution'])
                    if parts:
                        education.add(' '.join(parts).lower().strip())
        elif isinstance(education_data, list):
            for edu in education_data:
                if isinstance(edu, str):
                    education.add(edu.lower().strip())
                elif isinstance(edu, dict):
                    # Extract education details
                    parts = []
                    if edu.get('degree'):
                        parts.append(edu['degree'])
                    if edu.get('institution'):
                        parts.append(edu['institution'])
                    if parts:
                        education.add(' '.join(parts).lower().strip())
        
        return education
    
    def _calculate_set_overlap(self, set1: Set[str], set2: Set[str]) -> float:
        """Calculate overlap between two sets"""
        if not set1 or not set2:
            return 0.0
        
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)
    
    async def _get_match_details(self, resume1: Dict, resume2: Dict) -> Dict:
        """Get detailed match information between two resumes"""
        info1 = self._extract_basic_info(resume1)
        info2 = self._extract_basic_info(resume2)
        
        details = {
            'name_match': info1['name'] == info2['name'],
            'email_match': info1['email'] == info2['email'],
            'phone_match': info1['phone'] == info2['phone'],
            'name_similarity': fuzz.ratio(info1['name'], info2['name']) if info1['name'] and info2['name'] else 0,
            'email_similarity': fuzz.ratio(info1['email'], info2['email']) if info1['email'] and info2['email'] else 0,
            'phone_similarity': fuzz.ratio(info1['phone'], info2['phone']) if info1['phone'] and info2['phone'] else 0
        }
        
        return details
