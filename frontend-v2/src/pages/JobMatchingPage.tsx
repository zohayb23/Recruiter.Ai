import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMatchingCandidates } from '../services/api/matching';
import { getJobDescription } from '../services/api/jobDescriptions';

const JobMatchingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJobDescription(id!),
    enabled: !!id
  });

  const { data: matchingData, isLoading, error } = useQuery({
    queryKey: ['matching', id],
    queryFn: () => getMatchingCandidates(id!, 10, 0.6),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          Error loading matching candidates. Please try again later.
        </div>
      </div>
    );
  }

  const candidates = matchingData?.candidates || [];

  return (
    <div className="container-fluid">
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          Matching Candidates for {job?.title || 'Job'}
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/jobs/${id}`)}
        >
          <i className="fas fa-arrow-left fa-sm me-2"></i>
          Back to Job
        </button>
      </div>

      {/* Matching Stats Card */}
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Matching Candidates
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Matching Candidates</h6>
        </div>
        <div className="card-body">
          {candidates.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No matching candidates found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Match Score</th>
                    <th>Skills</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.resume_id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <div className="bg-primary rounded-circle p-2">
                              <i className="fas fa-user text-white"></i>
                            </div>
                          </div>
                          <div>
                            <div className="font-weight-bold text-primary">
                              {candidate.full_name || 'No Name'}
                            </div>
                            <div className="small text-gray-600">
                              {candidate.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className={`badge bg-${getScoreColor(candidate.match_score)} me-2`}>
                            {(candidate.match_score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {candidate.skills?.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="badge bg-light text-dark"
                            >
                              {skill}
                            </span>
                          ))}
                          {(candidate.skills?.length || 0) > 5 && (
                            <span className="badge bg-secondary">
                              +{(candidate.skills?.length || 0) - 5} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {Array.isArray(candidate.work_experience) 
                          ? `${candidate.work_experience.length} positions`
                          : candidate.work_experience || 'No experience listed'}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/candidates/${candidate.resume_id}`)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => window.location.href = `mailto:${candidate.email}`}
                            title="Contact"
                          >
                            <i className="fas fa-envelope"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getScoreColor = (score: number): string => {
  if (score >= 0.8) return 'success';
  if (score >= 0.6) return 'info';
  return 'warning';
};

export default JobMatchingPage;