import React from 'react';
import type { ParsedResume } from '../../services/api/resumeParser';

interface ParsedResumeViewerProps {
  resume: ParsedResume;
}

const ParsedResumeViewer: React.FC<ParsedResumeViewerProps> = ({ resume }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{resume.full_name}</h1>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {resume.contact.email && (
            <div className="flex items-center text-gray-600">
              <i className="fas fa-envelope mr-2"></i>
              <a href={`mailto:${resume.contact.email}`} className="hover:text-primary">
                {resume.contact.email}
              </a>
            </div>
          )}
          
          {resume.contact.phone && (
            <div className="flex items-center text-gray-600">
              <i className="fas fa-phone mr-2"></i>
              <span>{resume.contact.phone}</span>
            </div>
          )}
          
          {resume.contact.linkedin && (
            <div className="flex items-center text-gray-600">
              <i className="fab fa-linkedin mr-2"></i>
              <a href={resume.contact.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                LinkedIn Profile
              </a>
            </div>
          )}
          
          {resume.contact.github && (
            <div className="flex items-center text-gray-600">
              <i className="fab fa-github mr-2"></i>
              <a href={resume.contact.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                GitHub Profile
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {resume.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          <p className="text-gray-700">{resume.summary}</p>
        </div>
      )}

      {/* Work Experience Section */}
      {resume.work_experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Experience</h2>
          <div className="space-y-6">
            {resume.work_experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{exp.title}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {exp.start_date && (
                      <span>
                        {new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        {exp.end_date ? ` - ${new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ' - Present'}
                      </span>
                    )}
                  </div>
                </div>
                
                {exp.description.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                    {exp.description.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                )}
                
                {exp.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exp.technologies.map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {resume.education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
          <div className="space-y-4">
            {resume.education.map((edu, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4">
                <h3 className="text-lg font-medium text-gray-900">{edu.degree}</h3>
                <p className="text-gray-600">{edu.institution}</p>
                {edu.start_date && (
                  <p className="text-sm text-gray-500">
                    {new Date(edu.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    {edu.end_date ? ` - ${new Date(edu.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ' - Present'}
                  </p>
                )}
                {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {resume.skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(
              resume.skills.reduce((acc, skill) => {
                const category = skill.category || 'Other';
                return {
                  ...acc,
                  [category]: [...(acc[category] || []), skill]
                };
              }, {} as Record<string, typeof resume.skills>)
            ).map(([category, skills]) => (
              <div key={category} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {skill.name}
                      {skill.years_of_experience && ` (${skill.years_of_experience}+ years)`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Sections */}
      {resume.certifications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Certifications</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {resume.certifications.map((cert, index) => (
              <li key={index}>{cert}</li>
            ))}
          </ul>
        </div>
      )}

      {resume.languages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {resume.languages.map((lang, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParsedResumeViewer; 