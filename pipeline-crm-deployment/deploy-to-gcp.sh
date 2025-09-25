#!/bin/bash

# Pipeline CRM Backend Deployment Script for GCP
set -e

echo "🚀 Starting Pipeline CRM Backend Deployment to GCP..."

# Configuration
PROJECT_ID="taqforce"
SERVICE_NAME="pipeline-crm-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "📋 Deployment Configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Service Name: ${SERVICE_NAME}"
echo "  Region: ${REGION}"
echo "  Image: ${IMAGE_NAME}"

# Build and push Docker image
echo "🔨 Building Docker image..."
docker build -t ${IMAGE_NAME} .

echo "📤 Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8809 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars="ENVIRONMENT=production"

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL:"
gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)"
