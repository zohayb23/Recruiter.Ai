#!/bin/bash

# GCP VM Deployment Script for Recruiter.AI
# This script will be run on the GCP VM to set up the application

echo "🚀 Starting Recruiter.AI deployment on GCP VM..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    nginx \
    curl \
    wget \
    unzip \
    docker.io \
    docker-compose

# Start and enable Docker
echo "🐳 Setting up Docker..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Clone the repository
echo "📥 Cloning repository..."
cd /home/$USER
git clone https://github.com/your-username/Recruiter.Ai.git
cd Recruiter.Ai

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set up environment variables
echo "🔐 Setting up environment variables..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=sqlite:///./recruiter_ai.db

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Server Configuration
HOST=0.0.0.0
PORT=8804
DEBUG=False

# Security
SECRET_KEY=your_secret_key_here
EOF

# Create systemd service for the backend
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/recruiter-ai.service > /dev/null << EOF
[Unit]
Description=Recruiter.AI Backend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/Recruiter.Ai
Environment=PATH=/home/$USER/Recruiter.Ai/venv/bin
ExecStart=/home/$USER/Recruiter.Ai/venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8804
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/recruiter-ai > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8804;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/recruiter-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable recruiter-ai
sudo systemctl start recruiter-ai
sudo systemctl restart nginx

# Create startup script for Milvus
echo "🗄️ Setting up Milvus vector database..."
cd /home/$USER
mkdir milvus && cd milvus

cat > docker-compose.yml << EOF
version: '3.5'

services:
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/etcd:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/minio:/minio_data
    command: minio server /minio_data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  standalone:
    container_name: milvus-standalone
    image: milvusdb/milvus:v2.3.4
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/milvus:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"

  attu:
    container_name: milvus-attu
    image: zilliz/attu:v2.5.10
    environment:
      MILVUS_URL: http://standalone:19530
    ports:
      - "8000:3000"
    depends_on:
      - "standalone"

networks:
  default:
    name: milvus
EOF

# Start Milvus
docker-compose up -d

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at: http://$(curl -s ifconfig.me)"
echo "📊 Milvus Attu interface: http://$(curl -s ifconfig.me):8000"
echo "🔧 Backend API: http://$(curl -s ifconfig.me):8804"

echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your actual API keys"
echo "2. Restart the service: sudo systemctl restart recruiter-ai"
echo "3. Check logs: sudo journalctl -u recruiter-ai -f"
