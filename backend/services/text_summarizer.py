import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from typing import List, Dict, Optional

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class TextSummarizer:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        
    def extract_summary_section(self, text: str) -> Optional[str]:
        """Try to find and extract any explicit summary or objective section."""
        # Common section headers for summary content
        summary_patterns = [
            r"(?i)(?:^|\n)[\s]*(?:professional\s+)?summary[\s]*(?::|\.|\n)+([^#]+?)(?=\n\s*(?:[A-Z][a-z]+\s+)+:|$)",
            r"(?i)(?:^|\n)[\s]*objective[\s]*(?::|\.|\n)+([^#]+?)(?=\n\s*(?:[A-Z][a-z]+\s+)+:|$)",
            r"(?i)(?:^|\n)[\s]*profile[\s]*(?::|\.|\n)+([^#]+?)(?=\n\s*(?:[A-Z][a-z]+\s+)+:|$)",
            r"(?i)(?:^|\n)[\s]*about[\s]*(?::|\.|\n)+([^#]+?)(?=\n\s*(?:[A-Z][a-z]+\s+)+:|$)"
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text)
            if match:
                summary = match.group(1).strip()
                if len(summary) > 50:  # Ensure it's a meaningful summary
                    return self.clean_text(summary)
        return None

    def extract_experience(self, text: str) -> Optional[str]:
        """Extract current role and years of experience."""
        # Look for current/most recent role
        role_pattern = r"(?i)(?:current|present|latest)\s+(?:role|position|job):\s*([^\n.]+)"
        role_match = re.search(role_pattern, text)
        
        # Look for years of experience
        exp_pattern = r"(?i)(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:of\s+)?experience"
        exp_match = re.search(exp_pattern, text)
        
        result = []
        if role_match:
            result.append(f"Current role: {role_match.group(1).strip()}")
        if exp_match:
            result.append(f"{exp_match.group(1)}+ years of experience")
            
        return " | ".join(result) if result else None

    def score_sentences(self, text: str, query: str) -> List[tuple]:
        """Score sentences based on importance and query relevance."""
        sentences = sent_tokenize(text)
        query_words = set(word.lower() for word in word_tokenize(query) if word.lower() not in self.stop_words)
        
        # Calculate word frequency
        words = word_tokenize(text.lower())
        word_freq = FreqDist(word for word in words if word not in self.stop_words)
        
        # Score sentences
        sentence_scores = []
        for sentence in sentences:
            score = 0
            sentence_words = set(word.lower() for word in word_tokenize(sentence) if word not in self.stop_words)
            
            # Score based on word frequency
            for word in sentence_words:
                score += word_freq[word]
            
            # Boost score for sentences containing query terms
            query_match_score = sum(1 for word in query_words if word in sentence_words)
            score += query_match_score * 2
            
            # Normalize by sentence length
            score = score / (len(sentence_words) + 1)
            
            sentence_scores.append((sentence, score))
            
        return sorted(sentence_scores, key=lambda x: x[1], reverse=True)

    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?-]', '', text)
        return text

    def generate_summary(self, text: str, query: str, max_sentences: int = 3, max_chars: int = 300) -> str:
        """Generate a summary of the text, focusing on relevance to the query."""
        # Try to extract explicit summary section first
        summary = self.extract_summary_section(text)
        if summary and len(summary) <= max_chars:
            return summary
            
        # Extract experience information
        experience_info = self.extract_experience(text)
        
        # Score and select top sentences
        scored_sentences = self.score_sentences(text, query)
        selected_sentences = []
        current_length = 0
        
        for sentence, _ in scored_sentences:
            clean_sentence = self.clean_text(sentence)
            if current_length + len(clean_sentence) <= max_chars:
                selected_sentences.append(clean_sentence)
                current_length += len(clean_sentence) + 1  # +1 for space
                if len(selected_sentences) >= max_sentences:
                    break
            else:
                break
        
        # Combine summary components
        summary_parts = []
        if experience_info:
            summary_parts.append(experience_info)
        summary_parts.extend(selected_sentences)
        
        final_summary = " ".join(summary_parts)
        if len(final_summary) > max_chars:
            final_summary = final_summary[:max_chars-3] + "..."
            
        return final_summary

# Create a global instance
summarizer = TextSummarizer() 