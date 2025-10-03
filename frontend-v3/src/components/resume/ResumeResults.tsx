import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Globe,
  GraduationCap,
  Briefcase,
  Award,
  Languages,
  Star,
  Calendar
} from 'lucide-react';

interface ParsedResume {
  full_name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  skills: Array<{
    name: string;
    category: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
    location?: string;
  }>;
  work_experience: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date?: string;
    location?: string;
    description: string;
    achievements: string[];
    technologies: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    expiry?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
}

interface ResumeResultsProps {
  parsedData: ParsedResume | null;
  isLoading: boolean;
  error: string | null;
}

const ResumeResults: React.FC<ResumeResultsProps> = ({ 
  parsedData, 
  isLoading, 
  error 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Processing resume...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-danger-500 text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Parsing Failed</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Data</h3>
          <p className="text-gray-600">Upload a resume to see parsed information</p>
        </div>
      </div>
    );
  }

  const getSkillCategoryColor = (category: string) => {
    const colors = {
      'Programming Languages': 'bg-blue-100 text-blue-800',
      'Frameworks': 'bg-green-100 text-green-800',
      'Databases': 'bg-purple-100 text-purple-800',
      'Tools': 'bg-orange-100 text-orange-800',
      'Cloud': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  const getProficiencyColor = (proficiency: string) => {
    const colors = {
      'Native': 'bg-green-100 text-green-800',
      'Fluent': 'bg-blue-100 text-blue-800',
      'Intermediate': 'bg-yellow-100 text-yellow-800',
      'Basic': 'bg-gray-100 text-gray-800'
    };
    return colors[proficiency as keyof typeof colors] || colors.Basic;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {parsedData.full_name}
            </h2>
            {parsedData.summary && (
              <p className="text-gray-600 leading-relaxed">{parsedData.summary}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parsedData.email && (
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{parsedData.email}</span>
            </div>
          )}
          {parsedData.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{parsedData.phone}</span>
            </div>
          )}
          {parsedData.linkedin && (
            <div className="flex items-center space-x-3">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <a 
                href={parsedData.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
          {parsedData.github && (
            <div className="flex items-center space-x-3">
              <Github className="w-5 h-5 text-gray-600" />
              <a 
                href={parsedData.github} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800"
              >
                GitHub Profile
              </a>
            </div>
          )}
          {parsedData.website && (
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <a 
                href={parsedData.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800"
              >
                Website
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      {parsedData.skills && parsedData.skills.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-primary-500 mr-2" />
            Skills
          </h3>
          <div className="space-y-4">
            {Object.entries(
              parsedData.skills.reduce((acc, skill) => {
                if (!acc[skill.category]) acc[skill.category] = [];
                acc[skill.category].push(skill.name);
                return acc;
              }, {} as Record<string, string[]>)
            ).map(([category, skills]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillCategoryColor(category)}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {parsedData.work_experience && parsedData.work_experience.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 text-primary-500 mr-2" />
            Work Experience
          </h3>
          <div className="space-y-6">
            {parsedData.work_experience.map((job, index) => (
              <div key={index} className="border-l-4 border-primary-200 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{job.start_date} - {job.end_date || 'Present'}</p>
                    {job.location && <p>{job.location}</p>}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{job.description}</p>
                
                {job.achievements && job.achievements.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Key Achievements:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {job.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {job.technologies && job.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
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

      {/* Education */}
      {parsedData.education && parsedData.education.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 text-primary-500 mr-2" />
            Education
          </h3>
          <div className="space-y-4">
            {parsedData.education.map((edu, index) => (
              <div key={index} className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  <p className="text-gray-600">{edu.institution}</p>
                  {edu.location && <p className="text-sm text-gray-500">{edu.location}</p>}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{edu.year}</p>
                  {edu.gpa && <p>GPA: {edu.gpa}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {parsedData.certifications && parsedData.certifications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 text-primary-500 mr-2" />
            Certifications
          </h3>
          <div className="space-y-3">
            {parsedData.certifications.map((cert, index) => (
              <div key={index} className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                  <p className="text-gray-600">{cert.issuer}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{cert.date}</p>
                  {cert.expiry && <p>Expires: {cert.expiry}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {parsedData.languages && parsedData.languages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Languages className="w-5 h-5 text-primary-500 mr-2" />
            Languages
          </h3>
          <div className="flex flex-wrap gap-3">
            {parsedData.languages.map((lang, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{lang.language}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProficiencyColor(lang.proficiency)}`}>
                  {lang.proficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeResults;
