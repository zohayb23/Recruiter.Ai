# 📧 Gmail Agent Setup Guide

## Overview
The Gmail Agent is a fully automated service that monitors your Gmail inbox, parses incoming emails using AI, and stores them in your Milvus database. Perfect for automatically processing job applications, candidate inquiries, and recruitment emails.

## ✨ Features

- **🤖 Fully Automated**: Runs continuously without any manual intervention
- **🧠 AI-Powered Parsing**: Uses OpenAI GPT-4 to intelligently parse and categorize emails
- **📊 Structured Data**: Extracts sender info, email type, priority, and key points
- **🔍 Smart Categorization**: Automatically identifies job applications, resumes, and inquiries
- **💾 Milvus Integration**: Stores all parsed emails in your existing Milvus database
- **🔄 Real-time Processing**: Checks for new emails every 60 seconds (configurable)
- **📝 Duplicate Detection**: Tracks processed emails to avoid reprocessing

## 🚀 Quick Start

### Step 1: Enable Gmail API Access

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Click **Select app** → Choose **Mail**
5. Click **Select device** → Choose **Other** → Type "Recruiter.AI Agent"
6. Click **Generate**
7. Copy the 16-character password (you'll use this below)

### Step 2: Set Environment Variables

Add these to your environment (`.env` file or shell):

```bash
# Gmail Credentials
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-16-char-app-password"

# OpenAI API Key (already set)
export OPENAI_API_KEY="your-openai-api-key"

# Milvus Configuration (uses existing setup)
export MILVUS_HOST="localhost"
export MILVUS_PORT="19530"
```

### Step 3: Install Required Dependencies

```bash
cd /Users/fayzanbhatti/Recruiter.Ai
pip install sentence-transformers
```

### Step 4: Run the Gmail Agent

```bash
# Run in foreground (for testing)
python3 -m backend.services.gmail_agent

# Run in background (for production)
nohup python3 -m backend.services.gmail_agent > gmail_agent.log 2>&1 &
```

## 📊 Email Data Structure

Each email is parsed and stored with the following structure:

```json
{
  "id": "unique-email-id",
  "sender_email": "john.doe@example.com",
  "sender_name": "John Doe",
  "subject": "Application for Software Engineer Position",
  "body": "Full email body text...",
  "received_date": "2025-11-02T10:30:00",
  "email_type": "job_application",
  "is_resume": true,
  "is_job_inquiry": true,
  "priority": "high",
  "extracted_data": {
    "key_points": ["Has 5 years experience", "Expert in Python and React", "Available immediately"],
    "action_required": "review_resume",
    "candidate_info": {
      "name": "John Doe",
      "phone": "+1234567890",
      "skills": ["Python", "React", "Node.js"],
      "experience": "5 years"
    },
    "summary": "Experienced software engineer applying for position with strong full-stack skills."
  },
  "created_at": "2025-11-02T10:31:00",
  "embedding": [0.123, 0.456, ...]
}
```

## 🎯 Email Categorization

The agent automatically categorizes emails into:

- **job_application**: Contains resume/CV or job application
- **job_inquiry**: Questions about job opportunities
- **recruitment_outreach**: Recruiting messages
- **networking**: Professional networking
- **spam**: Spam or irrelevant emails
- **other**: Uncategorized emails

## 🔍 Priority Levels

- **High**: Job applications, resumes, urgent inquiries
- **Medium**: General job inquiries, networking
- **Low**: Other emails, spam

## 📡 API Integration

Access parsed emails through your existing backend:

```python
from pymilvus import Collection

# Get all emails
collection = Collection("emails")
collection.load()
results = collection.query(
    expr="priority == 'high'",
    output_fields=["sender_email", "subject", "email_type", "extracted_data"]
)

# Search emails by similarity
search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=10,
    output_fields=["sender_email", "subject", "body"]
)
```

## 🛠️ Configuration

### Adjust Check Interval

Edit the interval in `gmail_agent.py`:

```python
# Check every 60 seconds (default)
agent.run_continuous(interval_seconds=60)

# Check every 5 minutes
agent.run_continuous(interval_seconds=300)

# Check every 30 seconds (more frequent)
agent.run_continuous(interval_seconds=30)
```

### Change Email Folder

By default, the agent monitors the INBOX. To monitor a different folder:

```python
agent.fetch_and_process_emails(folder="[Gmail]/Important", limit=10)
```

### Limit Number of Emails Processed

```python
# Process last 10 emails (default)
agent.fetch_and_process_emails(limit=10)

# Process last 50 emails
agent.fetch_and_process_emails(limit=50)
```

## 📊 Monitoring

### Check Logs

```bash
# View real-time logs
tail -f gmail_agent.log

# View processed emails count
grep "Processed.*emails" gmail_agent.log

# View errors
grep "❌" gmail_agent.log
```

### Check Processed Emails

The agent maintains a file `processed_emails.json` with all processed email IDs to prevent reprocessing.

```bash
# Count processed emails
cat processed_emails.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))"
```

## 🔧 Troubleshooting

### Issue: "Gmail credentials not found"
**Solution**: Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables

### Issue: "Failed to connect to Gmail"
**Solution**: Make sure you're using an **App Password**, not your regular Gmail password

### Issue: "OpenAI API key not found"
**Solution**: The agent will still work with basic parsing. Set `OPENAI_API_KEY` for AI-powered parsing

### Issue: "Failed to connect to Milvus"
**Solution**: Ensure Milvus is running:
```bash
docker ps | grep milvus
```

### Issue: Agent stops unexpectedly
**Solution**: Check logs for errors. Run with `nohup` for persistent background operation

## 🎯 Use Cases

1. **Automatic Job Application Processing**: Automatically parse and store all incoming job applications
2. **Resume Collection**: Build a database of candidate resumes from email submissions
3. **Lead Tracking**: Track all recruitment inquiries and outreach responses
4. **Email Analytics**: Analyze email patterns, sender trends, and response rates
5. **Automated Screening**: AI categorizes and prioritizes emails for manual review

## 🔐 Security Best Practices

1. **Never share your App Password** - treat it like a real password
2. **Rotate App Passwords regularly** - generate new ones every 3-6 months
3. **Use environment variables** - never hardcode credentials
4. **Monitor logs** - check for suspicious activity
5. **Limit permissions** - the agent only needs read access to emails

## 🚀 Production Deployment

### Using systemd (Linux)

Create `/etc/systemd/system/gmail-agent.service`:

```ini
[Unit]
Description=Recruiter.AI Gmail Agent
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/Users/fayzanbhatti/Recruiter.Ai
Environment="GMAIL_USER=your-email@gmail.com"
Environment="GMAIL_APP_PASSWORD=your-app-password"
Environment="OPENAI_API_KEY=your-openai-key"
ExecStart=/usr/bin/python3 -m backend.services.gmail_agent
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable gmail-agent
sudo systemctl start gmail-agent
sudo systemctl status gmail-agent
```

### Using Docker

Create `Dockerfile.gmail-agent`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend backend/

ENV GMAIL_USER=""
ENV GMAIL_APP_PASSWORD=""
ENV OPENAI_API_KEY=""
ENV MILVUS_HOST="host.docker.internal"

CMD ["python", "-m", "backend.services.gmail_agent"]
```

Build and run:
```bash
docker build -f Dockerfile.gmail-agent -t gmail-agent .
docker run -d --name gmail-agent \
  -e GMAIL_USER="your-email@gmail.com" \
  -e GMAIL_APP_PASSWORD="your-app-password" \
  -e OPENAI_API_KEY="your-key" \
  gmail-agent
```

## 📈 Future Enhancements

- [ ] Email response automation
- [ ] Attachment extraction and parsing
- [ ] Multi-folder monitoring
- [ ] Custom parsing rules
- [ ] Email threading and conversation tracking
- [ ] Webhook notifications for high-priority emails
- [ ] Integration with frontend dashboard
- [ ] Automatic candidate profile creation from application emails

## 📞 Support

For issues or questions, check the logs first:
```bash
tail -100 gmail_agent.log
```

Common solutions:
1. Restart the agent
2. Check environment variables
3. Verify Milvus connection
4. Regenerate Gmail App Password
5. Check OpenAI API quota

---

**🎉 Your Gmail Agent is now fully automated! It will continuously monitor your inbox and process all incoming emails without any manual intervention.**

