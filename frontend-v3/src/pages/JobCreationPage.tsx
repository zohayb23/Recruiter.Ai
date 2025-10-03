import React, { useState } from 'react';
import {
  Sparkles,
  Building,
  MapPin,
  Users,
  Briefcase,
  Plus,
  X,
  Wand2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const JobCreationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    department: '',
    locationType: 'Remote',
    location: 'Anywhere',
    experienceLevel: '',
    keySkills: [] as string[],
    skillInput: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (formData.skillInput.trim() && !formData.keySkills.includes(formData.skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keySkills: [...prev.keySkills, prev.skillInput.trim()],
        skillInput: ''
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keySkills: prev.keySkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const generateJobDescription = async () => {
    if (!formData.jobTitle.trim()) {
      setError('Job title is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Simulate API call to generate job description
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockDescription = `
# ${formData.jobTitle}

## Company Overview
${formData.company || 'Our company'} is a leading technology company focused on innovation and growth. We're looking for a talented ${formData.jobTitle} to join our ${formData.department || 'team'}.

## Job Description
We are seeking a highly motivated and skilled ${formData.jobTitle} to join our dynamic team. The ideal candidate will have strong technical skills and a passion for delivering high-quality solutions.

## Key Responsibilities
- Design, develop, and maintain software applications
- Collaborate with cross-functional teams to deliver projects
- Write clean, maintainable, and efficient code
- Participate in code reviews and technical discussions
- Stay up-to-date with industry trends and best practices

## Required Qualifications
- Bachelor's degree in Computer Science or related field
- ${formData.experienceLevel || '3+ years'} of relevant experience
- Strong programming skills in ${formData.keySkills.join(', ') || 'modern programming languages'}
- Experience with software development methodologies
- Excellent problem-solving and communication skills

## Preferred Qualifications
- Experience with cloud platforms and services
- Knowledge of agile development practices
- Previous experience in a fast-paced environment
- Strong analytical and critical thinking skills

## Location
${formData.locationType === 'Remote' ? 'This is a remote position' : `This position is based in ${formData.location}`}

## Benefits
- Competitive salary and equity package
- Comprehensive health, dental, and vision insurance
- Flexible work arrangements
- Professional development opportunities
- Collaborative and inclusive work environment

## How to Apply
Please submit your resume and cover letter through our application portal. We look forward to hearing from you!
      `;

      setGeneratedDescription(mockDescription);
    } catch (error) {
      setError('Failed to generate job description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Development Mode Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Wand2 size={16} className="text-green-600" />
          </div>
          <div>
            <span className="text-green-800 font-medium">Development Mode</span>
            <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">DEV</span>
          </div>
        </div>
        <button className="text-green-700 hover:text-green-800 font-medium">
          Show Details
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
          <p className="text-gray-600 mt-1">Use AI to generate comprehensive job descriptions</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div>
              <span className="text-red-800 font-medium">Error</span>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is the only required field. Our AI will help generate the rest!
                </p>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Enter company name (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Engineering (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Location Type and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type
                  </label>
                  <select
                    value={formData.locationType}
                    onChange={(e) => handleInputChange('locationType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select experience level (optional)</option>
                  <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                  <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                  <option value="Senior Level (6-10 years)">Senior Level (6-10 years)</option>
                  <option value="Lead/Principal (10+ years)">Lead/Principal (10+ years)</option>
                </select>
              </div>

              {/* Key Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Skills
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.skillInput}
                    onChange={(e) => handleInputChange('skillInput', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter key skills (optional)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Add any key skills for the role (optional). Our AI will suggest additional relevant skills.
                </p>
                
                {/* Skills Tags */}
                {formData.keySkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.keySkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateJobDescription}
            disabled={!formData.jobTitle.trim() || isGenerating}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Job Description...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate Job Description</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Description Section */}
        <div className="space-y-6">
          {generatedDescription ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generated Job Description</h2>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Generated Successfully</span>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  {generatedDescription}
                </pre>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors">
                  Save & Publish
                </button>
                <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg transition-colors">
                  Edit Description
                </button>
                <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
                  <FileText size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wand2 size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Job Description Generator</h3>
                <p className="text-gray-600 mb-4">
                  Fill in the basic information and let our AI create a comprehensive job description for you.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Professional formatting</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Industry best practices</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Customized content</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCreationPage;
