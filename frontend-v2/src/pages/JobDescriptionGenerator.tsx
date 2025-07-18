import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api/config';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

interface JobRequirements {
  job_title: string;
  company_name: string;
  industry: string;
  experience_level: string;
  required_skills: string[];
  location: string;
  employment_type: string;
  company_description: string;
  equal_opportunity_statement?: string;
  additional_context?: string;
}

interface GeneratedDescription {
  id: string;
  content: string;
  sections: {
    job_summary: string;
    responsibilities: string;
    required_qualifications: string;
    preferred_qualifications: string;
    benefits: string;
  };
}

const JobDescriptionGenerator: React.FC = () => {
  const [requirements, setRequirements] = useState<JobRequirements>({
    job_title: '',
    company_name: '',
    industry: '',
    experience_level: 'Mid-Senior',
    required_skills: [],
    location: '',
    employment_type: 'Full-time',
    company_description: '',
    equal_opportunity_statement: 'We are an equal opportunity employer and value diversity at our company.',
  });

  const [skillInput, setSkillInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<GeneratedDescription | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleSkillAdd = () => {
    if (skillInput.trim()) {
      setRequirements({
        ...requirements,
        required_skills: [...requirements.required_skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setRequirements({
      ...requirements,
      required_skills: requirements.required_skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/job-descriptions`, {
        requirements
      });
      setGeneratedDescription(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!generatedDescription || !feedback.trim()) return;

    setIsRefining(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/job-descriptions/${generatedDescription.id}/refine`,
        { feedback }
      );
      setGeneratedDescription(response.data);
      setFeedback('');
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsRefining(false);
    }
  };

  if (error) return <ErrorState error={error} />;

  return (
    <div className="container-fluid">
      <h1 className="h3 mb-4 text-gray-800">AI Job Description Generator</h1>

      <div className="row">
        {/* Input Form */}
        <div className="col-lg-6">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Job Requirements</h6>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={requirements.job_title}
                  onChange={(e) => setRequirements({ ...requirements, job_title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={requirements.company_name}
                  onChange={(e) => setRequirements({ ...requirements, company_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  className="form-control"
                  value={requirements.industry}
                  onChange={(e) => setRequirements({ ...requirements, industry: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Experience Level</label>
                <select
                  className="form-control"
                  value={requirements.experience_level}
                  onChange={(e) => setRequirements({ ...requirements, experience_level: e.target.value })}
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid-Senior">Mid-Senior</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>

              <div className="form-group">
                <label>Required Skills</label>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSkillAdd()}
                  />
                  <div className="input-group-append">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleSkillAdd}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  {requirements.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="badge badge-primary mr-2 mb-1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSkillRemove(skill)}
                    >
                      {skill} ×
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={requirements.location}
                  onChange={(e) => setRequirements({ ...requirements, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Employment Type</label>
                <select
                  className="form-control"
                  value={requirements.employment_type}
                  onChange={(e) => setRequirements({ ...requirements, employment_type: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="form-group">
                <label>Company Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={requirements.company_description}
                  onChange={(e) => setRequirements({ ...requirements, company_description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Additional Context (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={requirements.additional_context || ''}
                  onChange={(e) => setRequirements({ ...requirements, additional_context: e.target.value })}
                  placeholder="Any additional information that should be considered..."
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Generate Description
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Description */}
        <div className="col-lg-6">
          {isGenerating ? (
            <LoadingState message="Generating job description..." />
          ) : generatedDescription && (
            <div className="card shadow mb-4">
              <div className="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 className="m-0 font-weight-bold text-primary">Generated Description</h6>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => navigator.clipboard.writeText(generatedDescription.content)}
                >
                  <i className="fas fa-copy mr-1"></i>
                  Copy
                </button>
              </div>
              <div className="card-body">
                <div className="generated-content mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                  {generatedDescription.content}
                </div>

                <hr />

                <div className="form-group">
                  <label>Feedback for Refinement</label>
                  <textarea
                    className="form-control mb-2"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to refine the description..."
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={handleRefine}
                    disabled={isRefining || !feedback.trim()}
                  >
                    {isRefining ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Refining...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refine Description
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionGenerator; 