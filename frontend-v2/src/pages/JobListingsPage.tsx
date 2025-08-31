import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobDescriptions, type JobDescriptionResponse } from '../services/api/jobDescriptions';

const JobListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobDescriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await getJobDescriptions();
      // Filter to only show published jobs
      const publishedJobs = response.filter(job => job.status === 'published');
      setJobs(publishedJobs);
    } catch (err: any) {
      console.error('Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const extractCompanyName = (companyDescription: string) => {
    // Extract company name from company description
    // Look for common patterns like "At [Company], we..." or "[Company] is..."
    const patterns = [
      /At\s+([A-Z][a-zA-Z\s&]+?)(?:,|\s+we)/i,
      /^([A-Z][a-zA-Z\s&]+?)\s+is/i,
      /^([A-Z][a-zA-Z\s&]+?)\s+has/i,
      /^([A-Z][a-zA-Z\s&]+?)\s+provides/i
    ];
    
    for (const pattern of patterns) {
      const match = companyDescription.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: take first few words
    const words = companyDescription.split(' ').slice(0, 3);
    return words.join(' ') + (words.length === 3 ? '...' : '');
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Job Listings</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/jobs/create')}
        >
          <i className="fas fa-plus me-2"></i>
          Post New Job
        </button>
      </div>

      <div className="card shadow">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Active Job Postings</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No job postings found
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Company</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Posted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <a href={`/jobs/${job.id}`} className="text-primary fw-bold">
                          {job.title}
                        </a>
                      </td>
                      <td>{job.company || (job.company_description ? extractCompanyName(job.company_description) : '-')}</td>
                      <td>{job.department || '-'}</td>
                      <td>{job.location || 'Remote'}</td>
                      <td>{formatDate(job.created_at.toString())}</td>
                      <td>
                        <span className="badge bg-success">PUBLISHED</span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => navigate(`/jobs/${job.id}/edit`)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn btn-sm btn-danger">
                            <i className="fas fa-trash"></i>
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

export default JobListingsPage;
