import { api } from './config';

export interface ScoreBreakdown {
  semantic_similarity: number;
  skills_match: number;
  experience_level: number;
  location_match: number;
}

export interface ScoringWeights {
  semantic_similarity: number;
  skills_match: number;
  experience_level: number;
  location_match: number;
}

export interface CandidateScore {
  resume_id: string;
  job_id: string;
  candidate_name: string;
  job_title: string;
  total_score: number;
  score_breakdown: ScoreBreakdown;
  weights: ScoringWeights;
  scored_at: string;
  recommendation: 'Recommended' | 'Consider' | 'Not Recommended';
}

export interface BatchScoreResult {
  job_id: string;
  total_candidates: number;
  results: CandidateScore[];
}

export interface ScoreRequest {
  resume_id: string;
  job_id: string;
}

export interface BatchScoreRequest {
  job_id: string;
  resume_ids: string[];
}

// API Functions
export const scoreCandidate = async (request: ScoreRequest): Promise<CandidateScore> => {
  const response = await api.post('/api/candidate-scoring/score', request);
  return response.data;
};

export const scoreBatch = async (request: BatchScoreRequest): Promise<BatchScoreResult> => {
  const response = await api.post(`/api/candidate-scoring/score-batch?job_id=${request.job_id}`, request.resume_ids);
  return response.data;
};

export const getCandidatesForJob = async (jobId: string): Promise<CandidateScore[]> => {
  const response = await api.get(`/api/candidate-scoring/job/${jobId}/candidates`);
  return response.data;
};

export const getJobsForCandidate = async (resumeId: string): Promise<CandidateScore[]> => {
  const response = await api.get(`/api/candidate-scoring/candidate/${resumeId}/jobs`);
  return response.data;
};

export const getScoringHealth = async (): Promise<{ status: string; service: string; weights: ScoringWeights }> => {
  const response = await api.get('/api/candidate-scoring/health');
  return response.data;
};

// Debug endpoints
export const debugResumeData = async (resumeId: string): Promise<any> => {
  const response = await api.get(`/api/candidate-scoring/debug/resume/${resumeId}`);
  return response.data;
};

export const debugJobData = async (jobId: string): Promise<any> => {
  const response = await api.get(`/api/candidate-scoring/debug/job/${jobId}`);
  return response.data;
};

// API object for easy importing
export const candidateScoringApi = {
  scoreCandidate,
  scoreBatch,
  getCandidatesForJob,
  getJobsForCandidate,
  getScoringHealth,
  debugResumeData,
  debugJobData
};
