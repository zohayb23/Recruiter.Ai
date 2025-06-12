import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import SearchResult from '../components/SearchResult';
import SearchTips from '../components/SearchTips';
import ResultsPagination from '../components/ResultsPagination';
import { SearchResultItem } from '../types/search';

interface RawSearchResult {
  filename?: string;
  name?: string;
  content?: string;
  summary?: string;
  experience?: string;
  skills?: string[];
  location?: string;
  email?: string;
  phone?: string;
  score?: number;
  match_details?: {
    skills_score?: number;
    experience_score?: number;
  };
}

const SemanticSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showTips, setShowTips] = useState(true);

  const processSearchResult = (rawResult: RawSearchResult): SearchResultItem => {
    return {
      filename: rawResult.filename || '',
      name: rawResult.name || rawResult.filename?.replace(/\.[^/.]+$/, '') || 'Unknown',
      summary: rawResult.summary || rawResult.content?.substring(0, 200) || 'No summary available',
      experience: rawResult.experience || '',
      skills: Array.isArray(rawResult.skills) ? rawResult.skills : [],
      location: rawResult.location || '',
      email: rawResult.email || '',
      phone: rawResult.phone || '',
      scores: {
        overall: rawResult.score ? Math.round(rawResult.score * 100) : 0,
        skills: rawResult.match_details?.skills_score ? Math.round(rawResult.match_details.skills_score * 100) : 0,
        experience: rawResult.match_details?.experience_score ? Math.round(rawResult.match_details.experience_score * 100) : 0,
      }
    };
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setPage(1);

    try {
      const response = await fetch('http://localhost:8001/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          top_k: rowsPerPage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Search failed');
      }

      const data = await response.json();
      
      const processedResults = (data.results || [])
        .map((result: RawSearchResult) => processSearchResult(result))
        .filter((result: SearchResultItem) => result.filename);

      const sortedResults = processedResults.sort((a: SearchResultItem, b: SearchResultItem) => 
        (b.scores?.overall || 0) - (a.scores?.overall || 0)
      );

      setResults(sortedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8001/api/resume/${filename}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch resume');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing resume:', err);
      setError('Failed to open resume. Please try again.');
    }
  };

  const handleViewDetails = (result: SearchResultItem) => {
    console.log('Viewing details for:', result.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const paginatedResults = results.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: '100%' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Semantic Search
          </Typography>
          <Tooltip title="Toggle search tips">
            <IconButton size="small" sx={{ ml: 2 }} onClick={() => setShowTips(!showTips)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search Tips */}
        {showTips && (
          <SearchTips type="semantic" onClose={() => setShowTips(false)} />
        )}

        {/* Search Input */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Search Query"
              variant="outlined"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the ideal candidate (e.g., 'experienced backend developer with cloud infrastructure knowledge')"
              multiline
              rows={2}
              sx={{ bgcolor: 'white' }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ px: 4, alignSelf: 'stretch' }}
            >
              Search
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Box>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Showing {paginatedResults.length} of {results.length} results
            </Typography>
            
            <Box mt={3}>
              {paginatedResults.map((result, index) => (
                <SearchResult
                  key={`${result.filename}-${index}`}
                  result={result}
                  onView={() => handleViewResume(result.filename)}
                  onDetails={() => handleViewDetails(result)}
                />
              ))}
            </Box>

            <Box mt={3} display="flex" justifyContent="center">
              <ResultsPagination
                count={results.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(newPage) => setPage(newPage)}
                onRowsPerPageChange={(newRowsPerPage) => {
                  setRowsPerPage(newRowsPerPage);
                  setPage(1);
                }}
              />
            </Box>
          </Box>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && query.trim() && (
          <Alert severity="info">
            No matching resumes found. Try adjusting your description.
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default SemanticSearch; 