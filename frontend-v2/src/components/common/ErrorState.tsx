import React from 'react';

interface ErrorStateProps {
  message?: string;
  error?: Error;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, error, onRetry }) => {
  const errorMessage = message || error?.message || 'An unexpected error occurred';
  
  return (
    <div className="text-center py-5">
      <div className="mb-3">
        <i className="fas fa-exclamation-circle fa-3x text-danger"></i>
      </div>
      <h6 className="text-danger mb-2">Error</h6>
      <p className="text-gray-500">{errorMessage}</p>
      {onRetry && (
        <button
          className="btn btn-outline-primary mt-3"
          onClick={onRetry}
        >
          <i className="fas fa-redo mr-2"></i>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState; 