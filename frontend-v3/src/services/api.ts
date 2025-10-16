import axios from 'axios';

// Detect environment
const isProduction = window.location.hostname.includes('netlify.app') || 
                    window.location.hostname.includes('vercel.app') ||
                    import.meta.env.PROD;

// API Base URLs - All services consolidated into single backend
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production fallback - use relative URLs for Netlify proxy
  if (isProduction) {
    return ''; // Use relative URLs for Netlify proxy
  }
  
  // Development fallback
  return 'http://localhost:8804';
};

const API_BASE_URL = getApiBaseUrl();

const API_BASE_URLS = {
  milvus: API_BASE_URL,
  crm: API_BASE_URL,
  massMailing: API_BASE_URL,
};

// Create axios instances for each service
const milvusAPI = axios.create({
  baseURL: API_BASE_URLS.milvus,
  timeout: 30000, // Increased timeout for job description generation
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

  // Generate job description using AI
  generateJobDescription: async (jobData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/job-descriptions/generate', jobData);
    return response.data;
  },

  // Save job description
  saveJobDescription: async (jobData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/job-descriptions/save', jobData);
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

  // Enhanced semantic search
  enhancedSearch: async (query: string, searchType: string = 'both', limit: number = 10, filters: any = {}): Promise<any> => {
    const response = await milvusAPI.post('/api/search/enhanced', {
      query,
      search_type: searchType,
      limit,
      filters
    });
    return response.data;
  },

  // AI enhanced semantic search
  aiEnhancedSearch: async (query: string, searchType: string = 'both', limit: number = 10, filters: any = {}, searchMode: string = 'balanced'): Promise<any> => {
    const response = await milvusAPI.post('/api/semantic-search/ai-enhanced', {
      query,
      search_type: searchType,
      limit,
      filters,
      search_mode: searchMode
    });
    return response.data;
  },

  // Generate keywords
  generateKeywords: async (jobData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/keywords/generate', jobData);
    return response.data;
  },

  // Get stored resumes
  getStoredResumes: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/resume-parser/stored-resumes');
    return response.data;
  },

  // Bulk parse resumes
  bulkParseResumes: async (files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await milvusAPI.post('/api/resume-parser/bulk-parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get candidates
  getCandidates: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/candidates');
    return response.data;
  },

  // Get jobs
  getJobs: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/jobs');
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
    const response = await crmAPI.get('/api/crm/pipeline');
    return response.data;
  },

  // Get pipeline by ID
  getCandidatePipeline: async (id: string): Promise<CandidatePipeline> => {
    const response = await crmAPI.get(`/api/crm/pipeline/${id}`);
    return response.data;
  },

  // Create new pipeline
  createCandidatePipeline: async (pipelineData: Partial<CandidatePipeline>): Promise<CandidatePipeline> => {
    const response = await crmAPI.post('/api/crm/pipeline', pipelineData);
    return response.data;
  },

  // Update pipeline
  updateCandidatePipeline: async (id: string, pipelineData: Partial<CandidatePipeline>): Promise<CandidatePipeline> => {
    const response = await crmAPI.put(`/api/crm/pipeline/${id}`, pipelineData);
    return response.data;
  },

  // Delete pipeline
  deleteCandidatePipeline: async (id: string): Promise<void> => {
    await crmAPI.delete(`/api/crm/pipeline/${id}`);
  },

  // Get pipeline stages
  getPipelineStages: async (pipelineId: string): Promise<PipelineStage[]> => {
    const response = await crmAPI.get(`/api/crm/pipeline/${pipelineId}/stages`);
    return response.data;
  },

  // Move candidate to stage
  moveCandidateToStage: async (candidateId: string, stageId: string): Promise<any> => {
    const response = await crmAPI.post('/api/crm/pipeline/move-candidate', {
      candidate_id: candidateId,
      stage_id: stageId
    });
    return response.data;
  },

  // Add candidate to stage
  addCandidateToStage: async (candidateData: any): Promise<any> => {
    const response = await crmAPI.post('/api/crm/pipeline/add-candidate', candidateData);
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
    const response = await massMailingAPI.get('/api/mass-mailing/campaigns');
    return response.data;
  },

  // Get campaign by ID
  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await massMailingAPI.get(`/api/mass-mailing/campaigns/${id}`);
    return response.data;
  },

  // Create new campaign
  createCampaign: async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await massMailingAPI.post('/api/mass-mailing/campaigns', campaignData);
    return response.data;
  },

  // Update campaign
  updateCampaign: async (id: string, campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await massMailingAPI.put(`/api/mass-mailing/campaigns/${id}`, campaignData);
    return response.data;
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<void> => {
    await massMailingAPI.delete(`/api/mass-mailing/campaigns/${id}`);
  },

  // Send campaign
  sendCampaign: async (id: string): Promise<any> => {
    const response = await massMailingAPI.post(`/api/mass-mailing/campaigns/${id}/send`);
    return response.data;
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id: string): Promise<any> => {
    const response = await massMailingAPI.get(`/api/mass-mailing/campaigns/${id}/analytics`);
    return response.data;
  },

  // Get email templates
  getTemplates: async (): Promise<{ templates: any[]; total: number }> => {
    const response = await massMailingAPI.get('/api/mass-mailing/templates');
    return response.data;
  },

  // Create email template
  createTemplate: async (templateData: any): Promise<any> => {
    const response = await massMailingAPI.post('/api/mass-mailing/templates', templateData);
    return response.data;
  },

  // AI generate content
  generateContent: async (contentData: any): Promise<any> => {
    const response = await massMailingAPI.post('/api/mass-mailing/ai-generate-content', contentData);
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

// AI Services
export const aiService = {
  // Candidate scoring
  scoreCandidate: async (candidateId: string, jobId: string): Promise<any> => {
    const response = await milvusAPI.post('/api/candidates/ai-score', {
      candidate_id: candidateId,
      job_id: jobId
    });
    return response.data;
  },

  // Gap analysis
  gapAnalysis: async (candidateId: string, jobId: string, analysisType: string = 'comprehensive'): Promise<any> => {
    const response = await milvusAPI.post('/api/analysis/gap-analysis', {
      candidate_id: candidateId,
      job_id: jobId,
      analysis_type: analysisType
    });
    return response.data;
  },

  // Find similar resumes
  findSimilarResumes: async (resumeId: string, limit: number = 10): Promise<any> => {
    const response = await milvusAPI.post('/api/search/similar-resumes', {
      resume_id: resumeId,
      limit
    });
    return response.data;
  },

  // Find similar jobs
  findSimilarJobs: async (jobId: string, limit: number = 10): Promise<any> => {
    const response = await milvusAPI.post('/api/search/similar-jobs', {
      job_id: jobId,
      limit
    });
    return response.data;
  },
};

// A/B Testing Service
export const abTestingService = {
  // Get experiments
  getExperiments: async (): Promise<{ experiments: any[]; total: number }> => {
    const response = await milvusAPI.get('/api/ab-testing/experiments');
    return response.data;
  },

  // Create experiment
  createExperiment: async (experimentData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/ab-testing/experiments', experimentData);
    return response.data;
  },

  // Start experiment
  startExperiment: async (experimentId: string): Promise<any> => {
    const response = await milvusAPI.put(`/api/ab-testing/experiments/${experimentId}/start`);
    return response.data;
  },

  // Stop experiment
  stopExperiment: async (experimentId: string): Promise<any> => {
    const response = await milvusAPI.put(`/api/ab-testing/experiments/${experimentId}/stop`);
    return response.data;
  },
};

// Segmentation Service
export const segmentationService = {
  // Get segments
  getSegments: async (): Promise<{ segments: any[]; total: number }> => {
    const response = await milvusAPI.get('/api/segmentation/segments');
    return response.data;
  },

  // Create segment
  createSegment: async (segmentData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/segmentation/segments', segmentData);
    return response.data;
  },

  // Get segment candidates
  getSegmentCandidates: async (segmentId: string): Promise<any> => {
    const response = await milvusAPI.get(`/api/segmentation/segments/${segmentId}/candidates`);
    return response.data;
  },
};

// Automation Service
export const automationService = {
  // Get workflows
  getWorkflows: async (): Promise<{ workflows: any[]; total: number }> => {
    const response = await milvusAPI.get('/api/automation/workflows');
    return response.data;
  },

  // Create workflow
  createWorkflow: async (workflowData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/automation/workflows', workflowData);
    return response.data;
  },

  // Activate workflow
  activateWorkflow: async (workflowId: string): Promise<any> => {
    const response = await milvusAPI.put(`/api/automation/workflows/${workflowId}/activate`);
    return response.data;
  },

  // Deactivate workflow
  deactivateWorkflow: async (workflowId: string): Promise<any> => {
    const response = await milvusAPI.put(`/api/automation/workflows/${workflowId}/deactivate`);
    return response.data;
  },
};

// Engagement Service
export const engagementService = {
  // Get engagement history
  getEngagementHistory: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/engagement/history');
    return response.data;
  },

  // Track engagement
  trackEngagement: async (engagementData: any): Promise<any> => {
    const response = await milvusAPI.post('/api/engagement/track', engagementData);
    return response.data;
  },

  // Get engagement analytics
  getEngagementAnalytics: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/engagement/analytics');
    return response.data;
  },
};

// Evaluation Service
export const evaluationService = {
  // Get interview summaries
  getInterviewSummaries: async (candidateId: string): Promise<any> => {
    const response = await milvusAPI.get(`/api/evaluation/candidate/${candidateId}/summaries`);
    return response.data;
  },

  // Create interview summary
  createInterviewSummary: async (candidateId: string, summaryData: any): Promise<any> => {
    const response = await milvusAPI.post(`/api/evaluation/candidate/${candidateId}/summaries`, summaryData);
    return response.data;
  },

  // Score candidate
  scoreCandidate: async (candidateId: string, scoreData: any): Promise<any> => {
    const response = await milvusAPI.post(`/api/evaluation/candidate/${candidateId}/score`, scoreData);
    return response.data;
  },

  // Get candidate score
  getCandidateScore: async (candidateId: string): Promise<any> => {
    const response = await milvusAPI.get(`/api/evaluation/candidate/${candidateId}/score`);
    return response.data;
  },

  // Get evaluation analytics
  getEvaluationAnalytics: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/evaluation/analytics');
    return response.data;
  },

  // Export analytics data
  exportAnalyticsData: async (): Promise<any> => {
    const response = await milvusAPI.get('/api/evaluation/analytics/export');
    return response.data;
  },
};

export default {
  milvus: milvusService,
  crm: crmService,
  massMailing: massMailingService,
  dashboard: dashboardService,
  ai: aiService,
  abTesting: abTestingService,
  segmentation: segmentationService,
  automation: automationService,
  engagement: engagementService,
  evaluation: evaluationService,
};
