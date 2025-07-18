import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JobFormData {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  isRemote: boolean;
  employmentType: string;
  experienceLevel: string;
  department: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'DRAFT' | 'PUBLISHED';
}

interface FormErrors {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  department?: string;
  salary?: string;
}

const initialFormData: JobFormData = {
  title: '',
  company: '',
  description: '',
  requirements: [],
  location: '',
  isRemote: false,
  employmentType: '',
  experienceLevel: '',
  department: '',
  salary: {
    min: 0,
    max: 0,
    currency: 'USD'
  },
  status: 'DRAFT'
};

const BootstrapJobCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [requirement, setRequirement] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
    if (!formData.experienceLevel) newErrors.experienceLevel = 'Experience level is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (formData.salary.min <= 0) newErrors.salary = 'Minimum salary is required';
    if (formData.salary.max <= 0 || formData.salary.max <= formData.salary.min) {
      newErrors.salary = 'Maximum salary must be greater than minimum salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED') => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // TODO: Integrate with backend API
        const submitData = {
          ...formData,
          status
        };
        console.log('Form submitted:', submitData);
        navigate('/jobs');
      } catch (error) {
        console.error('Error creating job:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRequirementAdd = () => {
    if (requirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirement.trim()],
      });
      setRequirement('');
    }
  };

  const handleRequirementDelete = (indexToDelete: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, index) => index !== indexToDelete),
    });
  };

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Create New Job Posting</h1>
        <div>
          <button 
            className="btn btn-secondary mr-2"
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={isSubmitting}
          >
            <i className="fas fa-save fa-sm text-white-50 mr-2"></i>
            Save as Draft
          </button>
          <button 
            className="btn btn-primary"
            onClick={(e) => handleSubmit(e, 'PUBLISHED')}
            disabled={isSubmitting}
          >
            <i className="fas fa-paper-plane fa-sm text-white-50 mr-2"></i>
            Publish Job
          </button>
        </div>
      </div>

      {/* Job Creation Form */}
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex justify-content-between align-items-center">
          <h6 className="m-0 font-weight-bold text-primary">Job Details</h6>
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/jobs')}
          >
            <i className="fas fa-arrow-left fa-sm mr-2"></i>
            Back to Jobs
          </button>
        </div>
        <div className="card-body">
          <form onSubmit={(e) => handleSubmit(e)}>
            <div className="row">
              <div className="col-md-8">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Job Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  {errors.title && (
                    <div className="invalid-feedback">{errors.title}</div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Company <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                    placeholder="Enter company name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                  {errors.company && (
                    <div className="invalid-feedback">{errors.company}</div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Job Description <span className="text-danger">*</span></label>
                  <textarea
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    rows={8}
                    placeholder="Enter detailed job description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Requirements</label>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add a requirement"
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleRequirementAdd())}
                    />
                    <div className="input-group-append">
                      <button
                        className="btn btn-outline-primary"
                        type="button"
                        onClick={handleRequirementAdd}
                      >
                        <i className="fas fa-plus fa-sm mr-1"></i> Add
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    {formData.requirements.map((req, index) => (
                      <div
                        key={index}
                        className="badge badge-light mr-2 mb-2 p-2"
                        style={{ fontSize: '0.9em', backgroundColor: '#f8f9fc' }}
                      >
                        {req}
                        <i
                          className="fas fa-times ml-2 text-danger"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRequirementDelete(index)}
                        ></i>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Location <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  {errors.location && (
                    <div className="invalid-feedback">{errors.location}</div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Department <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.department ? 'is-invalid' : ''}`}
                    placeholder="e.g., Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                  {errors.department && (
                    <div className="invalid-feedback">{errors.department}</div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Remote Work</label>
                  <div className="custom-control custom-switch mt-2">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="remoteSwitch"
                      checked={formData.isRemote}
                      onChange={(e) => setFormData({ ...formData, isRemote: e.target.checked })}
                    />
                    <label className="custom-control-label" htmlFor="remoteSwitch">
                      Allow remote work
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Employment Type <span className="text-danger">*</span></label>
                  <select
                    className={`form-control ${errors.employmentType ? 'is-invalid' : ''}`}
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  >
                    <option value="">Select employment type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                  {errors.employmentType && (
                    <div className="invalid-feedback">{errors.employmentType}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Experience Level <span className="text-danger">*</span></label>
                  <select
                    className={`form-control ${errors.experienceLevel ? 'is-invalid' : ''}`}
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  >
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (3-5 years)</option>
                    <option value="senior">Senior Level (5+ years)</option>
                    <option value="lead">Lead Level (8+ years)</option>
                  </select>
                  {errors.experienceLevel && (
                    <div className="invalid-feedback">{errors.experienceLevel}</div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Currency</label>
                  <select
                    className="form-control"
                    value={formData.salary.currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      salary: { ...formData.salary, currency: e.target.value }
                    })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Minimum Salary <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        {formData.salary.currency === 'USD' ? '$' : formData.salary.currency === 'EUR' ? '€' : '£'}
                      </span>
                    </div>
                    <input
                      type="number"
                      className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                      placeholder="e.g., 50000"
                      value={formData.salary.min || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        salary: { ...formData.salary, min: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group">
                  <label className="small font-weight-bold mb-1">Maximum Salary <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        {formData.salary.currency === 'USD' ? '$' : formData.salary.currency === 'EUR' ? '€' : '£'}
                      </span>
                    </div>
                    <input
                      type="number"
                      className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                      placeholder="e.g., 80000"
                      value={formData.salary.max || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        salary: { ...formData.salary, max: Number(e.target.value) }
                      })}
                    />
                    {errors.salary && (
                      <div className="invalid-feedback">{errors.salary}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BootstrapJobCreationForm; 