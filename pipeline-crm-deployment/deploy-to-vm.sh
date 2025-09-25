#!/bin/bash

# Deploy Pipeline CRM Backend to Existing GCP VM
set -e

echo "🚀 Deploying Pipeline CRM Backend to GCP VM..."

# Configuration
PROJECT_ID="taqforce"
VM_NAME="taqforce-recruiter-ai-vm"
ZONE="us-central1-a"  # Adjust zone as needed
SERVICE_PORT="8809"

echo "📋 VM Deployment Configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  VM Name: ${VM_NAME}"
echo "  Zone: ${ZONE}"
echo "  Service Port: ${SERVICE_PORT}"

# Check if gcloud is authenticated
echo "🔐 Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ Not authenticated with GCP. Please run: gcloud auth login"
    exit 1
fi

# Set project
echo "🎯 Setting GCP project..."
gcloud config set project ${PROJECT_ID}

# Get VM external IP
echo "🌐 Getting VM external IP..."
VM_IP=$(gcloud compute instances describe ${VM_NAME} --zone=${ZONE} --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

if [ -z "$VM_IP" ]; then
    echo "❌ Could not get VM IP. Check VM name and zone."
    exit 1
fi

echo "📍 VM External IP: ${VM_IP}"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf pipeline-crm-deployment.tar.gz \
    pipeline_crm_backend_production.py \
    requirements.txt \
    .env.production

# Copy files to VM
echo "📤 Copying files to VM..."
gcloud compute scp pipeline-crm-deployment.tar.gz ${VM_NAME}:~/ --zone=${ZONE}
gcloud compute scp deploy-vm-setup.sh ${VM_NAME}:~/ --zone=${ZONE}

# Run setup on VM
echo "🔧 Setting up service on VM..."
gcloud compute ssh ${VM_NAME} --zone=${ZONE} --command="
    cd ~ &&
    tar -xzf pipeline-crm-deployment.tar.gz &&
    chmod +x deploy-vm-setup.sh &&
    ./deploy-vm-setup.sh
"

# Clean up local files
rm pipeline-crm-deployment.tar.gz

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: http://${VM_IP}:${SERVICE_PORT}"
echo "🔍 Health Check: http://${VM_IP}:${SERVICE_PORT}/health"
echo "📊 API Documentation: http://${VM_IP}:${SERVICE_PORT}/docs"

echo ""
echo "🎉 Pipeline CRM Backend is now running on your VM!"
echo "📝 Next steps:"
echo "  1. Test the service: curl http://${VM_IP}:${SERVICE_PORT}/health"
echo "  2. Update frontend configuration to point to: http://${VM_IP}:${SERVICE_PORT}"
echo "  3. Set up firewall rules if needed"
