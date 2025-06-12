import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Layout from './components/Layout';
import CombinedSearch from './pages/CombinedSearch';
import FullTextSearch from './pages/FullTextSearch';
import SemanticSearch from './pages/SemanticSearch';
import SkillsRating from './pages/SkillsRating';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
  },
});

const NavButton = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Button
      component={Link}
      to={to}
      color="inherit"
      sx={{
        px: 3,
        py: 2,
        borderBottom: isActive ? '3px solid white' : '3px solid transparent',
        borderRadius: 0,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderBottom: isActive ? '3px solid white' : '3px solid rgba(255, 255, 255, 0.5)',
        },
      }}
    >
      {children}
    </Button>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" elevation={0}>
              <Container maxWidth={false}>
                <Toolbar disableGutters sx={{ height: 64 }}>
                  <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{
                      color: 'white',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                      mr: 4,
                    }}
                  >
                    Recruiter.AI
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <NavButton to="/combined">Combined Search</NavButton>
                    <NavButton to="/fulltext">Full Text</NavButton>
                    <NavButton to="/semantic">Semantic</NavButton>
                    <NavButton to="/skills">Skills</NavButton>
                  </Box>
                </Toolbar>
              </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={<CombinedSearch />} />
                <Route path="/combined" element={<CombinedSearch />} />
                <Route path="/fulltext" element={<FullTextSearch />} />
                <Route path="/semantic" element={<SemanticSearch />} />
                <Route path="/skills" element={<SkillsRating />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App; 