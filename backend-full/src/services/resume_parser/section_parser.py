from typing import List, Dict, Any
import re

class SectionParser:
    """Helper class for parsing resume sections"""
    
    @staticmethod
    def extract_sections(text: str) -> Dict[str, List[str]]:
        """Extract sections from text using section markers"""
        sections = {}
        current_section = None
        current_lines = []
        
        # Split text into lines and process each line
        for line in text.split('\n'):
            line = line.strip()
            
            # Check if this is a section marker
            if re.match(r'^\[(.*?)\]$', line):
                # Save previous section if exists
                if current_section and current_lines:
                    sections[current_section] = current_lines
                
                # Start new section
                current_section = line[1:-1].lower()  # Remove brackets and convert to lowercase
                current_lines = []
            elif line and current_section:
                current_lines.append(line)
        
        # Add last section if exists
        if current_section and current_lines:
            sections[current_section] = current_lines
        
        return sections
    
    @staticmethod
    def parse_education(lines: List[str]) -> List[Dict[str, str]]:
        """Parse education entries"""
        education_entries = []
        current_entry = {}
        
        for line in lines:
            if not line:
                if current_entry:
                    education_entries.append(current_entry)
                    current_entry = {}
                continue
            
            # First non-empty line is degree
            if not current_entry:
                current_entry['degree'] = line
            # Second non-empty line is institution
            elif 'institution' not in current_entry:
                current_entry['institution'] = line
            # Look for dates
            elif re.search(r'(?:19|20)\d{2}', line):
                dates = re.findall(r'(?:19|20)\d{2}', line)
                if dates:
                    current_entry['start_date'] = dates[0]
                    current_entry['end_date'] = dates[-1] if len(dates) > 1 else ""
        
        # Add last entry if exists
        if current_entry:
            education_entries.append(current_entry)
        
        return education_entries
    
    @staticmethod
    def parse_experience(lines: List[str]) -> List[Dict[str, Any]]:
        """Parse work experience entries"""
        experience_entries = []
        current_entry = None
        
        for line in lines:
            if not line:
                continue
            
            # Check if this is a new position (contains 'at' or date)
            if ' at ' in line or re.search(r'(?:19|20)\d{2}|[Pp]resent', line):
                # Save previous entry if exists
                if current_entry:
                    experience_entries.append(current_entry)
                
                # Start new entry
                current_entry = {
                    'title': '',
                    'company': '',
                    'start_date': '',
                    'end_date': '',
                    'description': [],
                    'technologies': []
                }
                
                # Parse title and company
                if ' at ' in line:
                    title, company = line.split(' at ', 1)
                    current_entry['title'] = title.strip()
                    current_entry['company'] = company.strip()
                else:
                    current_entry['title'] = line.strip()
            
            # Check for dates
            elif current_entry and re.search(r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+\d{4}', line):
                dates = re.findall(r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+\d{4}', line)
                if dates:
                    current_entry['start_date'] = dates[0]
                    if len(dates) > 1:
                        current_entry['end_date'] = dates[1]
                    elif 'present' in line.lower():
                        current_entry['end_date'] = 'Present'
            
            # Check for bullet points
            elif current_entry and line.startswith(('•', '-', '*', '›', '»', '∙')):
                clean_line = line.lstrip('•-*›»∙ \t')
                current_entry['description'].append(clean_line)
                
                # Extract technologies
                tech_pattern = r'\b(?:Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|SQL|MongoDB|PostgreSQL|MySQL|AWS|Azure|GCP|Docker|Kubernetes|Git|Jenkins|Terraform)\b'
                techs = re.findall(tech_pattern, clean_line)
                current_entry['technologies'].extend(techs)
        
        # Add last entry if exists
        if current_entry:
            experience_entries.append(current_entry)
        
        return experience_entries
    
    @staticmethod
    def parse_skills(lines: List[str]) -> List[Dict[str, str]]:
        """Parse skills entries"""
        skills = []
        
        for line in lines:
            if ':' in line:
                category, skills_text = line.split(':', 1)
                category = category.strip()
                
                # Add skills from this category
                for skill in skills_text.split(','):
                    skill = skill.strip()
                    if skill:
                        skills.append({
                            'name': skill,
                            'category': category
                        })
        
        return skills