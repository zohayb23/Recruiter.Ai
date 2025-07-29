import React, { useState } from 'react';
import { generateJobDescription, createJobDescription, type JobDescription } from '../../services/api/jobDescriptions';

interface JobFormData {
  title: string;
  company: string;
  description: string;
  location: string;
  department: string;
  employment_type: string;
  experience_level: string;
  remote_work: boolean;
  currency: string;
  min_salary: string;
  max_salary: string;
  requirements: string[];
}

export const BootstrapJobCreationForm: React.FC = () => {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    description: '',
    location: '',
    department: '',
    employment_type: '',
    experience_level: '',
    remote_work: false,
    currency: 'USD ($)',
    min_salary: '',
    max_salary: '',
    requirements: []
  });
  const [newRequirement, setNewRequirement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateJobDescription = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await generateJobDescription({
        title: formData.title,
        department: formData.department,
        experience_level: formData.experience_level,
        required_skills: formData.requirements
      });

      setFormData(prev => ({
        ...prev,
        title: response.title || prev.title,
        description: response.overview || prev.description,
        department: response.department || prev.department,
        experience_level: response.experience_level || prev.experience_level,
        requirements: [
          ...(response.responsibilities?.map((r: { description: string }) => r.description) || []),
          ...(response.qualifications?.map((q: { description: string }) => q.description) || [])
        ]
      }));
    } catch (error: any) {
      console.error('Error generating job description:', error);
      setError(error.response?.data?.message || 'Error generating job description');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      const jobData: JobDescription = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        overview: formData.description,
        responsibilities: formData.requirements.map(r => ({ description: r, is_required: true })),
        qualifications: [],
        required_skills: [],
        preferred_skills: [],
        benefits: [],
        company_description: '',
        culture_values: '',
        diversity_statement: '',
        status: 'draft'
      };

      await createJobDescription(jobData);
      // TODO: Show success message and redirect to job listings
    } catch (error: any) {
      console.error('Error saving job description:', error);
      setError(error.response?.data?.message || 'Error saving job description');
    }
  };

  return (
    <div className="container-fluid">
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Create New Job Posting</h6>
          <div>
            <button 
              className="btn btn-primary me-2"
              onClick={handleGenerateJobDescription}
              disabled={isGenerating}
            >
              {isGenerating ? (
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
            <button 
              className="btn btn-secondary me-2"
              onClick={handleSaveAsDraft}
            >
              Save as Draft
            </button>
            <button className="btn btn-primary">Publish Job</button>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              {error}
            </div>
          )}
          <form>
            <div className="mb-4">
              <h5>Job Details</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="jobTitle" className="form-label">Job Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="jobTitle"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="company" className="form-label">Company *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="company"
                    placeholder="Enter company name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="jobDescription" className="form-label">Job Description *</label>
                <textarea
                  className="form-control"
                  id="jobDescription"
                  rows={5}
                  placeholder="Enter detailed job description or use the 'Generate Job Description' button above"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="location" className="form-label">Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="department" className="form-label">Department *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="department"
                    placeholder="e.g., Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="employmentType" className="form-label">Employment Type *</label>
                  <select
                    className="form-select"
                    id="employmentType"
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    required
                  >
                    <option value="">Select employment type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="experienceLevel" className="form-label">Experience Level *</label>
                  <select
                    className="form-select"
                    id="experienceLevel"
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    required
                  >
                    <option value="">Select experience level</option>
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior Level</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div className="col-md-8 mb-3">
                  <label className="form-label d-block">Remote Work</label>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="remoteWork"
                      checked={formData.remote_work}
                      onChange={(e) => setFormData({ ...formData, remote_work: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="remoteWork">
                      Allow remote work
                    </label>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="currency" className="form-label">Currency</label>
                  <select
                    className="form-select"
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="minSalary" className="form-label">Minimum Salary *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="minSalary"
                    placeholder="e.g., 50000"
                    value={formData.min_salary}
                    onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="maxSalary" className="form-label">Maximum Salary *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="maxSalary"
                    placeholder="e.g., 80000"
                    value={formData.max_salary}
                    onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5>Requirements</h5>
              <div className="mb-3">
                <label htmlFor="requirements" className="form-label">Add a requirement</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    id="requirements"
                    placeholder="Enter requirement"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                  />
                  <button 
                    className="btn btn-outline-primary" 
                    type="button"
                    onClick={handleAddRequirement}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="requirements-list">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="alert alert-info d-flex justify-content-between align-items-center">
                    <span>{req}</span>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        const newReqs = [...formData.requirements];
                        newReqs.splice(index, 1);
                        setFormData({ ...formData, requirements: newReqs });
                      }}
                    ></button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BootstrapJobCreationForm; 