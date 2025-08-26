import { api } from './config';
import type { ParsedResume } from '../../types/resume';

export interface ResumeParseResponse {
  success: boolean;
  message?: string;
  data?: ParsedResume;
}

export const parseResume = async (file: File): Promise<ParsedResume> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ParsedResume>('/api/resume-parser/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};