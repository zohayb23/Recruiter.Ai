import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  alpha,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Code as ParenthesesIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { saveTemplate, fetchSkillSuggestions, fetchDidYouMean } from '../store/searchSlice';
import { QueryGroup, QueryTemplate, QueryTerm, Operator } from '../types';

const SAMPLE_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Python',
  'Java',
  'SQL',
  'Node.js',
  'Docker',
  'AWS',
  'Machine Learning',
  'Git',
  'CI/CD',
  'Agile',
  'REST API',
  'GraphQL',
  'MongoDB',
  'PostgreSQL',
];

const BooleanSearch: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { synonyms, relatedSkills, didYouMean, loading } = useAppSelector(
    (state) => state.search
  );
  const [queryGroups, setQueryGroups] = useState<QueryGroup[]>([
    { operator: 'AND', terms: [], parentheses: false },
  ]);
  const [suggestions, setSuggestionsLocal] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    const state = location.state as { template?: QueryTemplate };
    if (state?.template) {
      setQueryGroups(state.template.groups);
      setTemplateName(state.template.name);
    }
  }, [location.state]);

  const handleAddGroup = () => {
    setQueryGroups([...queryGroups, { operator: 'AND', terms: [], parentheses: false }]);
  };

  const handleRemoveGroup = (index: number) => {
    const newGroups = queryGroups.filter((_, i) => i !== index);
    setQueryGroups(newGroups);
  };

  const handleOperatorChange = (index: number) => {
    const newGroups = [...queryGroups];
    newGroups[index].operator = newGroups[index].operator === 'AND' ? 'OR' : 'AND';
    setQueryGroups(newGroups);
  };

  const handleTermsChange = (groupIndex: number, newTerms: string[]) => {
    const newGroups = [...queryGroups];
    newGroups[groupIndex].terms = newTerms.map(term => ({
      value: term,
      operator: 'AND' as Operator
    }));
    setQueryGroups(newGroups);
  };

  const handleTermOperatorChange = (groupIndex: number, termIndex: number) => {
    const newGroups = [...queryGroups];
    const currentOperator = newGroups[groupIndex].terms[termIndex].operator;
    const nextOperator: Operator = currentOperator === 'AND' ? 'NOT' : currentOperator === 'NOT' ? 'OR' : 'AND';
    newGroups[groupIndex].terms[termIndex].operator = nextOperator;
    setQueryGroups(newGroups);
  };

  const handleParenthesesToggle = (index: number) => {
    const newGroups = [...queryGroups];
    newGroups[index].parentheses = !newGroups[index].parentheses;
    setQueryGroups(newGroups);
  };

  const handleSaveTemplate = () => {
    if (!templateName) return;
    
    const template: QueryTemplate = {
      id: Date.now().toString(),
      name: templateName,
      groups: queryGroups,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    dispatch(saveTemplate(template));
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setTemplateName('');
      setQueryGroups([{ operator: 'AND', terms: [], parentheses: false }]);
    }, 2000);
  };

  const handleSkillSearch = async (value: string) => {
    setCurrentInput(value);
    if (value.length >= 2) {
      dispatch(fetchSkillSuggestions(value));
      dispatch(fetchDidYouMean(value));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (groupIndex: number, suggestion: string) => {
    const newGroups = [...queryGroups];
    newGroups[groupIndex].terms.push({
      value: suggestion,
      operator: 'AND'
    });
    setQueryGroups(newGroups);
    setShowSuggestions(false);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            onClick={() => navigate('/templates')}
            sx={{ 
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Boolean Search Builder
          </Typography>
        </Stack>
      </Stack>
      
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter a name for your search template"
            variant="outlined"
          />
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveTemplate}
            disabled={!templateName || queryGroups.every(g => g.terms.length === 0)}
            sx={{
              height: 48,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Save Template
          </Button>
        </Stack>
      </Paper>

      {showSaveSuccess && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
          }}
        >
          Template saved successfully!
        </Alert>
      )}

      <Stack spacing={2}>
        {queryGroups.map((group, groupIndex) => (
          <Card 
            key={groupIndex} 
            sx={{ 
              borderRadius: 2,
              '&:hover': {
                boxShadow: (theme) => theme.shadows[4],
              },
              transition: 'box-shadow 0.2s',
              border: (theme) => group.parentheses ? `2px solid ${theme.palette.primary.main}` : 'none',
            }}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      onClick={() => handleOperatorChange(groupIndex)}
                      aria-label={`Toggle operator ${group.operator}`}
                      sx={{
                        minWidth: 80,
                        backgroundColor: (theme) => 
                          group.operator === 'AND' 
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.secondary.main, 0.1),
                        color: (theme) =>
                          group.operator === 'AND'
                            ? theme.palette.primary.main
                            : theme.palette.secondary.main,
                        '&:hover': {
                          backgroundColor: (theme) =>
                            group.operator === 'AND'
                              ? alpha(theme.palette.primary.main, 0.2)
                              : alpha(theme.palette.secondary.main, 0.2),
                        },
                      }}
                    >
                      {group.operator}
                    </Button>
                    <Tooltip title="Toggle parentheses">
                      <IconButton
                        onClick={() => handleParenthesesToggle(groupIndex)}
                        sx={{
                          color: group.parentheses ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        <ParenthesesIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>
                <Grid item xs>
                  <Box position="relative">
                    <Autocomplete
                      multiple
                      options={[]}
                      value={group.terms.map(term => term.value)}
                      onChange={(_, newValue) => handleTermsChange(groupIndex, newValue)}
                      onInputChange={(_, value) => handleSkillSearch(value)}
                      filterOptions={(x) => x}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Add skills or keywords"
                          placeholder="Type to search..."
                          variant="outlined"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, termIndex) => {
                          const tagProps = getTagProps({ index: termIndex });
                          const term = group.terms[termIndex];
                          return (
                            <Chip
                              {...tagProps}
                              label={`${term.operator === 'NOT' ? 'NOT ' : ''}${option}`}
                              color={term.operator === 'NOT' ? 'error' : group.operator === 'AND' ? 'primary' : 'secondary'}
                              onClick={() => handleTermOperatorChange(groupIndex, termIndex)}
                            />
                          );
                        })
                      }
                    />
                    
                    {showSuggestions && currentInput.length >= 2 && (
                      <Paper
                        sx={{
                          position: 'absolute',
                          width: '100%',
                          mt: 1,
                          zIndex: 1000,
                          maxHeight: 400,
                          overflow: 'auto',
                        }}
                      >
                        {loading ? (
                          <Box p={2} display="flex" justifyContent="center">
                            <CircularProgress size={20} />
                          </Box>
                        ) : (
                          <>
                            {didYouMean.length > 0 && (
                              <Box p={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Did you mean:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {didYouMean.map((suggestion) => (
                                    <Chip
                                      key={suggestion}
                                      label={suggestion}
                                      size="small"
                                      onClick={() => handleSuggestionClick(groupIndex, suggestion)}
                                      sx={{ m: 0.5 }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                            
                            {synonyms.length > 0 && (
                              <Box p={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Synonyms:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {synonyms.map((synonym) => (
                                    <Chip
                                      key={synonym}
                                      label={synonym}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      onClick={() => handleSuggestionClick(groupIndex, synonym)}
                                      sx={{ m: 0.5 }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                            
                            {relatedSkills.length > 0 && (
                              <Box p={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Related Skills:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {relatedSkills.map((skill) => (
                                    <Chip
                                      key={skill}
                                      label={skill}
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                      onClick={() => handleSuggestionClick(groupIndex, skill)}
                                      sx={{ m: 0.5 }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </>
                        )}
                      </Paper>
                    )}
                  </Box>
                </Grid>
                <Grid item>
                  <IconButton
                    onClick={() => handleRemoveGroup(groupIndex)}
                    disabled={queryGroups.length === 1}
                    aria-label="Remove search group"
                    sx={{
                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2),
                      },
                      '&.Mui-disabled': {
                        backgroundColor: (theme) => theme.palette.action.disabledBackground,
                      },
                    }}
                  >
                    <RemoveIcon color="error" />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddGroup}
        sx={{ 
          mt: 2,
          borderStyle: 'dashed',
          borderWidth: 2,
          textTransform: 'none',
          fontSize: '1rem',
          height: 48,
        }}
        aria-label="Add new search group"
      >
        Add Group
      </Button>
    </Box>
  );
};

export default BooleanSearch; 