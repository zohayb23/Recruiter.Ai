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
              <Typography variant="subtitle1" fontWeight="bold">{resume.full_name}</Typography>
              <Typography>{resume.contact.email}</Typography>
              <Typography>{resume.contact.phone}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              {resume.contact.linkedin && (
                <Typography>
                  <Link href={resume.contact.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn Profile
                  </Link>
                </Typography>
              )}
              {resume.contact.github && (
                <Typography>
                  <Link href={resume.contact.github} target="_blank" rel="noopener noreferrer">
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
            {resume.education.map((edu, index) => (
              <ListItem key={index} divider={index < resume.education.length - 1}>
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
            {resume.work_experience.map((exp, index) => (
              <ListItem key={index} divider={index < resume.work_experience.length - 1}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {exp.title} {exp.company && `at ${exp.company}`}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography component="span" color="text.secondary" display="block">
                        {exp.start_date} - {exp.end_date || 'Present'}
                      </Typography>
                      <List dense>
                        {exp.description.map((desc, i) => (
                          <ListItem key={i}>
                            <ListItemText primary={desc} />
                          </ListItem>
                        ))}
                      </List>
                      {exp.technologies.length > 0 && (
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
              resume.skills.reduce((acc, skill) => {
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