import { createTheme, alpha } from '@mui/material/styles';

// Color palette
const primary = {
  main: '#1976d2',
  light: '#42a5f5',
  dark: '#1565c0',
  contrastText: '#ffffff',
};

const secondary = {
  main: '#64748B',
  light: '#94A3B8',
  dark: '#475569',
  contrastText: '#ffffff',
};

const success = {
  main: '#10B981',
  light: '#34D399',
  dark: '#059669',
  contrastText: '#ffffff',
};

const error = {
  main: '#EF4444',
  light: '#F87171',
  dark: '#DC2626',
  contrastText: '#ffffff',
};

const warning = {
  main: '#F59E0B',
  light: '#FBBF24',
  dark: '#D97706',
  contrastText: '#ffffff',
};

const info = {
  main: '#3B82F6',
  light: '#60A5FA',
  dark: '#2563EB',
  contrastText: '#ffffff',
};

// Create theme
const theme = createTheme({
  palette: {
    primary,
    secondary,
    success,
    error,
    warning,
    info,
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2027',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.05)',
    '0px 8px 16px rgba(0,0,0,0.05)',
    '0px 16px 24px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
    '0px 24px 32px rgba(0,0,0,0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 4px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
            },
            '&.Mui-focused': {
              boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme; 