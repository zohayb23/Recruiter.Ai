import { QueryGroup } from './index';

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

export interface SearchResultScore {
  overall?: number;
  skills?: number;
  experience?: number;
  relevance?: number;
}

export interface MatchedTerm {
  term: string;
  operator: string;
  context: string;
}

export interface SearchResultItem {
  filename: string;
  source: string;
  content: string;
  summary?: string;
  score: number;
  name?: string;
  skills?: string[];
  experience?: {
    years: number;
    positions: string[];
  };
  scores?: SearchResultScore;
  match_details?: {
    matched_terms: MatchedTerm[];
    operator_groups: string[];
    query_structure: QueryGroup[];
  };
  email?: string;
  phone?: string;
  location?: string;
}

export interface SearchComponentProps extends SearchResultItem {
  expanded?: boolean;
} 