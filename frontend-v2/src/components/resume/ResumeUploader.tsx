import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { parseResume } from '../../services/api/resumeParser';
import type { ResumeParseResponse } from '../../services/api/resumeParser';

interface ResumeUploaderProps {
  onParseComplete: (result: ResumeParseResponse) => void;
  onError: (error: Error) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onParseComplete, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await parseResume(file);
      onParseComplete(result);
    } catch (error) {
      console.error('Error parsing resume:', error);
      setUploadError(error instanceof Error ? error.message : 'Error uploading file');
      onError(error instanceof Error ? error : new Error('Error uploading file'));
    } finally {
      setIsUploading(false);
    }
  }, [onParseComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <Box>
      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        {isUploading ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography>Processing resume...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the resume here' : 'Drag & drop a resume here'}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              or
            </Typography>
            <Button variant="contained" component="span">
              Browse Files
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Supported formats: PDF, DOC, DOCX, TXT
            </Typography>
          </Box>
        )}
      </Paper>

      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError}
        </Alert>
      )}
    </Box>
  );
};

export default ResumeUploader;