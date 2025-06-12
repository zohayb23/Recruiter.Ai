import React from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  Build as BuildIcon,
  CheckCircleOutline as CheckIcon,
} from '@mui/icons-material';

interface SearchTipsProps {
  type: 'fulltext' | 'semantic' | 'skills' | 'combined';
  onClose?: () => void;
}

const SearchTips: React.FC<SearchTipsProps> = ({ type, onClose }) => {
  const getTipsContent = () => {
    switch (type) {
      case 'fulltext':
        return {
          title: 'Full Text Search Tips',
          icon: <SearchIcon />,
          tips: [
            {
              title: 'Boolean Operators',
              items: [
                'Use AND to require all terms: "java AND python"',
                'Use OR for alternatives: "react OR angular"',
                'Use NOT to exclude: "developer NOT junior"',
                'Group with parentheses: "(java OR python) AND developer"'
              ]
            },
            {
              title: 'Exact Phrases',
              items: [
                'Use quotes for exact matches: "project manager"',
                'Combine with operators: "software engineer" AND "5 years experience"'
              ]
            },
            {
              title: 'Special Features',
              items: [
                'Wildcard searches: develop* matches developer, developing, etc.',
                'Fuzzy matching: automatically handles minor typos',
                'Results are ranked by relevance and term frequency'
              ]
            }
          ]
        };

      case 'semantic':
        return {
          title: 'Semantic Search Tips',
          icon: <PsychologyIcon />,
          tips: [
            {
              title: 'Natural Language',
              items: [
                'Use natural language descriptions',
                'Describe the role or skills you need',
                'Include context and requirements',
                'Example: "experienced backend developer with cloud infrastructure knowledge"'
              ]
            },
            {
              title: 'Context Awareness',
              items: [
                'Understands synonyms and related concepts',
                'Recognizes skill relationships',
                'Considers industry context',
                'Matches based on meaning, not just keywords'
              ]
            },
            {
              title: 'Best Practices',
              items: [
                'Be specific about requirements',
                'Include level of expertise needed',
                'Mention relevant technologies',
                'Add important soft skills'
              ]
            }
          ]
        };

      case 'skills':
        return {
          title: 'Skills Search Tips',
          icon: <BuildIcon />,
          tips: [
            {
              title: 'Skills Matching',
              items: [
                'Enter specific technical skills',
                'Skills are matched exactly against resumes',
                'Results show skill match percentage',
                'Skills are weighted equally in scoring'
              ]
            },
            {
              title: 'Best Practices',
              items: [
                'Use standard skill names (e.g., "JavaScript" not "JS")',
                'Add related technologies for better matches',
                'Consider both broad and specific skills',
                'Remove skills to broaden search if needed'
              ]
            },
            {
              title: 'Results Analysis',
              items: [
                'Check matched skills in results',
                'Review experience with each skill',
                'Consider overall match percentage',
                'Look for skill combinations'
              ]
            }
          ]
        };

      case 'combined':
        return {
          title: 'Combined Search Tips',
          icon: <CodeIcon />,
          tips: [
            {
              title: 'Search Types',
              items: [
                'Full Text: Matches specific keywords and phrases',
                'Semantic: Understands context and meaning',
                'Skills: Matches technical requirements',
                'Adjust weights to prioritize search types'
              ]
            },
            {
              title: 'Query Structure',
              items: [
                'Include key requirements and skills',
                'Use natural language descriptions',
                'Add specific technical terms',
                'Combine with boolean operators for precision'
              ]
            },
            {
              title: 'Results Optimization',
              items: [
                'Results combine scores from all search types',
                'Higher weights increase search type importance',
                'Review individual match scores',
                'Adjust search parameters for better results'
              ]
            }
          ]
        };

      default:
        return {
          title: 'Search Tips',
          icon: <SearchIcon />,
          tips: []
        };
    }
  };

  const content = getTipsContent();

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {content.icon}
          <Typography variant="h6" color="primary.main">
            {content.title}
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {content.tips.map((section, index) => (
        <Box key={index} mb={2}>
          <Typography variant="subtitle1" color="primary.dark" gutterBottom>
            {section.title}
          </Typography>
          <List dense>
            {section.items.map((item, itemIndex) => (
              <ListItem key={itemIndex}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={item}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.primary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Paper>
  );
};

export default SearchTips; 