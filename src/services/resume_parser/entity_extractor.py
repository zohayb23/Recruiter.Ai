import re
import spacy
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..utils.patterns import (
    EMAIL_PATTERN,
    PHONE_PATTERN,
    LINKEDIN_PATTERN,
    GITHUB_PATTERN,
    WEBSITE_PATTERN,
    DATE_PATTERNS
)
from ...models.resume import Contact, Education, WorkExperience, Skill, ParsedResume

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EntityExtractor:
    """Extracts structured information from resume text using NLP"""
    
    def __init__(self):
        # Load English language model
        self.nlp = spacy.load("en_core_web_lg")
        
        # Add sentence boundaries for better segmentation
        self.nlp.add_pipe("sentencizer")

        # Common section headers
        self.section_patterns = {
            'education': r'(?i)education|academic|qualification|degree|university|college|school',
            'experience': r'(?i)experience|employment|work history|professional background|career',
            'skills': r'(?i)skills|expertise|technologies|technical skills|competencies|proficiencies',
            'projects': r'(?i)projects|personal projects|academic projects',
            'certifications': r'(?i)certifications|certificates|accreditations',
            'languages': r'(?i)languages|language skills|spoken languages',
            'summary': r'(?i)summary|profile|objective|about'
        }

        # Common skill categories and patterns
        self.skill_categories = {
            'programming': {
                'pattern': r'(?i)(Python|Java|JavaScript|TypeScript|C\+\+|Ruby|PHP|Swift|Kotlin|Go|Rust|C#|Scala|R|Perl|Shell|Bash|PowerShell|MATLAB|Assembly|Fortran|COBOL|Dart|Lua|Julia|Haskell|Erlang|Elixir|Clojure|F#|OCaml|Groovy|Visual Basic|Objective-C)',
                'aliases': {
                    'js': 'JavaScript',
                    'ts': 'TypeScript',
                    'py': 'Python',
                    'rb': 'Ruby',
                    'cpp': 'C++',
                }
            },
            'web_frontend': {
                'pattern': r'(?i)(React|Angular|Vue|Svelte|jQuery|Bootstrap|Tailwind|Material-UI|Chakra UI|Next\.js|Nuxt\.js|Gatsby|HTML5|CSS3|SASS|LESS|Webpack|Babel|ESLint|Jest|Cypress|Redux|MobX|GraphQL|REST|WebSocket)',
                'aliases': {
                    'reactjs': 'React',
                    'vuejs': 'Vue',
                    'scss': 'SASS',
                    'mui': 'Material-UI',
                }
            },
            'web_backend': {
                'pattern': r'(?i)(Node\.js|Express|Django|Flask|FastAPI|Spring|Laravel|Rails|ASP\.NET|Symfony|NestJS|Strapi|Socket\.IO|Redis|Celery|RabbitMQ|Kafka|gRPC|Swagger|OpenAPI)',
                'aliases': {
                    'nodejs': 'Node.js',
                    'expressjs': 'Express',
                    'ror': 'Rails',
                }
            },
            'databases': {
                'pattern': r'(?i)(SQL|MySQL|PostgreSQL|MongoDB|Redis|Cassandra|Oracle|DynamoDB|SQLite|MariaDB|Neo4j|Elasticsearch|Couchbase|Firebase|Supabase)',
                'aliases': {
                    'psql': 'PostgreSQL',
                    'mongo': 'MongoDB',
                }
            },
            'cloud': {
                'pattern': r'(?i)(AWS|Amazon Web Services|Azure|GCP|Google Cloud|Heroku|DigitalOcean|Kubernetes|Docker|Terraform|CloudFormation|Lambda|EC2|S3|RDS|ECS|EKS|Cloud Run|App Engine)',
                'aliases': {
                    'k8s': 'Kubernetes',
                    'do': 'DigitalOcean',
                }
            },
            'devops': {
                'pattern': r'(?i)(Git|GitHub|GitLab|Bitbucket|Jenkins|CircleCI|Travis|GitHub Actions|ArgoCD|Helm|Ansible|Puppet|Chef|Prometheus|Grafana|ELK|Datadog|New Relic)',
                'aliases': {
                    'ci/cd': 'CI/CD',
                }
            },
            'ai_ml': {
                'pattern': r'(?i)(TensorFlow|PyTorch|Scikit-learn|Pandas|NumPy|OpenCV|NLTK|spaCy|Keras|XGBoost|LightGBM|Hugging Face|Machine Learning|Deep Learning|NLP|Computer Vision|Neural Networks)',
                'aliases': {
                    'sklearn': 'Scikit-learn',
                    'cv2': 'OpenCV',
                    'tf': 'TensorFlow',
                }
            },
            'mobile': {
                'pattern': r'(?i)(Android|iOS|React Native|Flutter|Xamarin|Swift|Kotlin|SwiftUI|UIKit|Jetpack Compose|Mobile Development)',
                'aliases': {
                    'rn': 'React Native',
                }
            },
            'testing': {
                'pattern': r'(?i)(Jest|Mocha|Pytest|JUnit|Selenium|Cypress|TestNG|PHPUnit|RSpec|XCTest|Jasmine|Karma|Postman|SoapUI|LoadRunner|JMeter)',
                'aliases': {}
            },
            'methodologies': {
                'pattern': r'(?i)(Agile|Scrum|Kanban|Waterfall|TDD|BDD|DevOps|CI/CD|XP|Lean|Six Sigma|SDLC)',
                'aliases': {}
            },
            'soft_skills': {
                'pattern': r'(?i)(Leadership|Communication|Teamwork|Problem.Solving|Critical Thinking|Time Management|Project Management|Analytical|Strategic|Innovation|Creativity|Collaboration|Adaptability|Initiative)',
                'aliases': {}
            }
        }

    def extract_contact_info(self, text: str) -> Contact:
        """Extract contact information using regex patterns"""
        contact = Contact()
        
        # Extract email
        email_match = re.search(EMAIL_PATTERN, text)
        if email_match:
            contact.email = email_match.group()
        
        # Extract phone
        phone_match = re.search(PHONE_PATTERN, text)
        if phone_match:
            contact.phone = phone_match.group()
        
        # Extract LinkedIn
        linkedin_match = re.search(LINKEDIN_PATTERN, text)
        if linkedin_match:
            contact.linkedin = linkedin_match.group()
        
        # Extract GitHub
        github_match = re.search(GITHUB_PATTERN, text)
        if github_match:
            contact.github = github_match.group()
        
        # Extract website
        website_match = re.search(WEBSITE_PATTERN, text)
        if website_match:
            contact.website = website_match.group()

        # Extract location from address-like patterns
        location_pattern = r'(?i)(?:located in|address|location|based in)\s*(?:at|:)?\s*([^,\n]+(?:,\s*[^,\n]+){0,2})'
        location_match = re.search(location_pattern, text)
        if location_match:
            contact.location = location_match.group(1).strip()
        
        return contact

    def extract_name(self, text: str) -> str:
        """Extract full name using NLP"""
        # Look for name in the first 500 characters (usually at the top of resume)
        doc = self.nlp(text[:500])
        
        # First try to find a PERSON entity
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text

        # If no PERSON entity found, look for name-like patterns
        name_pattern = r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})'
        name_match = re.search(name_pattern, text.strip())
        if name_match:
            return name_match.group(1)

        return "Unknown"

    def parse_date(self, text: str) -> Optional[datetime]:
        """Parse date string into datetime object"""
        # First try common date formats
        for pattern in DATE_PATTERNS:
            try:
                return datetime.strptime(text.strip(), pattern).date()
            except ValueError:
                continue

        # Try to extract year and month from text
        year_pattern = r'20\d{2}'
        month_pattern = r'(?i)(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
        
        year_match = re.search(year_pattern, text)
        month_match = re.search(month_pattern, text)
        
        if year_match and month_match:
            year = int(year_match.group())
            month_map = {
                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
            }
            month = month_map[month_match.group(1)[:3].lower()]
            return datetime(year, month, 1).date()
        elif year_match:
            return datetime(int(year_match.group()), 1, 1).date()

        return None

    def extract_education(self, text: str) -> List[Education]:
        """Extract education information"""
        education_list = []
        doc = self.nlp(text)
        
        # Common patterns
        degree_pattern = r'(?i)(Ph\.?D\.?|Doctor of Philosophy|Master[\'s]? of|M\.?S\.?|M\.?Eng\.?|M\.?A\.?|Bachelor[\'s]? of|B\.?S\.?|B\.?A\.?|B\.?E\.?|M\.?B\.?A\.?|Associate[\'s]? of|A\.?S\.?|A\.?A\.?|B\.?Tech|M\.?Tech|High School Diploma)'
        major_pattern = r'(?i)(Computer Science|Software Engineering|Information Technology|Data Science|Artificial Intelligence|Machine Learning|Computer Engineering|Electrical Engineering|Mathematics|Physics|Business Administration|Economics)'
        inst_pattern = r'(?i)(?:at|from|in)\s+((?:[A-Z][a-z]+\s*)+(?:University|College|Institute|School|Academy)(?:\s+(?:of|for|in)\s+(?:[A-Z][a-z]+\s*)+)?)'
        date_pattern = r'(?i)(?:from|between)?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*\d{4})\s*(?:-|to|until|–|present|current|now|\d{4})'
        gpa_pattern = r'(?i)(?:GPA|CGPA|Grade Point Average)[:\s]*(\d+\.?\d*)'
        honors_pattern = r'(?i)(Summa|Magna|Cum) Laude|Honors|Distinction|Dean\'s List|Merit|Scholar'
        
        # Find education sections
        education_sections = []
        current_section = []
        in_education_section = False
        
        for sent in doc.sents:
            if re.search(self.section_patterns['education'], sent.text, re.IGNORECASE):
                in_education_section = True
                if current_section:
                    education_sections.append(" ".join(current_section))
                current_section = [sent.text]
            elif in_education_section:
                if any(re.search(pattern, sent.text, re.IGNORECASE) 
                      for pattern in self.section_patterns.values() 
                      if pattern != self.section_patterns['education']):
                    in_education_section = False
                    if current_section:
                        education_sections.append(" ".join(current_section))
                    current_section = []
                else:
                    current_section.append(sent.text)
        
        if current_section:
            education_sections.append(" ".join(current_section))
        
        # Process each education section
        for section in education_sections:
            # Split into potential degree entries
            entries = re.split(r'\n(?=\S)', section)
            
            for entry in entries:
                # Try to find degree
                degree_match = re.search(degree_pattern, entry)
                major_match = re.search(major_pattern, entry)
                
                if degree_match:
                    # Combine degree and major if both found
                    degree_text = degree_match.group()
                    if major_match:
                        degree_text = f"{degree_text} in {major_match.group()}"
                    
                    edu = Education(
                        degree=degree_text.strip(),
                        institution="Unknown"
                    )
                    
                    # Try to find institution name using NLP
                    doc_entry = self.nlp(entry)
                    for ent in doc_entry.ents:
                        if ent.label_ == "ORG":
                            edu.institution = ent.text
                            break
                    
                    # If no ORG entity found, try pattern matching
                    if edu.institution == "Unknown":
                        inst_match = re.search(inst_pattern, entry)
                        if inst_match:
                            edu.institution = inst_match.group(1)
                    
                    # Extract dates
                    dates = re.finditer(date_pattern, entry)
                    date_list = [d.group(1) or d.group(0) for d in dates]
                    if len(date_list) >= 2:
                        start_date = self.parse_date(date_list[0])
                        end_date = self.parse_date(date_list[1])
                        if start_date:
                            edu.start_date = start_date
                        if end_date:
                            edu.end_date = end_date
                    elif len(date_list) == 1:
                        if 'present' in entry.lower() or 'current' in entry.lower() or 'now' in entry.lower():
                            start_date = self.parse_date(date_list[0])
                            if start_date:
                                edu.start_date = start_date
                        else:
                            end_date = self.parse_date(date_list[0])
                            if end_date:
                                edu.end_date = end_date
                    
                    # Extract GPA
                    gpa_match = re.search(gpa_pattern, entry)
                    if gpa_match:
                        try:
                            gpa = float(gpa_match.group(1))
                            if 0 <= gpa <= 4.0 or 0 <= gpa <= 10.0:  # Common GPA scales
                                edu.gpa = gpa
                        except ValueError:
                            pass
                    
                    # Extract honors and achievements
                    honors_match = re.search(honors_pattern, entry)
                    if honors_match:
                        edu.description = honors_match.group()
                    
                    # Extract additional description
                    desc_lines = []
                    for line in entry.split('\n'):
                        # Skip lines that contain already extracted information
                        if any(re.search(p, line) for p in [
                            degree_pattern, major_pattern, inst_pattern,
                            date_pattern, gpa_pattern, honors_pattern
                        ]):
                            continue
                        
                        # Clean and process the line
                        line = line.strip()
                        if line and len(line) > 5:  # Avoid very short lines
                            desc_lines.append(line)
                    
                    if desc_lines:
                        # Combine existing description with new lines
                        all_desc = []
                        if edu.description:
                            all_desc.append(edu.description)
                        all_desc.extend(desc_lines)
                        edu.description = ' | '.join(all_desc)
                    
                    education_list.append(edu)
        
        # Sort education by date (most recent first)
        education_list.sort(
            key=lambda x: (x.end_date or datetime.now().date(), x.start_date or datetime.now().date()),
            reverse=True
        )
        
        return education_list

    def extract_work_experience(self, text: str) -> List[WorkExperience]:
        """Extract work experience information"""
        experience_list = []
        doc = self.nlp(text)
        
        # Common patterns
        title_pattern = r'(?i)(Senior|Lead|Principal|Staff|Software|Full.?Stack|Back.?End|Front.?End|DevOps|Cloud|Data|ML|AI|Engineer|Developer|Manager|Director|Consultant|Analyst|Architect|Designer|Administrator|Specialist|Coordinator|Associate|Intern)(?:\s+[A-Z][a-z]+)*'
        company_pattern = r'(?i)(?:at|with|for|@)\s+([A-Z][a-z]*(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Technologies|Solutions|Systems|Group|International))?)|\b([A-Z][a-z]*(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Technologies|Solutions|Systems|Group|International))?)\b'
        date_pattern = r'(?i)(?:from|between)?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*\d{4})\s*(?:-|to|until|–|present|current|now|\d{4})'
        bullet_pattern = r'(?:^|\n)[\s•\-\*\+◦○●■□▪▫⬤⚬⯁⭐►▻▷▸▹▶]+\s*(.+?)(?=(?:\n[\s•\-\*\+◦○●■□▪▫⬤⚬⯁⭐►▻▷▸▹▶]+|\n\n|$))'
        
        # Find work experience sections
        experience_sections = []
        current_section = []
        in_experience_section = False
        
        for sent in doc.sents:
            if re.search(self.section_patterns['experience'], sent.text, re.IGNORECASE):
                in_experience_section = True
                if current_section:
                    experience_sections.append(" ".join(current_section))
                current_section = [sent.text]
            elif in_experience_section:
                if any(re.search(pattern, sent.text, re.IGNORECASE) 
                      for pattern in self.section_patterns.values() 
                      if pattern != self.section_patterns['experience']):
                    in_experience_section = False
                    if current_section:
                        experience_sections.append(" ".join(current_section))
                    current_section = []
                else:
                    current_section.append(sent.text)
        
        if current_section:
            experience_sections.append(" ".join(current_section))
        
        # Process each experience section
        for section in experience_sections:
            # Split into potential job entries
            entries = re.split(r'\n(?=\S)', section)
            
            for entry in entries:
                # Try to find job title
                title_match = re.search(title_pattern, entry)
                
                # Try to find company name
                company_match = re.search(company_pattern, entry)
                company_name = None
                if company_match:
                    company_name = company_match.group(1) or company_match.group(2)
                
                # Try to find company using NLP if regex didn't work
                if not company_name:
                    doc_entry = self.nlp(entry)
                    for ent in doc_entry.ents:
                        if ent.label_ == "ORG":
                            company_name = ent.text
                            break
                
                if title_match or company_name:
                    exp = WorkExperience(
                        title=title_match.group() if title_match else "Unknown Position",
                        company=company_name if company_name else "Unknown Company"
                    )
                    
                    # Extract dates
                    dates = re.finditer(date_pattern, entry)
                    date_list = [d.group(1) or d.group(0) for d in dates]
                    if len(date_list) >= 2:
                        start_date = self.parse_date(date_list[0])
                        end_date = self.parse_date(date_list[1])
                        if start_date:
                            exp.start_date = start_date
                        if end_date:
                            exp.end_date = end_date
                    elif len(date_list) == 1:
                        if 'present' in entry.lower() or 'current' in entry.lower() or 'now' in entry.lower():
                            start_date = self.parse_date(date_list[0])
                            if start_date:
                                exp.start_date = start_date
                        else:
                            end_date = self.parse_date(date_list[0])
                            if end_date:
                                exp.end_date = end_date
                    
                    # Extract description points and technologies
                    description = []
                    technologies = set()
                    
                    # First try to find bullet points
                    bullet_matches = re.finditer(bullet_pattern, entry, re.MULTILINE)
                    for match in bullet_matches:
                        point = match.group(1).strip()
                        if point and len(point) > 5:  # Avoid very short points
                            description.append(point)
                            
                            # Look for technologies in each bullet point
                            for category, tech_pattern in self.skill_categories.items():
                                tech_matches = re.finditer(tech_pattern['pattern'], point)
                                for tech_match in tech_matches:
                                    technologies.add(tech_match.group())
                    
                    # If no bullet points found, try to extract sentences
                    if not description:
                        lines = entry.split('\n')
                        for line in lines:
                            # Skip lines that are part of the header (title, company, dates)
                            if any(re.search(p, line) for p in [title_pattern, company_pattern, date_pattern]):
                                continue
                            
                            # Clean and process the line
                            line = line.strip()
                            if line and len(line) > 10:  # Avoid very short lines
                                description.append(line)
                                
                                # Look for technologies in the line
                                for category, tech_pattern in self.skill_categories.items():
                                    tech_matches = re.finditer(tech_pattern['pattern'], line)
                                    for tech_match in tech_matches:
                                        technologies.add(tech_match.group())
                    
                    # Clean up description points
                    cleaned_description = []
                    for point in description:
                        # Remove redundant bullet points and spaces
                        point = re.sub(r'^[\s•\-\*\+◦○●■□▪▫⬤⚬⯁⭐►▻▷▸▹▶]+\s*', '', point)
                        point = point.strip()
                        
                        # Capitalize first letter if it's not
                        if point and point[0].islower():
                            point = point[0].upper() + point[1:]
                        
                        # Add period if missing
                        if point and not point.endswith(('.', '!', '?')):
                            point += '.'
                        
                        if point:
                            cleaned_description.append(point)
                    
                    exp.description = cleaned_description
                    exp.technologies = sorted(list(technologies))  # Sort for consistent output
                    
                    experience_list.append(exp)
        
        # Sort experiences by date (most recent first)
        experience_list.sort(
            key=lambda x: (x.end_date or datetime.now().date(), x.start_date or datetime.now().date()),
            reverse=True
        )
        
        return experience_list

    def extract_skills(self, text: str) -> List[Skill]:
        """Extract skills information"""
        skills_list = []
        doc = self.nlp(text)
        
        # Find skills sections
        skills_sections = []
        current_section = []
        in_skills_section = False
        
        for sent in doc.sents:
            if re.search(self.section_patterns['skills'], sent.text, re.IGNORECASE):
                in_skills_section = True
                if current_section:
                    skills_sections.append(" ".join(current_section))
                current_section = [sent.text]
            elif in_skills_section:
                if any(re.search(pattern, sent.text, re.IGNORECASE) 
                      for pattern in self.section_patterns.values() 
                      if pattern != self.section_patterns['skills']):
                    in_skills_section = False
                    if current_section:
                        skills_sections.append(" ".join(current_section))
                    current_section = []
                else:
                    current_section.append(sent.text)
        
        if current_section:
            skills_sections.append(" ".join(current_section))
        
        # Also look for skills in work experience sections
        for sent in doc.sents:
            if re.search(self.section_patterns['experience'], sent.text, re.IGNORECASE):
                current_section = [sent.text]
            else:
                current_section.append(sent.text)
        if current_section:
            skills_sections.append(" ".join(current_section))
        
        # Process skills by category
        skills_text = " ".join(skills_sections)
        
        # Dictionary to track skill occurrences and context
        skill_occurrences = {}
        
        # Process each category
        for category, category_info in self.skill_categories.items():
            pattern = category_info['pattern']
            aliases = category_info['aliases']
            
            # Find all matches of the pattern
            matches = re.finditer(pattern, skills_text, re.IGNORECASE)
            for match in matches:
                skill_name = match.group()
                
                # Normalize skill name using aliases
                normalized_name = None
                for alias, full_name in aliases.items():
                    if skill_name.lower() == alias.lower():
                        normalized_name = full_name
                        break
                
                if not normalized_name:
                    # Capitalize appropriately
                    if skill_name.isupper():  # Acronym
                        normalized_name = skill_name
                    else:  # Regular word
                        normalized_name = skill_name.title()
                
                # Get context around the skill mention
                start = max(0, match.start() - 50)
                end = min(len(skills_text), match.end() + 50)
                context = skills_text[start:end]
                
                # Try to find experience level
                exp_pattern = r'(?i)(?:\(|\s)(\d+(?:\.\d+)?)\+?\s*(?:year|yr)s?(?:\)|,|\s|$)'
                exp_match = re.search(exp_pattern, context)
                
                # Try to find skill level
                level_pattern = r'(?i)(?:beginner|intermediate|advanced|expert|proficient|familiar)'
                level_match = re.search(level_pattern, context)
                
                # Update skill occurrences
                if normalized_name not in skill_occurrences:
                    skill_occurrences[normalized_name] = {
                        'category': category,
                        'count': 1,
                        'years': float(exp_match.group(1)) if exp_match else None,
                        'level': level_match.group().title() if level_match else None
                    }
                else:
                    skill_occurrences[normalized_name]['count'] += 1
                    # Update years if found and greater than existing
                    if exp_match:
                        years = float(exp_match.group(1))
                        if not skill_occurrences[normalized_name]['years'] or years > skill_occurrences[normalized_name]['years']:
                            skill_occurrences[normalized_name]['years'] = years
                    # Update level if found and not already set
                    if level_match and not skill_occurrences[normalized_name]['level']:
                        skill_occurrences[normalized_name]['level'] = level_match.group().title()
        
        # Convert occurrences to skills list
        for name, info in skill_occurrences.items():
            skill = Skill(
                name=name,
                category=info['category'],
                years_of_experience=info['years'],
                level=info['level']
            )
            skills_list.append(skill)
        
        # Sort skills by category and then by name
        skills_list.sort(key=lambda x: (x.category, x.name))
        
        return skills_list

    def extract_summary(self, text: str) -> Optional[str]:
        """Extract professional summary or objective"""
        doc = self.nlp(text)
        
        summary_sections = []
        current_section = []
        in_summary_section = False
        
        for sent in doc.sents:
            if re.search(self.section_patterns['summary'], sent.text, re.IGNORECASE):
                in_summary_section = True
            elif in_summary_section:
                if any(re.search(pattern, sent.text, re.IGNORECASE) 
                      for pattern in self.section_patterns.values() 
                      if pattern != self.section_patterns['summary']):
                    in_summary_section = False
                    break
                else:
                    current_section.append(sent.text)
        
        if current_section:
            return ' '.join(current_section).strip()
        return None

    def extract_certifications(self, text: str) -> List[str]:
        """Extract professional certifications"""
        doc = self.nlp(text)
        certifications = []
        
        cert_sections = []
        current_section = []
        in_cert_section = False
        
        for sent in doc.sents:
            if re.search(self.section_patterns['certifications'], sent.text, re.IGNORECASE):
                in_cert_section = True
            elif in_cert_section:
                if any(re.search(pattern, sent.text, re.IGNORECASE) 
                      for pattern in self.section_patterns.values() 
                      if pattern != self.section_patterns['certifications']):
                    in_cert_section = False
                    break
                else:
                    # Look for certification-like patterns
                    cert_pattern = r'(?i)(?:^|\n)(?:[-•]\s*)?((?:AWS|Microsoft|Google|Oracle|CompTIA|Cisco|PMI|ITIL|PMP|CISSP|CEH|CISA|CISM|CCNA|MCSE|RHCE|Security\+)(?:[^\n,]*(?:certification|certified|certificate|exam))?[^\n]*)'
                    matches = re.finditer(cert_pattern, sent.text)
                    for match in matches:
                        cert = match.group(1).strip()
                        if cert and cert not in certifications:
                            certifications.append(cert)
        
        return certifications

    def extract_languages(self, text: str) -> List[str]:
        """Extract language skills"""
        doc = self.nlp(text)
        languages = []
        
        lang_sections = []
        current_section = []
        in_lang_section = False
        
        for sent in doc.sents:
            if re.search(self.section_patterns['languages'], sent.text, re.IGNORECASE):
                in_lang_section = True
            elif in_lang_section:
                if any(re.search(pattern, sent.text, re.IGNORECASE) 
                      for pattern in self.section_patterns.values() 
                      if pattern != self.section_patterns['languages']):
                    in_lang_section = False
                    break
                else:
                    # Look for language names
                    lang_pattern = r'(?i)(?:^|\n)(?:[-•]\s*)?((?:English|Spanish|French|German|Chinese|Japanese|Korean|Arabic|Russian|Portuguese|Italian|Dutch|Hindi|Bengali|Turkish|Vietnamese|Thai|Indonesian)(?:[^\n,]*(?:native|fluent|intermediate|basic|proficient))?[^\n]*)'
                    matches = re.finditer(lang_pattern, sent.text)
                    for match in matches:
                        lang = match.group(1).strip()
                        if lang and lang not in languages:
                            languages.append(lang)
        
        return languages

    def extract_all(self, text: str) -> ParsedResume:
        """Extract all information from resume text"""
        logger.info("Starting resume parsing")
        
        # Extract basic information
        contact = self.extract_contact_info(text)
        name = self.extract_name(text)
        summary = self.extract_summary(text)
        
        # Extract main sections
        education = self.extract_education(text)
        experience = self.extract_work_experience(text)
        skills = self.extract_skills(text)
        certifications = self.extract_certifications(text)
        languages = self.extract_languages(text)
        
        logger.info(f"Found: {len(education)} education entries, {len(experience)} work experiences, {len(skills)} skills")
        
        # Create ParsedResume object
        parsed_resume = ParsedResume(
            full_name=name,
            contact=contact,
            summary=summary,
            work_experience=experience,
            education=education,
            skills=skills,
            certifications=certifications,
            languages=languages,
            raw_text=text
        )
        
        return parsed_resume 