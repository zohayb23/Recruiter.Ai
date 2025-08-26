import os
from openai import OpenAI, OpenAIError
from typing import Dict, List, Optional
import logging
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        try:
            self.client = OpenAI(api_key=self.api_key)
            # Test the API key with a simple request
            self.client.models.list()
            logger.info("Successfully connected to OpenAI API")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise ValueError(f"Invalid OpenAI API key or connection error: {str(e)}")
        self.model = "gpt-4-turbo-preview"  # Using the latest GPT-4 model

    async def generate_job_description(self, 
        title: str,
        department: Optional[str] = None,
        experience_level: Optional[str] = None,
        required_skills: Optional[List[str]] = None,
        company_info: Optional[Dict] = None
    ) -> Dict:
        """Generate a comprehensive job description"""
        try:
            # Build the prompt with only the provided information
            prompt_parts = [f"Create a detailed job description for a {title} position."]
            
            if department:
                prompt_parts.append(f"Department: {department}")
            if experience_level:
                prompt_parts.append(f"Experience Level: {experience_level}")
            if required_skills:
                prompt_parts.append(f"Required Skills: {', '.join(required_skills)}")
            if company_info:
                prompt_parts.append(f"Company Information: {company_info}")

            prompt = f"""
{chr(10).join(prompt_parts)}

Based on the provided information and your expertise, please generate a complete job description in JSON format with the following sections:
1. overview - A compelling introduction about the role
2. responsibilities - Key duties and expectations (as an array of strings)
3. qualifications - Required and preferred qualifications (as an array of strings)
4. required_skills - Must-have technical and soft skills (as an array of strings)
5. preferred_skills - Nice-to-have skills (as an array of strings)
6. benefits - Standard benefits package (as an array of strings)
7. company_description - Brief company overview
8. culture_values - Work environment and company culture
9. diversity_statement - Commitment to diversity and inclusion

The response should be professional, inclusive, and engaging. Feel free to add relevant industry-standard requirements and qualifications based on the role.

IMPORTANT: Use lowercase for all JSON keys and ensure all arrays contain strings, not objects."""

            try:
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an expert technical recruiter with deep knowledge of job market trends and industry standards."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={ "type": "json_object" }
                )
                
                # Access the response content
                response_content = completion.choices[0].message.content
                logger.info("Successfully received response from OpenAI")
                
                # Parse the JSON response to validate it
                try:
                    parsed_response = json.loads(response_content)
                    return parsed_response
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing OpenAI response as JSON: {str(e)}")
                    logger.error(f"Raw response content: {response_content}")
                    raise ValueError("Generated content is not valid JSON")

            except OpenAIError as e:
                logger.error(f"OpenAI API error: {str(e)}")
                raise ValueError(f"OpenAI API error: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error during OpenAI request: {str(e)}")
                raise ValueError(f"Error during OpenAI request: {str(e)}")

        except Exception as e:
            logger.error(f"Error generating job description: {str(e)}")
            raise

    async def improve_job_description(self, jd_text: str) -> Dict:
        """Analyze and improve a job description"""
        try:
            prompt = f"""Analyze and improve the following job description:

{jd_text}

Please provide suggestions in JSON format with the following sections:
1. inclusive_language - Identify and suggest alternatives for any non-inclusive language (as an array of strings)
2. clarity_improvements - Areas where the description could be clearer or more specific (as an array of strings)
3. attractiveness_suggestions - Ways to make the role more appealing to candidates (as an array of strings)
4. technical_accuracy - Ensure technical requirements are current and accurate (as an array of strings)
5. culture_fit - How well the description reflects company culture and values (as an array of strings)

Focus on making the job description more effective, inclusive, and engaging.

IMPORTANT: Use lowercase for all JSON keys and ensure all arrays contain strings, not objects."""

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in DEI and technical recruiting, skilled at creating inclusive and effective job descriptions."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" }
            )

            # Access the response content
            response_content = completion.choices[0].message.content
            logger.info("Successfully received response from OpenAI")
            
            # Parse the JSON response to validate it
            try:
                parsed_response = json.loads(response_content)
                return parsed_response
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing OpenAI response as JSON: {str(e)}")
                logger.error(f"Raw response content: {response_content}")
                raise ValueError("Generated content is not valid JSON")

        except Exception as e:
            logger.error(f"Error improving job description: {str(e)}")
            raise

    async def analyze_market_alignment(self, jd_text: str) -> Dict:
        """Analyze market alignment of a job description"""
        try:
            prompt = f"""Analyze the market alignment of the following job description:

{jd_text}

Please provide analysis in JSON format with the following sections:
1. salary_range - Object containing:
   - min: number (minimum salary)
   - max: number (maximum salary)
   - currency: string (e.g., "USD")
   - notes: string (optional)
2. skills_alignment - Object containing:
   - score: number (0-100)
   - trending_skills: array of strings
   - missing_skills: array of strings
   - notes: string (optional)
3. experience_match - Object containing:
   - score: number (0-100)
   - market_average: string
   - notes: string (optional)
4. title_accuracy - Object containing:
   - score: number (0-100)
   - alternative_titles: array of strings
   - notes: string (optional)

Focus on current market trends and industry standards.

IMPORTANT: Use lowercase for all JSON keys and ensure arrays contain strings, not objects."""

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in technical recruiting and market analysis, with deep knowledge of industry trends and compensation."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" }
            )

            # Access the response content
            response_content = completion.choices[0].message.content
            logger.info("Successfully received response from OpenAI")
            
            # Parse the JSON response to validate it
            try:
                parsed_response = json.loads(response_content)
                return parsed_response
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing OpenAI response as JSON: {str(e)}")
                logger.error(f"Raw response content: {response_content}")
                raise ValueError("Generated content is not valid JSON")

        except Exception as e:
            logger.error(f"Error analyzing market alignment: {str(e)}")
            raise

openai_service = OpenAIService() 