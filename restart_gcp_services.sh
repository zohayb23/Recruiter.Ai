#!/bin/bash

echo "🔄 RESTARTING GCP SERVICES"
echo "========================="
echo ""

# Set project and VM details
PROJECT_ID="taqforce"
BACKEND_VM="taqforce-recruiter-ai-vm"
ZONE="us-central1-a"

echo "1. Setting GCP project..."
gcloud config set project $PROJECT_ID

echo "2. Checking VM status..."
gcloud compute instances list --filter="name:$BACKEND_VM"

echo "3. Getting VM IP address..."
VM_IP=$(gcloud compute instances describe $BACKEND_VM --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
echo "VM IP: $VM_IP"

echo "4. Restarting services on VM..."
gcloud compute ssh $BACKEND_VM --zone=$ZONE --command="
    echo 'Stopping existing services...'
    sudo pkill -f mass_mailing_backend.py
    sudo pkill -f pipeline_crm_backend.py
    sudo pkill -f complete_backend_with_milvus.py
    sudo pkill -f milvus
    sudo pkill -f attu
    
    echo 'Starting services...'
    cd /home/fayzanbhatti/mass_mailing_production
    nohup python3 mass_mailing_backend.py > mass_mailing.log 2>&1 &
    
    cd /home/fayzanbhatti
    nohup python3 pipeline_crm_backend.py > crm.log 2>&1 &
    nohup python3 complete_backend_with_milvus.py > milvus.log 2>&1 &
    
    echo 'Starting Milvus and Attu...'
    cd /home/fayzanbhatti/milvus
    nohup ./bin/milvus run standalone > milvus.log 2>&1 &
    
    cd /home/fayzanbhatti/attu
    nohup npm start > attu.log 2>&1 &
    
    echo 'Services started. Checking status...'
    sleep 5
    ps aux | grep -E '(mass_mailing|pipeline_crm|complete_backend|milvus|attu)' | grep -v grep
"

echo "5. Testing service endpoints..."
echo "Testing CRM Backend..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:8809/health || echo "❌ CRM Backend not responding"

echo "Testing Mass Mailing Backend..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:8810/health || echo "❌ Mass Mailing Backend not responding"

echo "Testing Milvus Integration..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:8808/health || echo "❌ Milvus Integration not responding"

echo "Testing Milvus Attu UI..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://$VM_IP:3000 || echo "❌ Milvus Attu UI not responding"

echo ""
echo "✅ GCP Service restart completed!"
