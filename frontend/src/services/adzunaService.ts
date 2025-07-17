import axios from 'axios';

interface JobSearchParams {
  query?: string;          // maps to 'what'
  location?: string;       // maps to 'where'
  page?: number;          
  fullTime?: boolean;      // maps to 'full_time'
  partTime?: boolean;      // maps to 'part_time'
  contract?: boolean;
  permanent?: boolean;
  resultsPerPage?: number; // maps to 'results_per_page'
}

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area: string[];
  };
  salary_min?: number;
  salary_max?: number;
  contract_type: string;
  created: string;
  redirect_url: string;
}

const BASE_URL = 'https://api.adzuna.com/v1/api';
const APP_ID = '67a9f1c4';
const APP_KEY = '61f25f9cf41074f8262fe4483e7b4120';
const COUNTRY = 'us';

export const searchJobs = async (params: JobSearchParams) => {
  try {
    const page = params.page || 1;
    
    // Build query parameters according to API spec
    const queryParams = {
      app_id: APP_ID,
      app_key: APP_KEY,
      results_per_page: params.resultsPerPage || 10,
      what: params.query?.trim(),
      where: params.location?.trim(),
      full_time: params.fullTime ? '1' : undefined,
      part_time: params.partTime ? '1' : undefined,
      contract: params.contract ? '1' : undefined,
      permanent: params.permanent ? '1' : undefined,
      sort_by: 'date'
    };

    // Remove undefined values
    const cleanParams = Object.entries(queryParams)
      .reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

    const response = await axios.get(`${BASE_URL}/jobs/${COUNTRY}/search/${page}`, {
      params: cleanParams,
      headers: {
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Adzuna API Error:', error);
    throw error;
  }
};

export const getJobDetails = async (jobId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/jobs/${COUNTRY}/${jobId}`, {
      params: {
        app_id: APP_ID,
        app_key: APP_KEY
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Adzuna API Error:', error);
    throw error;
  }
};

export type { AdzunaJob, JobSearchParams }; 