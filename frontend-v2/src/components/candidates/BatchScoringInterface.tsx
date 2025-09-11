import React, { useState, useEffect } from 'react';
import { candidateScoringApi } from '../../services/api/candidateScoring';
import type { BatchScoreResult, CandidateScore } from '../../services/api/candidateScoring';
import { getJobDescriptions } from '../../services/api/jobDescriptions';
import { getStoredResumes } from '../../services/api/resumeParser';
import ScoreDisplay from './ScoreDisplay';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

const BatchScoringInterface: React.FC = () => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedResumeIds, setSelectedResumeIds] = useState<string[]>([]);
  const [batchResult, setBatchResult] = useState<BatchScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableResumes, setAvailableResumes] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

  // Load available resumes and jobs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resumesResponse, jobsResponse] = await Promise.all([
          getStoredResumes(),
          getJobDescriptions()
        ]);
        // Ensure we always have arrays
        setAvailableResumes(Array.isArray(resumesResponse) ? resumesResponse : []);
        setAvailableJobs(Array.isArray(jobsResponse) ? jobsResponse : []);
      } catch (err) {
        console.error('Error loading data:', err);
        // Set empty arrays on error
        setAvailableResumes([]);
        setAvailableJobs([]);
      }
    };

    loadData();
  }, []);

  const handleResumeToggle = (resumeId: string) => {
    setSelectedResumeIds(prev => 
      prev.includes(resumeId) 
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedResumeIds.length === availableResumes.length) {
      setSelectedResumeIds([]);
    } else {
      setSelectedResumeIds(availableResumes.map(r => r.resume_id));
    }
  };

  const handleBatchScore = async () => {
    if (!selectedJobId || selectedResumeIds.length === 0) {
      setError('Please select a job and at least one candidate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await candidateScoringApi.scoreBatch({
        job_id: selectedJobId,
        resume_ids: selectedResumeIds
      });
      setBatchResult(result);
    } catch (err: any) {
      console.error('Batch scoring error:', err);
      let errorMessage = 'Failed to generate batch scores';
      
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = Array.isArray(availableJobs) ? availableJobs.find(j => j.id === selectedJobId) : null;

  // Sort candidates by score (highest first)
  const sortedCandidates = batchResult?.results?.sort((a, b) => b.total_score - a.total_score) || [];

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Batch Score Candidates</h5>
            </div>
            <div className="card-body">
              {/* Job Selection */}
              <div className="mb-3">
                <label className="form-label">Select Job</label>
                <select 
                  className="form-select"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                >
                  <option value="">Choose a job...</option>
                  {availableJobs.map((job) => {
                    // Extract company name from company_description if company is empty
                    const getCompanyName = (job: any) => {
                      if (job.company && job.company.trim()) {
                        return job.company;
                      }
                      if (job.company_description) {
                        // Extract company name from description (e.g., "Expedia is seeking..." -> "Expedia")
                        const match = job.company_description.match(/^([A-Z][a-zA-Z\s&]+?)(?:\s+is|\s+seeking|\s+is\s+seeking)/i);
                        return match ? match[1].trim() : 'Company';
                      }
                      return 'Unknown Company';
                    };
                    
                    return (
                      <option key={job.id} value={job.id}>
                        {job.title} - {getCompanyName(job)}
                      </option>
                    );
                  })}
                </select>
                {selectedJob && (
                  <div className="mt-2">
                    <small className="text-muted">
                      <strong>Title:</strong> {selectedJob.title}<br/>
                      <strong>Company:</strong> {selectedJob.company}<br/>
                      <strong>Experience:</strong> {selectedJob.experience_level}
                    </small>
                  </div>
                )}
              </div>

              {/* Candidate Selection */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Select Candidates</label>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleSelectAll}
                  >
                    {selectedResumeIds.length === availableResumes.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {availableResumes.map((resume) => (
                    <div key={resume.resume_id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`resume-${resume.resume_id}`}
                        checked={selectedResumeIds.includes(resume.resume_id)}
                        onChange={() => handleResumeToggle(resume.resume_id)}
                      />
                      <label className="form-check-label" htmlFor={`resume-${resume.resume_id}`}>
                        <div>
                          <strong>{resume.full_name || 'Unknown'}</strong>
                          <br/>
                          <small className="text-muted">
                            {Array.isArray(resume.skills) ? resume.skills.slice(0, 2).join(', ') : 'No skills listed'}...
                          </small>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                <small className="text-muted">
                  {selectedResumeIds.length} candidate(s) selected
                </small>
              </div>

              {/* Score Button */}
              <button 
                className="btn btn-primary w-100"
                onClick={handleBatchScore}
                disabled={loading || !selectedJobId || selectedResumeIds.length === 0}
              >
                {loading ? 'Generating Scores...' : `Score ${selectedResumeIds.length} Candidates`}
              </button>

              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {loading && <LoadingState message="Generating batch scores..." />}
          
          {error && !loading && (
            <ErrorState 
              message={error}
              onRetry={() => handleBatchScore()}
            />
          )}

          {batchResult && !loading && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Batch Scoring Results</h5>
                <small className="text-muted">
                  Scored {batchResult.total_candidates} candidates
                </small>
              </div>

              <div className="row">
                {sortedCandidates.map((candidateScore, index) => (
                  <div key={candidateScore.resume_id} className="col-md-6 mb-3">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">{candidateScore.candidate_name}</h6>
                          <small className="text-muted">#{index + 1} Rank</small>
                        </div>
                        <div className="text-end">
                          <span className={`fw-bold ${candidateScore.total_score >= 50 ? 'text-success' : 'text-danger'}`}>
                            {candidateScore.total_score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="card-body">
                        <ScoreDisplay score={candidateScore} showBreakdown={false} compact={true} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!batchResult && !loading && !error && (
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No Batch Scores Generated</h5>
                <p className="text-muted">
                  Select a job and candidates, then click "Score Candidates" to see the compatibility analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchScoringInterface;
