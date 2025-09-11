import React from 'react';
import { Card, Badge, ListGroup } from 'react-bootstrap';
import { type ResumeData } from '../../services/api/duplicateDetection';

interface ResumeComparisonProps {
  resume: ResumeData;
  compact?: boolean;
}

const ResumeComparison: React.FC<ResumeComparisonProps> = ({ resume, compact = false }) => {
  const formatSkills = (skills: string[]) => {
    if (!Array.isArray(skills)) return 'No skills listed';
    
    // Handle the complex skill format from the API
    const skillNames = skills.map(skill => {
      if (typeof skill === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(skill);
          return parsed.name || skill;
        } catch {
          return skill;
        }
      }
      return skill;
    });
    
    return skillNames.slice(0, compact ? 3 : 5).join(', ') + (skillNames.length > (compact ? 3 : 5) ? '...' : '');
  };

  const formatWorkExperience = (experience: ResumeData['work_experience']) => {
    if (!Array.isArray(experience) || experience.length === 0) {
      return 'No work experience listed';
    }
    
    const latest = experience[0];
    return `${latest.title} at ${latest.company}`;
  };

  const formatEducation = (education: ResumeData['education']) => {
    if (!Array.isArray(education) || education.length === 0) {
      return 'No education listed';
    }
    
    const latest = education[0];
    return `${latest.degree} from ${latest.institution}`;
  };

  if (compact) {
    return (
      <div>
        <div className="mb-2">
          <strong>Contact:</strong>
          <div className="text-muted">
            {resume.email && <div>📧 {resume.email}</div>}
            {resume.phone && <div>📞 {resume.phone}</div>}
          </div>
        </div>
        
        <div className="mb-2">
          <strong>Latest Role:</strong>
          <div className="text-muted">{formatWorkExperience(resume.work_experience)}</div>
        </div>
        
        <div className="mb-2">
          <strong>Education:</strong>
          <div className="text-muted">{formatEducation(resume.education)}</div>
        </div>
        
        <div>
          <strong>Skills:</strong>
          <div className="text-muted">{formatSkills(resume.skills)}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h6>Contact Information</h6>
        <ListGroup variant="flush">
          {resume.email && (
            <ListGroup.Item className="px-0">
              <strong>Email:</strong> {resume.email}
            </ListGroup.Item>
          )}
          {resume.phone && (
            <ListGroup.Item className="px-0">
              <strong>Phone:</strong> {resume.phone}
            </ListGroup.Item>
          )}
          <ListGroup.Item className="px-0">
            <strong>Resume ID:</strong> 
            <Badge bg="secondary" className="ms-2">
              {resume.resume_id.substring(0, 8)}...
            </Badge>
          </ListGroup.Item>
        </ListGroup>
      </div>

      <div className="mb-3">
        <h6>Work Experience</h6>
        {Array.isArray(resume.work_experience) && resume.work_experience.length > 0 ? (
          <ListGroup variant="flush">
            {resume.work_experience.slice(0, 3).map((exp, index) => (
              <ListGroup.Item key={index} className="px-0">
                <div>
                  <strong>{exp.title}</strong> at {exp.company}
                </div>
                <small className="text-muted">
                  {exp.start_date} - {exp.end_date}
                </small>
                {exp.description && exp.description.length > 0 && (
                  <div className="mt-1">
                    <small>{exp.description[0].substring(0, 100)}...</small>
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted">No work experience listed</p>
        )}
      </div>

      <div className="mb-3">
        <h6>Education</h6>
        {Array.isArray(resume.education) && resume.education.length > 0 ? (
          <ListGroup variant="flush">
            {resume.education.map((edu, index) => (
              <ListGroup.Item key={index} className="px-0">
                <div>
                  <strong>{edu.degree}</strong>
                </div>
                <small className="text-muted">{edu.institution}</small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted">No education listed</p>
        )}
      </div>

      <div>
        <h6>Skills</h6>
        <div className="text-muted">
          {formatSkills(resume.skills)}
        </div>
      </div>
    </div>
  );
};

export default ResumeComparison;
