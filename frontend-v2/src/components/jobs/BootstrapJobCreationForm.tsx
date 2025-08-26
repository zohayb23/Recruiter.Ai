import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { generateJobDescription, saveJobDescription } from '../../services/api/jobDescriptions';

interface FormData {
  title: string;
  company: string;
  department: string;
  location_type: 'remote' | 'in-person' | 'hybrid';
  location: string;
  key_skills: string[];
  experience_level: string;
  status: string;
  overview?: string;
  responsibilities?: string[];
  qualifications?: string[];
  required_skills?: string[];
  preferred_skills?: string[];
  benefits?: Array<{ title: string; description: string }>;
  company_description?: string;
  culture_values?: string;
  diversity_statement?: string;
}

const BootstrapJobCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    company: '',
    department: '',
    location_type: 'remote',
    location: '',
    key_skills: [],
    experience_level: '',
    status: 'draft'
  });
  const [skillInput, setSkillInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        key_skills: [...prev.key_skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      key_skills: prev.key_skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleGenerateJobDescription = async () => {
    if (!formData.title) {
      toast.error('Please enter a job title');
      return;
    }

    setIsLoading(true);
    try {
      const response = await generateJobDescription(formData);
      setFormData(prev => ({
        ...prev,
        ...response
      }));
      setShowGeneratedContent(true);
      toast.success('Job description generated successfully!');
    } catch (error) {
      console.error('Error generating job description:', error);
      toast.error('Failed to generate job description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishJob = async () => {
    try {
      const jobData = {
        ...formData,
        status: 'published'
      };
      await saveJobDescription(jobData);
      toast.success('Job successfully published!');
      setTimeout(() => {
        navigate('/jobs');
      }, 500);
    } catch (error) {
      console.error('Error publishing job:', error);
      toast.error('Failed to publish job. Please try again.');
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Create New Job Posting</h1>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Basic Information</h6>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Job Title*</label>
              <input
                type="text"
                className="form-control"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Senior Software Engineer"
              />
              <small className="text-muted">This is the only required field. Our AI will help generate the rest!</small>
            </div>
            <div className="col-md-6">
              <label className="form-label">Company</label>
              <input
                type="text"
                className="form-control"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Enter company name (optional)"
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Engineering (optional)"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Location Type</label>
              <select
                className="form-select"
                name="location_type"
                value={formData.location_type}
                onChange={handleInputChange}
              >
                <option value="remote">Remote</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={formData.location_type === 'remote' ? 'Anywhere' : 'e.g., New York, NY'}
                disabled={formData.location_type === 'remote'}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Experience Level</label>
              <select
                className="form-select"
                name="experience_level"
                value={formData.experience_level}
                onChange={handleInputChange}
              >
                <option value="">Select experience level (optional)</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead/Manager</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Key Skills</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Enter key skills (optional)"
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleAddSkill}
                >
                  Add
                </button>
              </div>
              <small className="text-muted">Add any key skills for the role (optional). Our AI will suggest additional relevant skills.</small>
              <div className="mt-2">
                {formData.key_skills.map((skill, index) => (
                  <span key={index} className="badge bg-primary me-2 mb-2">
                    {skill}
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-2"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ fontSize: '0.5rem' }}
                    ></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerateJobDescription}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic me-2"></i>
                  Generate Job Description
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showGeneratedContent && (
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Generated Job Description</h6>
          </div>
          <div className="card-body">
            <h4>{formData.title}</h4>
            {formData.company && <h5 className="text-muted">{formData.company}</h5>}
            
            <div className="mb-4">
              <h5>Overview</h5>
              <p>{formData.overview}</p>
            </div>

            <div className="mb-4">
              <h5>Responsibilities</h5>
              <ul>
                {formData.responsibilities?.map((resp, index) => (
                  <li key={index}>
                    {typeof resp === 'string' 
                      ? resp 
                      : resp.description || 'No description provided'}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <h5>Qualifications</h5>
              <ul>
                {formData.qualifications?.map((qual, index) => (
                  <li key={index}>
                    {typeof qual === 'string' 
                      ? qual 
                      : qual.description || 'No description provided'}
                  </li>
                ))}
              </ul>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <h5>Required Skills</h5>
                <div>
                  {formData.required_skills?.map((skill, index) => (
                    <span key={index} className="badge bg-primary me-2 mb-2">
                      {typeof skill === 'string' ? skill : skill.description}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <h5>Preferred Skills</h5>
                <div>
                  {formData.preferred_skills?.map((skill, index) => (
                    <span key={index} className="badge bg-secondary me-2 mb-2">
                      {typeof skill === 'string' ? skill : skill.description}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5>Benefits</h5>
              <ul>
                {formData.benefits?.map((benefit, index) => (
                  <li key={index}>
                    {typeof benefit === 'string' ? (
                      benefit
                    ) : (
                      <>
                        <strong>{benefit.title}</strong>
                        {benefit.description && `: ${benefit.description}`}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {formData.company_description && (
              <div className="mb-4">
                <h5>About the Company</h5>
                <p>{formData.company_description}</p>
              </div>
            )}

            {formData.culture_values && (
              <div className="mb-4">
                <h5>Culture & Values</h5>
                <p>{formData.culture_values}</p>
              </div>
            )}

            {formData.diversity_statement && (
              <div className="mb-4">
                <h5>Diversity & Inclusion</h5>
                <p>{formData.diversity_statement}</p>
              </div>
            )}

            <div className="text-center mt-4">
              <button
                className="btn btn-success btn-lg"
                onClick={handlePublishJob}
              >
                <i className="fas fa-globe me-2"></i>
                Publish Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BootstrapJobCreationForm;