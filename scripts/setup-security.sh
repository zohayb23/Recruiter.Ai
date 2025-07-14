#!/bin/bash

# Exit on any error
set -e

echo "🚀 Setting up Recruiter.AI security components..."

# Create namespace
echo "📁 Creating namespace..."
kubectl apply -f kubernetes/namespace.yaml

# Create network policies
echo "🔒 Applying network policies..."
kubectl apply -f kubernetes/network-policy.yaml

# Create Cloud Armor policy
echo "🛡️ Setting up Cloud Armor policy..."
gcloud compute security-policies create resume-embedding-security-policy \
    --description "Security policy for resume embedding service"

# Add Cloud Armor rules
echo "⚔️ Adding Cloud Armor security rules..."
gcloud compute security-policies rules create 1000 \
    --security-policy resume-embedding-security-policy \
    --description "Block common attacks" \
    --expression "evaluatePreconfiguredExpr('xss-stable')" \
    --action "deny-403"

gcloud compute security-policies rules create 2000 \
    --security-policy resume-embedding-security-policy \
    --description "Rate limiting" \
    --expression "rate(requests.count, 60s) > 100" \
    --action "rate-based-ban" \
    --ban-duration-sec 300

# Apply Cloud Armor configuration
echo "🌐 Applying Cloud Armor configuration..."
kubectl apply -f kubernetes/cloud-armor-policy.yaml

# Set up secrets management
echo "🔐 Setting up secrets management..."
kubectl apply -f kubernetes/secrets.yaml

# Update deployment with security contexts
echo "📦 Updating deployment with security contexts..."
kubectl apply -f kubernetes/deployment.yaml

echo "✅ Security setup complete!"
echo "⚠️ IMPORTANT: Please ensure you have:"
echo "  1. Created the necessary secrets in Google Secret Manager"
echo "  2. Set up GCR authentication using setup-gcr-auth.sh"
echo "  3. Updated the domain name in cloud-armor-policy.yaml" 