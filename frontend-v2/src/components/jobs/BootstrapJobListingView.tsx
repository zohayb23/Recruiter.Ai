import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { JobStatus } from '../../types/api';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { formatDistanceToNow } from 'date-fns';

const BootstrapJobListingView = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    status: '',
    department: '',
    search: '',
    page: 1,
    limit: 10,
  });

  const {
    jobs,
    totalPages,
    isLoadingJobs,
    jobsError,
    deleteJob,
    isDeleting,
  } = useJobs(filters);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value,
      page: 1,
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      await deleteJob(id);
    }
  };

  const getStatusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PUBLISHED:
        return 'badge-success';
      case JobStatus.DRAFT:
        return 'badge-warning';
      case JobStatus.CLOSED:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  if (isLoadingJobs) return <LoadingState />;
  if (jobsError) return <ErrorState error={jobsError} />;

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Job Listings</h1>
        <button 
          className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
          onClick={() => navigate('/jobs/create')}
        >
          <i className="fas fa-plus fa-sm text-white-50 mr-2"></i>
          Post New Job
        </button>
      </div>

      {/* Job Listings Card */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Active Job Postings</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <div id="dataTable_wrapper" className="dataTables_wrapper dt-bootstrap4">
              {/* Search Bar */}
              <div className="row">
                <div className="col-sm-12 col-md-6">
                  <div className="dataTables_filter">
                    <label>
                      Search:
                      <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Search jobs..."
                        value={filters.search}
                        onChange={handleSearchChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="row">
                <div className="col-sm-12">
                  <table className="table table-bordered dataTable" width="100%" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>Title</th>
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
                            <div className="font-weight-bold text-primary">{job.title}</div>
                            <div className="small text-gray-600">{job.company}</div>
                          </td>
                          <td>{job.department}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="fas fa-map-marker-alt fa-sm text-gray-400 mr-2"></i>
                              {job.location}
                              {job.isRemote && (
                                <span className="badge badge-light ml-2">Remote</span>
                              )}
                            </div>
                          </td>
                          <td>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(job.status)}`}>
                              {job.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm mr-2"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                              <i className="fas fa-eye fa-sm"></i>
                            </button>
                            <button
                              className="btn btn-info btn-sm mr-2"
                              onClick={() => navigate(`/jobs/${job.id}/edit`)}
                            >
                              <i className="fas fa-edit fa-sm"></i>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(job.id)}
                              disabled={isDeleting}
                            >
                              <i className="fas fa-trash fa-sm"></i>
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
                    Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, jobs.length)} of {jobs.length} entries
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

export default BootstrapJobListingView; 