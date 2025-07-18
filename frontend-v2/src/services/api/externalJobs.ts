import axios from 'axios';
import { API_BASE_URL } from './config';

export interface JobSearchParams {
  query?: string;
  location?: string;
  page?: number;
  fullTime?: boolean;
  partTime?: boolean;
  contract?: boolean;
  permanent?: boolean;
  resultsPerPage?: number;
}

export interface Company {
  display_name: string;
}

export interface Location {
  display_name: string;
  area: string[];
}

export interface ExternalJob {
  id: string;
  title: string;
  description: string;
  company: Company;
  location: Location;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  created: string;
  redirect_url: string;
}

export interface JobSearchResponse {
  count: number;
  mean?: number;
  results: ExternalJob[];
}

export const searchExternalJobs = async (params: JobSearchParams): Promise<JobSearchResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/external-jobs/search`, {
      params: {
        query: params.query,
        location: params.location,
        page: params.page || 1,
        full_time: params.fullTime,
        part_time: params.partTime,
        contract: params.contract,
        permanent: params.permanent,
        results_per_page: params.resultsPerPage || 10
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error searching external jobs:', error);
    throw error;
  }
};

export const getExternalJobDetails = async (jobId: string): Promise<ExternalJob> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/external-jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching external job details:', error);
    throw error;
  }
}; 