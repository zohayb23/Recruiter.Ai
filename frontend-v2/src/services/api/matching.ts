import { api } from './config';
import type { Candidate } from './candidates';

export interface MatchingResponse {
  candidates: (Candidate & { match_score: number })[];
  total: number;
}

export const getMatchingCandidates = async (
  jobId: string,
  limit: number = 10,
  minScore: number = 0.6
): Promise<MatchingResponse> => {
  console.log(`Fetching matching candidates for job ${jobId}`);
  
  // Log the full URL being requested
  const url = `/api/matching/${jobId}/candidates`;
  const params = { limit, min_score: minScore };
  console.log('Request URL:', url);
  console.log('Request params:', params);
  
  try {
    const response = await api.get<MatchingResponse>(url, { params });
    console.log('Matching response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching matching candidates:', error);
    throw error;
  }
};