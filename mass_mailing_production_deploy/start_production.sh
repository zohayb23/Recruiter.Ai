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
