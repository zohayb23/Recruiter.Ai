import type { ApiResponse, LoginRequest, LoginResponse, User } from '../../types/api';
import apiClient from './config';
import { mockAuthApi } from './mockApi';

// Use mock API in development
const isDevelopment = import.meta.env.MODE === 'development';
const api = isDevelopment ? mockAuthApi : {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
  },
};

export const authApi = api; 