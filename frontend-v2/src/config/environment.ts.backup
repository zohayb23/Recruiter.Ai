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
                // Production: use relative URLs for Netlify proxy
                return '';
            }
        },

        // Get the pipeline CRM backend URL
        getPipelineCRMUrl: () => {
            if (ENV.isDevelopment()) {
                // Development: use local pipeline CRM backend
                return 'http://localhost:8809';
            } else {
                // Production: use relative URLs for Netlify proxy
                return '/api/crm';
            }
        },

        // Get the mass mailing backend URL
        getMassMailingUrl: () => {
            if (ENV.isDevelopment()) {
                // Development: use local mass mailing backend
                return 'http://localhost:8810';
            } else {
                // Production: use relative URLs for Netlify proxy
                return '/api/mass-mailing';
            }
        },

        // Get the backend URL for direct access (useful for debugging)
        getBackendUrl: () => {
            if (ENV.isDevelopment()) {
                // Development: use local complete backend with Milvus integration
                return 'http://localhost:8804';
            } else {
                // Production: use relative URLs for Netlify proxy
                return '/api';
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
    backendUrl: ENV.getBackendUrl()
  })
};

// Log environment info on startup
console.log('🚀 Environment Configuration:', ENV.getInfo());
