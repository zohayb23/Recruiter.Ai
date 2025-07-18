import { useState, useEffect } from 'react';
import type { Candidate } from '../types/api';
import { searchCandidates } from '../services/api/candidates';

interface Filters {
  status: string;
  skills: string;
  search: string;
  minExperience: number;
  page: number;
  limit: number;
}

export const useCandidates = (filters: Filters) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const response = await searchCandidates({
          status: filters.status || undefined,
          skills: filters.skills || undefined,
          search: filters.search || undefined,
          minExperience: filters.minExperience || undefined,
          page: filters.page,
          limit: filters.limit
        });

        setCandidates(response.data);
        setTotalPages(Math.ceil(response.total / filters.limit));
        setCandidatesError(null);
      } catch (error) {
        setCandidatesError(error as Error);
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, [filters]);

  return {
    candidates,
    totalPages,
    isLoadingCandidates,
    candidatesError,
  };
}; 