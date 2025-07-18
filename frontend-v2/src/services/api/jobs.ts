import type { ApiResponse, Job } from '../../types/api';
import apiClient from './config';

export interface JobFilters {
  id?: string;
  status?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

export const jobsApi = {
  getJobs: async (filters: JobFilters = {}): Promise<ApiResponse<JobsResponse>> => {
    const response = await apiClient.get<ApiResponse<JobsResponse>>('/jobs', { params: filters });
    return response.data;
  },

  getJob: async (id: string): Promise<ApiResponse<Job>> => {
    const response = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Job>> => {
    const response = await apiClient.post<ApiResponse<Job>>('/jobs', job);
    return response.data;
  },

  updateJob: async (id: string, job: Partial<Job>): Promise<ApiResponse<Job>> => {
    const response = await apiClient.put<ApiResponse<Job>>(`/jobs/${id}`, job);
    return response.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`);
  },
}; 