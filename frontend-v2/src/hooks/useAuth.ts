import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/auth';
import type { LoginRequest } from '../types/api';

export const useAuth = () => {
  const navigate = useNavigate();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data;
    },
    retry: false,
  });

  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await authApi.login(credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      navigate('/jobs');
    },
  });

  const { mutate: logout } = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      navigate('/login');
    },
  });

  return {
    user,
    isLoadingUser,
    login,
    isLoggingIn,
    logout,
    isAuthenticated: !!user,
  };
}; 