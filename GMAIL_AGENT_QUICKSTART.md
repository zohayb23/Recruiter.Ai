# 🚀 Gmail Agent - Quick Start (5 Minutes)

## One-Page Setup Guide

### 📋 Prerequisites
- ✅ Gmail account
- ✅ OpenAI API key (already set)
- ✅ Milvus running
- ✅ Python 3.9+

---

## 🎯 3 Steps to Start

### 1️⃣ Get Gmail App Password (2 minutes)
```
1. Visit: https://myaccount.google.com/apppasswords
2. Select: Mail → Other → "Recruiter.AI"
3. Copy: 16-character password
```

### 2️⃣ Configure (1 minute)
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-16-char-password"
export OPENAI_API_KEY="already-set"
```

### 3️⃣ Start (1 minute)
```bash
cd /Users/fayzanbhatti/Recruiter.Ai

# Test first
python3 test_gmail_agent.py

# Start agent
./start_gmail_agent.sh
```

**Done!** 🎉

---

## 📊 Verify It's Working

### Check via API:
```bash
# List all emails
curl http://localhost:8804/api/emails/list

# Check agent status
curl http://localhost:8804/api/emails/health/agent-status

# View stats
curl http://localhost:8804/api/emails/stats/overview
```

### Check Logs:
```bash
tail -f gmail_agent.log
```

---

## 🎯 Common Commands

### Start Agent:
```bash
# Foreground (testing)
python3 -m backend.services.gmail_agent

# Background (production)
nohup python3 -m backend.services.gmail_agent > gmail_agent.log 2>&1 &
```

### Stop Agent:
```bash
# Find process
ps aux | grep gmail_agent

# Kill process
kill <PID>
```

### View Logs:
```bash
# Real-time
tail -f gmail_agent.log

# Last 50 lines
tail -50 gmail_agent.log

# Search for errors
grep "❌" gmail_agent.log
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/emails/list` | GET | List all emails |
| `/api/emails/{id}` | GET | Get email details |
| `/api/emails/search/semantic` | GET | Semantic search |
| `/api/emails/stats/overview` | GET | Email statistics |
| `/api/emails/{id}` | DELETE | Delete email |
| `/api/emails/health/agent-status` | GET | Agent status |

---

## 🎯 Quick Examples

### List high-priority emails:
```bash
curl "http://localhost:8804/api/emails/list?priority=high"
```

### Find emails with resumes:
```bash
curl "http://localhost:8804/api/emails/list?is_resume=true"
```

### Search for Python developers:
```bash
curl "http://localhost:8804/api/emails/search/semantic?query=python+developer"
```

### Get today's email count:
```bash
curl "http://localhost:8804/api/emails/stats/overview"
```

---

## 🐛 Troubleshooting

### Issue: "Gmail credentials not found"
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="your-16-char-password"
```

### Issue: "Failed to connect to Gmail"
- Use App Password (not regular password)
- Generate at: https://myaccount.google.com/apppasswords

### Issue: "Milvus not found"
```bash
docker ps | grep milvus  # Check if running
docker-compose up -d milvus  # Start if needed
```

### Issue: Agent stops
```bash
# Run in background
nohup python3 -m backend.services.gmail_agent > gmail_agent.log 2>&1 &
```

---

## 📚 Full Documentation

For detailed information:
- **User Guide**: `GMAIL_AGENT_README.md`
- **Setup Guide**: `GMAIL_AGENT_SETUP.md`
- **Technical Details**: `GMAIL_AGENT_IMPLEMENTATION.md`
- **Architecture**: `GMAIL_AGENT_ARCHITECTURE.md`

---

## ✅ Quick Checklist

- [ ] Gmail App Password generated
- [ ] Environment variables set
- [ ] Test suite passed
- [ ] Agent started
- [ ] Test email sent
- [ ] Verified via API
- [ ] Logs monitoring

---

## 🎉 That's It!

Your Gmail Agent is now:
- ✅ Monitoring Gmail every 60 seconds
- ✅ Parsing emails with AI
- ✅ Storing in Milvus database
- ✅ Accessible via REST API
- ✅ Running 24/7 automatically

**No more manual email processing!** 🚀

---

**Questions?** Check the full documentation files listed above.

