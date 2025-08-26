import { api } from './config';

export interface WorkExperience {
  company?: string;
  position?: string;
  duration?: string;
  description?: string;
}

export interface Candidate {
  resume_id: string;
  full_name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  skills: string[];
  education: string;
  work_experience: WorkExperience[] | string;
  created_at: string;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  total_pages: number;
}

export interface CandidateSearchParams {
  status?: string;
  skills?: string;
  search?: string;
  minExperience?: number;
  page?: number;
  limit?: number;
}

export const getCandidates = async (params: CandidateSearchParams = {}): Promise<CandidatesResponse> => {
  const response = await api.get<CandidatesResponse>('/api/candidates/search', { params });
  return response.data;
};