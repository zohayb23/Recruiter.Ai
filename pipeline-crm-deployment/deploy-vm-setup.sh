#!/bin/bash

# VM Setup Script for Pipeline CRM Backend
set -e

echo "🔧 Setting up Pipeline CRM Backend on VM..."

# Install Python and dependencies
echo "📦 Installing Python and dependencies..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# Create virtual environment
echo "🐍 Creating virtual environment..."
python3 -m venv pipeline-crm-env
source pipeline-crm-env/bin/activate

# Install requirements
echo "📚 Installing Python packages..."
pip install -r requirements.txt

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/pipeline-crm-backend.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=Pipeline CRM Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment=PATH=/home/ubuntu/pipeline-crm-env/bin
ExecStart=/home/ubuntu/pipeline-crm-env/bin/python pipeline_crm_backend_production.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Reload systemd and start service
echo "🚀 Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable pipeline-crm-backend
sudo systemctl start pipeline-crm-backend

# Check service status
echo "📊 Checking service status..."
sleep 5
sudo systemctl status pipeline-crm-backend --no-pager

echo "✅ VM setup completed!"
echo "🌐 Service should be running on port 8809"
echo "🔍 Test with: curl http://localhost:8809/health"
