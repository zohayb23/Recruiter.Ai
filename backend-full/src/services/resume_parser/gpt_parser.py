from typing import Dict, List
import logging
from openai import AsyncOpenAI
import os
import json

logger = logging.getLogger(__name__)

class GPTParser:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4"  # Using GPT-4 for better accuracy

    async def parse_resume_sections(self, text: str) -> Dict:
        """Use GPT-4 to parse resume sections accurately"""
        try:
            prompt = f"""Please analyze this resume text and extract information in the following JSON format:
            {{
                "contact": {{
                    "name": "full name",
                    "email": "email address",
                    "phone": "phone number",
                    "linkedin": "linkedin profile URL",
                    "github": "github profile URL",
                    "website": "personal website URL"
                }},
                "education": [
                    {{
                        "degree": "degree name",
                        "institution": "institution name",
                        "start_date": "start date (YYYY-MM)",
                        "end_date": "end date (YYYY-MM or 'Present')",
                        "gpa": "GPA if available",
                        "major": "field of study"
                    }}
                ],
                "work_experience": [
                    {{
                        "title": "job title",
                        "company": "company name",
                        "start_date": "start date (YYYY-MM)",
                        "end_date": "end date (YYYY-MM or 'Present')",
                        "description": ["achievement or responsibility 1", "achievement or responsibility 2"],
                        "technologies": ["technology 1", "technology 2"]
                    }}
                ],
                "skills": [
                    {{
                        "name": "skill name",
                        "category": "skill category (e.g., Programming, Database, Cloud, etc.)"
                    }}
                ]
            }}

            Resume text:
            {text}

            Please ensure:
            1. All dates are in YYYY-MM format
            2. Current positions use 'Present' as end_date
            3. Extract only factual information, no inference
            4. Keep descriptions concise and accurate
            5. Categorize skills appropriately
            6. Include all URLs found in contact section
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert resume parser that extracts structured information accurately."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent output
                max_tokens=2000,
                response_format={ "type": "json_object" }
            )

            # Parse the response
            parsed_data = json.loads(response.choices[0].message.content)
            logger.info("Successfully parsed resume sections with GPT")
            return parsed_data

        except Exception as e:
            logger.error(f"Error parsing resume with GPT: {str(e)}")
            raise
