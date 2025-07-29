import { api } from './config';

export interface Contact {
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Education {
  degree: string;
  institution: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  description?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string[];
  technologies: string[];
}

export interface Skill {
  name: string;
  category?: string;
  years_of_experience?: number;
  proficiency_level?: string;
}

export interface ParsedResume {
  resume_id: string;
  full_name: string;
  contact: Contact;
  education: Education[];
  work_experience: WorkExperience[];
  skills: Skill[];
  professional_summary?: string;
  file_path: string;
  created_at: string;
}

export const parseResume = async (file: File): Promise<ParsedResume> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ParsedResume>('/resume-parser/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}; 