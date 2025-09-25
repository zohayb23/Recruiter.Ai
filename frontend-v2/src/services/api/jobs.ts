import { api } from './config';

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary_range?: string;
  status: 'open' | 'closed' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface JobFilters {
  status?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JobsResponse {
  data: Job[];
  total: number;
  page: number;
  limit: number;
}

export const searchJobs = async (filters: JobFilters): Promise<JobsResponse> => {
  const response = await api.get('/api/job-descriptions');
  // Backend returns { job_descriptions: [...], total: X, message: "..." }
  const jobs = response.data.job_descriptions || [];
  return { data: jobs, total: jobs.length, page: 1, limit: jobs.length };
};

export const getJobById = async (id: string): Promise<Job> => {
  const response = await api.get(`/api/job-descriptions/${id}`);
    return response.data;
};

export const createJob = async (job: Partial<Job>): Promise<Job> => {
  const response = await api.post('/jobs', job);
    return response.data;
};

export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job> => {
  const response = await api.put(`/jobs/${id}`, updates);
    return response.data;
};

export const deleteJob = async (id: string): Promise<void> => {
  await api.delete(`/jobs/${id}`);
}; 