import { api } from './config';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
}

export interface SearchResults {
  total_results: number;
  page: number;
  results_per_page: number;
  jobs: Job[];
}

export interface SearchParams {
  query?: string;
  location?: string;
  page?: number;
  full_time?: boolean;
  part_time?: boolean;
  contract?: boolean;
  permanent?: boolean;
  results_per_page?: number;
}

export const searchExternalJobs = async (params: SearchParams): Promise<SearchResults> => {
  const response = await api.get('/external-jobs/search', { params });
  return response.data;
};

export const getJobDetails = async (jobId: string): Promise<Job> => {
  try {
    const response = await api.get(`/external-jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
}; 