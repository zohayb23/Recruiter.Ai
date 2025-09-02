#!/bin/bash

# Teammate Setup Script for Recruiter.AI GCP Access
# Run this script after you've been added to the GCP project

echo "🚀 Setting up GCP access for Recruiter.AI backend deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   macOS: brew install google-cloud-sdk"
    echo "   Windows: https://cloud.google.com/sdk/docs/install"
    echo "   Linux: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

echo "✅ Google Cloud CLI found"

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please authenticate with Google Cloud..."
    gcloud auth login
else
    echo "✅ Already authenticated as: $(gcloud auth list --filter=status:ACTIVE --format="value(account)")"
fi

# Set the project
echo "📋 Setting project to: recruiter-ai-468020"
gcloud config set project recruiter-ai-468020

# Verify project access
echo "🔍 Verifying project access..."
if ! gcloud projects describe recruiter-ai-468020 &> /dev/null; then
    echo "❌ Access denied to project. Please contact your team lead to add you to the GCP project."
    exit 1
fi

echo "✅ Project access verified"

# List available VMs
echo "🖥️ Available VMs in project:"
gcloud compute instances list --filter="name~recruiter-ai" --format="table(name,zone,status,EXTERNAL_IP)"

# Test VM access
echo "🧪 Testing access to backend VM..."
if gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="echo 'SSH access successful'" --quiet; then
    echo "✅ VM access successful!"
else
    echo "❌ VM access failed. Please check your IAM permissions."
    echo "   Required role: Compute Instance Admin (v1)"
    exit 1
fi

# Generate SSH key for direct access
echo "🔑 Setting up SSH key for direct VM access..."
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "Generating new SSH key..."
    ssh-keygen -t rsa -b 4096 -C "$(gcloud auth list --filter=status:ACTIVE --format='value(account)')" -f ~/.ssh/id_rsa -N ""
fi

# Copy SSH key to VM
echo "📤 Copying SSH key to VM..."
gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command="mkdir -p ~/.ssh && echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys"

# Test direct SSH access
echo "🧪 Testing direct SSH access..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $USER@35.223.26.176 "echo 'Direct SSH successful'" 2>/dev/null; then
    echo "✅ Direct SSH access successful!"
else
    echo "⚠️ Direct SSH access failed. You can still use gcloud compute ssh"
fi

# Show deployment commands
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Your deployment workflow:"
echo ""
echo "1. Make backend changes locally:"
echo "   cd backend-full"
echo "   source venv/bin/activate"
echo "   uvicorn src.main:app --reload --port 8804"
echo ""
echo "2. Test changes locally"
echo ""
echo "3. Commit and push:"
echo "   git add ."
echo "   git commit -m 'Backend: your feature'"
echo "   git push origin main"
echo ""
echo "4. Deploy to production (choose one):"
echo ""
echo "   Option A - Direct SSH (fastest):"
echo "   ssh $USER@35.223.26.176"
echo "   cd /home/\$USER/Recruiter.Ai"
echo "   git pull origin main"
echo "   sudo systemctl restart recruiter-ai"
echo "   exit"
echo ""
echo "   Option B - GitHub Actions (automatic):"
echo "   # Push triggers automatic deployment"
echo "   # Check GitHub Actions tab for status"
echo ""
echo "🔍 Useful commands:"
echo "   # Check VM status"
echo "   gcloud compute instances list"
echo ""
echo "   # SSH to VM"
echo "   gcloud compute ssh recruiter-ai-vm --zone=us-central1-a"
echo ""
echo "   # View backend logs"
echo "   gcloud compute ssh recruiter-ai-vm --zone=us-central1-a --command='sudo journalctl -u recruiter-ai -f'"
echo ""
echo "🚀 You're ready to deploy backend changes to production!"
