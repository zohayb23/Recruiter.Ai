import React, { useState } from 'react';
import { searchExternalJobs } from '../services/api/externalJobs';
import type { ExternalJob } from '../services/api/externalJobs';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { formatDistanceToNow } from 'date-fns';

const ExternalJobs: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState({
    fullTime: false,
    partTime: false,
    contract: false,
    permanent: false,
  });

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchExternalJobs({
        query,
        location,
        ...filters,
        page: 1,
        resultsPerPage: 10
      });
      setJobs(response.results);
      setTotalJobs(response.count);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="container-fluid">
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">External Job Search</h1>
      </div>

      {/* Search Form */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Search Jobs</h6>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Job title, keywords, or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                onClick={handleSearch}
                disabled={isLoading}
              >
                <i className="fas fa-search fa-sm mr-2"></i>
                Search Jobs
              </button>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <div className="custom-control custom-checkbox custom-control-inline">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="fullTime"
                  checked={filters.fullTime}
                  onChange={(e) => setFilters({ ...filters, fullTime: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="fullTime">Full Time</label>
              </div>
              <div className="custom-control custom-checkbox custom-control-inline">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="partTime"
                  checked={filters.partTime}
                  onChange={(e) => setFilters({ ...filters, partTime: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="partTime">Part Time</label>
              </div>
              <div className="custom-control custom-checkbox custom-control-inline">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="contract"
                  checked={filters.contract}
                  onChange={(e) => setFilters({ ...filters, contract: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="contract">Contract</label>
              </div>
              <div className="custom-control custom-checkbox custom-control-inline">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="permanent"
                  checked={filters.permanent}
                  onChange={(e) => setFilters({ ...filters, permanent: e.target.checked })}
                />
                <label className="custom-control-label" htmlFor="permanent">Permanent</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {jobs.length > 0 && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">
              Found {totalJobs.toLocaleString()} Jobs
            </h6>
          </div>
          <div className="card-body">
            {jobs.map((job) => (
              <div key={job.id} className="border-bottom py-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{job.title}</h5>
                    <p className="mb-1 text-primary">{job.company.display_name}</p>
                    <p className="mb-1 text-muted">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      {job.location.display_name}
                    </p>
                    {(job.salary_min || job.salary_max) && (
                      <p className="mb-1 text-success">
                        <i className="fas fa-money-bill-wave mr-2"></i>
                        {job.salary_min && job.salary_max
                          ? `$${Math.floor(job.salary_min).toLocaleString()} - $${Math.floor(job.salary_max).toLocaleString()}`
                          : job.salary_min
                          ? `$${Math.floor(job.salary_min).toLocaleString()}+`
                          : `Up to $${Math.floor(job.salary_max).toLocaleString()}`
                        }
                      </p>
                    )}
                    <p className="mb-2 text-muted small">
                      Posted {formatDistanceToNow(new Date(job.created))} ago
                    </p>
                  </div>
                  <a
                    href={job.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Apply Now
                  </a>
                </div>
                <p className="mb-0 mt-2">
                  {job.description.length > 300
                    ? `${job.description.substring(0, 300)}...`
                    : job.description
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalJobs; 