import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteTemplate, saveTemplate } from '../store/searchSlice';
import { QueryGroup, QueryTemplate, QueryTerm } from '../types';
import { RootState } from '../store/store';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const templates = useAppSelector((state: RootState) => state.search.templates);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleDelete = (templateId: string) => {
    setSelectedTemplate(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      dispatch(deleteTemplate(selectedTemplate));
    }
    setDeleteDialogOpen(false);
    setSelectedTemplate(null);
  };

  const handleEdit = (template: QueryTemplate) => {
    navigate('/', { state: { template } });
  };

  const handleCopy = (template: QueryTemplate) => {
    const newTemplate: QueryTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    dispatch(saveTemplate(newTemplate));
  };

  const handleCreateNew = () => {
    navigate('/');
  };

  const getTermColor = (term: QueryTerm, groupOperator: string) => {
    if (term.operator === 'NOT') return 'error';
    return groupOperator === 'AND' ? 'primary' : 'secondary';
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Saved Search Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleCreateNew}
          sx={{
            backgroundColor: (theme) => theme.palette.primary.main,
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.9),
            },
          }}
        >
          Create New Search
        </Button>
      </Stack>

      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <List sx={{ p: 0 }}>
          {templates.length === 0 ? (
            <ListItem>
              <Stack
                alignItems="center"
                spacing={2}
                sx={{
                  width: '100%',
                  py: 4,
                  textAlign: 'center',
                }}
              >
                <SearchIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    No templates saved yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a template in the Boolean Search Builder
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={handleCreateNew}
                  startIcon={<SearchIcon />}
                >
                  Create Your First Template
                </Button>
              </Stack>
            </ListItem>
          ) : (
            templates.map((template: QueryTemplate, index: number) => (
              <React.Fragment key={template.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {template.groups.map((group: QueryGroup, groupIndex: number) => (
                            <Box key={groupIndex} sx={{ display: 'inline-flex', alignItems: 'center', my: 0.5 }}>
                              <Chip
                                label={group.operator}
                                size="small"
                                color="primary"
                                sx={{ mr: 1 }}
                              />
                              {group.terms.map((term: QueryTerm) => (
                                <Chip
                                  key={term.value}
                                  label={`${term.operator === 'NOT' ? 'NOT ' : ''}${term.value}`}
                                  variant="outlined"
                                  size="small"
                                  color={getTermColor(term, group.operator)}
                                  sx={{ mr: 1 }}
                                />
                              ))}
                              {group.parentheses && (
                                <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                                  (Grouped)
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Created: {template.createdAt}
                        </Typography>
                      </Stack>
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => handleCopy(template)}
                      aria-label={`Copy template ${template.name}`}
                      sx={{
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      <CopyIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEdit(template)}
                      aria-label={`Edit template ${template.name}`}
                      sx={{
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(template.id)}
                      aria-label={`Delete template ${template.name}`}
                      sx={{
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: '100%',
            maxWidth: 400,
          },
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Templates; 