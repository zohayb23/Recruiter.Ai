import { api } from './config';

export interface Responsibility {
  description: string;
  is_required: boolean;
}

export interface Qualification {
  description: string;
  is_required: boolean;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface JobDescription {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  overview: string;
  responsibilities: Responsibility[];
  qualifications: Qualification[];
  required_skills: string[];
  preferred_skills: string[];
  benefits: Benefit[];
  company_description: string;
  culture_values: string;
  diversity_statement: string;
  status: string;
}

export interface JobDescriptionSuggestions {
  inclusive_language: string[];
  clarity_improvements: string[];
  candidate_attraction: string[];
  technical_accuracy: string[];
  culture_fit: string[];
}

export interface MarketAnalysis {
  salary_competitiveness: string;
  skills_alignment: string;
  experience_requirements: string;
  title_accuracy: string;
}

export const generateJobDescription = async (data: any) => {
  const response = await api.post('/job-descriptions/generate', data);
  return response.data;
};

export const getJobDescription = async (id: string) => {
  const response = await api.get(`/job-descriptions/${id}`);
  return response.data;
};

export const listJobDescriptions = async () => {
  const response = await api.get('/job-descriptions');
  return response.data;
};

export const createJobDescription = async (data: JobDescription) => {
  const response = await api.post('/job-descriptions', data);
  return response.data;
};

export const updateJobDescription = async (id: string, data: any) => {
  const response = await api.put(`/job-descriptions/${id}`, data);
  return response.data;
};

export const deleteJobDescription = async (id: string) => {
  const response = await api.delete(`/job-descriptions/${id}`);
  return response.data;
};

export const publishJobDescription = async (id: string) => {
  const response = await api.post(`/job-descriptions/${id}/publish`);
  return response.data;
};

export const archiveJobDescription = async (id: string) => {
  const response = await api.post(`/job-descriptions/${id}/archive`);
  return response.data;
};

export const improveJobDescription = async (id: string) => {
  const response = await api.post(`/job-descriptions/${id}/improve`);
  return response.data as JobDescriptionSuggestions;
};

export const analyzeMarketAlignment = async (id: string) => {
  const response = await api.post(`/job-descriptions/${id}/market-analysis`);
  return response.data as MarketAnalysis;
}; 