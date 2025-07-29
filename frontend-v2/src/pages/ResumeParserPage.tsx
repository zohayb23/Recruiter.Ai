import React, { useState } from 'react';
import { parseResume, type ParsedResume } from '../services/api/resumeParser';

const ResumeParserPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Check file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      
      setFile(selectedFile);
      setParsedData(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseResume(file);
      setParsedData(data);
    } catch (err: any) {
      console.error('Resume parsing error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error parsing resume');
    } finally {
      setLoading(false);
    }
  };

  const renderParsedData = () => {
    if (!parsedData) return null;

    return (
      <div className="mt-4">
        <h5 className="mb-4">Parsed Information</h5>
        
        {/* Basic Info */}
        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">Basic Information</h6>
          </div>
          <div className="card-body">
            <p><strong>Name:</strong> {parsedData.full_name}</p>
            <p><strong>Email:</strong> {parsedData.contact?.email}</p>
            <p><strong>Phone:</strong> {parsedData.contact?.phone}</p>
            {parsedData.contact?.linkedin && (
              <p><strong>LinkedIn:</strong> <a href={parsedData.contact.linkedin} target="_blank" rel="noopener noreferrer">{parsedData.contact.linkedin}</a></p>
            )}
            {parsedData.contact?.github && (
              <p><strong>GitHub:</strong> <a href={parsedData.contact.github} target="_blank" rel="noopener noreferrer">{parsedData.contact.github}</a></p>
            )}
            {parsedData.contact?.website && (
              <p><strong>Website:</strong> <a href={parsedData.contact.website} target="_blank" rel="noopener noreferrer">{parsedData.contact.website}</a></p>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {parsedData.professional_summary && (
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Professional Summary</h6>
            </div>
            <div className="card-body">
              <p>{parsedData.professional_summary}</p>
            </div>
          </div>
        )}

        {/* Work Experience */}
        {parsedData.work_experience && parsedData.work_experience.length > 0 && (
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Work Experience</h6>
            </div>
            <div className="card-body">
              {parsedData.work_experience.map((exp, index) => (
                <div key={index} className="mb-4">
                  <h6 className="font-weight-bold">{exp.title} at {exp.company}</h6>
                  <p className="text-muted small">
                    {exp.start_date} - {exp.end_date || 'Present'}
                  </p>
                  {exp.description && (
                    <ul className="pl-4">
                      {exp.description.map((desc, i) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  )}
                  {exp.technologies && exp.technologies.length > 0 && (
                    <p className="mb-0">
                      <strong>Technologies:</strong> {exp.technologies.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {parsedData.education && parsedData.education.length > 0 && (
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Education</h6>
            </div>
            <div className="card-body">
              {parsedData.education.map((edu, index) => (
                <div key={index} className="mb-3">
                  <h6 className="font-weight-bold">{edu.degree}</h6>
                  <p className="mb-1">{edu.institution}</p>
                  <p className="text-muted small">
                    {edu.start_date} - {edu.end_date || 'Present'}
                  </p>
                  {edu.gpa && (
                    <p className="mb-0">GPA: {edu.gpa}</p>
                  )}
                  {edu.description && (
                    <p className="mb-0">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {parsedData.skills && parsedData.skills.length > 0 && (
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Skills</h6>
            </div>
            <div className="card-body">
              {Object.entries(
                parsedData.skills.reduce((acc: Record<string, any[]>, skill) => {
                  const category = skill.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push({
                    name: skill.name,
                    proficiency_level: skill.proficiency_level,
                    years: skill.years_of_experience
                  });
                  return acc;
                }, {})
              ).map(([category, skills]) => (
                <div key={category} className="mb-3">
                  <h6 className="font-weight-bold text-capitalize">{category}</h6>
                  <p>
                    {skills.map((skill: any) => (
                      `${skill.name}${skill.proficiency_level ? ` (${skill.proficiency_level})` : ''}${skill.years ? ` - ${skill.years} years` : ''}`
                    )).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Resume Parser</h1>
      </div>

      <div className="row">
        <div className="col-xl-12 col-lg-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Upload Resume</h6>
            </div>
            <div className="card-body">
              <p className="mb-4">
                Upload a resume to automatically extract and structure the information.
                Supported formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
              </p>

              <div className="d-flex align-items-center">
                <div className="custom-file" style={{ maxWidth: '300px' }}>
                  <input
                    type="file"
                    className="custom-file-input"
                    id="resumeFile"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <label className="custom-file-label" htmlFor="resumeFile">
                    {file ? file.name : 'Choose file'}
                  </label>
                </div>

                {file && (
                  <button
                    className="btn btn-primary ml-3"
                    onClick={handleUpload}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Parsing...
                      </>
                    ) : (
                      'Parse Resume'
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderParsedData()}
    </>
  );
};

export default ResumeParserPage; 