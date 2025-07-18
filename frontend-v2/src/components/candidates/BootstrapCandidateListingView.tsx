import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidates } from '../../hooks/useCandidates';
import { CandidateStatus } from '../../types/api';
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

const BootstrapCandidateListingView = () => {
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value,
      page: 1,
    }));
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      status: event.target.value,
      page: 1,
    }));
  };

  const handleExperienceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      minExperience: event.target.value,
      page: 1,
    }));
  };

  const getStatusBadgeClass = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.NEW:
        return 'badge-info';
      case CandidateStatus.SCREENING:
        return 'badge-warning';
      case CandidateStatus.INTERVIEWING:
        return 'badge-primary';
      case CandidateStatus.OFFERED:
        return 'badge-success';
      case CandidateStatus.HIRED:
        return 'badge-success';
      case CandidateStatus.REJECTED:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (isLoadingCandidates) return <LoadingState />;
  if (candidatesError) return <ErrorState error={candidatesError} />;

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Candidates</h1>
        <div>
          <button
            className="btn btn-outline-primary mr-2"
            onClick={() => navigate('/candidates/import')}
          >
            <i className="fas fa-file-upload fa-sm mr-2"></i>
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

      {/* Candidates Overview Cards */}
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Candidates
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{candidates.length}</div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Active Interviews
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.filter(c => c.status === CandidateStatus.INTERVIEWING).length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-calendar-check fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Offers Extended
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.filter(c => c.status === CandidateStatus.OFFERED).length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-handshake fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    New Applications
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.filter(c => c.status === CandidateStatus.NEW).length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-user-plus fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List Card */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">All Candidates</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <div id="dataTable_wrapper" className="dataTables_wrapper dt-bootstrap4">
              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <div className="dataTables_filter">
                    <label className="d-flex align-items-center">
                      Search:
                      <input
                        type="search"
                        className="form-control form-control-sm ml-2"
                        placeholder="Name, skills, or location..."
                        value={filters.search}
                        onChange={handleSearchChange}
                      />
                    </label>
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-control form-control-sm"
                    value={filters.status}
                    onChange={handleStatusChange}
                  >
                    <option value="">All Statuses</option>
                    {Object.values(CandidateStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-control form-control-sm"
                    value={filters.minExperience}
                    onChange={handleExperienceChange}
                  >
                    <option value="">Any Experience</option>
                    <option value="1">1+ Year</option>
                    <option value="2">2+ Years</option>
                    <option value="3">3+ Years</option>
                    <option value="5">5+ Years</option>
                    <option value="8">8+ Years</option>
                    <option value="10">10+ Years</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="row">
                <div className="col-sm-12">
                  <table className="table table-bordered dataTable" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Current Role</th>
                        <th>Experience</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((candidate) => (
                        <tr key={candidate.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="mr-3">
                                <div className="icon-circle bg-primary">
                                  <i className="fas fa-user text-white"></i>
                                </div>
                              </div>
                              <div>
                                <div className="font-weight-bold text-primary">
                                  {candidate.firstName} {candidate.lastName}
                                </div>
                                <div className="small text-gray-600">{candidate.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{candidate.currentPosition || 'N/A'}</td>
                          <td>{candidate.experience} years</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-map-marker-alt fa-sm text-gray-400 mr-2"></i>
                              {candidate.location || 'Remote'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(candidate.status)}`}>
                              {candidate.status}
                            </span>
                          </td>
                          <td>{formatDistanceToNow(new Date(candidate.createdAt), { addSuffix: true })}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm mr-2"
                              onClick={() => navigate(`/candidates/${candidate.id}`)}
                            >
                              <i className="fas fa-eye fa-sm"></i>
                            </button>
                            <button
                              className="btn btn-info btn-sm mr-2"
                              onClick={() => navigate(`/candidates/${candidate.id}/edit`)}
                            >
                              <i className="fas fa-edit fa-sm"></i>
                            </button>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => navigate(`/candidates/${candidate.id}/match`)}
                            >
                              <i className="fas fa-magic fa-sm"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="row">
                <div className="col-sm-12 col-md-5">
                  <div className="dataTables_info">
                    Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, candidates.length)} of {candidates.length} candidates
                  </div>
                </div>
                <div className="col-sm-12 col-md-7">
                  <div className="dataTables_paginate paging_simple_numbers">
                    <ul className="pagination">
                      <li className={`paginate_button page-item previous ${filters.page === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={filters.page === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <li key={i} className={`paginate_button page-item ${filters.page === i + 1 ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`paginate_button page-item next ${filters.page === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={filters.page === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BootstrapCandidateListingView; 