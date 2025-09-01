import { ENV } from '../../config/environment';

// Smart API configuration that automatically detects environment
export const API_BASE_URL = ENV.getApiBaseUrl();

import axios from 'axios';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 1 minute default timeout
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the full error details
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      }
    });
    return Promise.reject(error);
  }
);

// Log the current API configuration for debugging
console.log('🌐 API Configuration:', {
  environment: ENV.isDevelopment() ? 'Development' : 'Production',
  baseURL: API_BASE_URL,
  fullURL: window.location.href
});