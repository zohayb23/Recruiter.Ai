import React from 'react';
import type { CandidateScore } from '../../services/api/candidateScoring';

interface ScoreDisplayProps {
  score: CandidateScore;
  showBreakdown?: boolean;
  compact?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  score, 
  showBreakdown = true, 
  compact = false 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Recommended':
        return 'badge bg-success';
      case 'Consider':
        return 'badge bg-warning';
      case 'Not Recommended':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className={`fw-bold ${getScoreColor(score.total_score)}`}>
          {score.total_score.toFixed(1)}%
        </span>
        <span className={getRecommendationColor(score.recommendation)}>
          {score.recommendation}
        </span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Candidate Score</h6>
        <span className={getRecommendationColor(score.recommendation)}>
          {score.recommendation}
        </span>
      </div>
      <div className="card-body">
        {/* Total Score */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold">Overall Score</span>
            <span className={`fw-bold ${getScoreColor(score.total_score)}`}>
              {score.total_score.toFixed(1)}%
            </span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className={`progress-bar ${getScoreBarColor(score.total_score)}`}
              style={{ width: `${Math.min(score.total_score, 100)}%` }}
            ></div>
          </div>
        </div>

        {showBreakdown && (
          <div className="row">
            {/* Semantic Similarity */}
            <div className="col-md-6 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Semantic Similarity</small>
                <small className="fw-bold">{score.score_breakdown.semantic_similarity.toFixed(1)}%</small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar bg-primary"
                  style={{ width: `${Math.min(score.score_breakdown.semantic_similarity, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Skills Match */}
            <div className="col-md-6 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Skills Match</small>
                <small className="fw-bold">{score.score_breakdown.skills_match.toFixed(1)}%</small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar bg-info"
                  style={{ width: `${Math.min(score.score_breakdown.skills_match, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Experience Level */}
            <div className="col-md-6 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Experience Level</small>
                <small className="fw-bold">{score.score_breakdown.experience_level.toFixed(1)}%</small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar bg-success"
                  style={{ width: `${Math.min(score.score_breakdown.experience_level, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Location Match */}
            <div className="col-md-6 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Location Match</small>
                <small className="fw-bold">{score.score_breakdown.location_match.toFixed(1)}%</small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar bg-warning"
                  style={{ width: `${Math.min(score.score_breakdown.location_match, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Scoring Weights Info */}
        <div className="mt-3 pt-3 border-top">
          <small className="text-muted">
            <strong>Scoring Weights:</strong> Semantic Similarity ({score.weights.semantic_similarity * 100}%), 
            Skills Match ({score.weights.skills_match * 100}%), 
            Experience ({score.weights.experience_level * 100}%), 
            Location ({score.weights.location_match * 100}%)
          </small>
        </div>

        {/* Timestamp */}
        <div className="mt-2">
          <small className="text-muted">
            Scored: {new Date(score.scored_at).toLocaleString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
