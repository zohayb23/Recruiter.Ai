import { api } from './config';

export interface JobDescriptionResponse {
  id: string;
  title: string;
  company?: string;
  company_description?: string;
  department?: string;
  location?: string;
  location_type?: string;
  experience_level?: string;
  overview?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface JobDescription {
  id?: string;
  title: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const getJobDescriptions = async (): Promise<JobDescriptionResponse[]> => {
  const response = await api.get('/api/job-descriptions');
  // Backend returns { job_descriptions: [...], total: X, message: "..." }
  return response.data.job_descriptions || [];
};

export const getJobDescription = async (id: string): Promise<JobDescriptionResponse> => {
  const response = await api.get(`/api/job-descriptions/${id}`);
  return response.data;
};

export const generateJobDescription = async (data: any): Promise<any> => {
  const response = await api.post('/api/job-descriptions/generate', data);
  return response.data;
};

export const saveJobDescription = async (data: any): Promise<JobDescriptionResponse> => {
  const response = await api.post('/api/job-descriptions/save', data);
  return response.data;
};

export const jobDescriptionApi = {
  getJobDescriptions,
  getJobDescription,
  generateJobDescription,
  saveJobDescription
};