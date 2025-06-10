import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Stack,
  Button,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteTemplate } from '../store/searchSlice';
import { QueryGroup, QueryTemplate, QueryTerm } from '../types';
import { RootState } from '../store/store';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const templates = useAppSelector((state: RootState) => state.search.templates);

  const handleDelete = (templateId: string) => {
    dispatch(deleteTemplate(templateId));
  };

  const handleEdit = (template: QueryTemplate) => {
    navigate('/search', { state: { template } });
  };

  const handleCreate = () => {
    navigate('/search');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Search Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{
            height: 48,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Create New Template
        </Button>
      </Stack>

      <Stack spacing={2}>
        {templates.map((template) => (
          <Card
            key={template.id}
            sx={{
              borderRadius: 2,
              '&:hover': {
                boxShadow: (theme) => theme.shadows[4],
              },
              transition: 'box-shadow 0.2s',
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(template.createdAt)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Edit template">
                    <IconButton
                      onClick={() => handleEdit(template)}
                      sx={{
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete template">
                    <IconButton
                      onClick={() => handleDelete(template.id)}
                      sx={{
                        backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2),
                        },
                      }}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default Templates; 