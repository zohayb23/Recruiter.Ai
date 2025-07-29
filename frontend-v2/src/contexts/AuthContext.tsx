import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, logout as logoutApi, type LoginCredentials } from '../services/api/auth';

interface User {
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoadingUser: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  isLoggingIn: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);
    try {
      const response = await loginApi(credentials);
      localStorage.setItem('token', response.access_token);
      setUser({ username: credentials.username });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoadingUser: false,
    login,
    isLoggingIn,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 