import React, { useState, useEffect } from 'react';
import { candidateScoringApi } from '../../services/api/candidateScoring';
import type { CandidateScore, ScoreRequest } from '../../services/api/candidateScoring';
import { getJobDescriptions } from '../../services/api/jobDescriptions';
import { getStoredResumes } from '../../services/api/resumeParser';
import ScoreDisplay from './ScoreDisplay';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

interface CandidateScoringInterfaceProps {
  selectedResumeId?: string;
  selectedJobId?: string;
  onScoreGenerated?: (score: CandidateScore) => void;
}

const CandidateScoringInterface: React.FC<CandidateScoringInterfaceProps> = ({
  selectedResumeId,
  selectedJobId,
  onScoreGenerated
}) => {
  const [resumeId, setResumeId] = useState(selectedResumeId || '');
  const [jobId, setJobId] = useState(selectedJobId || '');
  const [score, setScore] = useState<CandidateScore | null>(null);
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

  const handleScore = async () => {
    if (!resumeId || !jobId) {
      setError('Please select both a candidate and a job');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: ScoreRequest = { resume_id: resumeId, job_id: jobId };
      const result = await candidateScoringApi.scoreCandidate(request);
      setScore(result);
      onScoreGenerated?.(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate score');
    } finally {
      setLoading(false);
    }
  };

  const selectedResume = Array.isArray(availableResumes) ? availableResumes.find(r => r.resume_id === resumeId) : null;
  const selectedJob = Array.isArray(availableJobs) ? availableJobs.find(j => j.id === jobId) : null;


  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Score Candidate</h5>
            </div>
            <div className="card-body">
              {/* Candidate Selection */}
              <div className="mb-3">
                <label className="form-label">Select Candidate</label>
                <select 
                  className="form-select"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                >
                  <option value="">Choose a candidate...</option>
                  {availableResumes.map((resume) => (
                    <option key={resume.resume_id} value={resume.resume_id}>
                      {resume.full_name || 'Unknown'} - {resume.resume_id.substring(0, 8)}...
                    </option>
                  ))}
                </select>
                {selectedResume && (
                  <div className="mt-2">
                    <small className="text-muted">
                      <strong>Name:</strong> {selectedResume.full_name}<br/>
                      <strong>Skills:</strong> {Array.isArray(selectedResume.skills) ? selectedResume.skills.slice(0, 3).join(', ') : 'No skills listed'}...
                    </small>
                  </div>
                )}
              </div>

              {/* Job Selection */}
              <div className="mb-3">
                <label className="form-label">Select Job</label>
                <select 
                  className="form-select"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
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

              {/* Score Button */}
              <button 
                className="btn btn-primary w-100"
                onClick={handleScore}
                disabled={loading || !resumeId || !jobId}
              >
                {loading ? 'Generating Score...' : 'Generate Score'}
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
          {loading && <LoadingState message="Generating candidate score..." />}
          
          {error && !loading && (
            <ErrorState 
              message={error}
              onRetry={() => handleScore()}
            />
          )}

          {score && !loading && (
            <ScoreDisplay score={score} showBreakdown={true} />
          )}

          {!score && !loading && !error && (
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No Score Generated</h5>
                <p className="text-muted">
                  Select a candidate and job, then click "Generate Score" to see the compatibility analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateScoringInterface;
