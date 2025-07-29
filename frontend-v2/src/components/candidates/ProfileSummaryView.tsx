import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';

interface Contact {
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
}

interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  description: string[];
  technologies: string[];
}

interface Education {
  degree: string;
  institution: string;
  start_date: string;
  end_date: string;
  gpa?: number;
  description?: string;
}

interface Skill {
  name: string;
  category: string;
  level?: string;
  years_of_experience?: number;
}

interface ProfileSummaryProps {
  resumeData: {
    resume_id: string;
    full_name: string;
    contact: Contact;
    professional_summary: string;
    work_experience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    file_path: string;
    created_at: string;
  };
}

const ProfileSummaryView: React.FC<ProfileSummaryProps> = ({ resumeData }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return dateString;
    }
  };

  const groupSkillsByCategory = () => {
    const grouped: { [key: string]: Skill[] } = {};
    resumeData.skills.forEach((skill) => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    });
    return grouped;
  };

  return (
    <Box>
      {/* Header Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {resumeData.full_name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {resumeData.professional_summary}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {resumeData.contact.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon color="action" />
                    <Typography>{resumeData.contact.email}</Typography>
                  </Box>
                )}
                {resumeData.contact.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Typography>{resumeData.contact.phone}</Typography>
                  </Box>
                )}
                {resumeData.contact.linkedin && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkedInIcon color="action" />
                    <Typography>{resumeData.contact.linkedin}</Typography>
                  </Box>
                )}
                {resumeData.contact.github && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHubIcon color="action" />
                    <Typography>{resumeData.contact.github}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Experience Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Professional Experience
              </Typography>
              <Timeline>
                {resumeData.work_experience.map((exp, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color="primary">
                        <WorkIcon />
                      </TimelineDot>
                      {index < resumeData.work_experience.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" component="h3">
                          {exp.title}
                        </Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {exp.company} | {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                          {exp.description.map((desc, i) => (
                            <Typography component="li" key={i}>
                              {desc}
                            </Typography>
                          ))}
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {exp.technologies.map((tech) => (
                            <Chip key={tech} label={tech} size="small" />
                          ))}
                        </Box>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Education
              </Typography>
              <Timeline>
                {resumeData.education.map((edu, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color="secondary">
                        <SchoolIcon />
                      </TimelineDot>
                      {index < resumeData.education.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" component="h3">
                          {edu.degree}
                        </Typography>
                        <Typography color="text.secondary">
                          {edu.institution} | {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                        </Typography>
                        {edu.gpa && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            GPA: {edu.gpa}
                          </Typography>
                        )}
                        {edu.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {edu.description}
                          </Typography>
                        )}
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skills
              </Typography>
              {Object.entries(groupSkillsByCategory()).map(([category, skills]) => (
                <Box key={category} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon fontSize="small" color="primary" />
                    {category}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {skills.map((skill) => (
                      <Chip
                        key={skill.name}
                        label={`${skill.name}${skill.years_of_experience ? ` (${skill.years_of_experience}y)` : ''}`}
                        variant={skill.level === 'Expert' ? 'filled' : 'outlined'}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="caption" display="block">
                Resume ID: {resumeData.resume_id}
              </Typography>
              <Typography variant="caption" display="block">
                Uploaded: {new Date(resumeData.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" display="block">
                File: {resumeData.file_path.split('/').pop()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileSummaryView; 