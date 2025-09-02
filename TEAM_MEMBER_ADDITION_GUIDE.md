# 👥 Adding Team Members to GCP & Backend Deployment

**Goal**: Give your teammate access to deploy backend changes to the cloud VM

---

## 🔐 **Step 1: Add Teammate to GCP Project**

### **Option A: Through Google Cloud Console (Recommended)**

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=recruiter-ai-468020
2. **Click**: "GRANT ACCESS" button
3. **Add Member**: Enter your teammate's email address
4. **Assign Role**: Select `Compute Instance Admin (v1)` role
5. **Click**: "SAVE"

### **Option B: Through CLI (Advanced)**

```bash
# Replace with your teammate's email
TEAMMATE_EMAIL="teammate@company.com"

# Grant Compute Instance Admin role
gcloud projects add-iam-policy-binding recruiter-ai-468020 \
    --member="user:$TEAMMATE_EMAIL" \
    --role="roles/compute.instanceAdmin.v1"

# Grant additional roles for full access
gcloud projects add-iam-policy-binding recruiter-ai-468020 \
    --member="user:$TEAMMATE_EMAIL" \
    --role="roles/compute.viewer"

gcloud projects add-iam-policy-binding recruiter-ai-468020 \
    --member="user:$TEAMMATE_EMAIL" \
    --role="roles/iam.serviceAccountUser"
```

---

## 🚀 **Step 2: Teammate Setup (What They Need to Do)**

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

### **2. Authenticate with GCP**
```bash
# Login to your Google account
gcloud auth login

# Set the project
gcloud config set project recruiter-ai-468020

# Verify access
gcloud compute instances list
```

### **3. Test VM Access**
```bash
# Test SSH access to your backend VM
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a

# You should see a prompt to create SSH keys
# Type 'Y' and press Enter
```

---

## 🔄 **Step 3: Backend Deployment Methods**

### **Method 1: Direct SSH Deployment (Recommended for Teammates)**

```bash
# 1. Make changes locally
cd backend-full
# Edit your files...

# 2. Test locally
uvicorn src.main:app --reload --port 8804

# 3. Commit and push
git add .
git commit -m "Backend: your feature description"
git push origin main

# 4. Deploy to cloud VM
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a
cd /home/$USER/Recruiter.Ai
git pull origin main
sudo systemctl restart recruiter-ai
sudo systemctl status recruiter-ai
```

### **Method 2: Automated GitHub Actions Deployment**

**Setup (One-time)**:
```bash
# Run the setup script
./scripts/setup-automated-deployment.sh

# Follow prompts to generate SSH keys
# Add GitHub secrets as instructed
```

**Daily Workflow**:
```bash
# 1. Make changes locally
# 2. Test locally
# 3. Commit and push
git add .
git commit -m "Backend: your feature"
git push origin main

# 4. GitHub Action automatically deploys to VM
# Check: GitHub → Actions tab
```

---

## 🔑 **Step 4: SSH Key Setup for Teammate**

### **Generate SSH Key for VM Access**
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "teammate@company.com"

# Copy public key to VM
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="mkdir -p ~/.ssh"
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys"
```

### **Test Direct SSH Access**
```bash
# Test SSH connection
ssh $USER@35.223.26.176

# If successful, you can deploy without gcloud CLI
```

---

## 📋 **Complete Teammate Workflow**

### **Daily Development Cycle**:

```bash
# 1. Start local development
cd backend-full
source venv/bin/activate
uvicorn src.main:app --reload --port 8804

# 2. Make changes and test locally
# 3. Commit changes
git add .
git commit -m "Backend: feature description"
git push origin main

# 4. Deploy to production (choose one method)
```

### **Deployment Method A: Direct SSH**
```bash
ssh $USER@35.223.26.176
cd /home/$USER/Recruiter.Ai
git pull origin main
sudo systemctl restart recruiter-ai
exit
```

### **Deployment Method B: GitHub Actions**
```bash
# Push triggers automatic deployment
# Check GitHub Actions tab for status
```

---

## 🚨 **Important Security Notes**

### **IAM Roles Explanation**:
- **`Compute Instance Admin`**: Can start/stop/restart VMs
- **`Compute Viewer`**: Can view VM details and logs
- **`Service Account User`**: Can use service accounts

### **What Teammates Can Do**:
- ✅ **Deploy backend changes** to VM
- ✅ **Restart backend service**
- ✅ **View VM logs and status**
- ✅ **SSH into VM for debugging**

### **What Teammates Cannot Do**:
- ❌ **Delete VMs** or infrastructure
- ❌ **Modify billing** or project settings
- ❌ **Change IAM permissions**

---

## 🔍 **Troubleshooting Teammate Access**

### **Common Issues**:

| Issue | Solution |
|-------|----------|
| **"Permission denied"** | Check IAM roles in GCP Console |
| **"Project not found"** | Verify project ID: `recruiter-ai-468020` |
| **SSH connection failed** | Generate and copy SSH keys |
| **Service restart failed** | Check if teammate has sudo access |

### **Verify Access**:
```bash
# Check project access
gcloud projects list

# Check VM access
gcloud compute instances list

# Test SSH access
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a
```

---

## 📊 **Access Summary**

### **Teammate Permissions**:
- **GCP Project**: `recruiter-ai-468020`
- **VM Access**: `recruiter-ai-vm` (35.223.26.176)
- **Deployment**: Direct SSH + GitHub Actions
- **Service Management**: Can restart `recruiter-ai` service

### **Deployment Options**:
1. **Direct SSH**: Fast, manual control
2. **GitHub Actions**: Automated, trackable
3. **Hybrid**: Use both as needed

---

## 🎯 **Quick Setup Checklist**

### **For You (Project Owner)**:
- [ ] Add teammate email to GCP IAM
- [ ] Assign `Compute Instance Admin` role
- [ ] Test teammate access

### **For Your Teammate**:
- [ ] Install Google Cloud CLI
- [ ] Run `gcloud auth login`
- [ ] Set project: `recruiter-ai-468020`
- [ ] Test VM access: `gcloud compute ssh recruiter-ai-vm --zone=us-central1-a`
- [ ] Generate SSH keys for direct access
- [ ] Test deployment workflow

---

## 🚀 **Next Steps**

1. **Add your teammate** to GCP IAM (5 minutes)
2. **Have them authenticate** with GCP CLI (5 minutes)
3. **Test VM access** (2 minutes)
4. **Set up deployment workflow** (10 minutes)
5. **Start developing and deploying!** 🎉

**Result**: Your teammate can now deploy backend changes directly to the cloud VM in under 2 minutes!
