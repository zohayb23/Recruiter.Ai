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
      // Development: use new GCP backend directly on port 8804
      return 'http://34.121.146.153:8804';
    } else {
      // Production: use relative URLs for Netlify proxy
      return '';
    }
  },

  // Get the backend URL for direct access (useful for debugging)
  getBackendUrl: () => {
    if (ENV.isDevelopment()) {
      // Development: use new GCP backend directly
      return 'http://34.121.146.153:8804';
    } else {
      return 'http://34.121.146.153';
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
