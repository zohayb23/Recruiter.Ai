import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Grid,
  LinearProgress,
  Divider,
  Button,
  styled,
  Paper,
  Avatar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  LinkedIn as LinkedInIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { SearchResultItem } from '../types/search';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: '1px solid',
  borderColor: theme.palette.divider,
  '&:hover': {
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const SkillChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '&.matched': {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  '&.missing': {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
}));

const ScoreIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ExpandButton = styled(IconButton)<{ expanded: boolean }>(({ expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: 'transform 0.3s',
}));

interface SearchResultProps {
  result: SearchResultItem;
  onView: () => void;
  onDetails: () => void;
}

const SearchResult: React.FC<SearchResultProps> = ({ result, onView, onDetails }) => {
  const [expanded, setExpanded] = useState(false);

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  // Format score for display
  const formatScore = (score: number | undefined) => {
    if (score === undefined) return 'N/A';
    return `${Math.round(score)}%`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {result.name}
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
            {result.email && (
              <Box display="flex" alignItems="center">
                <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {result.email}
                </Typography>
              </Box>
            )}
            
            {result.phone && (
              <Box display="flex" alignItems="center">
                <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {result.phone}
                </Typography>
              </Box>
            )}
            
            {result.location && (
              <Box display="flex" alignItems="center">
                <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {result.location}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={onDetails}
            size="small"
          >
            Details
          </Button>
          <Button
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={onView}
            size="small"
          >
            View Resume
          </Button>
        </Box>
      </Box>

      <Typography variant="body1" paragraph sx={{ color: 'text.primary' }}>
        {result.summary}
      </Typography>

      {result.skills && result.skills.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {result.skills.map((skill, index) => (
            <Chip
              key={`${skill}-${index}`}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
          Match Scores
        </Typography>
        
        <Stack spacing={1}>
          {result.scores?.overall !== undefined && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Overall Match</Typography>
                <Typography variant="body2" sx={{ color: getScoreColor(result.scores.overall) }}>
                  {formatScore(result.scores.overall)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.scores.overall}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getScoreColor(result.scores.overall),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}

          {result.scores?.skills !== undefined && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Skills Match</Typography>
                <Typography variant="body2" sx={{ color: getScoreColor(result.scores.skills) }}>
                  {formatScore(result.scores.skills)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.scores.skills}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getScoreColor(result.scores.skills),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}

          {result.scores?.experience !== undefined && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">Experience Match</Typography>
                <Typography variant="body2" sx={{ color: getScoreColor(result.scores.experience) }}>
                  {formatScore(result.scores.experience)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.scores.experience}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getScoreColor(result.scores.experience),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default SearchResult; 