import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface DenseSearchResult {
  filename: string;
  source: string;
  distance: number;
  similarity: number;
}

const DenseSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DenseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.7);
  const [topK, setTopK] = useState(10);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/search/dense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          threshold,
          top_k: topK,
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to perform search');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Semantic Search
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Search Query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Describe the role or skills you're looking for..."
          />
          
          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '50%' }}>
              <Typography gutterBottom>
                Similarity Threshold: {threshold}
              </Typography>
              <Slider
                value={threshold}
                onChange={(_, value) => setThreshold(value as number)}
                min={0}
                max={1}
                step={0.05}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            
            <FormControl sx={{ width: '50%' }}>
              <InputLabel>Results Count</InputLabel>
              <Select
                value={topK}
                label="Results Count"
                onChange={(e) => setTopK(e.target.value as number)}
              >
                <MenuItem value={5}>5 results</MenuItem>
                <MenuItem value={10}>10 results</MenuItem>
                <MenuItem value={20}>20 results</MenuItem>
                <MenuItem value={50}>50 results</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Search
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {results.map((result, index) => (
          <Card key={index}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6" component="div">
                  {result.filename}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={result.source}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`Similarity: ${(result.similarity * 100).toFixed(1)}%`}
                    color="secondary"
                    size="small"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Distance: {result.distance.toFixed(4)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default DenseSearch; 