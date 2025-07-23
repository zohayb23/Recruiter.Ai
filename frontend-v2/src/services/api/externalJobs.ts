import { API_BASE_URL } from './config';
import axios from 'axios';

export interface JobSearchParams {
  query?: string;
  location?: string;
  page?: number;
  full_time?: boolean;
  part_time?: boolean;
  contract?: boolean;
  permanent?: boolean;
  results_per_page?: number;
}

export interface Company {
  display_name: string;
}

export interface Location {
  display_name: string;
  area: string[];
}

export interface Job {
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
  results: Job[];
}

export const searchExternalJobs = async (params: JobSearchParams): Promise<JobSearchResponse> => {
  try {
    // Convert params to URL search params
    const searchParams = new URLSearchParams();
    
    // Add basic params
    if (params.query) searchParams.append('query', params.query);
    if (params.location) searchParams.append('location', params.location);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.results_per_page) searchParams.append('results_per_page', params.results_per_page.toString());
    
    // Add boolean params
    if (params.full_time) searchParams.append('full_time', 'true');
    if (params.part_time) searchParams.append('part_time', 'true');
    if (params.contract) searchParams.append('contract', 'true');
    if (params.permanent) searchParams.append('permanent', 'true');

    const response = await axios.get(`${API_BASE_URL}/external-jobs/search?${searchParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error searching external jobs:', error);
    throw error;
  }
};

export const getJobDetails = async (jobId: string): Promise<Job> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/external-jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
}; 