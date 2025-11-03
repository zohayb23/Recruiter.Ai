"""
Gmail Job Description Agent for Recruiter.AI
Monitors Gmail inbox for job description emails, extracts structured data using LLM,
and stores them in Milvus job_descriptions collection
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, List
import imaplib
import email
from email.header import decode_header
import openai
from pymilvus import Collection, connections, utility
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GmailJobAgent:
    """Automated Gmail monitoring and job description extraction agent"""
    
    def __init__(self):
        """Initialize Gmail job agent with credentials and connections"""
        # Gmail credentials
        self.gmail_user = os.getenv("GMAIL_USER")
        self.gmail_password = os.getenv("GMAIL_APP_PASSWORD")
        
        # OpenAI for parsing
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
        else:
            logger.warning("⚠️  OpenAI API key not found - job extraction will fail")
            self.openai_client = None
        
        # Milvus connection
        self.milvus_host = os.getenv("MILVUS_HOST", "localhost")
        self.milvus_port = os.getenv("MILVUS_PORT", "19530")
        self.milvus_connected = False
        
        # Email tracking
        self.processed_emails = set()
        self.load_processed_emails()
        
        logger.info("🤖 Gmail Job Agent initialized")
    
    def load_processed_emails(self):
        """Load list of already processed email IDs"""
        try:
            if os.path.exists("processed_job_emails.json"):
                with open("processed_job_emails.json", "r") as f:
                    self.processed_emails = set(json.load(f))
                logger.info(f"📋 Loaded {len(self.processed_emails)} processed job email IDs")
        except Exception as e:
            logger.error(f"❌ Error loading processed job emails: {e}")
    
    def save_processed_emails(self):
        """Save list of processed email IDs"""
        try:
            with open("processed_job_emails.json", "w") as f:
                json.dump(list(self.processed_emails), f)
        except Exception as e:
            logger.error(f"❌ Error saving processed job emails: {e}")
    
    def connect_to_milvus(self):
        """Connect to Milvus database"""
        try:
            connections.connect(
                alias="default",
                host=self.milvus_host,
                port=self.milvus_port
            )
            self.milvus_connected = True
            logger.info(f"✅ Connected to Milvus at {self.milvus_host}:{self.milvus_port}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to Milvus: {e}")
            self.milvus_connected = False
            return False
    
    def connect_to_gmail(self):
        """Connect to Gmail via IMAP"""
        try:
            if not self.gmail_user or not self.gmail_password:
                logger.error("❌ Gmail credentials not found")
                return None
            
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(self.gmail_user, self.gmail_password)
            logger.info(f"✅ Connected to Gmail: {self.gmail_user}")
            return mail
        except Exception as e:
            logger.error(f"❌ Failed to connect to Gmail: {e}")
            return None
    
    def get_email_body(self, msg) -> str:
        """Extract email body from message"""
        body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode()
                        break
                    except:
                        pass
                elif content_type == "text/html" and not body and "attachment" not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode()
                    except:
                        pass
        else:
            try:
                body = msg.get_payload(decode=True).decode()
            except:
                body = str(msg.get_payload())
        
        return body[:20000]  # Limit body size
    
    def extract_job_description_with_ai(self, sender: str, subject: str, body: str) -> Dict[str, Any]:
        """Use OpenAI to extract structured job description matching Milvus schema"""
        try:
            if not self.openai_client:
                return None
            
            prompt = f"""Extract job description details from this email and structure it EXACTLY according to the schema below.

Email From: {sender}
Subject: {subject}
Body: {body[:10000]}

EXTRACT AND STRUCTURE AS JSON with these EXACT fields (matching Milvus job_descriptions collection schema):

{{
  "title": "Job title (e.g., 'Senior Software Engineer', 'Data Scientist')",
  "company": "Company name sending the job (extract from sender or body)",
  "department": "Department (e.g., 'Engineering', 'Data Science', 'Product')",
  "location_type": "One of: 'remote', 'in-person', 'hybrid'",
  "location": "Location string (e.g., 'San Francisco, CA', 'Remote', 'New York, NY')",
  "experience_level": "Experience level (e.g., 'Entry Level', 'Mid-Level', 'Senior Level', 'Lead', 'Executive')",
  "overview": "Job overview/summary (2-3 paragraphs)",
  "responsibilities": "JSON stringified array of responsibilities (e.g., '[\"Design scalable systems\", \"Lead team of 5 engineers\"]')",
  "qualifications": "JSON stringified array of qualifications (e.g., '[\"5+ years experience\", \"BS in Computer Science\"]')",
  "required_skills": "JSON stringified array of required skills (e.g., '[\"Python\", \"React\", \"AWS\"]')",
  "preferred_skills": "JSON stringified array of preferred/nice-to-have skills (e.g., '[\"GraphQL\", \"Kubernetes\"]')",
  "benefits": "JSON stringified array of benefits (e.g., '[\"Health insurance\", \"401k matching\", \"Remote work\"]')",
  "company_description": "Company description (1-2 paragraphs about the company)"
}}

CRITICAL RULES:
1. Extract sender company name from email address or body
2. Determine if email is actually a job posting (return null if not)
3. responsibilities, qualifications, required_skills, preferred_skills, benefits MUST be JSON-stringified arrays
4. If a field is not found, use empty string for text fields or empty array "[]" for list fields
5. For location_type: analyze if remote/hybrid/in-person is mentioned
6. Return ONLY valid JSON, no markdown formatting

EXAMPLES:
- responsibilities: "[\\"Develop scalable APIs\\", \\"Mentor junior developers\\", \\"Code reviews\\"]"
- required_skills: "[\\"Python\\", \\"FastAPI\\", \\"PostgreSQL\\", \\"5+ years experience\\"]"
- benefits: "[\\"Competitive salary\\", \\"Health insurance\\", \\"401k\\", \\"Flexible hours\\"]"
"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at extracting structured job description data from emails. You MUST return valid JSON that exactly matches the provided schema. For array fields (responsibilities, qualifications, required_skills, preferred_skills, benefits), return them as JSON-stringified arrays. If the email is not a job posting, return null."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=3000,
                temperature=0.3,
                timeout=60
            )
            
            result_text = response.choices[0].message.content
            
            # Parse JSON
            try:
                start_idx = result_text.find('{')
                end_idx = result_text.rfind('}') + 1
                json_str = result_text[start_idx:end_idx]
                job_data = json.loads(json_str)
                
                # Validate it's actually a job posting
                if not job_data or not job_data.get("title"):
                    logger.info("📭 Email does not contain a job posting")
                    return None
                
                logger.info(f"✅ AI extracted job: {job_data.get('title')} at {job_data.get('company')}")
                return job_data
                
            except Exception as e:
                logger.error(f"❌ JSON parsing error: {e}")
                return None
                
        except Exception as e:
            logger.error(f"❌ AI extraction failed: {e}")
            return None
    
    def get_embedding(self, text: str) -> List[float]:
        """Generate OpenAI embedding for text (dim=1536 to match schema)"""
        try:
            if not self.openai_client:
                return [0.0] * 1536
            
            response = self.openai_client.embeddings.create(
                input=text,
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"❌ Error generating embedding: {e}")
            return [0.0] * 1536
    
    def store_job_in_milvus(self, job_data: Dict[str, Any], sender: str, email_date: str, email_id: str):
        """Store job description in Milvus job_descriptions collection"""
        try:
            if not self.milvus_connected:
                logger.warning("⚠️  Milvus not connected, skipping storage")
                return False
            
            # Check if collection exists
            if not utility.has_collection("job_descriptions"):
                logger.error("❌ job_descriptions collection does not exist")
                return False
            
            collection = Collection("job_descriptions")
            collection.load()
            
            # Generate unique ID
            job_id = str(uuid.uuid4())
            current_time = datetime.now().isoformat()
            
            # Generate embedding from job content
            embedding_text = f"{job_data.get('title', '')} {job_data.get('company', '')} {job_data.get('overview', '')} {job_data.get('required_skills', '')}"
            embedding = self.get_embedding(embedding_text)
            
            # Extract sender contact info
            sender_email = sender
            if "<" in sender and ">" in sender:
                sender_email = sender.split("<")[1].split(">")[0]
            
            # Prepare data matching exact Milvus schema
            data = [{
                "id": job_id,
                "title": job_data.get("title", "")[:200],
                "company": job_data.get("company", "")[:200],
                "department": job_data.get("department", "")[:200],
                "location_type": job_data.get("location_type", "remote")[:50],
                "location": job_data.get("location", "")[:200],
                "experience_level": job_data.get("experience_level", "")[:100],
                "overview": job_data.get("overview", "")[:5000],
                "responsibilities": job_data.get("responsibilities", "[]")[:10000],
                "qualifications": job_data.get("qualifications", "[]")[:10000],
                "required_skills": job_data.get("required_skills", "[]")[:5000],
                "preferred_skills": job_data.get("preferred_skills", "[]")[:5000],
                "benefits": job_data.get("benefits", "[]")[:5000],
                "company_description": job_data.get("company_description", "")[:2000],
                "status": "draft",  # Default status
                "created_at": current_time[:50],
                "updated_at": current_time[:50],
                "embedding": embedding
            }]
            
            collection.insert(data)
            collection.flush()
            logger.info(f"✅ Stored job in Milvus: {job_id} - {job_data.get('title')}")
            logger.info(f"   Company: {job_data.get('company')}, Sender: {sender_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Error storing job in Milvus: {e}")
            return False
    
    def fetch_and_process_emails(self, folder="INBOX", limit=10):
        """Fetch and process job description emails from Gmail"""
        mail = self.connect_to_gmail()
        if not mail:
            return []
        
        processed_count = 0
        new_jobs = []
        
        try:
            mail.select(folder)
            status, messages = mail.search(None, "UNSEEN")
            
            if status != "OK":
                logger.warning("No new emails found")
                return []
            
            email_ids = messages[0].split()
            logger.info(f"📬 Found {len(email_ids)} unread emails")
            
            for email_id in email_ids[-limit:]:
                email_id_str = email_id.decode()
                
                if email_id_str in self.processed_emails:
                    continue
                
                try:
                    status, msg_data = mail.fetch(email_id, "(RFC822)")
                    if status != "OK":
                        continue
                    
                    msg = email.message_from_bytes(msg_data[0][1])
                    
                    # Extract email metadata
                    subject = decode_header(msg["Subject"])[0][0]
                    if isinstance(subject, bytes):
                        subject = subject.decode()
                    
                    sender = msg.get("From")
                    date = msg.get("Date")
                    body = self.get_email_body(msg)
                    
                    logger.info(f"📧 Processing: {subject} from {sender}")
                    
                    # Extract job description with AI
                    job_data = self.extract_job_description_with_ai(sender, subject, body)
                    
                    if job_data:
                        # Store in Milvus
                        success = self.store_job_in_milvus(job_data, sender, date, email_id_str)
                        
                        if success:
                            new_jobs.append({
                                "email_id": email_id_str,
                                "sender": sender,
                                "subject": subject,
                                "job_data": job_data
                            })
                            processed_count += 1
                            logger.info(f"✅ Processed job email: {subject}")
                    else:
                        logger.info(f"⏭️  Skipped (not a job posting): {subject}")
                    
                    # Mark as processed
                    self.processed_emails.add(email_id_str)
                    
                except Exception as e:
                    logger.error(f"❌ Error processing email {email_id_str}: {e}")
            
            self.save_processed_emails()
            logger.info(f"✅ Processed {processed_count} job emails")
            
        except Exception as e:
            logger.error(f"❌ Error fetching emails: {e}")
        finally:
            try:
                mail.close()
                mail.logout()
            except:
                pass
        
        return new_jobs
    
    def run_continuous(self, interval_seconds=60):
        """Run agent continuously"""
        logger.info(f"🚀 Starting Gmail Job Agent (checking every {interval_seconds}s)")
        
        if not self.connect_to_milvus():
            logger.warning("⚠️  Milvus not available. Agent will process emails but cannot store them.")
            self.milvus_connected = False
        
        while True:
            try:
                logger.info("🔄 Checking for new job emails...")
                new_jobs = self.fetch_and_process_emails()
                
                if new_jobs:
                    logger.info(f"✅ Processed {len(new_jobs)} job posting emails")
                    for job in new_jobs:
                        logger.info(f"  💼 {job['job_data']['title']} at {job['job_data']['company']}")
                else:
                    logger.info("📭 No job posting emails found")
                
                logger.info(f"⏰ Waiting {interval_seconds} seconds...")
                time.sleep(interval_seconds)
                
            except KeyboardInterrupt:
                logger.info("🛑 Gmail Job Agent stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in continuous loop: {e}")
                time.sleep(interval_seconds)


def main():
    """Main entry point"""
    logger.info("=" * 60)
    logger.info("💼 GMAIL JOB DESCRIPTION AGENT FOR RECRUITER.AI")
    logger.info("=" * 60)
    
    agent = GmailJobAgent()
    agent.run_continuous(interval_seconds=60)


if __name__ == "__main__":
    main()

