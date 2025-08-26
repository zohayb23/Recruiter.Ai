from typing import List, Dict, Tuple
import re
from datetime import datetime
from dateutil.relativedelta import relativedelta
import calendar

class ExperienceExtractor:
    def __init__(self):
        # Common date formats in resumes
        self.date_patterns = [
            r'(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+(\d{4})',
            r'(\d{1,2})[/-](\d{4})',  # MM/YYYY or M/YYYY
            r'(\d{4})[/-](\d{1,2})',  # YYYY/MM or YYYY/M
            r'(\d{4})'  # Just year
        ]
        
        # Keywords that indicate present employment
        self.present_keywords = [
            'present', 'current', 'now', 'till date', 'to date',
            str(datetime.now().year)  # Current year
        ]
        
        # Common section headers
        self.experience_headers = [
            'experience', 'work experience', 'employment history',
            'professional experience', 'work history'
        ]
        
    def extract_experience(self, resume_text: str) -> Dict:
        """
        Extract and calculate total years of experience from resume text
        Returns:
        {
            'total_years': float,
            'experiences': List[Dict],  # List of individual roles
            'current_role': Dict,       # Most recent/current role
            'gaps': List[Tuple],        # List of gaps in experience
            'concurrent_roles': int     # Number of overlapping roles
        }
        """
        # Split resume into sections
        sections = self._split_into_sections(resume_text)
        experience_section = self._find_experience_section(sections)
        
        if not experience_section:
            return {
                'total_years': 0,
                'experiences': [],
                'current_role': None,
                'gaps': [],
                'concurrent_roles': 0
            }
            
        # Extract individual roles and their durations
        roles = self._extract_roles(experience_section)
        
        # Calculate total experience
        total_years, gaps, concurrent = self._calculate_total_experience(roles)
        
        # Identify current role
        current_role = self._identify_current_role(roles)
        
        return {
            'total_years': round(total_years, 1),
            'experiences': roles,
            'current_role': current_role,
            'gaps': gaps,
            'concurrent_roles': concurrent
        }
        
    def _split_into_sections(self, text: str) -> List[str]:
        """Split resume text into sections based on common headers"""
        sections = []
        lines = text.split('\n')
        current_section = []
        
        for line in lines:
            # Check if line is a section header
            if any(header.lower() in line.lower() for header in self.experience_headers):
                if current_section:
                    sections.append('\n'.join(current_section))
                current_section = [line]
            else:
                current_section.append(line)
                
        if current_section:
            sections.append('\n'.join(current_section))
            
        return sections
        
    def _find_experience_section(self, sections: List[str]) -> str:
        """Find the section containing work experience"""
        for section in sections:
            if any(header.lower() in section.lower() for header in self.experience_headers):
                return section
        return None
        
    def _extract_roles(self, experience_section: str) -> List[Dict]:
        """Extract individual roles and their durations"""
        roles = []
        lines = experience_section.split('\n')
        current_role = None
        
        for line in lines:
            # Look for date patterns
            dates = self._extract_dates(line)
            if dates:
                if current_role:
                    roles.append(current_role)
                current_role = {
                    'title': self._extract_title(line),
                    'company': self._extract_company(line),
                    'start_date': dates[0],
                    'end_date': dates[1] if len(dates) > 1 else None,
                    'duration': self._calculate_duration(dates[0], dates[1] if len(dates) > 1 else None)
                }
            elif current_role:
                # Add description to current role
                if 'description' not in current_role:
                    current_role['description'] = []
                current_role['description'].append(line.strip())
                
        if current_role:
            roles.append(current_role)
            
        return roles
        
    def _extract_dates(self, text: str) -> List[datetime]:
        """Extract dates from text"""
        dates = []
        text = text.lower()
        
        # First check for present keywords
        is_present = any(keyword in text for keyword in self.present_keywords)
        
        # Extract dates using patterns
        for pattern in self.date_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    # Handle month name and year
                    if len(match) == 2:
                        month = self._month_to_number(match[0])
                        year = int(match[1])
                        dates.append(datetime(year, month, 1))
                    # Handle MM/YYYY
                    else:
                        month = int(match[0])
                        year = int(match[1])
                        dates.append(datetime(year, month, 1))
                else:
                    # Handle just year
                    year = int(match)
                    dates.append(datetime(year, 1, 1))
        
        # If present keyword was found and we have at least one date
        if is_present and dates:
            dates.append(datetime.now())
            
        return sorted(dates)
        
    def _month_to_number(self, month: str) -> int:
        """Convert month name to number"""
        try:
            return list(calendar.month_abbr).index(month[:3].title())
        except ValueError:
            return 1  # Default to January if month can't be parsed
            
    def _calculate_duration(self, start_date: datetime, end_date: datetime = None) -> float:
        """Calculate duration between two dates in years"""
        if not end_date:
            end_date = datetime.now()
            
        diff = relativedelta(end_date, start_date)
        return diff.years + (diff.months / 12)
        
    def _calculate_total_experience(self, roles: List[Dict]) -> Tuple[float, List[Tuple], int]:
        """Calculate total experience, identify gaps and concurrent roles"""
        if not roles:
            return 0.0, [], 0
            
        # Sort roles by start date
        sorted_roles = sorted(roles, key=lambda x: x['start_date'])
        total_duration = 0
        gaps = []
        concurrent = 0
        current_end = sorted_roles[0]['end_date'] or datetime.now()
        
        for i, role in enumerate(sorted_roles[:-1]):
            next_role = sorted_roles[i + 1]
            
            # Check for concurrent roles
            if role['end_date'] and next_role['start_date'] < role['end_date']:
                concurrent += 1
                
            # Check for gaps
            if role['end_date'] and next_role['start_date'] > role['end_date']:
                gaps.append((role['end_date'], next_role['start_date']))
                
            # Update total duration
            total_duration += role['duration']
            
        # Add duration of last role
        total_duration += sorted_roles[-1]['duration']
        
        return total_duration, gaps, concurrent
        
    def _identify_current_role(self, roles: List[Dict]) -> Dict:
        """Identify the current/most recent role"""
        if not roles:
            return None
            
        # Sort roles by end date (None/present dates should come first)
        sorted_roles = sorted(roles, 
                            key=lambda x: x['end_date'] or datetime.now(),
                            reverse=True)
        return sorted_roles[0]
        
    def _extract_title(self, text: str) -> str:
        """Extract job title from text"""
        # Split by common separators and clean up
        parts = re.split(r'\s*[|@-]\s*', text)
        if parts:
            return parts[0].strip()
        return ""
        
    def _extract_company(self, text: str) -> str:
        """Extract company name from text"""
        # Split by common separators and take the second part if it exists
        parts = re.split(r'\s*[|@-]\s*', text)
        if len(parts) > 1:
            return parts[1].strip()
        return "" 