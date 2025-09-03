import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { parseBulkResumes, type BulkResumeParseResponse, type BulkParseProgress } from '../../services/api/resumeParser';

interface BulkResumeUploaderProps {
  onBulkParseComplete: (result: BulkResumeParseResponse) => void;
  onError: (error: Error) => void;
}

const BulkResumeUploader: React.FC<BulkResumeUploaderProps> = ({ onBulkParseComplete, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BulkParseProgress | null>(null);
  const [results, setResults] = useState<BulkResumeParseResponse | null>(null);
  const [expandedResults, setExpandedResults] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setResults(null);

    try {
      const result = await parseBulkResumes(acceptedFiles, (progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      setResults(result);
      onBulkParseComplete(result);
    } catch (error) {
      console.error('Error parsing bulk resumes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error uploading files';
      setUploadError(errorMessage);
      onError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  }, [onBulkParseComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 50,
    multiple: true
  });

  const handleRetry = () => {
    setUploadError(null);
    setResults(null);
  };

  const toggleResults = () => {
    setExpandedResults(!expandedResults);
  };

  return (
    <Box>
      {/* Upload Area */}
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
            <Typography variant="h6" gutterBottom>
              Processing {progress?.current || 0} of {progress?.total || 0} resumes...
            </Typography>
            {progress && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(progress.current / progress.total) * 100} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {progress.currentFile}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop resumes here' : 'Drag & drop multiple resumes here'}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              or
            </Typography>
            <Button variant="contained" component="span" startIcon={<FolderOpenIcon />}>
              Browse Files
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Supported formats: PDF, DOC, DOCX, TXT (Max 50 files, 10MB each)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All files will be processed simultaneously for faster results
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Error Display */}
      {uploadError && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {uploadError}
        </Alert>
      )}

      {/* Results Display */}
      {results && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">
                Bulk Processing Results
              </Typography>
              <IconButton onClick={toggleResults} size="small">
                {expandedResults ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* Summary */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {results.total_files}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Files
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {results.successful_parses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {results.failed_parses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Chip 
                label={`Success Rate: ${results.summary.success_rate}`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Processed: ${results.summary.processed_at}`} 
                color="default" 
                variant="outlined"
              />
            </Box>

            {/* Detailed Results */}
            <Collapse in={expandedResults}>
              <Box>
                {/* Successful Parses */}
                {results.results.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      Successfully Parsed ({results.results.length})
                    </Typography>
                    <List dense>
                      {results.results.map((result, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={result.filename}
                            secondary={`Name: ${result.data.full_name || 'N/A'} | Skills: ${result.data.skills?.length || 0}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Failed Parses */}
                {results.errors.length > 0 && (
                  <Box>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      Failed to Parse ({results.errors.length})
                    </Typography>
                    <List dense>
                      {results.errors.map((error, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <ErrorIcon color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary={error.filename}
                            secondary={error.error}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default BulkResumeUploader;
