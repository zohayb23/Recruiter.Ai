"""
Simple Duplicate Detection Service
Searches by full_name and keeps the most recent entry
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict

from ..services.vector_store.milvus_service import MilvusService

logger = logging.getLogger(__name__)

class SimpleDuplicateDetectionService:
    def __init__(self):
        self.milvus_service = MilvusService()
    
    async def find_duplicates_by_name(self) -> Dict[str, List[Dict]]:
        """
        Find duplicates by full_name and return grouped by name
        Returns: {name: [list of resumes with that name]}
        """
        try:
            # Get all resumes from Milvus
            all_resumes = await self.milvus_service.get_all_resumes()
            
            # Group by full_name
            name_groups = defaultdict(list)
            
            for resume in all_resumes:
                full_name = resume.get('full_name', '').strip()
                if full_name:  # Only process resumes with names
                    name_groups[full_name].append(resume)
            
            # Filter to only groups with duplicates (more than 1 resume)
            duplicates = {name: resumes for name, resumes in name_groups.items() if len(resumes) > 1}
            
            logger.info(f"Found {len(duplicates)} names with duplicates out of {len(name_groups)} total names")
            return duplicates
            
        except Exception as e:
            logger.error(f"Error finding duplicates by name: {e}")
            raise
    
    async def get_duplicate_stats(self) -> Dict:
        """
        Get statistics about duplicates
        """
        try:
            duplicates = await self.find_duplicates_by_name()
            
            total_duplicates = sum(len(resumes) for resumes in duplicates.values())
            total_unique_names = len(duplicates)
            total_resumes_to_remove = total_duplicates - total_unique_names
            
            return {
                "total_duplicate_names": total_unique_names,
                "total_duplicate_resumes": total_duplicates,
                "resumes_to_remove": total_resumes_to_remove,
                "duplicate_groups": duplicates
            }
            
        except Exception as e:
            logger.error(f"Error getting duplicate stats: {e}")
            raise
    
    async def remove_duplicates_keep_latest(self) -> Dict:
        """
        Remove duplicate resumes, keeping only the most recent one for each name
        Returns: {removed_count: int, kept_resumes: list}
        """
        try:
            duplicates = await self.find_duplicates_by_name()
            
            removed_count = 0
            kept_resumes = []
            
            for name, resumes in duplicates.items():
                # Sort by created_at (most recent first)
                sorted_resumes = sorted(
                    resumes, 
                    key=lambda x: x.get('created_at', ''), 
                    reverse=True
                )
                
                # Keep the first (most recent), remove the rest
                kept_resume = sorted_resumes[0]
                kept_resumes.append(kept_resume)
                
                # Remove the older duplicates
                for resume_to_remove in sorted_resumes[1:]:
                    resume_id = resume_to_remove.get('resume_id')
                    if resume_id:
                        await self.milvus_service.delete_resume(resume_id)
                        removed_count += 1
                        logger.info(f"Removed duplicate resume: {name} (ID: {resume_id})")
            
            logger.info(f"Removed {removed_count} duplicate resumes, kept {len(kept_resumes)} unique resumes")
            
            return {
                "removed_count": removed_count,
                "kept_resumes": kept_resumes,
                "message": f"Successfully removed {removed_count} duplicate resumes"
            }
            
        except Exception as e:
            logger.error(f"Error removing duplicates: {e}")
            raise
