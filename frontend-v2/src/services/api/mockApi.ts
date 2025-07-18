import type { ApiResponse, LoginRequest, LoginResponse, User } from '../../types/api';

const mockUser: User = {
  id: '1',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'RECRUITER',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockToken = 'mock-jwt-token';

export const mockAuthApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
      localStorage.setItem('token', mockToken);
      return {
        data: {
          user: mockUser,
          token: mockToken,
        },
        status: 200,
      };
    }

    throw new Error('Invalid credentials');
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const token = localStorage.getItem('token');
    if (token === mockToken) {
      return {
        data: mockUser,
        status: 200,
      };
    }

    throw new Error('Not authenticated');
  },

  logout: async (): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.removeItem('token');
  },
}; 