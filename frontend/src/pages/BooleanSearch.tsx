import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Autocomplete,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAppDispatch } from '../store/hooks';
import { saveTemplate } from '../store/searchSlice';
import { QueryGroup, QueryTemplate, SearchResultItem } from '../types';
import BooleanQueryBuilder from '../components/BooleanQueryBuilder';
import SearchBox from '../components/shared/SearchBox';
import PageHeader from '../components/shared/PageHeader';
import SearchResult from '../components/SearchResult';
import SearchTips from '../components/SearchTips';

const SAMPLE_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Python', 'Java', 'SQL',
  'Node.js', 'Docker', 'AWS', 'Machine Learning', 'Git', 'CI/CD',
  'Agile', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL',
];

const BooleanSearch: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [queryGroups, setQueryGroups] = useState<QueryGroup[]>([
    { operator: 'AND', terms: [], parentheses: false },
  ]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { template?: QueryTemplate };
    if (state?.template) {
      setQueryGroups(state.template.groups);
      setTemplateName(state.template.name);
    }
  }, [location.state]);

  const handleSearch = async () => {
    if (queryGroups.every(g => g.terms.length === 0)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/search/boolean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terms: queryGroups.flatMap(group => 
            group.parentheses ? ['(', ...group.terms.map(t => t.value), ')'] : group.terms.map(t => t.value)
          ),
          top_k: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName || queryGroups.every(g => g.terms.length === 0)) return;
    
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

  const handleAddGroup = () => {
    setQueryGroups([...queryGroups, { operator: 'AND', terms: [], parentheses: false }]);
  };

  const handleRemoveGroup = (index: number) => {
    const newGroups = queryGroups.filter((_, i) => i !== index);
    setQueryGroups(newGroups);
  };

  const handleSkillSelect = (groupIndex: number, skills: string[]) => {
    const newGroups = [...queryGroups];
    newGroups[groupIndex].terms = skills.map(skill => ({
      value: skill,
      operator: 'AND',
    }));
    setQueryGroups(newGroups);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Boolean Search"
        onHelpClick={() => setShowTips(!showTips)}
      />

      {showTips && (
        <SearchTips type="boolean" onClose={() => setShowTips(false)} />
      )}

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter a name for your search template"
            variant="outlined"
          />

          {queryGroups.map((group, index) => (
            <Box key={index}>
              <Autocomplete
                multiple
                options={SAMPLE_SKILLS}
                value={group.terms.map(term => term.value)}
                onChange={(_, newValue) => handleSkillSelect(index, newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Group ${index + 1} Skills`}
                    placeholder="Type to add skills..."
                  />
                )}
              />
            </Box>
          ))}

          <BooleanQueryBuilder
            groups={queryGroups}
            onGroupsChange={setQueryGroups}
            onAddGroup={handleAddGroup}
            onRemoveGroup={handleRemoveGroup}
          />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || queryGroups.every(g => g.terms.length === 0)}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveTemplate}
              disabled={!templateName || queryGroups.every(g => g.terms.length === 0)}
            >
              Save Template
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {showSaveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Template saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {results.map((result, index) => (
          <SearchResult
            key={`${result.filename}-${index}`}
            result={result}
            onView={() => {}}
            onDetails={() => {}}
          />
        ))}
      </Stack>
    </Container>
  );
};

export default BooleanSearch; 