import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';

interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  employmentType: string;
  experienceLevel: string;
}

const initialFormData: JobFormData = {
  title: '',
  description: '',
  requirements: [],
  location: '',
  employmentType: '',
  experienceLevel: '',
};

export const JobCreationForm: React.FC = () => {
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [requirement, setRequirement] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with backend API
    console.log('Form submitted:', formData);
  };

  const handleRequirementAdd = () => {
    if (requirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirement.trim()],
      });
      setRequirement('');
    }
  };

  const handleRequirementDelete = (indexToDelete: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, index) => index !== indexToDelete),
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Job Posting
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Job Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Job Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Add Requirement"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleRequirementAdd())}
              />
              <Button
                variant="outlined"
                onClick={handleRequirementAdd}
                sx={{ mt: 1 }}
              >
                Add Requirement
              </Button>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {formData.requirements.map((req, index) => (
                <Chip
                  key={index}
                  label={req}
                  onDelete={() => handleRequirementDelete(index)}
                />
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Employment Type</InputLabel>
              <Select
                value={formData.employmentType}
                label="Employment Type"
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              >
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="internship">Internship</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={formData.experienceLevel}
                label="Experience Level"
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
              >
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior Level</MenuItem>
                <MenuItem value="lead">Lead Level</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              Create Job Posting
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default JobCreationForm; 