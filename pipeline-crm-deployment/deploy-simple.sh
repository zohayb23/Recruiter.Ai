#!/bin/bash

# Simple Pipeline CRM Backend Deployment (No Cloud Build Required)
set -e

echo "🚀 Starting Simple Pipeline CRM Backend Deployment..."

# Configuration
PROJECT_ID="taqforce"
SERVICE_NAME="pipeline-crm-backend"
REGION="us-central1"

echo "📋 Deployment Configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Service Name: ${SERVICE_NAME}"
echo "  Region: ${REGION}"

# Check if gcloud is authenticated
echo "🔐 Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ Not authenticated with GCP. Please run: gcloud auth login"
    exit 1
fi

# Set project
echo "🎯 Setting GCP project..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required GCP APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build Docker image locally
echo "🔨 Building Docker image locally..."
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME} .

# Push to Container Registry
echo "📤 Pushing image to Container Registry..."
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8809 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 1 \
    --set-env-vars="ENVIRONMENT=production,DATABASE_URL=sqlite:///tmp/pipeline_crm.db,PORT=8809" \
    --timeout 300 \
    --concurrency 100

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "🔍 Health Check: ${SERVICE_URL}/health"
echo "📊 API Documentation: ${SERVICE_URL}/docs"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 10
if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed. Check the logs:"
    echo "gcloud logs read --service=${SERVICE_NAME} --region=${REGION} --limit=50"
fi

echo ""
echo "🎉 Pipeline CRM Backend is now live in production!"
