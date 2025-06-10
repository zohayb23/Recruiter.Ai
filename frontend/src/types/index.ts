export type Operator = 'AND' | 'OR' | 'NOT';

export interface QueryTerm {
  value: string;
  operator: Operator;
}

export interface QueryGroup {
  terms: QueryTerm[];
  operator: 'AND' | 'OR';
  parentheses?: boolean;
}

export interface QueryTemplate {
  id: string;
  name: string;
  groups: QueryGroup[];
  createdAt: string;
}

export interface SearchState {
  templates: QueryTemplate[];
  currentTemplate: QueryTemplate | null;
  suggestions: string[];
  loading: boolean;
  error: string | null;
} 