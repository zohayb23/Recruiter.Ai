import React from 'react';
import ExternalJobSearch from '../components/jobs/ExternalJobSearch';

const ExternalJobsPage: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4 px-4 pt-4">External Job Search</h1>
      <ExternalJobSearch />
    </div>
  );
};

export default ExternalJobsPage; 