import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Paper
} from '@mui/material';
import { parseResume } from '../services/api/resumeParser';
import { parseBulkResumes } from '../services/api/resumeParser';
import type { ParsedResume } from '../types/resume';
import type { BulkResumeParseResponse } from '../services/api/resumeParser';
import ParsedResumeDisplay from '../components/resume/ParsedResumeDisplay';
import ResumeUploader from '../components/resume/ResumeUploader';

const ResumeParserPage = () => {
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkResumeParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSingleParseComplete = (result: ParsedResume) => {
    setParsedData(result);
    setBulkResults(null);
    setError(null);
  };

  const handleBulkParseComplete = (result: BulkResumeParseResponse) => {
    setBulkResults(result);
    setParsedData(null);
    setError(null);
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setParsedData(null);
    setBulkResults(null);
  };

  const handleReset = () => {
    setParsedData(null);
    setBulkResults(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Resume Parser
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload resumes to automatically extract and structure the information
        </Typography>
      </Box>

      {/* Upload Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <ResumeUploader
          onParseComplete={handleSingleParseComplete}
          onBulkParseComplete={handleBulkParseComplete}
          onError={handleError}
        />
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Single Resume Results */}
      {parsedData && (
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Parsed Resume Results
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Successfully parsed: {parsedData.full_name || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Skills: {parsedData.skills?.length || 0} | Experience: {parsedData.work_experience?.length || 0}
              </Typography>
            </Box>
          </Box>
          <ParsedResumeDisplay resume={parsedData} />
        </Paper>
      )}

      {/* Bulk Upload Results Summary */}
      {bulkResults && (
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              Bulk Processing Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bulkResults.summary.processed_at}
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} mb={3}>
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="primary">
                {bulkResults.total_files}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </Box>
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="success.main">
                {bulkResults.successful_parses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful
              </Typography>
            </Box>
            <Box textAlign="center" flex={1}>
              <Typography variant="h4" color="error.main">
                {bulkResults.failed_parses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Success Rate: <strong>{bulkResults.summary.success_rate}</strong>
          </Typography>

          <Typography variant="body2" color="text.secondary">
            All successfully parsed resumes have been added to your candidate database. 
            You can view them in the Candidates section.
          </Typography>
        </Paper>
      )}

      {/* Reset Button */}
      {(parsedData || bulkResults) && (
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ready to process more resumes?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the upload area above to process additional files.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ResumeParserPage;