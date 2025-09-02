# 🚀 Teammate Setup Guide - Recruiter.AI Backend

**You've been added to the GCP project! Here's how to get started deploying backend changes.**

---

## 📋 **Quick Setup (5 minutes)**

### **1. Install Google Cloud CLI**
```bash
# macOS
brew install google-cloud-sdk

# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### **2. Run Setup Script**
```bash
# Clone the repo
git clone https://github.com/yourusername/Recruiter.AI.git
cd Recruiter.AI

# Run the setup script
./scripts/setup-teammate-access.sh
```

**That's it!** The script will handle everything else automatically.

---

## 🔄 **Daily Workflow**

### **1. Develop Locally**
```bash
cd backend-full
source venv/bin/activate
uvicorn src.main:app --reload --port 8804
```

### **2. Make Changes & Test**
- Edit your files
- Test locally at http://localhost:8804/docs

### **3. Deploy to Production**

**Option A: Direct SSH (Fastest - 2 min)**
```bash
ssh $USER@35.223.26.176
cd /home/$USER/Recruiter.Ai
git pull origin main
sudo systemctl restart recruiter-ai
exit
```

**Option B: GitHub Actions (Automatic - 5 min)**
```bash
git add .
git commit -m "Backend: your feature"
git push origin main
# Check GitHub Actions tab for deployment status
```

---

## 🔍 **Useful Commands**

| Command | What It Does |
|---------|--------------|
| `gcloud compute instances list` | See all VMs |
| `gcloud compute ssh recruiter-ai-vm --zone=us-central1-a` | SSH to backend VM |
| `ssh $USER@35.223.26.176` | Direct SSH to VM |
| `sudo systemctl status recruiter-ai` | Check backend service status |
| `sudo journalctl -u recruiter-ai -f` | View backend logs |

---

## 🚨 **Troubleshooting**

| Issue | Solution |
|-------|----------|
| **"Permission denied"** | Contact team lead - you need IAM access |
| **SSH fails** | Run the setup script again |
| **Service won't restart** | Check logs: `sudo journalctl -u recruiter-ai -f` |
| **Port conflicts** | Kill process: `lsof -ti:8804 \| xargs kill -9` |

---

## 📊 **Your Access**

- **GCP Project**: `recruiter-ai-468020`
- **Backend VM**: `recruiter-ai-vm` (35.223.26.176)
- **Backend Port**: 8804
- **Service**: `recruiter-ai`

---

## 🎯 **What You Can Do**

✅ **Deploy backend changes** to production VM  
✅ **Restart backend service**  
✅ **View logs and debug** issues  
✅ **SSH into VM** for troubleshooting  

---

## 🚀 **You're Ready!**

1. **Run the setup script** (5 min)
2. **Start developing** locally
3. **Deploy changes** in 2-5 minutes
4. **Build amazing features!** 🎉

**Need help?** Check the troubleshooting section or ask your team lead.
