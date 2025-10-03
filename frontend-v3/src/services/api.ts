import axios from 'axios';

// API Base URLs
const API_BASE_URLS = {
  milvus: 'http://localhost:8804',
  crm: 'http://localhost:8809',
  massMailing: 'http://localhost:8810',
};

// Create axios instances for each service
const milvusAPI = axios.create({
  baseURL: API_BASE_URLS.milvus,
  timeout: 10000,
});

const crmAPI = axios.create({
  baseURL: API_BASE_URLS.crm,
  timeout: 10000,
});

const massMailingAPI = axios.create({
  baseURL: API_BASE_URLS.massMailing,
  timeout: 10000,
});

// Types
export interface JobDescription {
  job_id: string;
  title: string;
  company: string;
  department: string;
  location_type: string;
  location: string;
  experience_level: string;
  overview: string;
  responsibilities: string[];
  qualifications: string[];
  required_skills: string[];
  preferred_skills: string[];
  benefits: string[];
  company_description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  created_by: string;
  created_at: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
}

export interface CandidatePipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  description: string;
  color: string;
}

// Milvus API (Job Descriptions & AI Features)
export const milvusService = {
  // Get all job descriptions
  getJobDescriptions: async (): Promise<{ job_descriptions: JobDescription[]; total: number }> => {
    const response = await milvusAPI.get('/api/job-descriptions');
    return response.data;
  },

  // Get job description by ID
  getJobDescription: async (id: string): Promise<JobDescription> => {
    const response = await milvusAPI.get(`/api/job-descriptions/${id}`);
    return response.data;
  },

  // Create new job description
  createJobDescription: async (jobData: Partial<JobDescription>): Promise<JobDescription> => {
    const response = await milvusAPI.post('/api/job-descriptions', jobData);
    return response.data;
  },

  // Update job description
  updateJobDescription: async (id: string, jobData: Partial<JobDescription>): Promise<JobDescription> => {
    const response = await milvusAPI.put(`/api/job-descriptions/${id}`, jobData);
    return response.data;
  },

  // Delete job description
  deleteJobDescription: async (id: string): Promise<void> => {
    await milvusAPI.delete(`/api/job-descriptions/${id}`);
  },

  // Semantic search
  semanticSearch: async (query: string, limit: number = 10): Promise<any> => {
    const response = await milvusAPI.post('/api/search/semantic', { query, limit });
    return response.data;
  },

  // Parse resume
  parseResume: async (resumeData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/resume-parser/parse', resumeData);
    return response.data;
  },

  // Health check
  health: async (): Promise<any> => {
    const response = await milvusAPI.get('/health');
    return response.data;
  },
};

// CRM API (Candidate Pipeline Management)
export const crmService = {
  // Get all candidate pipelines
  getCandidatePipelines: async (): Promise<{ pipelines: CandidatePipeline[]; total: number }> => {
    const response = await crmAPI.get('/api/candidate-pipelines');
    return response.data;
  },

  // Get pipeline by ID
  getCandidatePipeline: async (id: string): Promise<CandidatePipeline> => {
    const response = await crmAPI.get(`/api/candidate-pipelines/${id}`);
    return response.data;
  },

  // Create new pipeline
  createCandidatePipeline: async (pipelineData: Partial<CandidatePipeline>): Promise<CandidatePipeline> => {
    const response = await crmAPI.post('/api/candidate-pipelines', pipelineData);
    return response.data;
  },

  // Update pipeline
  updateCandidatePipeline: async (id: string, pipelineData: Partial<CandidatePipeline>): Promise<CandidatePipeline> => {
    const response = await crmAPI.put(`/api/candidate-pipelines/${id}`, pipelineData);
    return response.data;
  },

  // Delete pipeline
  deleteCandidatePipeline: async (id: string): Promise<void> => {
    await crmAPI.delete(`/api/candidate-pipelines/${id}`);
  },

  // Get pipeline stages
  getPipelineStages: async (pipelineId: string): Promise<PipelineStage[]> => {
    const response = await crmAPI.get(`/api/candidate-pipelines/${pipelineId}/stages`);
    return response.data;
  },

  // Health check
  health: async (): Promise<any> => {
    const response = await crmAPI.get('/health');
    return response.data;
  },
};

// Mass Mailing API (Email Campaigns)
export const massMailingService = {
  // Get all campaigns
  getCampaigns: async (): Promise<{ campaigns: Campaign[]; total: number }> => {
    const response = await massMailingAPI.get('/api/campaigns');
    return response.data;
  },

  // Get campaign by ID
  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await massMailingAPI.get(`/api/campaigns/${id}`);
    return response.data;
  },

  // Create new campaign
  createCampaign: async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await massMailingAPI.post('/api/campaigns', campaignData);
    return response.data;
  },

  // Update campaign
  updateCampaign: async (id: string, campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await massMailingAPI.put(`/api/campaigns/${id}`, campaignData);
    return response.data;
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<void> => {
    await massMailingAPI.delete(`/api/campaigns/${id}`);
  },

  // Send campaign
  sendCampaign: async (id: string): Promise<any> => {
    const response = await massMailingAPI.post(`/api/campaigns/${id}/send`);
    return response.data;
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id: string): Promise<any> => {
    const response = await massMailingAPI.get(`/api/campaigns/${id}/analytics`);
    return response.data;
  },

  // Health check
  health: async (): Promise<any> => {
    const response = await massMailingAPI.get('/health');
    return response.data;
  },
};

// Combined service for dashboard data
export const dashboardService = {
  // Get dashboard metrics
  getDashboardMetrics: async () => {
    try {
      const [jobsResponse, campaignsResponse, pipelinesResponse] = await Promise.all([
        milvusService.getJobDescriptions(),
        massMailingService.getCampaigns(),
        crmService.getCandidatePipelines(),
      ]);

      return {
        totalJobs: jobsResponse.total,
        totalCampaigns: campaignsResponse.total,
        totalPipelines: pipelinesResponse.total,
        recentJobs: jobsResponse.job_descriptions.slice(0, 5),
        recentCampaigns: campaignsResponse.campaigns.slice(0, 5),
        recentPipelines: pipelinesResponse.pipelines.slice(0, 5),
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Health check all services
  healthCheck: async () => {
    try {
      const [milvusHealth, crmHealth, massMailingHealth] = await Promise.all([
        milvusService.health(),
        crmService.health(),
        massMailingService.health(),
      ]);

      return {
        milvus: milvusHealth,
        crm: crmHealth,
        massMailing: massMailingHealth,
        allHealthy: true,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        milvus: null,
        crm: null,
        massMailing: null,
        allHealthy: false,
        error: error,
      };
    }
  },
};

export default {
  milvus: milvusService,
  crm: crmService,
  massMailing: massMailingService,
  dashboard: dashboardService,
};
