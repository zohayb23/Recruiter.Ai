import { api } from './config';

// Types for duplicate detection
export interface DuplicateStats {
  total_duplicate_names: number;
  total_duplicate_resumes: number;
  resumes_to_remove: number;
  duplicate_groups: Record<string, ResumeData[]>;
}

export interface ResumeData {
  resume_id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  education: EducationData[];
  work_experience: WorkExperienceData[];
  file_path: string;
  created_at: string;
}

export interface EducationData {
  degree: string;
  institution: string;
  start_date?: string;
  end_date?: string;
}

export interface WorkExperienceData {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string[];
  technologies: string[];
}

export interface DuplicateGroup {
  name: string;
  resumes: ResumeData[];
  count: number;
}

export interface RemoveDuplicatesResponse {
  removed_count: number;
  kept_resumes: ResumeData[];
  message: string;
}

// API functions
export const getDuplicateStats = async (): Promise<DuplicateStats> => {
  const response = await api.get('/api/simple-duplicate-detection/stats');
  return response.data;
};

export const findDuplicates = async (): Promise<{ duplicates: Record<string, ResumeData[]>; total_duplicate_groups: number; message: string }> => {
  const response = await api.get('/api/simple-duplicate-detection/find');
  return response.data;
};

export const removeDuplicates = async (): Promise<RemoveDuplicatesResponse> => {
  const response = await api.post('/api/simple-duplicate-detection/remove');
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; service: string; message: string }> => {
  const response = await api.get('/api/simple-duplicate-detection/health');
  return response.data;
};
