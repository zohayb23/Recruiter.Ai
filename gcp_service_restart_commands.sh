#!/bin/bash

echo "🔄 GCP SERVICE RESTART SCRIPT"
echo "============================="
echo ""

# Set variables
PROJECT_ID="taqforce"
BACKEND_VM="taqforce-recruiter-ai-vm"
ZONE="us-central1-a"

echo "1. Setting GCP project..."
gcloud config set project $PROJECT_ID

echo "2. Getting VM IP address..."
VM_IP=$(gcloud compute instances describe $BACKEND_VM --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo "VM IP: $VM_IP"

echo "3. SSH into VM and restart services..."
gcloud compute ssh $BACKEND_VM --zone=$ZONE --command="
    echo '🔍 Checking current service status...'
    ps aux | grep -E '(mass_mailing|pipeline_crm|complete_backend|milvus|attu)' | grep -v grep
    
    echo ''
    echo '🛑 Stopping existing services...'
    sudo pkill -f mass_mailing_backend.py
    sudo pkill -f pipeline_crm_backend.py  
    sudo pkill -f complete_backend_with_milvus.py
    sudo pkill -f milvus
    sudo pkill -f attu
    
    echo '⏳ Waiting 3 seconds...'
    sleep 3
    
    echo '🚀 Starting Mass Mailing Backend...'
    cd /home/fayzanbhatti/mass_mailing_production
    nohup python3 mass_mailing_backend.py > mass_mailing.log 2>&1 &
    
    echo '🚀 Starting CRM Backend...'
    cd /home/fayzanbhatti
    nohup python3 pipeline_crm_backend.py > crm.log 2>&1 &
    
    echo '🚀 Starting Milvus Integration...'
    nohup python3 complete_backend_with_milvus.py > milvus.log 2>&1 &
    
    echo '🚀 Starting Milvus Database...'
    cd /home/fayzanbhatti/milvus
    nohup ./bin/milvus run standalone > milvus_db.log 2>&1 &
    
    echo '🚀 Starting Milvus Attu UI...'
    cd /home/fayzanbhatti/attu
    nohup npm start > attu.log 2>&1 &
    
    echo '⏳ Waiting 10 seconds for services to start...'
    sleep 10
    
    echo '🔍 Checking service status...'
    ps aux | grep -E '(mass_mailing|pipeline_crm|complete_backend|milvus|attu)' | grep -v grep
    
    echo ''
    echo '📊 Checking service logs...'
    echo 'Mass Mailing Backend Log:'
    tail -5 /home/fayzanbhatti/mass_mailing_production/mass_mailing.log 2>/dev/null || echo 'No log found'
    
    echo 'CRM Backend Log:'
    tail -5 /home/fayzanbhatti/crm.log 2>/dev/null || echo 'No log found'
    
    echo 'Milvus Integration Log:'
    tail -5 /home/fayzanbhatti/milvus.log 2>/dev/null || echo 'No log found'
"

echo "4. Testing service endpoints..."
echo "Testing Mass Mailing Backend..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:8810/health || echo "❌ Mass Mailing Backend not responding"

echo "Testing Milvus Integration..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:8808/health || echo "❌ Milvus Integration not responding"

echo "Testing Milvus Attu UI..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:3000 || echo "❌ Milvus Attu UI not responding"

echo ""
echo "✅ GCP Service restart completed!"
echo "VM IP: $VM_IP"
echo "Service URLs:"
echo "  - Mass Mailing Backend: http://$VM_IP:8810"
echo "  - Milvus Integration: http://$VM_IP:8808"  
echo "  - Milvus Attu UI: http://$VM_IP:3000"
