import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <h6 className="text-gray-500">{message}</h6>
    </div>
  );
};

export default LoadingState; 