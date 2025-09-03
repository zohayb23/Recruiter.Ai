import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Divider
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Upload as UploadIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { parseResume } from '../../services/api/resumeParser';
import type { ResumeParseResponse } from '../../services/api/resumeParser';
import BulkResumeUploader from './BulkResumeUploader';
import type { BulkResumeParseResponse } from '../../services/api/resumeParser';

interface ResumeUploaderProps {
  onParseComplete: (result: ResumeParseResponse) => void;
  onError: (error: Error) => void;
  onBulkParseComplete?: (result: BulkResumeParseResponse) => void;
}

type UploadMode = 'single' | 'bulk';

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ 
  onParseComplete, 
  onError, 
  onBulkParseComplete 
}) => {
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
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

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: UploadMode | null) => {
    if (newMode !== null) {
      setUploadMode(newMode);
      setUploadError(null);
    }
  };

  const handleBulkParseComplete = (result: BulkResumeParseResponse) => {
    if (onBulkParseComplete) {
      onBulkParseComplete(result);
    }
  };

  const handleBulkError = (error: Error) => {
    onError(error);
  };

  return (
    <Box>
      {/* Mode Toggle */}
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={uploadMode}
          exclusive
          onChange={handleModeChange}
          aria-label="upload mode"
          size="large"
        >
          <ToggleButton value="single" aria-label="single upload">
            <UploadIcon sx={{ mr: 1 }} />
            Single Resume
          </ToggleButton>
          <ToggleButton value="bulk" aria-label="bulk upload">
            <FolderOpenIcon sx={{ mr: 1 }} />
            Bulk Upload
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Single Upload Mode */}
      {uploadMode === 'single' && (
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
                Supported formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Bulk Upload Mode */}
      {uploadMode === 'bulk' && (
        <BulkResumeUploader
          onBulkParseComplete={handleBulkParseComplete}
          onError={handleBulkError}
        />
      )}

      {/* Error Display for Single Upload */}
      {uploadMode === 'single' && uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError}
        </Alert>
      )}

      {/* Divider */}
      <Divider sx={{ my: 3 }} />

      {/* Mode Description */}
      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          {uploadMode === 'single' 
            ? 'Upload and parse one resume at a time for detailed review'
            : 'Upload multiple resumes simultaneously for batch processing (up to 50 files)'
          }
        </Typography>
      </Box>
    </Box>
  );
};

export default ResumeUploader;