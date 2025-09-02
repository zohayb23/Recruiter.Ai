# 🚀 Recruiter.AI Team Setup Guide

**Quick Setup**: Clone → Install → Run → Deploy

## 📋 Prerequisites

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Python** (3.9+) - [Download](https://python.org/)
- **Docker** - [Download](https://docker.com/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
```

### 2. Choose Your Setup

| Use Case | Setup | Time |
|----------|-------|------|
| **Frontend Only** | Local frontend + Cloud backend | 2 min |
| **Backend Only** | Local backend + Cloud frontend | 5 min |
| **Full Stack** | Local frontend + Local backend | 7 min |

---

## 🌐 Frontend Development (Local + Cloud Backend)

### Setup
```bash
cd frontend-v2
npm install
npm run dev
```

### Access
- **Local Frontend**: http://localhost:5173
- **Cloud Backend**: http://35.223.26.176:8804 (automatic)
- **Production**: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app

### How It Works
- Frontend runs locally for fast development
- Automatically connects to cloud backend
- No configuration needed
- Hot reloading enabled

---

## 🔧 Backend Development (Local + Local Frontend)

### Setup
```bash
# Backend
cd backend-full
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Start services
docker-compose up -d  # Milvus
uvicorn src.main:app --reload --port 8804  # Backend

# Frontend (new terminal)
cd ../frontend-v2
npm install
npm run dev
```

### Access
- **Local Backend**: http://localhost:8804
- **Local Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8804/docs

### Environment Variables
Create `.env` in `backend-full/`:
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-1106-preview
MILVUS_HOST=localhost
MILVUS_PORT=19530
CACHE_ENABLED=true
```

---

## 🚀 Deployment

### Frontend Changes
```bash
git add .
git commit -m "Frontend: description"
git push origin main
# Auto-deploys to Netlify in ~2 minutes
```

### Backend Changes
```bash
git add .
git commit -m "Backend: description"
git push origin main
# Auto-deploys to VM in ~5 minutes (if GitHub Action set up)
```

### Manual Backend Deployment
```bash
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a
cd /home/$USER/Recruiter.Ai
git pull origin main
sudo systemctl restart recruiter-ai
```

---

## 🔄 Automated Deployment Setup

### 1. Generate SSH Key
```bash
./scripts/setup-automated-deployment.sh
```

### 2. Add GitHub Secrets
Go to: `Settings → Secrets → Actions`
- `VM_HOST`: `35.223.26.176`
- `VM_USERNAME`: Your VM username
- `VM_SSH_KEY`: Content of `~/.ssh/github_actions_key`

### 3. Test
```bash
# Make small change
echo "# Test" >> backend-full/src/main.py
git add . && git commit -m "Test" && git push
# Check GitHub Actions tab
```

---

## 🧪 Testing Your Setup

### Frontend Development
1. Open http://localhost:5173
2. Check browser console for environment info
3. Navigate to any page (Jobs, Candidates, etc.)
4. Verify API calls go to cloud backend

### Backend Development
1. Open http://localhost:8804/docs
2. Test API endpoints
3. Check local frontend integration
4. Verify local Milvus connection

---

## 🔍 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Port 5173 in use** | `lsof -ti:5173 \| xargs kill -9` |
| **Port 8804 in use** | `lsof -ti:8804 \| xargs kill -9` |
| **Frontend won't start** | `rm -rf node_modules && npm install` |
| **Backend won't start** | Check `.env` and virtual environment |
| **Milvus issues** | `docker-compose down && docker-compose up -d` |

### Debug Commands
```bash
# Check backend status
curl http://35.223.26.176:8804/health

# View backend logs (if you have GCP access)
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f"

# Check environment
# Browser console shows: 🚀 Environment Configuration
```

---

## 📊 Development vs Production

| Aspect | Local Development | Production |
|--------|------------------|------------|
| **Frontend** | localhost:5173 | Netlify |
| **Backend** | localhost:8804 or cloud | Cloud VM |
| **Database** | Empty local Milvus | 16 resumes, 4 jobs |
| **API Keys** | Your OpenAI key | Team OpenAI key |
| **Performance** | Fast local | Network latency |

---

## 🎯 Development Workflow

### 1. **Develop Locally**
- Make changes in local environment
- Test thoroughly before committing

### 2. **Commit & Push**
- Use descriptive commit messages
- Push to main branch

### 3. **Auto-Deploy**
- Frontend: Netlify (2 min)
- Backend: GCP VM (5 min)

### 4. **Verify Production**
- Test deployed changes
- Monitor logs if issues

---

## 📁 Project Structure

```
Recruiter.AI/
├── frontend-v2/          # React frontend
│   ├── src/
│   │   ├── pages/       # Main pages
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API services
│   │   └── config/      # Environment config
│   └── package.json
├── backend-full/         # FastAPI backend
│   ├── src/
│   │   ├── routers/     # API endpoints
│   │   ├── services/    # Business logic
│   │   └── models/      # Data models
│   └── requirements.txt
└── scripts/              # Setup scripts
```

---

## 🚨 Important Notes

### Security
- **Never commit API keys**
- **Local development**: Your OpenAI key
- **Production**: Team OpenAI key

### Data
- **Local Milvus**: Starts empty
- **Cloud backend**: Has production data
- **Upload test resumes** for local development

### Costs
- **Resume parsing**: ~$0.01-0.03 each
- **Local development**: Your OpenAI costs
- **Production**: Team OpenAI costs

---

## 🆘 Getting Help

### Team Resources
- **Backend Issues**: Check if cloud backend is running
- **Frontend Issues**: Check browser console
- **Deployment Issues**: Check GitHub Actions

### Useful Commands
```bash
# Check backend health
curl http://35.223.26.176:8804/health

# View backend logs
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f"

# Clear frontend cache
rm -rf node_modules package-lock.json && npm install
```

---

## 🎉 You're Ready!

Your development environment is now:
- ✅ **Frontend**: Fast local development
- ✅ **Backend**: Local or cloud options
- ✅ **Deployment**: Automated via GitHub
- ✅ **Production**: Connected and ready

**Start building amazing features!** 🚀

---

**Need help?** Check browser console for debug info or ask the team lead.
