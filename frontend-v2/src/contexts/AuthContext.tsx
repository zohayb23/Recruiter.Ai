import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, LoginRequest } from '../types/api';
import { UserRole } from '../types/api';

interface AuthContextType {
  user: User | undefined;
  isLoadingUser: boolean;
  login: (credentials: LoginRequest) => void;
  isLoggingIn: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development
const mockUser: User = {
  id: '1',
  email: 'dev@recruiter.ai',
  firstName: 'Development',
  lastName: 'User',
  role: UserRole.ADMIN,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // Always return authenticated state with mock user
  const value = {
    user: mockUser,
    isLoadingUser: false,
    login: () => navigate('/jobs'),
    isLoggingIn: false,
    logout: () => navigate('/jobs'),
    isAuthenticated: true,
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