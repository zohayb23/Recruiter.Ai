import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import { jobDescriptionApi } from '../../services/api/jobDescriptions';

interface SmartJDWriterProps {
  jobId?: string;
  initialData?: {
    title: string;
    department: string;
    experience_level: string;
    required_skills: string[];
  };
  onGenerated?: (jobDescription: any) => void;
}

export const SmartJDWriter: React.FC<SmartJDWriterProps> = ({
  jobId,
  initialData,
  onGenerated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialData || {
    title: '',
    department: '',
    experience_level: '',
    required_skills: [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<string | null>(null);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);
  const [showMarketAnalysisDialog, setShowMarketAnalysisDialog] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleGenerateJD = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobDescriptionApi.generateJobDescription(formData);
      if (response.success && response.data) {
        onGenerated?.(response.data);
      } else {
        setError('Failed to generate job description');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await jobDescriptionApi.improveJobDescription(jobId);
      if (response.success && response.data) {
        setSuggestions((response.data as any).suggestions);
        setShowSuggestionsDialog(true);
      } else {
        setError('Failed to get suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGetMarketAnalysis = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await jobDescriptionApi.analyzeMarketAlignment(jobId);
      if (response.success && response.data) {
        setMarketAnalysis((response.data as any).market_analysis);
        setShowMarketAnalysisDialog(true);
      } else {
        setError('Failed to get market analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Smart JD Writer
              </Typography>
              <Typography color="textSecondary" paragraph>
                Let AI help you create an effective and inclusive job description
              </Typography>
            </Grid>

            {/* Basic Information */}
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
                label="Experience Level"
                value={formData.experience_level}
                onChange={(e) => handleInputChange('experience_level', e.target.value)}
              />
            </Grid>

            {/* Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Required Skills
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  sx={{ mr: 1 }}
                />
                <Button onClick={handleAddSkill}>Add</Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.required_skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                  />
                ))}
              </Box>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Box>
                  {jobId && (
                    <>
                      <Button
                        startIcon={<AutoFixHighIcon />}
                        onClick={handleGetSuggestions}
                        disabled={loading}
                      >
                        Get Suggestions
                      </Button>
                      <Button
                        startIcon={<TrendingUpIcon />}
                        onClick={handleGetMarketAnalysis}
                        disabled={loading}
                        sx={{ ml: 2 }}
                      >
                        Market Analysis
                      </Button>
                    </>
                  )}
                </Box>
                <Button
                  variant="contained"
                  onClick={handleGenerateJD}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Generate Job Description'}
                </Button>
              </Stack>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Typography color="error">{error}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      <Dialog
        open={showSuggestionsDialog}
        onClose={() => setShowSuggestionsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Improvement Suggestions
          <IconButton
            onClick={() => setShowSuggestionsDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              my: 2,
            }}
          >
            {suggestions}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Market Analysis Dialog */}
      <Dialog
        open={showMarketAnalysisDialog}
        onClose={() => setShowMarketAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Market Analysis
          <IconButton
            onClick={() => setShowMarketAnalysisDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              my: 2,
            }}
          >
            {marketAnalysis}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMarketAnalysisDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartJDWriter; 