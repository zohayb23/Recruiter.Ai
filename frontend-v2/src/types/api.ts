// Common API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface User {
  username: string;
  role?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const JobStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

export const CandidateStatus = {
  NEW: 'NEW',
  SCREENING: 'SCREENING',
  INTERVIEWING: 'INTERVIEWING',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED'
} as const;

export type CandidateStatus = typeof CandidateStatus[keyof typeof CandidateStatus];

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  isRemote?: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: JobStatus;
  department: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  currentPosition: string;
  experience: number;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  resumeUrl?: string;
  status: CandidateStatus;
  createdAt: string;
  updatedAt: string;
} 