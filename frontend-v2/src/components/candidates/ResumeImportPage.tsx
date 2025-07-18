import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Stack,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Article as DocIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  progress?: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/rtf',
];

export const ResumeImportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, TXT, or RTF files.',
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit.',
      };
    }
    return { isValid: true };
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .map((file) => {
        const validation = validateFile(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          status: validation.isValid ? 'pending' : 'error',
          error: validation.error,
          progress: 0,
        };
      });

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const droppedFiles = event.dataTransfer.files;
    if (!droppedFiles) return;

    const newFiles: UploadedFile[] = Array.from(droppedFiles)
      .map((file) => {
        const validation = validateFile(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          status: validation.isValid ? 'pending' : 'error',
          error: validation.error,
          progress: 0,
        };
      });

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleRemoveFile = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const validFiles = files.filter((file) => file.status === 'pending');
      
      for (const file of validFiles) {
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === file.id ? { ...f, status: 'processing' } : f
          )
        );

        // Simulate file upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === file.id ? { ...f, progress } : f
            )
          );
        }

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
          )
        );
      }
    } catch (err) {
      setError('Failed to upload files. Please try again.');
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          status: file.status === 'processing' ? 'error' : file.status,
          error: 'Upload failed',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PdfIcon color="error" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <DocIcon color="primary" />;
    return <FileIcon color="action" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          variant="text"
          onClick={() => navigate('/candidates')}
          sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
            }
          }}
        >
          <ArrowBackIcon fontSize="small" />
          Back to Candidates
        </Button>

        <Typography 
          variant="h4" 
          sx={{ 
            mb: 3,
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Import Resumes
        </Typography>

        <Stack spacing={3}>
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  flex: 1
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Card
            elevation={0}
            sx={{
              p: 4,
              border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragging ? theme.palette.primary.light : theme.palette.background.paper,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: theme.palette.primary.light,
              },
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.doc,.docx,.txt,.rtf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <CloudUploadIcon 
              sx={{ 
                fontSize: 64, 
                color: isDragging ? theme.palette.primary.main : theme.palette.primary.light,
                mb: 2 
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              Drag and drop resumes here
            </Typography>
            <Typography 
              color="textSecondary"
              sx={{ mb: 2 }}
            >
              or click to select files
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                color: theme.palette.text.secondary
              }}
            >
              Supported formats: PDF, DOC, DOCX, TXT, RTF (Max 10MB per file)
            </Typography>
          </Card>

          {files.length > 0 && (
            <Card 
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.text.primary
                  }}
                >
                  Selected Files ({files.length})
                </Typography>
                <List>
                  {files.map((file) => (
                    <ListItem
                      key={file.id}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={2} alignItems="center">
                          {file.status === 'processing' && (
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={file.progress || 0}
                                size={24}
                              />
                              <Box
                                sx={{
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  right: 0,
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  component="div"
                                  color="text.secondary"
                                >
                                  {file.progress}%
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          <Chip
                            icon={
                              file.status === 'success' ? <CheckCircleIcon /> :
                              file.status === 'error' ? <ErrorIcon /> :
                              undefined
                            }
                            label={
                              file.status === 'success' ? 'Uploaded' :
                              file.status === 'error' ? 'Error' :
                              file.status === 'processing' ? 'Uploading' :
                              'Pending'
                            }
                            color={
                              file.status === 'success' ? 'success' :
                              file.status === 'error' ? 'error' :
                              file.status === 'processing' ? 'primary' :
                              'default'
                            }
                            variant={file.status === 'pending' ? 'outlined' : 'filled'}
                            size="small"
                            sx={{ minWidth: 90 }}
                          />
                          <Tooltip title="Remove">
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(file.id)}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  bgcolor: theme.palette.error.light,
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <ListItemIcon>
                        {getFileIcon(file.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              color: file.error ? theme.palette.error.main : theme.palette.text.primary,
                            }}
                          >
                            {file.name}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(file.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Modified {formatDistanceToNow(file.lastModified, { addSuffix: true })}
                            </Typography>
                            {file.error && (
                              <Typography variant="caption" color="error">
                                {file.error}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Box 
                  sx={{ 
                    mt: 3, 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: 2
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setFiles([])}
                    disabled={isUploading || files.length === 0}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={isUploading || !files.some(f => f.status === 'pending')}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 4,
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload and Parse Resumes'}
                  </Button>
                </Box>
              </Box>
            </Card>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default ResumeImportPage; 