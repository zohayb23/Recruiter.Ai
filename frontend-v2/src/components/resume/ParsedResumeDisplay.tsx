import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
  Link
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ParsedResume } from '../../types/resume';

interface ParsedResumeDisplayProps {
  resume: ParsedResume;
}

const ParsedResumeDisplay: React.FC<ParsedResumeDisplayProps> = ({ resume }) => {
  // Add null checks to prevent errors
  if (!resume) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Typography variant="h6" color="error">
          No resume data available. Please try parsing a resume again.
        </Typography>
      </Box>
    );
  }

  const contact = resume.contact || {};
  const fullName = resume.full_name || 'Unknown';
  const email = contact.email || 'Not provided';
  const phone = contact.phone || 'Not provided';
  const education = resume.education || [];
  const workExperience = resume.work_experience || [];
  const skills = resume.skills || [];

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Contact Information */}
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="contact-content"
          id="contact-header"
        >
          <Typography variant="h6">Contact Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold">{fullName}</Typography>
              <Typography>{email}</Typography>
              <Typography>{phone}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              {contact.linkedin && (
                <Typography>
                  <Link href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn Profile
                  </Link>
                </Typography>
              )}
              {contact.github && (
                <Typography>
                  <Link href={contact.github} target="_blank" rel="noopener noreferrer">
                    GitHub Profile
                  </Link>
                </Typography>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Education */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="education-content"
          id="education-header"
        >
          <Typography variant="h6">Education</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {education.map((edu, index) => (
              <ListItem key={index} divider={index < education.length - 1}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {edu.degree}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" display="block">
                        {edu.institution}
                      </Typography>
                      {edu.start_date && (
                        <Typography component="span" color="text.secondary">
                          {edu.start_date} - {edu.end_date || 'Present'}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Work Experience */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="experience-content"
          id="experience-header"
        >
          <Typography variant="h6">Work Experience</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {workExperience.map((exp, index) => (
              <ListItem key={index} divider={index < workExperience.length - 1}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {exp.title || 'Unknown Position'} {exp.company && `at ${exp.company}`}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography component="span" color="text.secondary" display="block">
                        {exp.start_date || 'Unknown'} - {exp.end_date || 'Present'}
                      </Typography>
                      <List dense>
                        {Array.isArray(exp.description) 
                          ? exp.description.map((desc, i) => (
                              <ListItem key={i}>
                                <ListItemText primary={desc} />
                              </ListItem>
                            ))
                          : exp.description && (
                              <ListItem>
                                <ListItemText primary={exp.description} />
                              </ListItem>
                            )
                        }
                      </List>
                      {exp.technologies && Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {exp.technologies.map((tech, i) => (
                            <Chip
                              key={i}
                              label={tech}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Skills */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="skills-content"
          id="skills-header"
        >
          <Typography variant="h6">Skills</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(
              skills.reduce((acc, skill) => {
                if (!acc[skill.category]) {
                  acc[skill.category] = [];
                }
                acc[skill.category].push(skill.name);
                return acc;
              }, {} as Record<string, string[]>)
            ).map(([category, skills]) => (
              <Grid item xs={12} md={6} key={category}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {category}
                  </Typography>
                  <Box>
                    {skills.map((skill, i) => (
                      <Chip
                        key={i}
                        label={skill}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ParsedResumeDisplay;