// Common API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  RECRUITER: 'RECRUITER',
  HIRING_MANAGER: 'HIRING_MANAGER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Job types
export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  isRemote: boolean;
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

export const JobStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

// Job filters
export interface Filters {
  status: string;
  department: string;
  search: string;
  page: number;
  limit: number;
}

// Candidate types
export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentPosition?: string;
  experience: number;
  skills: string[];
  education: Education[];
  resumeUrl?: string;
  status: CandidateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export const CandidateStatus = {
  NEW: 'NEW',
  SCREENING: 'SCREENING',
  INTERVIEWING: 'INTERVIEWING',
  OFFERED: 'OFFERED',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
} as const;

export type CandidateStatus = typeof CandidateStatus[keyof typeof CandidateStatus]; 