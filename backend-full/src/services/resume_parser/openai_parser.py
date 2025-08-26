from typing import Dict, List, Optional
import logging
from openai import AsyncOpenAI
import os
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class OpenAIParser:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4"

    async def parse_resume(self, text: str) -> Dict:
        """Parse resume text using GPT-4 for accurate and structured extraction"""
        try:
            prompt = f"""Please analyze this resume text and extract information in the following structured format. Be very precise and thorough:

            {{
                "personal_information": {{
                    "full_name": "candidate's full name",
                    "email": "email address",
                    "phone": "phone number",
                    "location": "city, state/country",
                    "linkedin": "LinkedIn URL",
                    "github": "GitHub URL",
                    "website": "personal website URL"
                }},
                "summary": "Professional summary/objective",
                "skills": {{
                    "technical": [
                        {{
                            "category": "Web Technologies",
                            "skills": ["JavaScript", "React.js", "HTML5", etc.]
                        }},
                        {{
                            "category": "Programming Languages",
                            "skills": ["Python", "Java", etc.]
                        }},
                        {{
                            "category": "Databases",
                            "skills": ["MySQL", "MongoDB", etc.]
                        }},
                        {{
                            "category": "Tools & Platforms",
                            "skills": ["Git", "Docker", etc.]
                        }}
                    ],
                    "soft_skills": ["Leadership", "Communication", etc.]
                }},
                "professional_experience": [
                    {{
                        "company": "company name",
                        "title": "job title",
                        "location": "city, state/country",
                        "start_date": "YYYY-MM",
                        "end_date": "YYYY-MM or Present",
                        "responsibilities": [
                            "key achievement or responsibility 1",
                            "key achievement or responsibility 2"
                        ],
                        "technologies_used": ["tech1", "tech2"]
                    }}
                ],
                "education": [
                    {{
                        "degree": "degree name",
                        "institution": "institution name",
                        "location": "city, state/country",
                        "graduation_date": "YYYY-MM",
                        "gpa": "if available",
                        "major": "field of study",
                        "relevant_coursework": ["course1", "course2"]
                    }}
                ],
                "certifications": [
                    {{
                        "name": "certification name",
                        "issuer": "issuing organization",
                        "date": "YYYY-MM",
                        "expires": "YYYY-MM if applicable"
                    }}
                ],
                "languages": [
                    {{
                        "language": "language name",
                        "proficiency": "proficiency level"
                    }}
                ]
            }}

            Important guidelines:
            1. Categorize technical skills logically into relevant groups
            2. Extract all dates in YYYY-MM format
            3. Use "Present" for current positions
            4. Include all URLs found in the text
            5. Keep descriptions clear and concise
            6. Ensure responsibilities highlight achievements and impact
            7. Include technologies used in each role
            8. Maintain chronological order (most recent first)

            Resume text:
            {text}
            """

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert resume parser that extracts structured information with high accuracy and organization."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent output
                max_tokens=3000,
                response_format={ "type": "json_object" }
            )

            # Parse the response
            parsed_data = json.loads(response.choices[0].message.content)
            logger.info("Successfully parsed resume with GPT-4")
            
            # Add metadata
            parsed_data["metadata"] = {
                "parsed_at": datetime.now().isoformat(),
                "parser_version": "2.0",
                "model_used": "gpt-4"
            }

            return parsed_data

        except Exception as e:
            logger.error(f"Error parsing resume with GPT-4: {str(e)}")
            raise
