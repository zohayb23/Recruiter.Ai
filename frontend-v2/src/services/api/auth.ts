import { api } from './config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
}; 