import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SmartJDWriter from './SmartJDWriter';

interface Responsibility {
  description: string;
  is_required: boolean;
}

interface Qualification {
  description: string;
  is_required: boolean;
  years_of_experience?: number;
}

interface Benefit {
  title: string;
  description: string;
}

interface JobDescriptionDetailProps {
  jobData: {
    job_id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    experience_level: string;
    salary_range: string;
    overview: string;
    responsibilities: Responsibility[];
    qualifications: Qualification[];
    required_skills: string[];
    preferred_skills: string[];
    benefits: Benefit[];
    company_description: string;
    culture_values: string;
    diversity_statement: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
  };
  onEdit?: () => void;
  onArchive?: () => void;
  onPublish?: () => void;
}

const JobDescriptionDetail: React.FC<JobDescriptionDetailProps> = ({
  jobData,
  onEdit,
  onArchive,
  onPublish,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Smart JD Writer */}
      <Box sx={{ mb: 3 }}>
        <SmartJDWriter
          jobId={jobData.job_id}
          initialData={{
            title: jobData.title,
            department: jobData.department,
            experience_level: jobData.experience_level,
            required_skills: jobData.required_skills,
          }}
        />
      </Box>

      {/* Existing detail view */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4" component="h1">
                {jobData.title}
              </Typography>
              <Chip
                label={jobData.status.toUpperCase()}
                color={getStatusColor(jobData.status)}
                sx={{ textTransform: 'uppercase' }}
              />
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon />
                  <Typography>{jobData.location}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon />
                  <Typography>{jobData.employment_type}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  <Typography>{jobData.department}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoneyIcon />
                  <Typography>{jobData.salary_range}</Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {onEdit && (
                <Button variant="outlined" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onPublish && jobData.status === 'draft' && (
                <Button variant="contained" color="primary" onClick={onPublish}>
                  Publish
                </Button>
              )}
              {onArchive && jobData.status === 'published' && (
                <Button variant="outlined" color="error" onClick={onArchive}>
                  Archive
                </Button>
              )}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Overview */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Overview</Typography>
              <Typography>{jobData.overview}</Typography>
            </Box>

            {/* Responsibilities */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Responsibilities</Typography>
              <ul>
                {jobData.responsibilities.map((resp, index) => (
                  <li key={index}>
                    <Typography>
                      {resp.description}
                      {!resp.is_required && ' (Optional)'}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>

            {/* Qualifications */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Qualifications</Typography>
              <ul>
                {jobData.qualifications.map((qual, index) => (
                  <li key={index}>
                    <Typography>
                      {qual.description}
                      {qual.years_of_experience && ` (${qual.years_of_experience}+ years)`}
                      {!qual.is_required && ' (Preferred)'}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>

            {/* Skills */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Required Skills</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {jobData.required_skills.map((skill) => (
                  <Chip key={skill} label={skill} color="primary" />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>Preferred Skills</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {jobData.preferred_skills.map((skill) => (
                  <Chip key={skill} label={skill} variant="outlined" />
                ))}
              </Box>
            </Box>

            {/* Benefits */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Benefits</Typography>
              <Grid container spacing={2}>
                {jobData.benefits.map((benefit, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {benefit.title}
                        </Typography>
                        <Typography variant="body2">
                          {benefit.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Company Information */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>About the Company</Typography>
              <Typography paragraph>{jobData.company_description}</Typography>

              <Typography variant="h6" gutterBottom>Culture & Values</Typography>
              <Typography paragraph>{jobData.culture_values}</Typography>

              <Typography variant="h6" gutterBottom>Diversity Statement</Typography>
              <Typography>{jobData.diversity_statement}</Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Metadata */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" display="block">
                Created: {new Date(jobData.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" display="block">
                Last Updated: {new Date(jobData.updated_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobDescriptionDetail; 