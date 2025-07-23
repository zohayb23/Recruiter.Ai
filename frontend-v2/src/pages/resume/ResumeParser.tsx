import React, { useState } from 'react';
import ResumeUploader from '../../components/resume/ResumeUploader';
import ParsedResumeViewer from '../../components/resume/ParsedResumeViewer';
import type { ResumeParseResponse } from '../../services/api/resumeParser';

const ResumeParser: React.FC = () => {
  const [parseResult, setParseResult] = useState<ResumeParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParseComplete = (result: ResumeParseResponse) => {
    setError(null);
    setParseResult(result);
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setParseResult(null);
  };

  const handleReset = () => {
    setParseResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Parser</h1>
        <p className="text-gray-600">
          Upload a resume to automatically extract and structure the information
        </p>
      </div>

      {!parseResult && (
        <ResumeUploader
          onParseComplete={handleParseComplete}
          onError={handleError}
        />
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {parseResult && (
        <div>
          {parseResult.success ? (
            <div>
              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload Another Resume
                </button>
              </div>
              <ParsedResumeViewer resume={parseResult.data!} />
            </div>
          ) : (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                <p className="text-yellow-700">{parseResult.message}</p>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeParser; 