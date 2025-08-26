import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { parseResume } from '../services/api/resumeParser';
import type { ParsedResume } from '../types/resume';
import ParsedResumeDisplay from '../components/resume/ParsedResumeDisplay';

const ResumeParserPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Check file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      
      setFile(selectedFile);
      setParsedData(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseResume(file);
      setParsedData(data);
    } catch (err: any) {
      console.error('Resume parsing error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Error parsing resume');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Resume Parser
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload a resume to automatically extract and structure the information
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box>
          <Typography variant="body1" gutterBottom>
            Supported formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="contained"
              component="label"
              disabled={loading}
            >
              Choose File
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Typography variant="body2" color="text.secondary">
                {file.name}
              </Typography>
            )}

            {file && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              >
                {loading ? 'Parsing...' : 'Parse Resume'}
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>

      {parsedData && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleReset}
            >
              Upload Another Resume
            </Button>
          </Box>
          <ParsedResumeDisplay resume={parsedData} />
        </Box>
      )}
    </Container>
  );
};

export default ResumeParserPage;