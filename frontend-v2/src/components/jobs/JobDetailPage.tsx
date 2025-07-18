import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { useJobs } from '../../hooks/useJobs';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  postedDate: string;
  status?: 'open' | 'closed' | 'draft';
}

// Mock data - will be replaced with API call
const mockJob: Job = {
  id: '1',
  title: 'Senior Software Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  employmentType: 'Full-time',
  experienceLevel: 'Senior Level',
  description: 'We are looking for an experienced software engineer to join our team and help build scalable, robust applications. The ideal candidate will have a strong background in full-stack development and a passion for creating high-quality software.',
  requirements: [
    'Bachelor\'s degree in Computer Science or related field',
    '5+ years of experience in software development',
    'Strong proficiency in React, Node.js, and TypeScript',
    'Experience with cloud platforms (AWS/GCP)',
    'Excellent problem-solving skills',
  ],
  responsibilities: [
    'Design and implement new features for our core products',
    'Write clean, maintainable, and efficient code',
    'Collaborate with cross-functional teams to define and implement solutions',
    'Participate in code reviews and provide constructive feedback',
    'Mentor junior developers and contribute to team growth',
  ],
  benefits: [
    'Competitive salary and equity package',
    'Health, dental, and vision insurance',
    'Flexible work hours and remote work options',
    'Professional development budget',
    'Company-sponsored events and team building activities',
  ],
  postedDate: '2024-03-15',
  status: 'open',
};

const getStatusColor = (status: 'open' | 'closed' | 'draft' = 'open'): string => {
  const statusColors = {
    open: 'success',
    closed: 'danger',
    draft: 'warning'
  };
  return statusColors[status] || 'success';
};

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // TODO: Replace with actual API call from useJobs hook
  const { isLoading, error, data: job, refetch } = { 
    isLoading: false, 
    error: null, 
    data: mockJob,
    refetch: () => console.log('Refetching job data...') 
  };

  const handleApply = () => {
    // TODO: Implement application logic
    console.log('Applying for job:', id);
  };

  if (isLoading) {
    return <LoadingState message="Loading job details..." />;
  }

  if (error) {
    return (
      <ErrorState 
        message="Failed to load job details. Please try again." 
        onRetry={refetch}
      />
    );
  }

  if (!job) {
    return <ErrorState message="Job not found" />;
  }

  return (
    <div className="container-fluid">
      {/* Back Button */}
      <button
        className="btn btn-link text-gray-600 mb-3 px-0"
        onClick={() => navigate('/jobs')}
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Back to Jobs
      </button>

      {/* Main Content */}
      <div className="card shadow mb-4">
        <div className="card-body p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h1 className="h3 mb-2 text-gray-800">{job.title}</h1>
              <div className="mb-3">
                <span className={`badge bg-${getStatusColor(job.status)}`}>
                  {job.status || 'Open'}
                </span>
              </div>
              <div className="text-gray-600">
                <div className="mb-2">
                  <i className="fas fa-building mr-2"></i>
                  {job.company}
                </div>
                <div className="mb-2">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {job.location}
                </div>
                <div className="mb-2">
                  <i className="fas fa-briefcase mr-2"></i>
                  {job.employmentType}
                </div>
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary"
                onClick={handleApply}
                disabled={job.status === 'closed'}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Apply Now
              </button>
              <button
                className="btn btn-primary ms-2"
                onClick={() => navigate(`/jobs/${id}/matches`)}
              >
                <i className="fas fa-users mr-2"></i>
                View Matching Candidates
              </button>
            </div>
          </div>

          {/* Job Details */}
          <div className="row">
            <div className="col-lg-8">
              {/* Description */}
              <div className="mb-4">
                <h5 className="text-gray-800 mb-3">Description</h5>
                <p className="text-gray-600">{job.description}</p>
              </div>

              {/* Requirements */}
              <div className="mb-4">
                <h5 className="text-gray-800 mb-3">Requirements</h5>
                <ul className="list-group list-group-flush">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="list-group-item text-gray-600">
                      <i className="fas fa-check text-success mr-2"></i>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Responsibilities */}
              <div className="mb-4">
                <h5 className="text-gray-800 mb-3">Responsibilities</h5>
                <ul className="list-group list-group-flush">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="list-group-item text-gray-600">
                      <i className="fas fa-tasks text-primary mr-2"></i>
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-lg-4">
              {/* Benefits */}
              <div className="card bg-light border-0 mb-4">
                <div className="card-body">
                  <h5 className="text-gray-800 mb-3">Benefits</h5>
                  <ul className="list-unstyled mb-0">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="mb-2 text-gray-600">
                        <i className="fas fa-gift text-info mr-2"></i>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Additional Info */}
              <div className="card bg-light border-0">
                <div className="card-body">
                  <h5 className="text-gray-800 mb-3">Additional Information</h5>
                  <div className="text-gray-600">
                    <p className="mb-2">
                      <i className="fas fa-clock mr-2"></i>
                      Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
                    </p>
                    <p className="mb-2">
                      <i className="fas fa-user-tie mr-2"></i>
                      Experience Level: {job.experienceLevel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage; 