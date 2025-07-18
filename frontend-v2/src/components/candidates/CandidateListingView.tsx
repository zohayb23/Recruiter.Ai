import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidates } from '../../hooks/useCandidates';
import { CandidateStatus, type Candidate } from '../../types/api';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { formatDistanceToNow } from 'date-fns';

interface Filters {
  status: string;
  skills: string;
  search: string;
  minExperience: string;
  page: number;
  limit: number;
}

const getStatusColor = (status: CandidateStatus): string => {
  const statusColors = {
    [CandidateStatus.NEW]: 'info',
    [CandidateStatus.SCREENING]: 'warning',
    [CandidateStatus.INTERVIEWING]: 'primary',
    [CandidateStatus.OFFERED]: 'secondary',
    [CandidateStatus.HIRED]: 'success',
    [CandidateStatus.REJECTED]: 'danger',
  };
  return statusColors[status] || 'secondary';
};

const CandidateListingView: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({
    status: '',
    skills: '',
    search: '',
    minExperience: '',
    page: 1,
    limit: 10,
  });

  const {
    candidates,
    totalPages,
    isLoadingCandidates,
    candidatesError,
  } = useCandidates({
    ...filters,
    minExperience: filters.minExperience ? parseInt(filters.minExperience, 10) : 0,
  });

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  if (isLoadingCandidates) {
    return <LoadingState message="Loading candidates..." />;
  }

  if (candidatesError) {
    return (
      <ErrorState 
        message="Failed to load candidates. Please try again." 
        onRetry={() => {}}
      />
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Heading */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">Candidates</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate('/candidates/import')}
          >
            <i className="fas fa-upload fa-sm mr-2"></i>
            Import Resumes
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/candidates/create')}
          >
            <i className="fas fa-plus fa-sm mr-2"></i>
            Add Candidate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  name="search"
                  placeholder="Search by name, skills, or location..."
                  value={filters.search}
                  onChange={handleTextChange}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleSelectChange}
              >
                <option value="">All Statuses</option>
                {Object.values(CandidateStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                name="skills"
                placeholder="Filter by skills..."
                value={filters.skills}
                onChange={handleTextChange}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                name="minExperience"
                value={filters.minExperience}
                onChange={handleSelectChange}
              >
                <option value="">Any Experience</option>
                <option value="1">1+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="8">8+ years</option>
                <option value="10">10+ years</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="row">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="col-xl-3 col-md-6 mb-4">
            <div className="card border-left-primary shadow h-100 py-2">
              <div className="card-body">
                <div className="row no-gutters align-items-center">
                  <div className="col mr-2">
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      {candidate.currentPosition}
                    </div>
                    <div className="mb-2">
                      <span className={`badge bg-${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      {candidate.location}
                    </div>
                    <div className="text-sm text-gray-600">
                      <i className="fas fa-briefcase mr-2"></i>
                      {candidate.experience} years
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    className="btn btn-sm btn-primary mr-2"
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <nav aria-label="Candidates pagination">
        <ul className="pagination justify-content-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <li
              key={i + 1}
              className={`page-item ${filters.page === i + 1 ? 'active' : ''}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CandidateListingView; 