// API Configuration Utility
// Detect environment
const isProduction = window.location.hostname.includes('netlify.app') || 
                    window.location.hostname.includes('vercel.app') ||
                    import.meta.env.PROD;

// Get API base URL
export const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production fallback - use relative URLs for Netlify proxy
  if (isProduction) {
    return ''; // Use relative URLs for Netlify proxy
  }
  
  // Development fallback - always use localhost for development
  return 'http://localhost:8804';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Helper function for making API calls that works in both environments
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Making API call to:', url);
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Endpoint:', endpoint);
  return fetch(url, options);
};
