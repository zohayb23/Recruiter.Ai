import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Container,
  Divider,
} from '@mui/material';

interface ResumeViewerProps {
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  matchingExperience: string[];
  score: number;
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({
  summary,
  matchingSkills,
  missingSkills,
  matchingExperience,
  score,
}) => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Box mb={4}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h5" gutterBottom>
                Match Results
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Showing detailed resume analysis
              </Typography>
            </Grid>
            <Grid item>
              <Chip
                label={`Score: ${score}`}
                color={score >= 90 ? "success" : score >= 70 ? "primary" : "warning"}
                sx={{ fontSize: '1.1rem', py: 2, px: 1 }}
              />
            </Grid>
          </Grid>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {summary}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Matching Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {matchingSkills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    color="success"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Missing Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {missingSkills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    color="error"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Matching Experience
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 2 }}>
            {matchingExperience.map((exp, index) => (
              <Typography
                key={index}
                component="li"
                variant="body1"
                sx={{
                  mb: 2,
                  '&::marker': {
                    color: 'primary.main',
                    fontSize: '1.2em'
                  }
                }}
              >
                {exp}
              </Typography>
            ))}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResumeViewer; 