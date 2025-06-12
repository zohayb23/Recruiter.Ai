from typing import List, Dict, Any
import re
from collections import Counter
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

def generate_smart_summary(text: str, max_sentences: int = 3) -> str:
    """
    Generate a concise summary from resume text using key information extraction.
    """
    try:
        # Split into sentences using basic sentence tokenization
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        
        # Initialize score for each sentence
        scores = {}
        
        # Keywords that indicate important information
        important_keywords = [
            'experience', 'skills', 'developed', 'led', 'managed', 'created',
            'implemented', 'designed', 'architected', 'expertise', 'proficient',
            'years', 'professional', 'specialist', 'expert'
        ]
        
        for i, sentence in enumerate(sentences):
            score = 0
            lower_sent = sentence.lower()
            
            # Score based on position (first few sentences often contain summary)
            if i < 3:
                score += 3 - i
            
            # Score based on important keywords
            for keyword in important_keywords:
                if keyword in lower_sent:
                    score += 1
            
            # Score based on sentence length (prefer medium-length sentences)
            words = len(sentence.split())
            if 10 <= words <= 30:
                score += 2
            
            # Score based on presence of years of experience
            if re.search(r'\d+\+?\s*years?', lower_sent):
                score += 3
            
            scores[sentence] = score
        
        # Get top scoring sentences
        top_sentences = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:max_sentences]
        
        # Sort sentences by their original order
        summary_sentences = sorted(top_sentences, key=lambda x: sentences.index(x[0]))
        
        # Combine sentences into summary
        summary = '. '.join(sent for sent, _ in summary_sentences)
        
        return summary.strip()
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return text[:300] + "..."  # Return first 300 chars as fallback

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using pattern matching and NLP."""
    try:
        # Common technical skills dictionary
        skill_patterns = {
            'languages': [
                'Python', 'Java', 'JavaScript', 'TypeScript', 'C\\+\\+', 'C#', 'Ruby',
                'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'Scala', 'R', 'MATLAB'
            ],
            'frameworks': [
                'React', 'Angular', 'Vue.js', 'Django', 'Flask', 'Spring Boot',
                'Express.js', 'Node.js', 'Laravel', 'ASP.NET', 'Ruby on Rails',
                'TensorFlow', 'PyTorch', 'Keras', 'Hibernate', 'Bootstrap'
            ],
            'databases': [
                'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'SQL Server', 'Redis',
                'Cassandra', 'Elasticsearch', 'DynamoDB', 'Neo4j'
            ],
            'tools': [
                'Git', 'Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Azure', 'GCP',
                'Linux', 'Nginx', 'Apache', 'Maven', 'Gradle', 'Webpack', 'Babel'
            ]
        }
        
        found_skills = set()
        text_lower = text.lower()
        
        # Flatten skill patterns
        all_skills = [skill for category in skill_patterns.values() for skill in category]
        
        # Find skills using regex pattern matching
        for skill in all_skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.add(skill)
        
        return sorted(list(found_skills))
    except Exception as e:
        print(f"Error extracting skills: {str(e)}")
        return []

def extract_experience(text: str) -> List[Dict[str, Any]]:
    """Extract relevant work experience sections from the resume."""
    try:
        # Split text into sections using common section headers
        sections = re.split(r'\n\s*(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT|PROFESSIONAL BACKGROUND)\s*\n', text, flags=re.IGNORECASE)
        if len(sections) < 2:
            return []
        
        # Process the experience section (after the header)
        experience_text = sections[1]
        experience_entries = []
        
        # Split into individual entries
        entries = re.split(r'\n\s*(?=\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', experience_text)
        
        for entry in entries:
            if not entry.strip():
                continue
                
            # Try to extract company and duration
            company_match = re.search(r'(?:at|with|for)?\s*([A-Z][A-Za-z0-9\s&.,]+)(?=\s*[-–|]|\s*\(|\s*\d{4}|\s*$)', entry)
            duration_match = re.search(r'(\d{4})\s*[-–]\s*(\d{4}|Present|Current)', entry, re.IGNORECASE)
            
            # Extract bullet points
            bullets = [b.strip() for b in re.split(r'\n\s*[•●\-]\s*', entry) if b.strip()]
            
            experience_entries.append({
                'company': company_match.group(1).strip() if company_match else None,
                'duration': duration_match.group(0) if duration_match else None,
                'description': entry.strip(),
                'highlights': bullets[1:] if bullets else []  # Skip the first item as it's usually the header
            })
            
            if len(experience_entries) >= 5:  # Limit to top 5 experiences
                break
        
        return experience_entries
    except Exception as e:
        print(f"Error extracting experience: {str(e)}")
        return []

def process_search_result(result: Dict[str, Any], query_skills: List[str] = None) -> Dict[str, Any]:
    """Process a search result to include summary, skills, and experience."""
    try:
        content = result.get('content', '')
        
        # Generate smart summary
        result['summary'] = generate_smart_summary(content)
        
        # Extract skills
        all_skills = extract_skills(content)
        result['matching_skills'] = []
        result['missing_skills'] = []
        
        if query_skills:
            result['matching_skills'] = [skill for skill in all_skills if skill.lower() in [s.lower() for s in query_skills]]
            result['missing_skills'] = [skill for skill in query_skills if skill.lower() not in [s.lower() for s in all_skills]]
        else:
            result['matching_skills'] = all_skills
        
        # Extract experience
        result['matching_experience'] = extract_experience(content)
        
        return result
    except Exception as e:
        print(f"Error processing search result: {str(e)}")
        return result 