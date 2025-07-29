import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, logout as logoutApi, type LoginCredentials } from '../services/api/auth';
import { useState } from 'react';

export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await loginApi(credentials);
      // Store the token
      localStorage.setItem('token', response.access_token);
      // Set user state
      setUser({ username: credentials.username });
      return response;
    },
    onSuccess: () => {
      navigate('/');
    },
  });

  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      await logoutApi();
      // Clear token and user state
      localStorage.removeItem('token');
      setUser(null);
    },
    onSuccess: () => {
      navigate('/login');
    },
  });

  return {
    user,
    isLoadingUser: false,
    login,
    isLoggingIn,
    logout,
    isAuthenticated: !!user,
  };
}; 