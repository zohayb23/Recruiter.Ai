"""
Automated Gmail Agent for Recruiter.AI
Monitors Gmail inbox, parses emails, and stores them in Milvus database
Fully automated - no manual intervention required
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
from pymilvus import Collection, connections, FieldSchema, CollectionSchema, DataType, utility

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GmailAgent:
    """Automated Gmail monitoring and parsing agent"""
    
    def __init__(self):
        """Initialize Gmail agent with credentials and connections"""
        # Gmail credentials from environment
        self.gmail_user = os.getenv("GMAIL_USER")
        self.gmail_password = os.getenv("GMAIL_APP_PASSWORD")  # Use App Password, not regular password
        
        # OpenAI for parsing
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
        else:
            logger.warning("⚠️  OpenAI API key not found - email parsing will use basic extraction")
            self.openai_client = None
        
        # Milvus connection
        self.milvus_host = os.getenv("MILVUS_HOST", "localhost")
        self.milvus_port = os.getenv("MILVUS_PORT", "19530")
        self.milvus_connected = False
        
        # Email tracking
        self.processed_emails = set()
        self.load_processed_emails()
        
        logger.info("🤖 Gmail Agent initialized")
    
    def load_processed_emails(self):
        """Load list of already processed email IDs"""
        try:
            if os.path.exists("processed_emails.json"):
                with open("processed_emails.json", "r") as f:
                    self.processed_emails = set(json.load(f))
                logger.info(f"📋 Loaded {len(self.processed_emails)} processed email IDs")
        except Exception as e:
            logger.error(f"❌ Error loading processed emails: {e}")
    
    def save_processed_emails(self):
        """Save list of processed email IDs"""
        try:
            with open("processed_emails.json", "w") as f:
                json.dump(list(self.processed_emails), f)
        except Exception as e:
            logger.error(f"❌ Error saving processed emails: {e}")
    
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
            
            # Create emails collection if it doesn't exist
            self.create_emails_collection()
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to Milvus: {e}")
            self.milvus_connected = False
            return False
    
    def create_emails_collection(self):
        """Create Milvus collection for storing parsed emails"""
        collection_name = "emails"
        
        try:
            # Check if collection exists
            if utility.has_collection(collection_name):
                logger.info(f"📦 Collection '{collection_name}' already exists")
                return
            
            # Define schema
            fields = [
                FieldSchema(name="id", dtype=DataType.VARCHAR, is_primary=True, max_length=100),
                FieldSchema(name="sender_email", dtype=DataType.VARCHAR, max_length=500),
                FieldSchema(name="sender_name", dtype=DataType.VARCHAR, max_length=500),
                FieldSchema(name="subject", dtype=DataType.VARCHAR, max_length=1000),
                FieldSchema(name="body", dtype=DataType.VARCHAR, max_length=10000),
                FieldSchema(name="received_date", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="email_type", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="is_resume", dtype=DataType.BOOL),
                FieldSchema(name="is_job_inquiry", dtype=DataType.BOOL),
                FieldSchema(name="priority", dtype=DataType.VARCHAR, max_length=50),
                FieldSchema(name="extracted_data", dtype=DataType.VARCHAR, max_length=5000),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384)
            ]
            
            schema = CollectionSchema(
                fields=fields,
                description="Parsed emails from Gmail"
            )
            
            collection = Collection(
                name=collection_name,
                schema=schema
            )
            
            # Create index for vector search
            index_params = {
                "metric_type": "L2",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 128}
            }
            collection.create_index(
                field_name="embedding",
                index_params=index_params
            )
            
            logger.info(f"✅ Created collection '{collection_name}'")
        except Exception as e:
            logger.error(f"❌ Error creating collection: {e}")
    
    def connect_to_gmail(self):
        """Connect to Gmail via IMAP"""
        try:
            if not self.gmail_user or not self.gmail_password:
                logger.error("❌ Gmail credentials not found in environment variables")
                logger.info("💡 Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables")
                return None
            
            # Connect to Gmail IMAP
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(self.gmail_user, self.gmail_password)
            logger.info(f"✅ Connected to Gmail: {self.gmail_user}")
            return mail
        except Exception as e:
            logger.error(f"❌ Failed to connect to Gmail: {e}")
            logger.info("💡 Make sure you're using an App Password, not your regular Gmail password")
            logger.info("💡 Generate one at: https://myaccount.google.com/apppasswords")
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
        
        return body[:5000]  # Limit body size
    
    def parse_email_with_ai(self, sender: str, subject: str, body: str) -> Dict[str, Any]:
        """Use OpenAI to parse and categorize email"""
        try:
            if not self.openai_client:
                return self.parse_email_basic(sender, subject, body)
            
            prompt = f"""Analyze this email and extract structured information as JSON:

From: {sender}
Subject: {subject}
Body: {body[:2000]}

Extract the following:
1. sender_name: Full name of the sender
2. sender_email: Email address
3. email_type: Type of email (job_application, job_inquiry, recruitment_outreach, networking, spam, other)
4. is_resume: Boolean - Does this email contain or mention a resume/CV?
5. is_job_inquiry: Boolean - Is this inquiring about a job?
6. priority: high/medium/low based on urgency and importance
7. key_points: List of 3-5 key points from the email
8. action_required: What action is needed? (reply, review_resume, schedule_interview, none)
9. candidate_info: If it's a job application, extract: name, phone, skills, experience
10. summary: 2-3 sentence summary of the email

Return ONLY valid JSON, no markdown formatting."""

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that analyzes recruitment-related emails and extracts structured data. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=1000,
                temperature=0.3
            )
            
            parsed_data = json.loads(response.choices[0].message.content)
            logger.info(f"✅ AI parsed email from {sender}")
            return parsed_data
            
        except Exception as e:
            logger.error(f"❌ AI parsing failed: {e}, using basic parsing")
            return self.parse_email_basic(sender, subject, body)
    
    def parse_email_basic(self, sender: str, subject: str, body: str) -> Dict[str, Any]:
        """Basic email parsing without AI"""
        # Extract email address
        sender_email = sender
        if "<" in sender and ">" in sender:
            sender_email = sender.split("<")[1].split(">")[0]
            sender_name = sender.split("<")[0].strip()
        else:
            sender_name = sender_email.split("@")[0]
        
        # Basic categorization
        body_lower = body.lower()
        subject_lower = subject.lower()
        
        is_resume = any(word in body_lower or word in subject_lower 
                       for word in ["resume", "cv", "curriculum vitae", "application"])
        is_job_inquiry = any(word in body_lower or word in subject_lower 
                            for word in ["job", "position", "opportunity", "hiring", "career"])
        
        if is_resume:
            email_type = "job_application"
            priority = "high"
        elif is_job_inquiry:
            email_type = "job_inquiry"
            priority = "medium"
        else:
            email_type = "other"
            priority = "low"
        
        return {
            "sender_name": sender_name,
            "sender_email": sender_email,
            "email_type": email_type,
            "is_resume": is_resume,
            "is_job_inquiry": is_job_inquiry,
            "priority": priority,
            "key_points": [subject],
            "action_required": "review" if is_resume else "none",
            "candidate_info": {},
            "summary": f"Email from {sender_name} regarding: {subject}"
        }
    
    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using sentence-transformers"""
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
            embedding = model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"❌ Error generating embedding: {e}")
            return [0.0] * 384  # Return zero vector as fallback
    
    def store_email_in_milvus(self, email_data: Dict[str, Any], email_id: str):
        """Store parsed email in Milvus database"""
        try:
            if not self.milvus_connected:
                logger.warning("⚠️  Milvus not connected, skipping storage")
                return False
            
            collection = Collection("emails")
            collection.load()
            
            # Generate embedding
            embedding_text = f"{email_data['subject']} {email_data['body'][:500]} {email_data.get('sender_name', '')}"
            embedding = self.get_embedding(embedding_text)
            
            current_time = datetime.now().isoformat()
            
            # Prepare data for Milvus
            data = [{
                "id": email_id,
                "sender_email": email_data["parsed"]["sender_email"],
                "sender_name": email_data["parsed"]["sender_name"],
                "subject": email_data["subject"],
                "body": email_data["body"][:10000],
                "received_date": email_data["date"],
                "email_type": email_data["parsed"]["email_type"],
                "is_resume": email_data["parsed"]["is_resume"],
                "is_job_inquiry": email_data["parsed"]["is_job_inquiry"],
                "priority": email_data["parsed"]["priority"],
                "extracted_data": json.dumps(email_data["parsed"]),
                "created_at": current_time,
                "embedding": embedding
            }]
            
            collection.insert(data)
            collection.flush()
            logger.info(f"✅ Stored email in Milvus: {email_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error storing email in Milvus: {e}")
            return False
    
    def fetch_and_process_emails(self, folder="INBOX", limit=10):
        """Fetch and process new emails from Gmail"""
        mail = self.connect_to_gmail()
        if not mail:
            return []
        
        processed_count = 0
        new_emails = []
        
        try:
            # Select mailbox
            mail.select(folder)
            
            # Search for unread emails
            status, messages = mail.search(None, "UNSEEN")
            
            if status != "OK":
                logger.warning("No new emails found")
                return []
            
            email_ids = messages[0].split()
            logger.info(f"📬 Found {len(email_ids)} unread emails")
            
            # Process each email
            for email_id in email_ids[-limit:]:  # Process last N emails
                email_id_str = email_id.decode()
                
                # Skip if already processed
                if email_id_str in self.processed_emails:
                    continue
                
                try:
                    # Fetch email
                    status, msg_data = mail.fetch(email_id, "(RFC822)")
                    
                    if status != "OK":
                        continue
                    
                    # Parse email
                    msg = email.message_from_bytes(msg_data[0][1])
                    
                    # Extract basic info
                    subject = decode_header(msg["Subject"])[0][0]
                    if isinstance(subject, bytes):
                        subject = subject.decode()
                    
                    sender = msg.get("From")
                    date = msg.get("Date")
                    body = self.get_email_body(msg)
                    
                    logger.info(f"📧 Processing: {subject} from {sender}")
                    
                    # Parse with AI
                    parsed_data = self.parse_email_with_ai(sender, subject, body)
                    
                    email_data = {
                        "email_id": email_id_str,
                        "sender": sender,
                        "subject": subject,
                        "body": body,
                        "date": date,
                        "parsed": parsed_data
                    }
                    
                    # Store in Milvus
                    self.store_email_in_milvus(email_data, email_id_str)
                    
                    # Mark as processed
                    self.processed_emails.add(email_id_str)
                    new_emails.append(email_data)
                    processed_count += 1
                    
                    logger.info(f"✅ Processed email: {subject}")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing email {email_id_str}: {e}")
            
            # Save processed emails list
            self.save_processed_emails()
            
            logger.info(f"✅ Processed {processed_count} new emails")
            
        except Exception as e:
            logger.error(f"❌ Error fetching emails: {e}")
        finally:
            try:
                mail.close()
                mail.logout()
            except:
                pass
        
        return new_emails
    
    def run_continuous(self, interval_seconds=60):
        """Run agent continuously, checking for new emails at regular intervals"""
        logger.info(f"🚀 Starting Gmail Agent in continuous mode (checking every {interval_seconds}s)")
        
        # Try to connect to Milvus (optional)
        if not self.connect_to_milvus():
            logger.warning("⚠️  Milvus not available. Agent will process emails without database storage.")
            logger.warning("⚠️  Emails will still be parsed and logged, but not stored in Milvus.")
            self.milvus_connected = False
        
        while True:
            try:
                logger.info("🔄 Checking for new emails...")
                new_emails = self.fetch_and_process_emails()
                
                if new_emails:
                    logger.info(f"✅ Processed {len(new_emails)} new emails")
                    for email_data in new_emails:
                        logger.info(f"  📧 {email_data['subject']} - {email_data['parsed']['email_type']}")
                else:
                    logger.info("📭 No new emails")
                
                logger.info(f"⏰ Waiting {interval_seconds} seconds before next check...")
                time.sleep(interval_seconds)
                
            except KeyboardInterrupt:
                logger.info("🛑 Gmail Agent stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in continuous loop: {e}")
                time.sleep(interval_seconds)


def main():
    """Main entry point for Gmail Agent"""
    logger.info("=" * 60)
    logger.info("🤖 GMAIL AGENT FOR RECRUITER.AI")
    logger.info("=" * 60)
    
    # Create agent
    agent = GmailAgent()
    
    # Run continuously
    agent.run_continuous(interval_seconds=60)


if __name__ == "__main__":
    main()

