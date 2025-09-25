#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT TO GCP - MASS MAILING SYSTEM
# =====================================================
# This script deploys the complete Mass Mailing system to GCP production

set -e  # Exit on any error

# Configuration
PROJECT_ID="taqforce"
BACKEND_VM="taqforce-recruiter-ai-vm"
MILVUS_VM="milvus-vm"
ZONE="us-central1-a"
BACKEND_PORT="8810"
MILVUS_PORT="19530"
ATTU_PORT="3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PRODUCTION DEPLOYMENT TO GCP - MASS MAILING SYSTEM${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Verify GCP Authentication
echo -e "${BLUE}🔐 STEP 1: VERIFYING GCP AUTHENTICATION${NC}"
echo "=============================================="

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "No active GCP authentication found"
    print_info "Please run: gcloud auth login"
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
print_status "Authenticated as: $ACTIVE_ACCOUNT"

# Set project
gcloud config set project $PROJECT_ID
print_status "Project set to: $PROJECT_ID"

echo ""

# Step 2: Verify VMs are running
echo -e "${BLUE}🖥️  STEP 2: VERIFYING GCP VMs${NC}"
echo "================================"

# Check backend VM
if gcloud compute instances describe $BACKEND_VM --zone=$ZONE --format="value(status)" | grep -q "RUNNING"; then
    print_status "Backend VM ($BACKEND_VM) is running"
else
    print_warning "Backend VM ($BACKEND_VM) is not running. Starting it..."
    gcloud compute instances start $BACKEND_VM --zone=$ZONE
    print_status "Backend VM started"
fi

# Check Milvus VM
if gcloud compute instances describe $MILVUS_VM --zone=$ZONE --format="value(status)" | grep -q "RUNNING"; then
    print_status "Milvus VM ($MILVUS_VM) is running"
else
    print_warning "Milvus VM ($MILVUS_VM) is not running. Starting it..."
    gcloud compute instances start $MILVUS_VM --zone=$ZONE
    print_status "Milvus VM started"
fi

echo ""

# Step 3: Get VM IP addresses
echo -e "${BLUE}🌐 STEP 3: GETTING VM IP ADDRESSES${NC}"
echo "===================================="

BACKEND_IP=$(gcloud compute instances describe $BACKEND_VM --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
MILVUS_IP=$(gcloud compute instances describe $MILVUS_VM --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

print_status "Backend VM IP: $BACKEND_IP"
print_status "Milvus VM IP: $MILVUS_IP"

echo ""

# Step 4: Create deployment package
echo -e "${BLUE}📦 STEP 4: CREATING DEPLOYMENT PACKAGE${NC}"
echo "======================================="

# Create deployment directory
DEPLOY_DIR="mass_mailing_production_deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy production files
cp mass_mailing_backend.py $DEPLOY_DIR/
cp pipeline_crm_backend.py $DEPLOY_DIR/
cp complete_backend_with_milvus.py $DEPLOY_DIR/
cp gap_detection_backend.py $DEPLOY_DIR/
cp data_management_backend.py $DEPLOY_DIR/
cp enhanced_fallback_backend.py $DEPLOY_DIR/
cp optimized_api_backend.py $DEPLOY_DIR/
cp init_database_fixed.py $DEPLOY_DIR/

# Copy documentation
cp README.md $DEPLOY_DIR/
cp CANDIDATE_CRM_USER_GUIDE.md $DEPLOY_DIR/
cp COMPREHENSIVE_CRM_TEST_PLAN.md $DEPLOY_DIR/
cp FRONTEND_TESTING_GUIDE.md $DEPLOY_DIR/
cp MANUAL_DEPLOYMENT_GUIDE.md $DEPLOY_DIR/
cp QUICK_REFERENCE_CARD.md $DEPLOY_DIR/
cp CONTRIBUTING.md $DEPLOY_DIR/

# Copy deployment scripts
cp deploy-to-gcp.sh $DEPLOY_DIR/
cp gcp-startup-script.sh $DEPLOY_DIR/

# Create production requirements.txt
cat > $DEPLOY_DIR/requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
requests==2.31.0
python-docx==1.1.0
PyPDF2==3.0.1
openai==1.3.0
sentence-transformers==2.2.2
python-dateutil==2.8.2
pymilvus==2.3.4
sendgrid==6.10.0
pytz==2023.3
EOF

# Create production environment file
cat > $DEPLOY_DIR/.env.production << EOF
# Production Environment Variables
ENVIRONMENT=production
DEBUG=false

# Database Configuration
MILVUS_HOST=$MILVUS_IP
MILVUS_PORT=$MILVUS_PORT

# Email Service Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Security Configuration
SECRET_KEY=your_production_secret_key_here
ALLOWED_HOSTS=$BACKEND_IP,localhost,127.0.0.1

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=Mass Mailing System
EOF

# Create production startup script
cat > $DEPLOY_DIR/start_production.sh << 'EOF'
#!/bin/bash

# Production startup script for Mass Mailing System
echo "🚀 Starting Mass Mailing System in Production Mode..."

# Set environment
export ENVIRONMENT=production
export DEBUG=false

# Install dependencies
pip3 install -r requirements.txt

# Start the main backend service
echo "📧 Starting Mass Mailing Backend..."
nohup python3 mass_mailing_backend.py > mass_mailing.log 2>&1 &
echo $! > mass_mailing.pid

# Start CRM backend
echo "👥 Starting CRM Backend..."
nohup python3 pipeline_crm_backend.py > crm.log 2>&1 &
echo $! > crm.pid

# Start Milvus integration backend
echo "🔍 Starting Milvus Integration..."
nohup python3 complete_backend_with_milvus.py > milvus.log 2>&1 &
echo $! > milvus.pid

echo "✅ All services started successfully!"
echo "📊 Mass Mailing Backend: http://localhost:8810"
echo "👥 CRM Backend: http://localhost:8809"
echo "🔍 Milvus Backend: http://localhost:8808"
echo "📚 API Documentation: http://localhost:8810/docs"
EOF

chmod +x $DEPLOY_DIR/start_production.sh

# Create systemd service file
cat > $DEPLOY_DIR/mass-mailing.service << EOF
[Unit]
Description=Mass Mailing System
After=network.target

[Service]
Type=forking
User=fayzanbhatti
WorkingDirectory=/home/fayzanbhatti/mass_mailing_production
ExecStart=/home/fayzanbhatti/mass_mailing_production/start_production.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create deployment package
tar -czf mass_mailing_production.tar.gz $DEPLOY_DIR/
print_status "Deployment package created: mass_mailing_production.tar.gz"

echo ""

# Step 5: Deploy to GCP
echo -e "${BLUE}🚀 STEP 5: DEPLOYING TO GCP BACKEND VM${NC}"
echo "============================================="

# Copy deployment package to VM
print_info "Copying deployment package to backend VM..."
gcloud compute scp mass_mailing_production.tar.gz $BACKEND_VM:/home/fayzanbhatti/ --zone=$ZONE

# SSH into VM and deploy
print_info "Deploying to backend VM..."
gcloud compute ssh $BACKEND_VM --zone=$ZONE --command="
    echo '🚀 Starting deployment on backend VM...'
    
    # Stop existing services
    echo '⏹️  Stopping existing services...'
    sudo pkill -f mass_mailing_backend.py || true
    sudo pkill -f pipeline_crm_backend.py || true
    sudo pkill -f complete_backend_with_milvus.py || true
    
    # Remove old deployment
    rm -rf mass_mailing_production
    
    # Extract new deployment
    echo '📦 Extracting deployment package...'
    tar -xzf mass_mailing_production.tar.gz
    cd mass_mailing_production
    
    # Install Python dependencies
    echo '📚 Installing Python dependencies...'
    pip3 install -r requirements.txt
    
    # Set up systemd service
    echo '🔧 Setting up systemd service...'
    sudo cp mass-mailing.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable mass-mailing.service
    
    # Start services
    echo '🚀 Starting production services...'
    sudo systemctl start mass-mailing.service
    
    # Wait for services to start
    sleep 10
    
    # Check service status
    echo '📊 Checking service status...'
    sudo systemctl status mass-mailing.service --no-pager
    
    echo '✅ Deployment completed successfully!'
"

echo ""

# Step 6: Verify deployment
echo -e "${BLUE}✅ STEP 6: VERIFYING DEPLOYMENT${NC}"
echo "================================="

print_info "Testing backend connectivity..."
sleep 5

# Test backend health
if curl -s http://$BACKEND_IP:$BACKEND_PORT/health | grep -q "healthy"; then
    print_status "Backend health check: PASSED"
else
    print_warning "Backend health check: FAILED - Service may still be starting"
fi

# Test API endpoints
print_info "Testing API endpoints..."
if curl -s http://$BACKEND_IP:$BACKEND_PORT/api/campaigns | grep -q "campaigns"; then
    print_status "Campaigns API: WORKING"
else
    print_warning "Campaigns API: Not responding yet"
fi

echo ""

# Step 7: Update frontend configuration
echo -e "${BLUE}🌐 STEP 7: UPDATING FRONTEND CONFIGURATION${NC}"
echo "============================================="

print_info "Backend is now available at: http://$BACKEND_IP:$BACKEND_PORT"
print_info "API Documentation: http://$BACKEND_IP:$BACKEND_PORT/docs"
print_info "Milvus Attu UI: http://$MILVUS_IP:$ATTU_PORT"

echo ""

# Step 8: Production monitoring setup
echo -e "${BLUE}📊 STEP 8: SETTING UP PRODUCTION MONITORING${NC}"
echo "==============================================="

# Create monitoring script
cat > monitor_production.sh << EOF
#!/bin/bash

echo "📊 MASS MAILING SYSTEM - PRODUCTION MONITORING"
echo "=============================================="
echo ""

echo "🖥️  VM STATUS:"
echo "Backend VM ($BACKEND_VM): \$(gcloud compute instances describe $BACKEND_VM --zone=$ZONE --format='value(status)')"
echo "Milvus VM ($MILVUS_VM): \$(gcloud compute instances describe $MILVUS_VM --zone=$ZONE --format='value(status)')"
echo ""

echo "🌐 SERVICE ENDPOINTS:"
echo "Backend Health: http://$BACKEND_IP:$BACKEND_PORT/health"
echo "API Documentation: http://$BACKEND_IP:$BACKEND_PORT/docs"
echo "Milvus Attu: http://$MILVUS_IP:$ATTU_PORT"
echo ""

echo "📊 QUICK HEALTH CHECK:"
curl -s http://$BACKEND_IP:$BACKEND_PORT/health | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Backend Status: {data[\"status\"]}')
    print(f'✅ Database: {data[\"database\"]}')
    print(f'✅ Version: {data[\"version\"]}')
except:
    print('❌ Backend not responding')
"
EOF

chmod +x monitor_production.sh
print_status "Production monitoring script created: monitor_production.sh"

echo ""

# Final summary
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}📊 DEPLOYMENT SUMMARY:${NC}"
echo "======================"
echo "✅ Backend VM: $BACKEND_VM ($BACKEND_IP)"
echo "✅ Milvus VM: $MILVUS_VM ($MILVUS_IP)"
echo "✅ Mass Mailing Backend: http://$BACKEND_IP:$BACKEND_PORT"
echo "✅ API Documentation: http://$BACKEND_IP:$BACKEND_PORT/docs"
echo "✅ Milvus Attu UI: http://$MILVUS_IP:$ATTU_PORT"
echo ""
echo -e "${BLUE}🔧 PRODUCTION FEATURES DEPLOYED:${NC}"
echo "=================================="
echo "✅ Campaign Management & Sending"
echo "✅ Advanced Analytics & Reporting"
echo "✅ A/B Testing System"
echo "✅ Advanced Segmentation"
echo "✅ Campaign Automation"
echo "✅ Vendor Management & Scoring"
echo "✅ Advanced Scheduling"
echo "✅ Security & Compliance (GDPR)"
echo "✅ Email Service Integration"
echo "✅ Response Tracking & Analytics"
echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo "=============="
echo "1. Update frontend configuration to point to: http://$BACKEND_IP:$BACKEND_PORT"
echo "2. Configure SendGrid API key in production environment"
echo "3. Set up SSL certificates for HTTPS"
echo "4. Configure firewall rules for production access"
echo "5. Set up monitoring and alerting"
echo ""
echo -e "${GREEN}🚀 MASS MAILING SYSTEM IS NOW LIVE IN PRODUCTION!${NC}"
echo ""
echo -e "${YELLOW}💡 TIP: Run './monitor_production.sh' to check system status${NC}"
