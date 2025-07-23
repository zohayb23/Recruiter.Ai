import axios from 'axios';
import { API_BASE_URL } from './config';

export interface Contact {
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
}

export interface Education {
  degree: string;
  institution: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  gpa?: number;
  description?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description: string[];
  technologies: string[];
}

export interface Skill {
  name: string;
  category?: string;
  years_of_experience?: number;
  level?: string;
}

export interface ParsedResume {
  full_name: string;
  contact: Contact;
  summary?: string;
  work_experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: string[];
  languages: string[];
  raw_text: string;
}

export interface ResumeParseResponse {
  success: boolean;
  message?: string;
  data?: ParsedResume;
}

export const parseResume = async (file: File): Promise<ResumeParseResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<ResumeParseResponse>(
      `${API_BASE_URL}/resume-parser/parse`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Error parsing resume');
    }
    throw error;
  }
}; 