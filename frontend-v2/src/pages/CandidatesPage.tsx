import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCandidates, type Candidate, type WorkExperience } from '../services/api/candidates';

const CandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => getCandidates({
      status: '',
      skills: '',
      search: '',
      minExperience: 0,
      page: 1,
      limit: 10
    })
  });

  // Helper function to safely render work experience
  const renderWorkExperience = (experience: WorkExperience[] | string | undefined): string => {
    if (!experience) return 'No experience listed';
    if (typeof experience === 'string') return experience;
    if (Array.isArray(experience)) {
      return `${experience.length} position${experience.length !== 1 ? 's' : ''}`;
    }
    return 'No experience listed';
  };

  // Helper function to safely render skills
  const renderSkills = (skills: string[] | undefined): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) {
      return skills.filter(s => typeof s === 'string');
    }
    return [];
  };

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
          Error loading candidates. Please try again later.
        </div>
      </div>
    );
  }

  const candidates = data?.candidates || [];

  return (
    <div className="container-fluid">
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Candidates</h1>
        <div>
          <button
            className="btn btn-outline-primary me-2"
            onClick={() => navigate('/resume-parser')}
          >
            <i className="fas fa-file-upload fa-sm me-2"></i>
            Import Resumes
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/candidates/create')}
          >
            <i className="fas fa-plus fa-sm me-2"></i>
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
                <div className="col me-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Candidates
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
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">All Candidates</h6>
          <div className="input-group w-25">
            <input
              type="text"
              className="form-control"
              placeholder="Search candidates..."
              aria-label="Search candidates"
            />
            <button className="btn btn-outline-secondary" type="button">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
        <div className="card-body">
          {candidates.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No candidates found. Import some resumes to get started.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Skills</th>
                    <th>Experience</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate: Candidate) => (
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
                              ID: {candidate.resume_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div><i className="fas fa-envelope me-2"></i>{candidate.email || 'No email'}</div>
                          {candidate.phone && (
                            <div><i className="fas fa-phone me-2"></i>{candidate.phone}</div>
                          )}
                          {candidate.linkedin && (
                            <div>
                              <i className="fab fa-linkedin me-2"></i>
                              <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer">
                                LinkedIn
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {renderSkills(candidate.skills).slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="badge bg-light text-dark"
                            >
                              {skill}
                            </span>
                          ))}
                          {renderSkills(candidate.skills).length > 5 && (
                            <span className="badge bg-secondary">
                              +{renderSkills(candidate.skills).length - 5} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {renderWorkExperience(candidate.work_experience)}
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
                            className="btn btn-info btn-sm"
                            onClick={() => navigate(`/candidates/${candidate.resume_id}/edit`)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => navigate(`/candidates/${candidate.resume_id}/match`)}
                            title="Find Matching Jobs"
                          >
                            <i className="fas fa-magic"></i>
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

export default CandidatesPage;