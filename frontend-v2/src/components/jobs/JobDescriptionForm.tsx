import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { jobDescriptionApi } from '../../services/api/jobDescriptions';
import type { JobDescription } from '../../services/api/jobDescriptions';
import { useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
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

interface JobDescriptionFormData {
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
}

interface JobDescriptionFormProps {
  initialData?: JobDescriptionFormData;
  onSubmit: (data: JobDescriptionFormData) => void;
  onSaveAsDraft?: () => void;
}

const defaultFormData: JobDescriptionFormData = {
  title: '',
  department: '',
  location: '',
  employment_type: 'Full-time',
  experience_level: 'Mid-Level',
  salary_range: '',
  overview: '',
  responsibilities: [{ description: '', is_required: true }],
  qualifications: [{ description: '', is_required: true, years_of_experience: 0 }],
  required_skills: [],
  preferred_skills: [],
  benefits: [{ title: '', description: '' }],
  company_description: '',
  culture_values: '',
  diversity_statement: '',
};

export const JobDescriptionForm: React.FC<JobDescriptionFormProps> = ({
  initialData = defaultFormData,
  onSubmit,
  onSaveAsDraft,
}) => {
  const [formData, setFormData] = useState<JobDescriptionFormData>(initialData);
  const [newSkill, setNewSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleInputChange = (field: keyof JobDescriptionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResponsibilityChange = (index: number, field: keyof Responsibility, value: any) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities[index] = { ...newResponsibilities[index], [field]: value };
    handleInputChange('responsibilities', newResponsibilities);
  };

  const handleQualificationChange = (index: number, field: keyof Qualification, value: any) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = { ...newQualifications[index], [field]: value };
    handleInputChange('qualifications', newQualifications);
  };

  const handleBenefitChange = (index: number, field: keyof Benefit, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    handleInputChange('benefits', newBenefits);
  };

  const addSkill = (isRequired: boolean) => {
    const skill = isRequired ? newSkill : newPreferredSkill;
    if (skill.trim()) {
      if (isRequired) {
        handleInputChange('required_skills', [...formData.required_skills, skill]);
        setNewSkill('');
      } else {
        handleInputChange('preferred_skills', [...formData.preferred_skills, skill]);
        setNewPreferredSkill('');
      }
    }
  };

  const removeSkill = (skill: string, isRequired: boolean) => {
    if (isRequired) {
      handleInputChange('required_skills', formData.required_skills.filter((s) => s !== skill));
    } else {
      handleInputChange('preferred_skills', formData.preferred_skills.filter((s) => s !== skill));
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await jobDescriptionApi.createJobDescription({
        ...formData,
        status: isDraft ? 'draft' : 'published',
      });

      if (response.success && response.data) {
        setSuccess(isDraft ? 'Job description saved as draft' : 'Job description published successfully');
        const jobId = (response.data as JobDescription).job_id;
        setTimeout(() => {
          navigate(`/jobs/${jobId}`);
        }, 2000);
      } else {
        setError('Failed to save job description');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratedJD = (generatedJD: any) => {
    setFormData((prev) => ({
      ...prev,
      title: generatedJD.title || prev.title,
      overview: generatedJD.overview || prev.overview,
      responsibilities: generatedJD.responsibilities || prev.responsibilities,
      qualifications: generatedJD.qualifications || prev.qualifications,
      required_skills: generatedJD.required_skills || prev.required_skills,
      preferred_skills: generatedJD.preferred_skills || prev.preferred_skills,
      benefits: generatedJD.benefits || prev.benefits,
      company_description: generatedJD.company_description || prev.company_description,
      culture_values: generatedJD.culture_values || prev.culture_values,
      diversity_statement: generatedJD.diversity_statement || prev.diversity_statement,
    }));
  };

  return (
    <Box>
      {/* Smart JD Writer */}
      <Box sx={{ mb: 3 }}>
        <SmartJDWriter
          initialData={{
            title: formData.title,
            department: formData.department,
            experience_level: formData.experience_level,
            required_skills: formData.required_skills,
          }}
          onGenerated={handleGeneratedJD}
        />
      </Box>

      {/* Main Form */}
      <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Employment Type</InputLabel>
                      <Select
                        value={formData.employment_type}
                        onChange={(e) => handleInputChange('employment_type', e.target.value)}
                        label="Employment Type"
                      >
                        <MenuItem value="Full-time">Full-time</MenuItem>
                        <MenuItem value="Part-time">Part-time</MenuItem>
                        <MenuItem value="Contract">Contract</MenuItem>
                        <MenuItem value="Internship">Internship</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Job Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Job Details</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Overview"
                  value={formData.overview}
                  onChange={(e) => handleInputChange('overview', e.target.value)}
                  required
                />
              </Grid>

              {/* Responsibilities */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Responsibilities</Typography>
                {formData.responsibilities.map((resp, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label={`Responsibility ${index + 1}`}
                      value={resp.description}
                      onChange={(e) => handleResponsibilityChange(index, 'description', e.target.value)}
                      sx={{ mr: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={resp.is_required}
                          onChange={(e) => handleResponsibilityChange(index, 'is_required', e.target.checked)}
                        />
                      }
                      label="Required"
                    />
                    <IconButton
                      onClick={() => handleInputChange('responsibilities', formData.responsibilities.filter((_, i) => i !== index))}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleInputChange('responsibilities', [...formData.responsibilities, { description: '', is_required: true }])}
                >
                  Add Responsibility
                </Button>
              </Grid>

              {/* Skills */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Skills</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Required Skills</Typography>
                    <Box sx={{ display: 'flex', mb: 1 }}>
                      <TextField
                        fullWidth
                        label="Add Required Skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill(true)}
                        sx={{ mr: 1 }}
                      />
                      <Button onClick={() => addSkill(true)}>Add</Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.required_skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          onDelete={() => removeSkill(skill, true)}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Preferred Skills</Typography>
                    <Box sx={{ display: 'flex', mb: 1 }}>
                      <TextField
                        fullWidth
                        label="Add Preferred Skill"
                        value={newPreferredSkill}
                        onChange={(e) => setNewPreferredSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill(false)}
                        sx={{ mr: 1 }}
                      />
                      <Button onClick={() => addSkill(false)}>Add</Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.preferred_skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          onDelete={() => removeSkill(skill, false)}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Company Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Company Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Company Description"
                      value={formData.company_description}
                      onChange={(e) => handleInputChange('company_description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Culture & Values"
                      value={formData.culture_values}
                      onChange={(e) => handleInputChange('culture_values', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Diversity Statement"
                      value={formData.diversity_statement}
                      onChange={(e) => handleInputChange('diversity_statement', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Form Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={loading}
                  >
                    Publish Job Description
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccess(null);
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobDescriptionForm; 