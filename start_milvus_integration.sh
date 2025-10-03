#!/bin/bash

echo "🚀 STARTING GCP MILVUS INTEGRATION"
echo "================================="
echo ""

echo "🔍 Stopping any existing Milvus Integration processes..."
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="pkill -f complete_backend_with_milvus.py || echo 'No existing processes found'"

echo ""
echo "🔍 Starting Milvus Integration service..."
gcloud compute ssh taqforce-recruiter-ai-vm --zone=us-central1-a --command="
cd /home/fayzanbhatti/mass_mailing_production
nohup python3 complete_backend_with_milvus.py > milvus_integration.log 2>&1 &
echo 'Milvus Integration started with PID:' \$!
sleep 3
ps aux | grep complete_backend_with_milvus.py | grep -v grep
ss -tlnp | grep :8808 || echo 'Port 8808 not found yet'
curl -s -o /dev/null -w 'Local test status: %{http_code}\n' http://localhost:8808/health || echo 'Local connection failed'
"

echo ""
echo "🔍 Testing external connectivity..."
sleep 5
curl -s -o /dev/null -w "External test status: %{http_code}\n" http://34.31.224.102:8808/health || echo "External connection failed"

echo ""
echo "✅ Milvus Integration startup completed!"
