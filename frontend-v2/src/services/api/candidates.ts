import { api } from './config';
import type { Candidate } from '../../types/api';

interface CandidateFilters {
  status?: string;
  skills?: string;
  search?: string;
  minExperience?: number;
  page?: number;
  limit?: number;
}

interface CandidateResponse {
  data: Candidate[];
  total: number;
  page: number;
  limit: number;
}

export const searchCandidates = async (filters: CandidateFilters): Promise<CandidateResponse> => {
  try {
    const response = await api.get('/candidates/search', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching candidates:', error);
    throw error;
  }
};

export const getCandidateById = async (id: string): Promise<Candidate> => {
  try {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching candidate:', error);
    throw error;
  }
};

export const createCandidate = async (candidate: Partial<Candidate>): Promise<Candidate> => {
  try {
    const response = await api.post('/candidates', candidate);
    return response.data;
  } catch (error) {
    console.error('Error creating candidate:', error);
    throw error;
  }
};

export const updateCandidate = async (id: string, updates: Partial<Candidate>): Promise<Candidate> => {
  try {
    const response = await api.put(`/candidates/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
};

export const deleteCandidate = async (id: string): Promise<void> => {
  try {
    await api.delete(`/candidates/${id}`);
  } catch (error) {
    console.error('Error deleting candidate:', error);
    throw error;
  }
}; 