import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Alert,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchResultComponent from '../components/SearchResult';
import ResultsPagination from '../components/ResultsPagination';
import { SearchResultItem } from '../types/search';
import SearchResult from '../components/SearchResult';

interface SearchPayload {
  query: string;
  top_k: number;
  terms?: string[];
}

const DenseSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [useBooleanLogic, setUseBooleanLogic] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setPage(1);

    try {
      const endpoint = useBooleanLogic ? 'boolean' : 'semantic';
      const payload: SearchPayload = {
        query: query.trim(),
        top_k: rowsPerPage
      };

      if (useBooleanLogic) {
        // Parse the boolean expression into components
        payload.terms = query.trim().split(/\s+/);
      }

      console.log('Search request:', { endpoint, payload }); // Debug log

      const response = await fetch(`http://localhost:8001/api/search/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Semantic search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Get paginated results
  const paginatedResults = results.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Semantic Search
          </Typography>
          <Tooltip title="Learn how matching works">
            <IconButton size="small" sx={{ ml: 2 }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {useBooleanLogic ? (
                "Boolean search allows complex queries using AND, OR, NOT operators. Results are matched exactly based on the boolean expression."
              ) : (
                "Semantic search understands the meaning of your query and matches resumes based on:"
              )}
            </Typography>
            {!useBooleanLogic && (
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Contextual understanding (matches similar concepts)</li>
                <li>Skill relevance (matches related technologies and skills)</li>
                <li>Experience alignment (matches relevant job roles and responsibilities)</li>
                <li>Overall profile fit (considers the entire resume context)</li>
              </Box>
            )}
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={useBooleanLogic}
                onChange={(e) => {
                  setUseBooleanLogic(e.target.checked);
                  setResults([]);
                  setError(null);
                }}
              />
            }
            label="Use Boolean Logic"
            sx={{ mb: 2 }}
          />

          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Search Query"
              variant="outlined"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                useBooleanLogic
                  ? "Example: java AND (python OR javascript) NOT php"
                  : "Describe the role or skills you're looking for..."
              }
              multiline={useBooleanLogic}
              rows={useBooleanLogic ? 2 : 1}
              helperText={useBooleanLogic ? "Use AND, OR, NOT operators and parentheses () for complex queries" : ""}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              sx={{ px: 4 }}
            >
              Search
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">
                Found {results.length} {useBooleanLogic ? "matching" : "semantically similar"} resumes
              </Typography>
            </Box>

            {paginatedResults.map((result, index) => (
              <SearchResult
                key={`${result.filename}-${index}`}
                result={result}
                onView={() => {
                  // Handle view action
                  console.log('View resume:', result.filename);
                }}
                onDetails={() => {
                  // Handle details action
                  console.log('Show details:', result.filename);
                }}
              />
            ))}

            <ResultsPagination
              count={results.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}

        {!loading && results.length === 0 && query.trim() && (
          <Alert severity="info">
            No results found for your search query.
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default DenseSearch; 