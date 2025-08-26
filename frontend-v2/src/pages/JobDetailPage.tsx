import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDescription, type JobDescriptionResponse } from '../services/api/jobDescriptions';
import { toast } from 'react-toastify';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDescriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/jobs');
      return;
    }

    const loadJob = async () => {
      try {
        setLoading(true);
        const jobData = await getJobDescription(id);
        setJob(jobData);
      } catch (err: any) {
        console.error('Error loading job:', err);
        setError(err.message || 'Failed to load job details');
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id, navigate]);

  if (loading) {
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

  if (error || !job) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Back button */}
      <div className="mb-4">
        <button
          className="btn btn-link text-decoration-none"
          onClick={() => navigate('/jobs')}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to Jobs
        </button>
      </div>

      {/* Job Header */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3 mb-2">{job.title}</h1>
              <p className="text-muted mb-2">{job.company}</p>
              <div className="mb-3">
                {job.department && (
                  <span className="badge bg-light text-dark me-2">
                    <i className="fas fa-building me-1"></i>
                    {job.department}
                  </span>
                )}
                {job.experience_level && (
                  <span className="badge bg-light text-dark me-2">
                    <i className="fas fa-briefcase me-1"></i>
                    {job.experience_level}
                  </span>
                )}
                <span className="badge bg-success">
                  <i className="fas fa-check-circle me-1"></i>
                  {job.status}
                </span>
              </div>
            </div>
            <div>
              <button
                className="btn btn-success me-2"
                onClick={() => navigate(`/jobs/${id}/matches`)}
              >
                <i className="fas fa-users me-2"></i>
                View Matching Candidates
              </button>
              <button className="btn btn-primary me-2">
                <i className="fas fa-paper-plane me-2"></i>
                Apply Now
              </button>
              <button className="btn btn-outline-primary">
                <i className="fas fa-share-alt me-2"></i>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Content */}
      <div className="row">
        <div className="col-lg-8">
          {/* Overview */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Overview</h6>
            </div>
            <div className="card-body">
              <p className="text-dark mb-0" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{job.overview}</p>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Responsibilities</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                {job.responsibilities?.map((resp, index) => (
                  <li key={index} className="mb-3 d-flex align-items-start">
                    <i className={`fas fa-${resp.is_required ? 'check' : 'circle'} text-${resp.is_required ? 'success' : 'secondary'} me-3 mt-1`}></i>
                    <span className="text-dark" style={{ fontSize: '1rem', lineHeight: '1.5' }}>{resp.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Qualifications */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Qualifications</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                {job.qualifications?.map((qual, index) => (
                  <li key={index} className="mb-3 d-flex align-items-start">
                    <i className={`fas fa-${qual.is_required ? 'check' : 'circle'} text-${qual.is_required ? 'success' : 'secondary'} me-3 mt-1`}></i>
                    <span className="text-dark" style={{ fontSize: '1rem', lineHeight: '1.5' }}>{qual.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Company Information */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">About {job.company}</h6>
            </div>
            <div className="card-body">
              <p className="text-dark" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{job.company_description}</p>
              {job.culture_values && (
                <>
                  <h6 className="font-weight-bold mt-4 mb-3 text-primary">Culture & Values</h6>
                  <p className="text-dark" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{job.culture_values}</p>
                </>
              )}
              {job.diversity_statement && (
                <>
                  <h6 className="font-weight-bold mt-4 mb-3 text-primary">Diversity & Inclusion</h6>
                  <p className="text-dark" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{job.diversity_statement}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Skills */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Skills</h6>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h6 className="font-weight-bold mb-2">Required Skills</h6>
                <div className="mb-3 d-flex flex-wrap">
                  {job.required_skills?.map((skill, index) => (
                    <span 
                      key={index} 
                      className="badge bg-primary me-2 mb-2 p-2 text-white" 
                      style={{ 
                        fontSize: '0.9rem',
                        maxWidth: '100%',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        height: 'auto',
                        lineHeight: '1.5'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {job.preferred_skills && job.preferred_skills.length > 0 && (
                <div>
                  <h6 className="font-weight-bold mb-2 text-dark">Preferred Skills</h6>
                  <div className="mb-3 d-flex flex-wrap">
                    {job.preferred_skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="badge bg-secondary me-2 mb-2 p-2 text-white" 
                        style={{ 
                          fontSize: '0.9rem',
                          maxWidth: '100%',
                          whiteSpace: 'normal',
                          textAlign: 'left',
                          height: 'auto',
                          lineHeight: '1.5'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Benefits</h6>
            </div>
            <div className="card-body">
              {job.benefits?.map((benefit, index) => (
                <div key={index} className="mb-4">
                  <div className="d-flex align-items-start">
                    <i className="fas fa-gift text-primary me-3 mt-1"></i>
                    <div>
                      <h6 className="font-weight-bold mb-2 text-dark">{benefit.title}</h6>
                      {benefit.description && (
                        <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                          {benefit.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
