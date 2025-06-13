import React from 'react';
import {
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Code as BooleanIcon,
  Psychology as SemanticIcon,
  Assessment as SkillsIcon,
  CompareArrows as CombinedIcon,
} from '@mui/icons-material';

interface SearchTipsProps {
  type: 'fulltext' | 'semantic' | 'skills' | 'combined' | 'boolean';
  onClose: () => void;
}

const SearchTips: React.FC<SearchTipsProps> = ({ type, onClose }) => {
  const getTipsContent = () => {
    switch (type) {
      case 'boolean':
        return {
          title: 'Boolean Search Tips',
          icon: <BooleanIcon />,
          tips: [
            {
              title: 'Basic Operators',
              items: [
                'Click on terms to toggle between AND, OR, NOT operators',
                'Group terms together using parentheses',
                'Use AND for required matches: "java AND spring"',
                'Use OR for alternatives: "react OR angular"',
                'Use NOT to exclude: "developer NOT junior"'
              ]
            },
            {
              title: 'Advanced Features',
              items: [
                'Create multiple search groups for complex queries',
                'Save searches as reusable templates',
                'Combine operators: "(java OR python) AND (react OR angular)"',
                'Use skill suggestions for accurate matching'
              ]
            },
            {
              title: 'Best Practices',
              items: [
                'Start with broad terms, then refine with operators',
                'Group related skills together',
                'Use templates for common job roles',
                'Consider synonyms and variations of terms'
              ]
            }
          ]
        };
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
          icon: <SemanticIcon />,
          tips: [
            {
              title: 'Natural Language',
              items: [
                'Use natural language descriptions',
                'Include key skills and requirements',
                'Describe the role or experience level',
                'Add industry-specific terms'
              ]
            },
            {
              title: 'Context Awareness',
              items: [
                'Results match meaning, not just exact words',
                'Handles synonyms and related concepts',
                'Understands skill relationships',
                'Considers experience context'
              ]
            }
          ]
        };
      case 'skills':
        return {
          title: 'Skills Rating Tips',
          icon: <SkillsIcon />,
          tips: [
            {
              title: 'Skill Assessment',
              items: [
                'List required skills in order of importance',
                'Specify experience levels when relevant',
                'Include both technical and soft skills',
                'Consider related technologies'
              ]
            },
            {
              title: 'Rating System',
              items: [
                'Scores are based on skill mentions and context',
                'Higher weights for recent experience',
                'Considers skill relationships',
                'Evaluates project implementations'
              ]
            }
          ]
        };
      case 'combined':
      default:
        return {
          title: 'Combined Search Tips',
          icon: <CombinedIcon />,
          tips: [
            {
              title: 'Search Types',
              items: [
                'Full Text: Exact keyword matching',
                'Semantic: Meaning-based matching',
                'Skills: Experience-focused matching',
                'Adjust weights to customize results'
              ]
            },
            {
              title: 'Best Results',
              items: [
                'Use specific technical terms',
                'Include role requirements',
                'Specify experience levels',
                'Consider industry context'
              ]
            }
          ]
        };
    }
  };

  const content = getTipsContent();

  return (
    <Paper sx={{ p: 3, mb: 4, position: 'relative' }}>
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {content.icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {content.title}
        </Typography>
      </Box>

      <List>
        {content.tips.map((section, index) => (
          <React.Fragment key={section.title}>
            {index > 0 && <Divider sx={{ my: 1 }} />}
            <ListItem sx={{ display: 'block' }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {section.title}
              </Typography>
              <List dense>
                {section.items.map((item, itemIndex) => (
                  <ListItem key={itemIndex}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SearchTips; 