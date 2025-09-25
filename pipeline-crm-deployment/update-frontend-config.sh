#!/bin/bash

# Frontend Configuration Update Script for Production
set -e

echo "🔄 Updating Frontend Configuration for Production..."

# Get the deployed service URL
PROJECT_ID="taqforce"
SERVICE_NAME="pipeline-crm-backend"
REGION="us-central1"

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Could not get service URL. Make sure the service is deployed."
    exit 1
fi

echo "🌐 Production Service URL: ${SERVICE_URL}"

# Update frontend environment configuration
FRONTEND_CONFIG_FILE="../frontend-v2/src/config/environment.ts"

if [ ! -f "$FRONTEND_CONFIG_FILE" ]; then
    echo "❌ Frontend config file not found: $FRONTEND_CONFIG_FILE"
    exit 1
fi

# Create backup
cp "$FRONTEND_CONFIG_FILE" "${FRONTEND_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Update the configuration
echo "📝 Updating frontend configuration..."

# Create new environment configuration
cat > "$FRONTEND_CONFIG_FILE" << 'ENVEOF'
// Environment configuration
export const ENV = {
  // Detect if we're in development mode
  isDevelopment: () => {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.port === '5173' || // Vite dev server
      window.location.port === '3000' || // React dev server
      window.location.port === '8080'    // Common dev port
    );
  },

  // Detect if we're in production (Netlify)
  isProduction: () => {
    return (
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('recruiter-ai') ||
      !ENV.isDevelopment()
    );
  },

  // Get the appropriate API base URL
  getApiBaseUrl: () => {
    if (ENV.isDevelopment()) {
      // Development: use local complete backend with Milvus integration
      return 'http://localhost:8804';
    } else {
      // Production: use relative URLs for Netlify proxy
      return '';
    }
  },

  // Get the gap detection backend URL
  getGapDetectionUrl: () => {
      if (ENV.isDevelopment()) {
          // Development: use local gap detection backend
          return 'http://localhost:8808';
      } else {
          // Production: use GCP gap detection backend
          return 'http://34.121.146.153:8808';
      }
  },

  // Get the pipeline CRM backend URL
  getPipelineCRMUrl: () => {
      if (ENV.isDevelopment()) {
          // Development: use local pipeline CRM backend
          return 'http://localhost:8809';
      } else {
          // Production: use GCP pipeline CRM backend
          return 'PRODUCTION_URL_PLACEHOLDER';
      }
  },

  // Get the backend URL for direct access (useful for debugging)
  getBackendUrl: () => {
    if (ENV.isDevelopment()) {
      // Development: use local complete backend with Milvus integration
      return 'http://localhost:8804';
    } else {
      return 'http://34.121.146.153:8804';
    }
  },

  // Get environment info for debugging
  getInfo: () => ({
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    href: window.location.href,
    isDevelopment: ENV.isDevelopment(),
    isProduction: ENV.isProduction(),
    apiBaseUrl: ENV.getApiBaseUrl(),
    backendUrl: ENV.getBackendUrl(),
    pipelineCRMUrl: ENV.getPipelineCRMUrl()
  })
};

// Log environment info on startup
console.log('🚀 Environment Configuration:', ENV.getInfo());
ENVEOF

# Replace the placeholder with actual URL
sed -i.bak "s|PRODUCTION_URL_PLACEHOLDER|${SERVICE_URL}|g" "$FRONTEND_CONFIG_FILE"
rm "${FRONTEND_CONFIG_FILE}.bak"

echo "✅ Frontend configuration updated successfully!"
echo "📝 Updated getPipelineCRMUrl() to point to: ${SERVICE_URL}"

echo ""
echo "🎉 Frontend is now configured for production!"
echo "📝 Next steps:"
echo "  1. Test the frontend locally with production backend"
echo "  2. Deploy frontend to Netlify"
echo "  3. Verify end-to-end functionality"
