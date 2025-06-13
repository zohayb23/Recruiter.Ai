import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Paper,
  Button,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Code as ParenthesesIcon,
  NotInterested as NotIcon,
} from '@mui/icons-material';
import { QueryGroup, QueryTerm } from '../types';

interface BooleanQueryBuilderProps {
  groups: QueryGroup[];
  onGroupsChange: (groups: QueryGroup[]) => void;
  onAddGroup: () => void;
  onRemoveGroup: (index: number) => void;
}

const BooleanQueryBuilder: React.FC<BooleanQueryBuilderProps> = ({
  groups,
  onGroupsChange,
  onAddGroup,
  onRemoveGroup,
}) => {
  const handleOperatorChange = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].operator = newGroups[groupIndex].operator === 'AND' ? 'OR' : 'AND';
    onGroupsChange(newGroups);
  };

  const handleTermOperatorChange = (groupIndex: number, termIndex: number) => {
    const newGroups = [...groups];
    const currentOperator = newGroups[groupIndex].terms[termIndex].operator;
    const nextOperator = currentOperator === 'AND' ? 'NOT' : currentOperator === 'NOT' ? 'OR' : 'AND';
    newGroups[groupIndex].terms[termIndex].operator = nextOperator;
    onGroupsChange(newGroups);
  };

  const handleParenthesesToggle = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].parentheses = !newGroups[groupIndex].parentheses;
    onGroupsChange(newGroups);
  };

  const getTermColor = (term: QueryTerm, groupOperator: string) => {
    switch (term.operator) {
      case 'NOT':
        return 'error';
      case 'OR':
        return 'secondary';
      default:
        return groupOperator === 'AND' ? 'primary' : 'secondary';
    }
  };

  return (
    <Stack spacing={2}>
      {groups.map((group, groupIndex) => (
        <Paper
          key={groupIndex}
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 2,
            border: (theme) => group.parentheses
              ? `2px solid ${theme.palette.primary.main}`
              : '1px solid ' + theme.palette.divider,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 3,
              borderColor: (theme) => group.parentheses
                ? theme.palette.primary.main
                : theme.palette.action.hover,
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOperatorChange(groupIndex)}
              sx={{
                minWidth: 60,
                borderRadius: 2,
                color: (theme) => group.operator === 'AND'
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
                borderColor: (theme) => group.operator === 'AND'
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
                '&:hover': {
                  backgroundColor: (theme) => alpha(
                    group.operator === 'AND'
                      ? theme.palette.primary.main
                      : theme.palette.secondary.main,
                    0.1
                  ),
                },
              }}
            >
              {group.operator}
            </Button>

            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flex: 1 }}>
              {group.terms.map((term, termIndex) => (
                <Chip
                  key={`${termIndex}-${term.value}`}
                  label={`${term.operator === 'NOT' ? 'NOT ' : ''}${term.value}`}
                  color={getTermColor(term, group.operator)}
                  onClick={() => handleTermOperatorChange(groupIndex, termIndex)}
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    '& .MuiChip-label': {
                      px: 2,
                    },
                  }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Toggle parentheses">
                <IconButton
                  size="small"
                  onClick={() => handleParenthesesToggle(groupIndex)}
                  sx={{
                    color: (theme) => group.parentheses
                      ? theme.palette.primary.main
                      : theme.palette.action.active,
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <ParenthesesIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Remove group">
                <IconButton
                  size="small"
                  onClick={() => onRemoveGroup(groupIndex)}
                  disabled={groups.length === 1}
                  sx={{
                    color: (theme) => theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  <RemoveIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onAddGroup}
        sx={{
          alignSelf: 'flex-start',
          borderStyle: 'dashed',
          borderRadius: 2,
          px: 3,
          py: 1,
        }}
      >
        Add Group
      </Button>
    </Stack>
  );
};

export default BooleanQueryBuilder; 