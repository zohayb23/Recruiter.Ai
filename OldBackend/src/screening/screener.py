from typing import Dict, List
from .criteria import ScreeningCriteria, EducationLevel
from .skills import SkillMatcher
from .experience import ExperienceExtractor
from .communication import CandidateCommunicator, EmailConfig

class CandidateScreener:
    def __init__(self, skill_synonyms_path: str = None, email_config: EmailConfig = None):
        """Initialize screening components"""
        self.skill_matcher = SkillMatcher(skill_synonyms_path)
        self.experience_extractor = ExperienceExtractor()
        self.communicator = CandidateCommunicator(email_config) if email_config else None
        
    def screen_and_notify_candidate(self, resume_text: str, criteria: ScreeningCriteria,
                                  candidate_email: str, job_details: Dict) -> Dict:
        """
        Screen candidate and send appropriate notification
        Returns: Dict containing screening results and notification status
        """
        # Perform screening
        result = self.screen_candidate(resume_text, criteria)
        
        # Send notification if communicator is configured
        notification_sent = False
        if self.communicator:
            if result['meets_requirements']:
                notification_sent = self.communicator.notify_qualified_candidate(
                    candidate_email,
                    result,
                    job_details
                )
            else:
                notification_sent = self.communicator.notify_unqualified_candidate(
                    candidate_email,
                    result,
                    job_details
                )
                
        result['notification_sent'] = notification_sent
        return result
        
    def schedule_candidate_interview(self, candidate_email: str, interview_details: Dict) -> bool:
        """Schedule interview for qualified candidate"""
        if not self.communicator:
            return False
            
        return self.communicator.schedule_interview(candidate_email, interview_details)
        
    def screen_candidate(self, resume_text: str, criteria: ScreeningCriteria) -> Dict:
        """
        Screen a candidate against the given criteria
        Returns:
        {
            'meets_requirements': bool,
            'overall_score': float,  # 0-100
            'skill_match': Dict,     # Detailed skill matching results
            'experience_match': Dict, # Experience analysis
            'education_match': Dict,  # Education requirements match
            'location_match': bool,   # Location requirement match
            'disqualifiers': List[str], # Reasons for not meeting requirements
            'recommendations': List[str] # Suggestions for improvement
        }
        """
        # Initialize result structure
        result = {
            'meets_requirements': False,
            'overall_score': 0,
            'skill_match': None,
            'experience_match': None,
            'education_match': None,
            'location_match': None,
            'disqualifiers': [],
            'recommendations': []
        }
        
        # Check skills
        skill_match = self.skill_matcher.match_skills(
            resume_text,
            criteria.required_skills,
            criteria.preferred_skills
        )
        result['skill_match'] = skill_match
        
        if not skill_match['has_all_required']:
            result['disqualifiers'].append(
                f"Missing required skills: {', '.join(skill_match['missing_required'])}"
            )
            
        # Check experience
        experience_data = self.experience_extractor.extract_experience(resume_text)
        experience_match = {
            'meets_minimum': experience_data['total_years'] >= criteria.min_years_experience,
            'meets_preferred': experience_data['total_years'] >= criteria.preferred_years_experience,
            'total_years': experience_data['total_years'],
            'current_role': experience_data['current_role'],
            'experience_gap': len(experience_data['gaps']) > 0,
            'min_years_experience': criteria.min_years_experience  # Added this line
        }
        result['experience_match'] = experience_match
        
        if not experience_match['meets_minimum']:
            result['disqualifiers'].append(
                f"Insufficient experience: {experience_match['total_years']} years " +
                f"(minimum required: {criteria.min_years_experience} years)"
            )
            
        # Calculate overall score
        scores = {
            'skills': skill_match['skills_score'] * 0.4,  # 40% weight
            'experience': self._calculate_experience_score(
                experience_data['total_years'],
                criteria.min_years_experience,
                criteria.preferred_years_experience
            ) * 0.3,  # 30% weight
            'education': 0  # 30% weight - to be implemented
        }
        
        result['overall_score'] = round(sum(scores.values()), 2)
        
        # Determine if candidate meets all requirements
        result['meets_requirements'] = (
            not result['disqualifiers'] and
            result['overall_score'] >= 65  # Lowered from 70 to 65
        )
        
        # Add recommendations
        if not result['meets_requirements']:
            self._add_recommendations(result)
            
        return result
        
    def _calculate_experience_score(self, actual: float, minimum: float, preferred: float) -> float:
        """Calculate experience score based on actual vs required/preferred"""
        if actual < minimum:
            # Below minimum gets proportional score up to 60
            return (actual / minimum) * 60
        elif actual < preferred:
            # Between minimum and preferred gets 60-90
            range_progress = (actual - minimum) / (preferred - minimum)
            return 60 + (range_progress * 30)
        else:
            # Above preferred gets 90-100 based on how much they exceed
            excess_score = min(10, ((actual - preferred) / preferred) * 10)
            return 90 + excess_score
            
    def _add_recommendations(self, result: Dict):
        """Add improvement recommendations based on screening results"""
        if result['skill_match']['missing_required']:
            result['recommendations'].append(
                f"Acquire missing required skills: {', '.join(result['skill_match']['missing_required'])}"
            )
            
        if not result['experience_match']['meets_minimum']:
            years_needed = round(
                result['experience_match']['min_years_experience'] -
                result['experience_match']['total_years'],
                1
            )
            result['recommendations'].append(
                f"Gain {years_needed} more years of relevant experience"
            )
            
        if result['experience_match']['experience_gap']:
            result['recommendations'].append(
                "Consider explaining any gaps in employment history"
            )
            
        # Add recommendations for preferred skills if missing
        missing_preferred = set(result['skill_match']['preferred_skills']) - \
                          set(result['skill_match']['matched_preferred'])
        if missing_preferred:
            result['recommendations'].append(
                f"Consider acquiring these preferred skills: {', '.join(missing_preferred)}"
            ) 