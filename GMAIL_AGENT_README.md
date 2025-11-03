# 🤖 Gmail Agent - Automated Email Processing for Recruiter.AI

## 🎯 What is the Gmail Agent?

The Gmail Agent is a **fully automated background service** that monitors your Gmail inbox, intelligently parses incoming emails using AI, and stores them in your Milvus database - all without any manual intervention.

Perfect for recruitment teams who want to automatically process:
- ✅ Job applications sent via email
- ✅ Resume submissions
- ✅ Candidate inquiries
- ✅ Recruitment outreach responses
- ✅ Networking emails
- ✅ Any recruitment-related communication

## 🚀 Key Features

### 🤖 Fully Automated
- Runs continuously in the background
- Checks for new emails every 60 seconds (configurable)
- No manual clicks or intervention required
- Processes emails 24/7

### 🧠 AI-Powered Intelligence
- Uses OpenAI GPT-4 to understand email content
- Automatically categorizes emails (job_application, job_inquiry, networking, etc.)
- Extracts key information (sender details, skills, experience)
- Assigns priority levels (high/medium/low)
- Identifies resumes and job-related emails

### 💾 Seamless Milvus Integration
- Stores all parsed emails in your existing Milvus database
- Creates structured, searchable records
- Enables semantic search through all emails
- Uses the same Milvus instance as your resumes and jobs

### 🔍 Smart Features
- **Duplicate Detection**: Tracks processed emails to avoid reprocessing
- **Semantic Search**: Find emails by meaning, not just keywords
- **Resume Detection**: Automatically flags emails containing resumes
- **Priority Assignment**: High priority for applications, medium for inquiries
- **Candidate Info Extraction**: Pulls out names, contact info, skills from emails

## 📦 What's Included

```
backend/
├── services/
│   └── gmail_agent.py          # Main Gmail agent service
├── routes/
│   └── email_routes.py         # API endpoints for email management
├── GMAIL_AGENT_SETUP.md        # Detailed setup guide
├── start_gmail_agent.sh        # Quick start script
└── test_gmail_agent.py         # Setup verification script
```

## ⚡ Quick Start (5 Minutes)

### Step 1: Get Gmail App Password (2 minutes)

1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** → **Other** → Type "Recruiter.AI"
3. Copy the 16-character password

### Step 2: Configure Environment (1 minute)

```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-16-char-app-password"
export OPENAI_API_KEY="your-openai-key"  # Already set
```

### Step 3: Test Setup (1 minute)

```bash
python3 test_gmail_agent.py
```

### Step 4: Start Agent (1 minute)

```bash
# Option A: Use the start script
./start_gmail_agent.sh

# Option B: Run directly
python3 -m backend.services.gmail_agent

# Option C: Run in background
nohup python3 -m backend.services.gmail_agent > gmail_agent.log 2>&1 &
```

That's it! Your agent is now running and will automatically process all incoming emails.

## 📊 How It Works

```
┌─────────────────┐
│  Gmail Inbox    │
│  New Email ✉️   │
└────────┬────────┘
         │
         ├─── Agent checks every 60 seconds
         │
         ▼
┌─────────────────┐
│  Gmail Agent    │
│  🤖 Processing  │
└────────┬────────┘
         │
         ├─── Extract: sender, subject, body
         ├─── Parse with AI (OpenAI GPT-4)
         ├─── Categorize & prioritize
         ├─── Extract structured data
         │
         ▼
┌─────────────────┐
│  Milvus DB      │
│  💾 Stored      │
└────────┬────────┘
         │
         ├─── Searchable
         ├─── Analyzable
         ├─── Retrievable via API
         │
         ▼
┌─────────────────┐
│  Your Backend   │
│  📊 Dashboard   │
└─────────────────┘
```

## 🔌 API Endpoints

The Gmail Agent automatically creates these endpoints in your backend:

### 📋 List All Emails
```bash
GET /api/emails/list?limit=50&priority=high&is_resume=true
```

### 📧 Get Specific Email
```bash
GET /api/emails/{email_id}
```

### 🔍 Semantic Search
```bash
GET /api/emails/search/semantic?query=software engineer with python&limit=10
```

### 📊 Email Statistics
```bash
GET /api/emails/stats/overview
```

### 🗑️ Delete Email
```bash
DELETE /api/emails/{email_id}
```

### ❤️ Agent Health Check
```bash
GET /api/emails/health/agent-status
```

## 📈 Example Email Record

When an email is processed, it creates a structured record like this:

```json
{
  "id": "12345",
  "sender_email": "john.doe@example.com",
  "sender_name": "John Doe",
  "subject": "Application for Senior Software Engineer",
  "body": "Dear Hiring Manager, I am writing to apply...",
  "received_date": "Mon, 02 Nov 2025 10:30:00 +0000",
  "email_type": "job_application",
  "is_resume": true,
  "is_job_inquiry": true,
  "priority": "high",
  "extracted_data": {
    "sender_name": "John Doe",
    "sender_email": "john.doe@example.com",
    "email_type": "job_application",
    "key_points": [
      "5 years of Python experience",
      "Expert in React and Node.js",
      "Available for immediate start"
    ],
    "action_required": "review_resume",
    "candidate_info": {
      "name": "John Doe",
      "phone": "+1 (555) 123-4567",
      "skills": ["Python", "React", "Node.js", "AWS"],
      "experience": "5 years"
    },
    "summary": "Experienced software engineer applying for senior position with strong full-stack background and immediate availability."
  },
  "created_at": "2025-11-02T10:31:00"
}
```

## 🎯 Use Cases

### 1. Automatic Application Tracking
Every job application email is automatically:
- Extracted and parsed
- Stored in searchable database
- Flagged as high priority
- Ready for review in your dashboard

### 2. Resume Collection
Build a database of candidate resumes from email submissions:
- Automatic detection of resume-containing emails
- Structured candidate information extraction
- Easy search and retrieval

### 3. Inquiry Management
Never miss a candidate inquiry:
- All inquiries automatically categorized
- Priority assignment for urgent requests
- Complete email history in one place

### 4. Email Analytics
Analyze your recruitment email patterns:
- Track application volumes
- Identify peak times
- Measure response rates
- Monitor email types

### 5. Semantic Search
Find emails by meaning, not just keywords:
```bash
# Find all emails about Python developers
GET /api/emails/search/semantic?query=python developer experience

# Find urgent application emails
GET /api/emails/search/semantic?query=immediate availability senior engineer
```

## 🛠️ Configuration Options

### Adjust Check Frequency
Edit `backend/services/gmail_agent.py`:
```python
# Check every 30 seconds (more frequent)
agent.run_continuous(interval_seconds=30)

# Check every 5 minutes (less frequent)
agent.run_continuous(interval_seconds=300)
```

### Monitor Different Folders
```python
# Monitor Starred emails
agent.fetch_and_process_emails(folder="[Gmail]/Starred")

# Monitor specific label
agent.fetch_and_process_emails(folder="Jobs")
```

### Process More Emails
```python
# Process last 50 emails instead of 10
agent.fetch_and_process_emails(limit=50)
```

## 📊 Monitoring & Logs

### View Real-Time Activity
```bash
tail -f gmail_agent.log
```

### Check Processed Count
```bash
grep "Processed.*emails" gmail_agent.log | tail -10
```

### View Errors
```bash
grep "❌" gmail_agent.log
```

### Check Status
```bash
curl http://localhost:8804/api/emails/health/agent-status
```

## 🔐 Security Best Practices

✅ **DO:**
- Use Gmail App Passwords (not regular password)
- Store credentials in environment variables
- Rotate App Passwords every 3-6 months
- Monitor logs for suspicious activity
- Use HTTPS in production

❌ **DON'T:**
- Hardcode credentials in code
- Share App Passwords
- Commit credentials to git
- Use regular Gmail password
- Run without monitoring

## 🐛 Troubleshooting

### Problem: "Gmail credentials not found"
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-app-password"
```

### Problem: "Failed to connect to Gmail"
- Make sure you're using an **App Password**, not regular password
- Generate new one at: https://myaccount.google.com/apppasswords

### Problem: "Failed to connect to Milvus"
```bash
# Check if Milvus is running
docker ps | grep milvus

# Start Milvus if needed
docker-compose up -d milvus
```

### Problem: Agent stops unexpectedly
```bash
# Run in background with nohup
nohup python3 -m backend.services.gmail_agent > gmail_agent.log 2>&1 &

# Check logs for errors
tail -50 gmail_agent.log
```

## 🚀 Production Deployment

### Option 1: systemd Service (Linux)
```bash
sudo cp gmail-agent.service /etc/systemd/system/
sudo systemctl enable gmail-agent
sudo systemctl start gmail-agent
```

### Option 2: Docker Container
```bash
docker build -f Dockerfile.gmail-agent -t gmail-agent .
docker run -d --name gmail-agent \
  -e GMAIL_USER="your-email" \
  -e GMAIL_APP_PASSWORD="your-password" \
  gmail-agent
```

### Option 3: Background Process
```bash
nohup ./start_gmail_agent.sh > gmail_agent.log 2>&1 &
```

## 📈 Performance

- **Processing Speed**: ~2-3 seconds per email (with AI)
- **Check Interval**: Every 60 seconds (configurable)
- **Memory Usage**: ~200-300 MB
- **CPU Usage**: Low (~5% during processing)
- **Storage**: Minimal (only email IDs tracked locally)

## 🔮 Future Enhancements

- [ ] Automatic email responses
- [ ] Attachment extraction and parsing
- [ ] Email threading and conversation tracking
- [ ] Custom parsing rules and filters
- [ ] Webhook notifications
- [ ] Multi-account support
- [ ] Integration with calendar for interview scheduling
- [ ] Automatic candidate profile creation

## 📚 Additional Resources

- **Full Setup Guide**: `GMAIL_AGENT_SETUP.md`
- **Test Script**: `test_gmail_agent.py`
- **Start Script**: `start_gmail_agent.sh`
- **Service Code**: `backend/services/gmail_agent.py`
- **API Routes**: `backend/routes/email_routes.py`

## 💡 Tips

1. **Start with test mode**: Process a few emails first to verify setup
2. **Monitor logs initially**: Watch for any issues in the first hour
3. **Adjust frequency**: Start with 60s, adjust based on email volume
4. **Use filters**: Set up Gmail filters to organize recruitment emails
5. **Regular backups**: Backup your Milvus data regularly

## 🎉 Benefits

✅ **Save Time**: No more manual email checking and categorization  
✅ **Never Miss Applications**: 24/7 automatic monitoring  
✅ **Better Organization**: All emails structured and searchable  
✅ **AI Intelligence**: Smart categorization and extraction  
✅ **Easy Integration**: Works with existing Milvus database  
✅ **Scalable**: Handles high email volumes effortlessly  

---

**Ready to automate your recruitment email processing? Follow the Quick Start guide above!** 🚀

For questions or issues, check the troubleshooting section or review the logs.

