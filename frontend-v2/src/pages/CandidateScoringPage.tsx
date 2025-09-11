import React, { useState } from 'react';
import CandidateScoringInterface from '../components/candidates/CandidateScoringInterface';
import BatchScoringInterface from '../components/candidates/BatchScoringInterface';
import type { CandidateScore } from '../services/api/candidateScoring';

const CandidateScoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [recentScores, setRecentScores] = useState<CandidateScore[]>([]);

  const handleScoreGenerated = (score: CandidateScore) => {
    setRecentScores(prev => [score, ...prev.slice(0, 4)]); // Keep last 5 scores
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Candidate Scoring</h2>
              <p className="text-muted mb-0">
                AI-powered candidate-job compatibility analysis using NLP and semantic matching
              </p>
            </div>
            <div className="text-end">
              <small className="text-muted">
                Powered by advanced machine learning algorithms
              </small>
            </div>
          </div>

          {/* Tab Navigation */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                <i className="fas fa-user me-2"></i>
                Single Candidate
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'batch' ? 'active' : ''}`}
                onClick={() => setActiveTab('batch')}
              >
                <i className="fas fa-users me-2"></i>
                Batch Scoring
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'single' && (
              <div className="tab-pane active">
                <CandidateScoringInterface onScoreGenerated={handleScoreGenerated} />
              </div>
            )}
            {activeTab === 'batch' && (
              <div className="tab-pane active">
                <BatchScoringInterface />
              </div>
            )}
          </div>

          {/* Recent Scores Section */}
          {recentScores.length > 0 && (
            <div className="mt-5">
              <h5>Recent Scores</h5>
              <div className="row">
                {recentScores.map((score, index) => (
                  <div key={`${score.resume_id}-${score.job_id}-${index}`} className="col-md-6 col-lg-4 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{score.candidate_name}</h6>
                            <small className="text-muted">{score.job_title}</small>
                          </div>
                          <span className={`badge ${
                            score.recommendation === 'Recommended' ? 'bg-success' :
                            score.recommendation === 'Consider' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {score.recommendation}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-primary">
                            {score.total_score.toFixed(1)}%
                          </span>
                          <small className="text-muted">
                            {new Date(score.scored_at).toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Section */}
          <div className="mt-5">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-info-circle me-2"></i>
                  How Candidate Scoring Works
                </h6>
                <div className="row">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '40px', height: '40px' }}>
                        <i className="fas fa-brain"></i>
                      </div>
                      <h6>Semantic Similarity</h6>
                      <small className="text-muted">
                        AI analyzes job requirements and candidate experience for contextual match
                      </small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '40px', height: '40px' }}>
                        <i className="fas fa-tools"></i>
                      </div>
                      <h6>Skills Matching</h6>
                      <small className="text-muted">
                        Compares technical skills and technologies between candidate and job
                      </small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '40px', height: '40px' }}>
                        <i className="fas fa-chart-line"></i>
                      </div>
                      <h6>Experience Level</h6>
                      <small className="text-muted">
                        Evaluates years of experience against job requirements
                      </small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '40px', height: '40px' }}>
                        <i className="fas fa-map-marker-alt"></i>
                      </div>
                      <h6>Location Match</h6>
                      <small className="text-muted">
                        Considers remote, hybrid, and location preferences
                      </small>
                    </div>
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

export default CandidateScoringPage;
