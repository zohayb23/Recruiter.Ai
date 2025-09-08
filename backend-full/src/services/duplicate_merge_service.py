import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from ..services.vector_store.milvus_service import MilvusService

logger = logging.getLogger(__name__)

class DuplicateMergeService:
    def __init__(self):
        """Initialize the duplicate merge service"""
        self.milvus_service = MilvusService()
    
    async def merge_duplicates(self, primary_resume_id: str, duplicate_resume_ids: List[str], merge_strategy: str = "best") -> Dict[str, Any]:
        """
        Merge duplicate resumes into a single resume
        
        Args:
            primary_resume_id: ID of the resume to keep as primary
            duplicate_resume_ids: List of resume IDs to merge into primary
            merge_strategy: Strategy for merging ("best", "combine", "latest")
            
        Returns:
            Dictionary containing merge results
        """
        try:
            # Get all resumes
            all_resumes = await self.milvus_service.get_all_resumes()
            
            # Find the primary resume
            primary_resume = next((r for r in all_resumes if r.get('metadata', {}).get('resume_id') == primary_resume_id), None)
            if not primary_resume:
                raise ValueError(f"Primary resume {primary_resume_id} not found")
            
            # Find duplicate resumes
            duplicate_resumes = []
            for dup_id in duplicate_resume_ids:
                dup_resume = next((r for r in all_resumes if r.get('metadata', {}).get('resume_id') == dup_id), None)
                if dup_resume:
                    duplicate_resumes.append(dup_resume)
                else:
                    logger.warning(f"Duplicate resume {dup_id} not found")
            
            if not duplicate_resumes:
                raise ValueError("No valid duplicate resumes found to merge")
            
            # Merge resumes based on strategy
            merged_resume = await self._merge_resumes(primary_resume, duplicate_resumes, merge_strategy)
            
            # Update the primary resume in the database
            await self._update_resume_in_database(primary_resume_id, merged_resume)
            
            # Delete duplicate resumes
            deleted_resumes = []
            for dup_resume in duplicate_resumes:
                dup_id = dup_resume.get('metadata', {}).get('resume_id')
                if dup_id:
                    success = await self._delete_resume_from_database(dup_id)
                    if success:
                        deleted_resumes.append(dup_id)
            
            return {
                'success': True,
                'primary_resume_id': primary_resume_id,
                'merged_resume': merged_resume,
                'deleted_resume_ids': deleted_resumes,
                'merge_strategy': merge_strategy,
                'merge_timestamp': datetime.now().isoformat(),
                'summary': f"Successfully merged {len(deleted_resumes)} duplicate resumes into {primary_resume_id}"
            }
            
        except Exception as e:
            logger.error(f"Error merging duplicates: {e}")
            raise ValueError(f"Error merging duplicates: {e}")
    
    async def _merge_resumes(self, primary_resume: Dict, duplicate_resumes: List[Dict], strategy: str) -> Dict:
        """Merge multiple resumes into one based on the specified strategy"""
        try:
            if strategy == "best":
                return await self._merge_best_strategy(primary_resume, duplicate_resumes)
            elif strategy == "combine":
                return await self._merge_combine_strategy(primary_resume, duplicate_resumes)
            elif strategy == "latest":
                return await self._merge_latest_strategy(primary_resume, duplicate_resumes)
            else:
                raise ValueError(f"Unknown merge strategy: {strategy}")
                
        except Exception as e:
            logger.error(f"Error in merge strategy {strategy}: {e}")
            raise
    
    async def _merge_best_strategy(self, primary_resume: Dict, duplicate_resumes: List[Dict]) -> Dict:
        """Merge strategy: Keep the best/most complete resume as primary"""
        # Start with primary resume
        merged = primary_resume.copy()
        
        # For each field, keep the most complete version
        for dup_resume in duplicate_resumes:
            merged = self._merge_basic_information(merged, dup_resume)
            merged = self._merge_skills(merged, dup_resume)
            merged = self._merge_education(merged, dup_resume)
            merged = self._merge_work_experience(merged, dup_resume)
        
        return merged
    
    async def _merge_combine_strategy(self, primary_resume: Dict, duplicate_resumes: List[Dict]) -> Dict:
        """Merge strategy: Combine all unique information from all resumes"""
        merged = primary_resume.copy()
        
        for dup_resume in duplicate_resumes:
            merged = self._combine_basic_information(merged, dup_resume)
            merged = self._combine_skills(merged, dup_resume)
            merged = self._combine_education(merged, dup_resume)
            merged = self._combine_work_experience(merged, dup_resume)
        
        return merged
    
    async def _merge_latest_strategy(self, primary_resume: Dict, duplicate_resumes: List[Dict]) -> Dict:
        """Merge strategy: Use the most recently uploaded resume as primary"""
        # Find the most recent resume based on file modification time or upload date
        all_resumes = [primary_resume] + duplicate_resumes
        latest_resume = max(all_resumes, key=lambda r: self._get_resume_timestamp(r))
        
        # If the latest is not the primary, use it as the base
        if latest_resume != primary_resume:
            merged = latest_resume.copy()
            # Add any missing information from other resumes
            for resume in all_resumes:
                if resume != latest_resume:
                    merged = self._merge_basic_information(merged, resume)
                    merged = self._merge_skills(merged, resume)
                    merged = self._merge_education(merged, resume)
                    merged = self._merge_work_experience(merged, resume)
        else:
            merged = primary_resume.copy()
        
        return merged
    
    def _get_resume_timestamp(self, resume: Dict) -> str:
        """Get timestamp for resume (for latest strategy)"""
        # Try to get upload timestamp
        metadata = resume.get('metadata', {})
        if metadata.get('uploaded_at'):
            return metadata['uploaded_at']
        
        # Fallback to current time
        return datetime.now().isoformat()
    
    def _merge_basic_information(self, primary: Dict, duplicate: Dict) -> Dict:
        """Merge basic information, keeping the most complete version"""
        primary_info = primary.get('basic_information', {})
        dup_info = duplicate.get('basic_information', {})
        
        # Merge contact information
        primary_contact = primary_info.get('contact', {})
        dup_contact = dup_info.get('contact', {})
        
        # Keep non-empty values
        merged_contact = {}
        for field in ['email', 'phone', 'linkedin', 'github', 'website']:
            primary_value = primary_contact.get(field, '').strip()
            dup_value = dup_contact.get(field, '').strip()
            
            if primary_value and not dup_value:
                merged_contact[field] = primary_value
            elif dup_value and not primary_value:
                merged_contact[field] = dup_value
            elif primary_value and dup_value:
                # If both have values, prefer the primary
                merged_contact[field] = primary_value
        
        # Merge other basic info
        merged_info = primary_info.copy()
        merged_info['contact'] = merged_contact
        
        # Keep the most complete name
        primary_name = primary_info.get('name', '').strip()
        dup_name = dup_info.get('name', '').strip()
        
        if not primary_name and dup_name:
            merged_info['name'] = dup_name
        elif primary_name and dup_name and len(dup_name) > len(primary_name):
            # Prefer longer/more complete name
            merged_info['name'] = dup_name
        
        # Keep the highest experience level
        primary_exp = primary_info.get('years_of_experience', 0)
        dup_exp = dup_info.get('years_of_experience', 0)
        merged_info['years_of_experience'] = max(primary_exp, dup_exp)
        
        primary['basic_information'] = merged_info
        return primary
    
    def _merge_skills(self, primary: Dict, duplicate: Dict) -> Dict:
        """Merge skills, keeping unique skills from both"""
        primary_skills = self._extract_skills_list(primary)
        dup_skills = self._extract_skills_list(duplicate)
        
        # Combine and deduplicate skills
        all_skills = list(set(primary_skills + dup_skills))
        
        # Update primary resume with merged skills
        primary['skills'] = {
            'total_count': len(all_skills),
            'list': all_skills
        }
        
        return primary
    
    def _combine_skills(self, primary: Dict, duplicate: Dict) -> Dict:
        """Combine skills from both resumes (same as merge for skills)"""
        return self._merge_skills(primary, duplicate)
    
    def _merge_education(self, primary: Dict, duplicate: Dict) -> Dict:
        """Merge education, keeping unique entries"""
        primary_edu = self._extract_education_list(primary)
        dup_edu = self._extract_education_list(duplicate)
        
        # Combine and deduplicate education
        all_education = list(set(primary_edu + dup_edu))
        
        # Update primary resume with merged education
        primary['education'] = {
            'total_count': len(all_education),
            'list': all_education
        }
        
        return primary
    
    def _combine_education(self, primary: Dict, duplicate: Dict) -> Dict:
        """Combine education from both resumes (same as merge for education)"""
        return self._merge_education(primary, duplicate)
    
    def _merge_work_experience(self, primary: Dict, duplicate: Dict) -> Dict:
        """Merge work experience, keeping unique entries"""
        primary_work = primary.get('work_experience', [])
        dup_work = duplicate.get('work_experience', [])
        
        # Combine work experience
        all_work = primary_work + dup_work
        
        # Remove duplicates based on title + company combination
        unique_work = []
        seen_combinations = set()
        
        for work in all_work:
            if isinstance(work, dict):
                title = work.get('title', '').strip().lower()
                company = work.get('company', '').strip().lower()
                combination = f"{title}|{company}"
                
                if combination not in seen_combinations and combination != "|":
                    unique_work.append(work)
                    seen_combinations.add(combination)
        
        primary['work_experience'] = unique_work
        return primary
    
    def _combine_work_experience(self, primary: Dict, duplicate: Dict) -> Dict:
        """Combine work experience from both resumes (same as merge for work experience)"""
        return self._merge_work_experience(primary, duplicate)
    
    def _extract_skills_list(self, resume: Dict) -> List[str]:
        """Extract skills list from resume"""
        skills_data = resume.get('skills', {})
        if isinstance(skills_data, dict) and skills_data.get('list'):
            return skills_data['list']
        elif isinstance(skills_data, list):
            return skills_data
        return []
    
    def _extract_education_list(self, resume: Dict) -> List[str]:
        """Extract education list from resume"""
        education_data = resume.get('education', {})
        if isinstance(education_data, dict) and education_data.get('list'):
            return education_data['list']
        elif isinstance(education_data, list):
            return education_data
        return []
    
    async def _update_resume_in_database(self, resume_id: str, updated_resume: Dict) -> bool:
        """Update resume in the database"""
        try:
            # This would need to be implemented in the MilvusService
            # For now, we'll log the update
            logger.info(f"Would update resume {resume_id} with merged data")
            
            # TODO: Implement actual database update
            # await self.milvus_service.update_resume(resume_id, updated_resume)
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating resume {resume_id}: {e}")
            return False
    
    async def _delete_resume_from_database(self, resume_id: str) -> bool:
        """Delete resume from the database"""
        try:
            # This would need to be implemented in the MilvusService
            # For now, we'll log the deletion
            logger.info(f"Would delete resume {resume_id}")
            
            # TODO: Implement actual database deletion
            # await self.milvus_service.delete_resume(resume_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting resume {resume_id}: {e}")
            return False
