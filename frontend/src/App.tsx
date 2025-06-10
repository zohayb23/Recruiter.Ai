import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Layout from './components/Layout';
import BooleanSearch from './pages/BooleanSearch';
import Templates from './pages/Templates';
import FullTextSearch from './pages/FullTextSearch';
import DenseSearch from './pages/DenseSearch';
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
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<BooleanSearch />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/fulltext" element={<FullTextSearch />} />
              <Route path="/semantic" element={<DenseSearch />} />
              <Route path="/skills" element={<SkillsRating />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App; 