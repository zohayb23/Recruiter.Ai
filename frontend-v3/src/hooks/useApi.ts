import { useState, useEffect } from 'react';
import { dashboardService, milvusService, crmService, massMailingService } from '../services/api';
import type { JobDescription, Campaign, CandidatePipeline } from '../services/api';

// Dashboard data hook
export const useDashboardData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardService.getDashboardMetrics();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await milvusService.health();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
};

// Job descriptions hook
export const useJobDescriptions = () => {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await milvusService.getJobDescriptions();
      setJobs(result.job_descriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job descriptions');
      console.error('Job descriptions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const createJob = async (jobData: Partial<JobDescription>) => {
    try {
      const newJob = await milvusService.createJobDescription(jobData);
      setJobs(prev => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job description');
      throw err;
    }
  };

  const updateJob = async (id: string, jobData: Partial<JobDescription>) => {
    try {
      const updatedJob = await milvusService.updateJobDescription(id, jobData);
      setJobs(prev => prev.map(job => job.job_id === id ? updatedJob : job));
      return updatedJob;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job description');
      throw err;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await milvusService.deleteJobDescription(id);
      setJobs(prev => prev.filter(job => job.job_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job description');
      throw err;
    }
  };

  return { 
    jobs, 
    loading, 
    error, 
    createJob, 
    updateJob, 
    deleteJob,
    refetch: fetchJobs
  };
};

// Campaigns hook
export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await massMailingService.getCampaigns();
      setCampaigns(result.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      console.error('Campaigns fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const createCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      const newCampaign = await massMailingService.createCampaign(campaignData);
      setCampaigns(prev => [newCampaign, ...prev]);
      return newCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      throw err;
    }
  };

  const updateCampaign = async (id: string, campaignData: Partial<Campaign>) => {
    try {
      const updatedCampaign = await massMailingService.updateCampaign(id, campaignData);
      setCampaigns(prev => prev.map(campaign => campaign.id === id ? updatedCampaign : campaign));
      return updatedCampaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
      throw err;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await massMailingService.deleteCampaign(id);
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
      throw err;
    }
  };

  const sendCampaign = async (id: string) => {
    try {
      const result = await massMailingService.sendCampaign(id);
      // Refresh campaigns to get updated status
      const updatedResult = await massMailingService.getCampaigns();
      setCampaigns(updatedResult.campaigns);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send campaign');
      throw err;
    }
  };

  return { 
    campaigns, 
    loading, 
    error, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign,
    sendCampaign,
    refetch: fetchCampaigns
  };
};

// Candidate pipelines hook
export const useCandidatePipelines = () => {
  const [pipelines, setPipelines] = useState<CandidatePipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await crmService.getCandidatePipelines();
      setPipelines(result.pipelines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch candidate pipelines');
      console.error('Candidate pipelines fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const createPipeline = async (pipelineData: Partial<CandidatePipeline>) => {
    try {
      const newPipeline = await crmService.createCandidatePipeline(pipelineData);
      setPipelines(prev => [newPipeline, ...prev]);
      return newPipeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create candidate pipeline');
      throw err;
    }
  };

  const updatePipeline = async (id: string, pipelineData: Partial<CandidatePipeline>) => {
    try {
      const updatedPipeline = await crmService.updateCandidatePipeline(id, pipelineData);
      setPipelines(prev => prev.map(pipeline => pipeline.id === id ? updatedPipeline : pipeline));
      return updatedPipeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update candidate pipeline');
      throw err;
    }
  };

  const deletePipeline = async (id: string) => {
    try {
      await crmService.deleteCandidatePipeline(id);
      setPipelines(prev => prev.filter(pipeline => pipeline.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete candidate pipeline');
      throw err;
    }
  };

  return { 
    pipelines, 
    loading, 
    error, 
    createPipeline, 
    updatePipeline, 
    deletePipeline,
    refetch: fetchPipelines
  };
};

// Health check hook
export const useHealthCheck = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.healthCheck();
      setHealth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return { health, loading, error, refetch: checkHealth };
};
