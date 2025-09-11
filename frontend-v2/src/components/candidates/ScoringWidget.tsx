import React, { useState } from 'react';
import { candidateScoringApi } from '../../services/api/candidateScoring';
import type { CandidateScore } from '../../services/api/candidateScoring';
import ScoreDisplay from './ScoreDisplay';

interface ScoringWidgetProps {
  resumeId: string;
  jobId: string;
  candidateName: string;
  jobTitle: string;
  compact?: boolean;
}

const ScoringWidget: React.FC<ScoringWidgetProps> = ({
  resumeId,
  jobId,
  candidateName,
  jobTitle,
  compact = true
}) => {
  const [score, setScore] = useState<CandidateScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScored, setHasScored] = useState(false);

  const handleScore = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await candidateScoringApi.scoreCandidate({
        resume_id: resumeId,
        job_id: jobId
      });
      setScore(result);
      setHasScored(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate score');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2">
        {!hasScored && !loading && (
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={handleScore}
            title={`Score ${candidateName} for ${jobTitle}`}
          >
            <i className="fas fa-chart-line me-1"></i>
            Score
          </button>
        )}
        
        {loading && (
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
        
        {score && (
          <ScoreDisplay score={score} compact={true} />
        )}
        
        {error && (
          <small className="text-danger" title={error}>
            <i className="fas fa-exclamation-triangle"></i>
          </small>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Compatibility Score</h6>
        {!hasScored && !loading && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={handleScore}
          >
            <i className="fas fa-chart-line me-1"></i>
            Generate Score
          </button>
        )}
      </div>
      <div className="card-body">
        {loading && (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Generating score...</span>
            </div>
            <p className="mt-2 text-muted">Analyzing compatibility...</p>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        {score && (
          <ScoreDisplay score={score} showBreakdown={true} />
        )}
        
        {!score && !loading && !error && (
          <div className="text-center text-muted">
            <i className="fas fa-chart-line fa-2x mb-2"></i>
            <p>Click "Generate Score" to analyze candidate-job compatibility</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoringWidget;
