#!/bin/bash

# Production Database Setup Script for Pipeline CRM
set -e

echo "🗄️ Setting up Production Database for Pipeline CRM..."

PROJECT_ID="taqforce"
DB_INSTANCE_NAME="pipeline-crm-db"
DB_NAME="pipeline_crm"
REGION="us-central1"
TIER="db-f1-micro"

echo "📋 Database Configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Instance Name: ${DB_INSTANCE_NAME}"
echo "  Database Name: ${DB_NAME}"
echo "  Region: ${REGION}"
echo "  Tier: ${TIER}"

# Enable Cloud SQL API
echo "🔧 Enabling Cloud SQL API..."
gcloud services enable sqladmin.googleapis.com

# Create Cloud SQL instance
echo "🏗️ Creating Cloud SQL instance..."
gcloud sql instances create ${DB_INSTANCE_NAME} \
    --database-version=POSTGRES_14 \
    --tier=${TIER} \
    --region=${REGION} \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup \
    --enable-ip-alias \
    --authorized-networks=0.0.0.0/0

# Set root password
echo "🔐 Setting database password..."
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users set-password postgres \
    --instance=${DB_INSTANCE_NAME} \
    --password=${DB_PASSWORD}

# Create database
echo "📊 Creating database..."
gcloud sql databases create ${DB_NAME} --instance=${DB_INSTANCE_NAME}

# Get connection details
DB_IP=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(ipAddresses[0].ipAddress)")
CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)")

echo "✅ Database setup completed!"
echo "📝 Database Details:"
echo "  Instance: ${DB_INSTANCE_NAME}"
echo "  Database: ${DB_NAME}"
echo "  IP Address: ${DB_IP}"
echo "  Connection Name: ${CONNECTION_NAME}"
echo "  Username: postgres"
echo "  Password: ${DB_PASSWORD}"

echo ""
echo "🔗 Connection String:"
echo "postgresql://postgres:${DB_PASSWORD}@${DB_IP}:5432/${DB_NAME}"

echo ""
echo "📝 Next steps:"
echo "  1. Update Cloud Run service with database connection string"
echo "  2. Run database migrations"
echo "  3. Test database connectivity"
echo "  4. Set up database backups and monitoring"

# Save credentials to file
cat > database-credentials.txt << CREDEOF
Database Credentials for Pipeline CRM
=====================================
Instance Name: ${DB_INSTANCE_NAME}
Database Name: ${DB_NAME}
IP Address: ${DB_IP}
Connection Name: ${CONNECTION_NAME}
Username: postgres
Password: ${DB_PASSWORD}
Connection String: postgresql://postgres:${DB_PASSWORD}@${DB_IP}:5432/${DB_NAME}
CREDEOF

echo "💾 Credentials saved to: database-credentials.txt"
echo "🔒 Keep these credentials secure!"
