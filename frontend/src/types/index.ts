export type Operator = 'AND' | 'OR' | 'NOT';

export interface QueryTerm {
  value: string;
  operator: Operator;
}

export interface QueryGroup {
  operator: 'AND' | 'OR';
  terms: QueryTerm[];
  parentheses: boolean;
  negated?: boolean;
}

export interface QueryTemplate {
  id: string;
  name: string;
  groups: QueryGroup[];
  createdAt: string;
}

export interface SearchResultScore {
  overall?: number;
  skills?: number;
  experience?: number;
  relevance?: number;
}

export interface MatchedTerm {
  term: string;
  operator: Operator;
  context: string;
}

export interface SearchResultItem {
  filename: string;
  source: string;
  content: string;
  summary?: string;
  score: number;
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
}

export interface SearchState {
  templates: QueryTemplate[];
  currentTemplate: QueryTemplate | null;
  suggestions: string[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
}

export interface RootState {
  search: SearchState;
} 