import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  LinearProgress,
  Grid,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface SkillRatingResult {
  filename: string;
  source: string;
  overall_score: number;
  skill_scores: Record<string, number>;
  match_score: number;
}

const SkillsRating: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SkillRatingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial skill suggestions
    fetchSkillSuggestions('');
  }, []);

  const fetchSkillSuggestions = async (query: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/skills/suggest/${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Failed to fetch skill suggestions:', err);
    }
  };

  const handleSearch = async () => {
    if (!jobDescription.trim() && skills.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/search/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          required_skills: skills,
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to perform search');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Skills Rating
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Job Description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Enter the job description to extract and match skills..."
          />
          
          <Typography variant="subtitle1">
            Or specify skills manually:
          </Typography>
          
          <Autocomplete
            multiple
            options={suggestions}
            value={skills}
            onChange={(_, newValue) => setSkills(newValue)}
            onInputChange={(_, value) => fetchSkillSuggestions(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Required Skills"
                placeholder="Type to search skills..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  color="primary"
                />
              ))
            }
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || (!jobDescription.trim() && skills.length === 0)}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Rate Candidates
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {results.map((result, index) => (
          <Card key={index}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" component="div">
                    {result.filename}
                  </Typography>
                  <Chip
                    label={`Overall: ${result.overall_score}%`}
                    color={result.overall_score >= 70 ? 'success' : 'warning'}
                  />
                </Stack>
                
                <Chip
                  label={result.source}
                  color="primary"
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                />

                <Grid container spacing={2}>
                  {Object.entries(result.skill_scores).map(([skill, score]) => (
                    <Grid item xs={12} sm={6} key={skill}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" gutterBottom>
                          {skill}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={score}
                              color={score >= 70 ? 'success' : 'warning'}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {`${Math.round(score)}%`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default SkillsRating; 