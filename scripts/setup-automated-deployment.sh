#!/bin/bash

# Setup Automated Deployment for Recruiter.AI
# This script helps set up GitHub Actions for automatic backend deployment

echo "🚀 Setting up automated deployment for Recruiter.AI..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the Recruiter.AI root directory"
    exit 1
fi

echo "📋 Prerequisites:"
echo "1. You need access to the GCP VM (recruiter-ai-vm)"
echo "2. You need admin access to the GitHub repository"
echo "3. You need to be able to SSH into the VM"
echo ""

# Generate SSH key for GitHub Actions
echo "🔑 Generating SSH key for GitHub Actions..."
ssh-keygen -t rsa -b 4096 -C "github-actions@recruiter-ai" -f ~/.ssh/github_actions_key -N ""

echo ""
echo "✅ SSH key generated: ~/.ssh/github_actions_key"
echo ""

# Get VM details
read -p "Enter your GCP VM username: " VM_USERNAME
read -p "Enter your GCP VM IP address [35.223.26.176]: " VM_HOST
VM_HOST=${VM_HOST:-35.223.26.176}

echo ""
echo "📤 Copying SSH key to VM..."
ssh-copy-id -i ~/.ssh/github_actions_key.pub $VM_USERNAME@$VM_HOST

echo ""
echo "🔐 Setting up GitHub repository secrets..."
echo ""
echo "📋 Next steps:"
echo "1. Go to your GitHub repository: https://github.com/yourusername/Recruiter.AI"
echo "2. Go to Settings → Secrets and variables → Actions"
echo "3. Add these secrets:"
echo ""
echo "   VM_HOST: $VM_HOST"
echo "   VM_USERNAME: $VM_USERNAME"
echo "   VM_SSH_KEY: (copy the content of ~/.ssh/github_actions_key)"
echo ""
echo "4. The GitHub Action will automatically deploy backend changes when you push to main"
echo ""

# Test the connection
echo "🧪 Testing SSH connection to VM..."
if ssh -i ~/.ssh/github_actions_key $VM_USERNAME@$VM_HOST "echo 'SSH connection successful'"; then
    echo "✅ SSH connection test successful!"
else
    echo "❌ SSH connection test failed. Please check your setup."
    exit 1
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 To test the automated deployment:"
echo "1. Make a small change to a backend file"
echo "2. Commit and push:"
echo "   git add ."
echo "   git commit -m 'Test automated deployment'"
echo "   git push origin main"
echo "3. Check the GitHub Actions tab for deployment status"
echo ""
echo "🔍 To monitor deployment logs:"
echo "   gcloud compute ssh $VM_USERNAME@recruiter-ai-vm --zone=us-central1-a"
echo "   sudo journalctl -u recruiter-ai -f"
