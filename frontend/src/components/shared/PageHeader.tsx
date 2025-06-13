import React from 'react';
import { Box, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface PageHeaderProps {
  title: string;
  onHelpClick?: () => void;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onHelpClick, actions }) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 4 }}
    >
      <Box display="flex" alignItems="center">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          {title}
        </Typography>
        {onHelpClick && (
          <Tooltip title="View help">
            <IconButton size="small" onClick={onHelpClick} sx={{ ml: 2 }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {actions && (
        <Box>
          {actions}
        </Box>
      )}
    </Stack>
  );
};

export default PageHeader; 