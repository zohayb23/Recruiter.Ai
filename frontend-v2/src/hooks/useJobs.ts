import { useState, useEffect } from 'react';
import type { Job } from '../types/api';
import { mockJobs } from '../services/mockData';

interface Filters {
  status: string;
  department: string;
  search: string;
  page: number;
  limit: number;
}

export const useJobs = (filters: Filters) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<Error | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadJobs = () => {
      setIsLoadingJobs(true);
      try {
        // Filter jobs based on search criteria
        let filteredJobs = [...mockJobs];
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredJobs = filteredJobs.filter(job => 
            job.title.toLowerCase().includes(searchLower) ||
            job.description.toLowerCase().includes(searchLower)
          );
        }

        if (filters.status) {
          filteredJobs = filteredJobs.filter(job => job.status === filters.status);
        }

        if (filters.department) {
          const deptLower = filters.department.toLowerCase();
          filteredJobs = filteredJobs.filter(job => 
            job.department.toLowerCase().includes(deptLower)
          );
        }

        // Calculate pagination
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        const paginatedJobs = filteredJobs.slice(start, end);

        setJobs(paginatedJobs);
        setTotalPages(Math.ceil(filteredJobs.length / filters.limit));
        setJobsError(null);
      } catch (error) {
        setJobsError(error as Error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [filters]);

  const deleteJob = async (id: string) => {
    setIsDeleting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    jobs,
    totalPages,
    isLoadingJobs,
    jobsError,
    deleteJob,
    isDeleting,
  };
}; 