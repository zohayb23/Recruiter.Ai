import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBoxProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  placeholder?: string;
  description?: string;
  toggleOptions?: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  multiline?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  query,
  onQueryChange,
  onSearch,
  loading = false,
  placeholder = 'Enter your search query...',
  description,
  toggleOptions,
  multiline = false,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      onSearch();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      
      {toggleOptions && (
        <FormControlLabel
          control={
            <Switch
              checked={toggleOptions.checked}
              onChange={(e) => toggleOptions.onChange(e.target.checked)}
            />
          }
          label={toggleOptions.label}
          sx={{ mb: 2 }}
        />
      )}

      <Box display="flex" gap={2}>
        <TextField
          fullWidth
          label="Search Query"
          variant="outlined"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          multiline={multiline}
          rows={multiline ? 3 : 1}
          sx={{ bgcolor: 'background.paper' }}
        />
        <Button
          variant="contained"
          onClick={onSearch}
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          sx={{
            px: 4,
            minWidth: '120px',
            alignSelf: multiline ? 'stretch' : 'center'
          }}
        >
          Search
        </Button>
      </Box>
    </Paper>
  );
};

export default SearchBox; 