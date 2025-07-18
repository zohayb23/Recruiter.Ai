import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Job, Candidate } from '../../types/api';
import { CandidateStatus } from '../../types/api';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

interface MatchScore {
  candidateId: string;
  score: number;
  skillMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  matchDetails: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceGap: number;
    locationDistance?: string;
    salaryDifference?: number;
  };
}

const JobMatchingInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CandidateStatus | 'ALL'>('ALL');
  const [minMatchScore, setMinMatchScore] = useState(0);

  // TODO: Replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // TODO: Implement actual API calls
        // const jobResponse = await jobsApi.getJob(id);
        // const candidatesResponse = await candidatesApi.getCandidates();
        // const matchScoresResponse = await matchingApi.getMatchScores(id);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load matching data');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleContactCandidate = (candidateId: string) => {
    navigate(`/candidates/${candidateId}`);
  };

  if (isLoading) {
    return <LoadingState message="Analyzing candidates..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-link text-gray-600 p-0"
          onClick={() => navigate(`/jobs/${id}`)}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Job Details
        </button>
        <div>
          <button className="btn btn-primary">
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Matches
          </button>
        </div>
      </div>

      {/* Job Summary Card */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <h4 className="card-title text-gray-800">
                {job?.title}
              </h4>
              <p className="text-gray-600 mb-2">
                <i className="fas fa-building mr-2"></i>
                {job?.company}
              </p>
              <p className="text-gray-600 mb-2">
                <i className="fas fa-map-marker-alt mr-2"></i>
                {job?.location}
              </p>
              <div className="mb-3">
                {job?.requirements.map((req, index) => (
                  <span key={index} className="badge bg-primary me-2 mb-2">
                    {req}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light border-0">
                <div className="card-body">
                  <h6 className="card-title text-gray-800">Match Statistics</h6>
                  <div className="text-gray-600">
                    <p className="mb-1">
                      <i className="fas fa-users mr-2"></i>
                      Total Candidates: {candidates.length}
                    </p>
                    <p className="mb-1">
                      <i className="fas fa-star mr-2"></i>
                      Strong Matches: {matchScores.filter(m => m.score >= 80).length}
                    </p>
                    <p className="mb-1">
                      <i className="fas fa-check-circle mr-2"></i>
                      Good Matches: {matchScores.filter(m => m.score >= 60 && m.score < 80).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CandidateStatus | 'ALL')}
              >
                <option value="ALL">All Statuses</option>
                {Object.values(CandidateStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label">Minimum Match Score</label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="100"
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                />
                <div className="text-gray-600 small">{minMatchScore}% or higher</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="row">
        {matchScores
          .filter(match => match.score >= minMatchScore)
          .sort((a, b) => b.score - a.score)
          .map((match) => {
            const candidate = candidates.find(c => c.id === match.candidateId);
            if (!candidate) return null;
            if (filterStatus !== 'ALL' && candidate.status !== filterStatus) return null;

            return (
              <div key={match.candidateId} className="col-xl-4 col-md-6 mb-4">
                <div className="card shadow h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title text-gray-800 mb-0">
                        {candidate.firstName} {candidate.lastName}
                      </h5>
                      <div className="match-score">
                        <div className="circular-progress" style={{
                          background: `conic-gradient(#4e73df ${match.score * 3.6}deg, #e8e8e8 0deg)`
                        }}>
                          <div className="circular-progress-inner">
                            {match.score}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-2">
                      <i className="fas fa-briefcase mr-2"></i>
                      {candidate.currentPosition}
                    </p>
                    <p className="text-gray-600 mb-3">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      {candidate.location}
                    </p>

                    {/* Match Details */}
                    <div className="match-details mb-3">
                      <div className="progress-item mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-sm text-gray-600">Skills Match</span>
                          <span className="text-sm text-gray-800">{match.skillMatch}%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${match.skillMatch}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="progress-item mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-sm text-gray-600">Experience Match</span>
                          <span className="text-sm text-gray-800">{match.experienceMatch}%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${match.experienceMatch}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="progress-item mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-sm text-gray-600">Location Match</span>
                          <span className="text-sm text-gray-800">{match.locationMatch}%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${match.locationMatch}%` }}
                          ></div>
                        </div>
                      </div>

                      {match.salaryMatch !== undefined && (
                        <div className="progress-item">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-sm text-gray-600">Salary Match</span>
                            <span className="text-sm text-gray-800">{match.salaryMatch}%</span>
                          </div>
                          <div className="progress" style={{ height: "6px" }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${match.salaryMatch}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Matched Skills */}
                    <div className="mb-3">
                      <h6 className="text-gray-700 mb-2">Matched Skills</h6>
                      <div className="matched-skills">
                        {match.matchDetails.matchedSkills.map((skill, index) => (
                          <span key={index} className="badge bg-success me-2 mb-2">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    {match.matchDetails.missingSkills.length > 0 && (
                      <div className="mb-3">
                        <h6 className="text-gray-700 mb-2">Missing Skills</h6>
                        <div className="missing-skills">
                          {match.matchDetails.missingSkills.map((skill, index) => (
                            <span key={index} className="badge bg-danger me-2 mb-2">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4">
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => handleContactCandidate(candidate.id)}
                      >
                        <i className="fas fa-user mr-2"></i>
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* No Results */}
      {matchScores.filter(match => match.score >= minMatchScore).length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-search fa-3x text-gray-400"></i>
          </div>
          <h5 className="text-gray-800">No matching candidates found</h5>
          <p className="text-gray-600">Try adjusting your filters or lowering the minimum match score.</p>
        </div>
      )}
    </div>
  );
};

export default JobMatchingInterface; 