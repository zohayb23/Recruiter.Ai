export interface Experience {
  company: string | null;
  duration: string | null;
  description: string;
  highlights: string[];
}

export interface MatchDetails {
  coverage?: number;
  relevance?: number;
  skills_score?: number;
  experience_score?: number;
}

export interface SearchResultItem {
  filename: string;
  name: string;
  summary: string;
  experience?: string;
  skills?: string[];
  location?: string;
  email?: string;
  phone?: string;
  scores?: {
    overall: number;
    skills: number;
    experience: number;
  };
  metadata?: {
    lastModified?: string;
    fileSize?: number;
    fileType?: string;
  };
  match_details?: MatchDetails;
  matching_skills?: string[];
  missing_skills?: string[];
  matching_experience?: Experience[];
}

export interface SearchComponentProps extends SearchResultItem {
  expanded?: boolean;
} 