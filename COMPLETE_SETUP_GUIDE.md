# 🚀 Recruiter.AI Complete Setup Guide

**Everything you need to set up, develop, and deploy Recruiter.AI**

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Quick Start](#-quick-start)
3. [Development Setup](#-development-setup)
4. [Team Member Access](#-team-member-access)
5. [Deployment](#-deployment)
6. [Troubleshooting](#-troubleshooting)
7. [Project Structure](#-project-structure)

---

## 🎯 Prerequisites

### **Required Software**
- **Git** (latest version)
- **Node.js** (v18 or higher)
- **Python** (3.9 or higher)
- **Docker Desktop** (latest version)
- **OpenAI API Key** (required for AI features)

### **Platform-Specific**
- **macOS**: Homebrew recommended
- **Windows**: WSL2 recommended, or Git Bash/PowerShell
- **Linux**: Standard package manager

---

## 🚀 Quick Start

### **Choose Your Setup Type**

| Use Case | Setup | Time | Best For |
|----------|-------|------|----------|
| **Frontend Only** | Local frontend + Cloud backend | 2 min | UI/UX development |
| **Backend Only** | Local backend + Cloud frontend | 5 min | API development |
| **Full Stack** | Local frontend + Local backend | 7 min | End-to-end development |

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI
```

### **2. Environment Setup**
```bash
# Copy environment file
cp .env.example backend-full/.env

# Edit with your OpenAI API key
# OPENAI_API_KEY=your_actual_api_key_here
```

---

## 🔧 Development Setup

### **Frontend Development (Local + Cloud Backend)**

#### **Setup**
```bash
cd frontend-v2
npm install
npm run dev
```

#### **Access & Configuration**
- **Local Frontend**: http://localhost:5173
- **Cloud Backend**: http://35.223.26.176:8804 (automatic)
- **Production**: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app

#### **How It Works**
- Frontend runs locally for fast development
- Automatically connects to cloud backend
- Hot reloading enabled
- No additional configuration needed

---

### **Backend Development (Local + Local Frontend)**

#### **Setup**
```bash
# Backend
cd backend-full
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows Command Prompt:
venv\Scripts\activate.bat
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start services
docker-compose up -d  # Milvus database
uvicorn src.main:app --reload --port 8804  # Backend API
```

#### **Frontend (New Terminal)**
```bash
cd ../frontend-v2
npm install
npm run dev
```

#### **Access**
- **Local Backend**: http://localhost:8804
- **Local Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8804/docs
- **Milvus Attu**: http://localhost:8000

---

### **Environment Variables**

Create `.env` in `backend-full/`:
```env
# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-1106-preview

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Performance Tuning
CACHE_ENABLED=true
SUPPRESS_HF_WARNINGS=true
PORT=8804
```

---

## 👥 Team Member Access

### **Adding New Team Members**

#### **Step 1: GCP IAM Access**
1. Go to: https://console.cloud.google.com/iam-admin/iam?project=recruiter-ai-468020
2. Click "GRANT ACCESS"
3. Add teammate's email
4. Assign role: `Compute Instance Admin (v1)`
5. Click "SAVE"

#### **Step 2: Teammate Setup**
```bash
# Teammate runs this script
./scripts/setup-teammate-access.sh
```

**What the script does:**
- Installs Google Cloud CLI
- Authenticates with GCP
- Sets up SSH keys
- Tests VM access
- Configures deployment workflow

---

### **Team Member Permissions**

| Role | What They Can Do | What They Cannot Do |
|------|------------------|---------------------|
| **Compute Instance Admin** | ✅ Deploy backend changes<br>✅ Restart services<br>✅ SSH into VM<br>✅ View logs | ❌ Delete infrastructure<br>❌ Modify billing<br>❌ Change IAM |
| **Compute Viewer** | ✅ View VM details<br>✅ Monitor performance | ❌ Make changes<br>❌ Deploy code |
| **Service Account User** | ✅ Use service accounts<br>✅ Access APIs | ❌ Modify accounts<br>❌ Change permissions |

---

## 🚀 Deployment

### **Frontend Deployment (Automatic)**

```bash
# Make changes locally
git add .
git commit -m "Frontend: feature description"
git push origin main

# Automatically deploys to Netlify in ~2 minutes
# Check: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app
```

### **Backend Deployment**

#### **Method 1: Direct SSH (Fastest - 2 min)**
```bash
# Deploy directly to cloud VM
ssh $USER@35.223.26.176
cd /home/$USER/Recruiter.Ai
git pull origin main
sudo systemctl restart recruiter-ai
sudo systemctl status recruiter-ai
exit
```

#### **Method 2: GitHub Actions (Automatic - 5 min)**

**Setup (One-time)**:
```bash
# Generate SSH key for automated deployment
./scripts/setup-automated-deployment.sh

# Add GitHub secrets (Settings → Secrets → Actions):
# VM_HOST: 35.223.26.176
# VM_USERNAME: Your VM username
# VM_SSH_KEY: Content of generated SSH key
```

**Daily Workflow**:
```bash
# Make changes and test locally
git add .
git commit -m "Backend: feature description"
git push origin main

# GitHub Action automatically deploys to VM
# Check: GitHub → Actions tab
```

---

### **Deployment Commands Reference**

| Command | Purpose |
|---------|---------|
| `sudo systemctl restart recruiter-ai` | Restart backend service |
| `sudo systemctl status recruiter-ai` | Check service status |
| `sudo journalctl -u recruiter-ai -f` | View real-time logs |
| `gcloud compute ssh recruiter-ai-vm --zone=us-central1-a` | SSH via GCP CLI |

---

## 🔍 Troubleshooting

### **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| **Port 5173 in use** | `lsof -ti:5173 \| xargs kill -9` |
| **Port 8804 in use** | `lsof -ti:8804 \| xargs kill -9` |
| **Frontend won't start** | `rm -rf node_modules && npm install` |
| **Backend won't start** | Check `.env` and virtual environment |
| **Milvus issues** | `docker-compose down && docker-compose up -d` |
| **Permission denied** | Check GCP IAM roles |
| **SSH connection failed** | Generate and copy SSH keys |

---

### **Debug Commands**

```bash
# Check backend health
curl http://35.223.26.176:8804/health

# View backend logs (if you have GCP access)
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f"

# Check environment
# Browser console shows: 🚀 Environment Configuration

# Kill conflicting processes
lsof -ti:8804 | xargs kill -9  # Backend port
lsof -ti:5173 | xargs kill -9  # Frontend port
```

---

### **Windows-Specific Issues**

#### **PowerShell Execution Policy Error**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then use:
.\venv\Scripts\Activate.ps1
```

#### **Virtual Environment Activation**
- **Command Prompt**: `venv\Scripts\activate.bat`
- **PowerShell**: `.\venv\Scripts\Activate.ps1`
- **Git Bash**: `source venv/Scripts/activate`

---

## 📁 Project Structure

```
Recruiter.AI/
├── frontend-v2/              # React frontend
│   ├── src/
│   │   ├── pages/           # Main pages
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API services
│   │   └── config/          # Environment config
│   └── package.json
├── backend-full/             # FastAPI backend
│   ├── src/
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── models/          # Data models
│   ├── requirements.txt
│   └── .env                 # Environment variables
├── scripts/                  # Setup & deployment scripts
├── docker-compose.yml        # Milvus database services
└── .github/                  # CI/CD workflows
```

---

## 🔄 Development Workflow

### **Daily Development Cycle**

```bash
# 1. Start local development
cd backend-full
source venv/bin/activate
uvicorn src.main:app --reload --port 8804

# 2. Make changes and test locally
# 3. Commit changes
git add .
git commit -m "Feature: description"
git push origin main

# 4. Deploy to production (choose method)
```

### **Starting Development**
```bash
# Terminal 1: Start Docker services
docker-compose up -d

# Terminal 2: Start backend
cd backend-full
source venv/bin/activate
uvicorn src.main:app --reload --port 8804

# Terminal 3: Start frontend
cd frontend-v2
npm run dev
```

### **Stopping Development**
```bash
# Stop frontend: Ctrl+C in frontend terminal
# Stop backend: Ctrl+C in backend terminal
# Stop Docker services
docker-compose down
```

---

## 📊 Development vs Production

| Aspect | Local Development | Production |
|--------|------------------|------------|
| **Frontend** | localhost:5173 | Netlify |
| **Backend** | localhost:8804 or cloud | Cloud VM (35.223.26.176:8804) |
| **Database** | Empty local Milvus | 16 resumes, 4 jobs |
| **API Keys** | Your OpenAI key | Team OpenAI key |
| **Performance** | Fast local | Network latency |

---

## 🚨 Important Notes

### **Security**
- **Never commit API keys**
- **Local development**: Your OpenAI key
- **Production**: Team OpenAI key
- **Keep `.env` files local**

### **Data Management**
- **Local Milvus**: Starts empty
- **Cloud backend**: Has production data
- **Upload test resumes** for local development
- **Backup important data** before major changes

### **Cost Management**
- **Resume parsing**: ~$0.01-0.03 each
- **Local development**: Your OpenAI costs
- **Production**: Team OpenAI costs
- **Monitor usage** regularly

---

## 🆘 Getting Help

### **Team Resources**
- **Backend Issues**: Check if cloud backend is running
- **Frontend Issues**: Check browser console
- **Deployment Issues**: Check GitHub Actions
- **GCP Issues**: Check IAM permissions

### **Useful Commands**
```bash
# Check backend health
curl http://35.223.26.176:8804/health

# View backend logs
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="sudo journalctl -u recruiter-ai.service -f"

# Clear frontend cache
rm -rf node_modules package-lock.json && npm install

# Check all running services
docker ps
```

---

## 🎯 Quick Reference

### **Access URLs**
- **Local Frontend**: http://localhost:5173
- **Local Backend**: http://localhost:8804
- **Cloud Backend**: http://35.223.26.176:8804
- **Production Frontend**: https://playful-biscuit-e5d6e1-recruiter-ai.netlify.app
- **API Docs**: http://localhost:8804/docs or http://35.223.26.176:8804/docs

### **Key Commands**
```bash
# Start backend
cd backend-full && source venv/bin/activate && uvicorn src.main:app --reload --port 8804

# Start frontend
cd frontend-v2 && npm run dev

# Deploy backend
ssh $USER@35.223.26.176 && cd Recruiter.Ai && git pull && sudo systemctl restart recruiter-ai

# Check service status
sudo systemctl status recruiter-ai
```

---

## 🎉 You're Ready!

Your development environment is now:
- ✅ **Frontend**: Fast local development with hot reloading
- ✅ **Backend**: Local or cloud options
- ✅ **Database**: Local Milvus for development
- ✅ **Deployment**: Automated via GitHub Actions
- ✅ **Production**: Connected and ready
- ✅ **Team Access**: Configured for collaboration

**Start building amazing features!** 🚀

---

## 📞 Support

**Need help?**
1. Check the troubleshooting section above
2. Look at browser console for debug info
3. Check GitHub Actions for deployment status
4. Ask your team lead

**Remember**: The setup script (`./scripts/setup-teammate-access.sh`) handles most configuration automatically!

---

*Last updated: September 2024*
