import { api } from './config';

export interface Responsibility {
  description: string;
  is_required: boolean;
}

export interface Qualification {
  description: string;
  is_required: boolean;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface JobDescription {
  title: string;
  company?: string;
  department?: string;
  experience_level?: string;
  overview?: string;
  responsibilities?: Responsibility[];
  qualifications?: Qualification[];
  required_skills?: string[];
  preferred_skills?: string[];
  benefits?: Benefit[];
  company_description?: string;
  culture_values?: string;
  diversity_statement?: string;
  status?: string;
}

export interface JobDescriptionResponse extends JobDescription {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface JobDescriptionSuggestions {
  inclusive_language: string[];
  clarity_improvements: string[];
  attractiveness_suggestions: string[];
  technical_accuracy: string[];
  culture_fit: string[];
}

export interface MarketAnalysis {
  salary_range: {
    min: number;
    max: number;
    currency: string;
    notes?: string;
  };
  skills_alignment: {
    score: number;
    trending_skills: string[];
    missing_skills: string[];
    notes?: string;
  };
  experience_match: {
    score: number;
    market_average: string;
    notes?: string;
  };
  title_accuracy: {
    score: number;
    alternative_titles: string[];
    notes?: string;
  };
}

export interface GenerateJobDescriptionParams {
  title: string;
  company?: string;
  department?: string;
  experience_level?: string;
  required_skills?: string[];
}

export const generateJobDescription = async (data: GenerateJobDescriptionParams) => {
  const response = await api.post('/api/job-descriptions/generate', data);
  return response.data;
};

export const saveJobDescription = async (data: JobDescription): Promise<JobDescriptionResponse> => {
  // Clean up the data before sending
  const cleanedData = {
    ...data,
    company: typeof data.company === 'string' ? data.company.trim() || null : null,
    department: typeof data.department === 'string' ? data.department.trim() || null : null,
    experience_level: typeof data.experience_level === 'string' ? data.experience_level.trim() || null : null,
    overview: typeof data.overview === 'string' ? data.overview.trim() || null : null,
    responsibilities: Array.isArray(data.responsibilities) && data.responsibilities.length > 0 
      ? data.responsibilities.map(r => ({
          description: r.description.trim(),
          is_required: r.is_required
        }))
      : null,
    qualifications: Array.isArray(data.qualifications) && data.qualifications.length > 0
      ? data.qualifications.map(q => ({
          description: q.description.trim(),
          is_required: q.is_required
        }))
      : null,
    benefits: Array.isArray(data.benefits) && data.benefits.length > 0
      ? data.benefits.map(b => ({
          title: b.title.trim(),
          description: typeof b.description === 'string' ? b.description.trim() || '' : ''
        }))
      : null,
    required_skills: Array.isArray(data.required_skills) && data.required_skills.length > 0
      ? data.required_skills.filter(s => typeof s === 'string' && s.trim())
      : null,
    preferred_skills: Array.isArray(data.preferred_skills) && data.preferred_skills.length > 0
      ? data.preferred_skills.filter(s => typeof s === 'string' && s.trim())
      : null,
    company_description: typeof data.company_description === 'string' ? data.company_description.trim() || null : null,
    culture_values: typeof data.culture_values === 'string' ? data.culture_values.trim() || null : null,
    diversity_statement: typeof data.diversity_statement === 'string' ? data.diversity_statement.trim() || null : null,
    status: data.status || 'draft'
  };

  // Remove any empty strings or empty arrays
  Object.keys(cleanedData).forEach(key => {
    if (typeof cleanedData[key] === 'string' && !cleanedData[key].trim()) {
      delete cleanedData[key];
    }
    if (Array.isArray(cleanedData[key]) && cleanedData[key].length === 0) {
      delete cleanedData[key];
    }
  });

  const response = await api.post('/api/job-descriptions/save', cleanedData);
  return response.data;
};

export const getDraftJobDescriptions = async (): Promise<JobDescriptionResponse[]> => {
  const response = await api.get('/api/job-descriptions/drafts');
  return response.data;
};

export const getJobDescription = async (id: string): Promise<JobDescriptionResponse> => {
  const response = await api.get(`/api/job-descriptions/${id}`);
  return response.data;
};

export const getJobDescriptions = async (): Promise<JobDescriptionResponse[]> => {
  const response = await api.get<JobDescriptionResponse[]>('/api/job-descriptions/drafts');
  return response.data;
};

export const createJobDescription = async (data: JobDescription) => {
  const response = await api.post<JobDescription>('/api/job-descriptions', data);
  return response.data;
};

export const updateJobDescription = async (id: string, data: Partial<JobDescription>) => {
  const response = await api.put<JobDescription>(`/api/job-descriptions/${id}`, data);
  return response.data;
};

export const deleteJobDescription = async (id: string) => {
  await api.delete(`/api/job-descriptions/${id}`);
};

export const publishJobDescription = async (id: string) => {
  const response = await api.post<JobDescription>(`/api/job-descriptions/${id}/publish`);
  return response.data;
};

export const archiveJobDescription = async (id: string) => {
  const response = await api.post<JobDescription>(`/api/job-descriptions/${id}/archive`);
  return response.data;
};

export const improveJobDescription = async (id: string) => {
  const response = await api.post<JobDescriptionSuggestions>(`/api/job-descriptions/${id}/improve`);
  return response.data;
};

export const analyzeMarketAlignment = async (id: string) => {
  const response = await api.post<MarketAnalysis>(`/api/job-descriptions/${id}/market-analysis`);
  return response.data;
};