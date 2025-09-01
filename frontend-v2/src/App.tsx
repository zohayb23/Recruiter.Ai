import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';

// Components
import JobListingsPage from './pages/JobListingsPage';
import JobDetailPage from './pages/JobDetailPage';
import JobMatchingPage from './pages/JobMatchingPage';
import JobMatchingInterface from './components/jobs/JobMatchingInterface';
import CandidatesPage from './pages/CandidatesPage';
import CandidateDetailPage from './components/candidates/CandidateDetailPage';
import ResumeImportPage from './components/candidates/ResumeImportPage';
import BootstrapMainLayout from './components/layout/BootstrapMainLayout';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import BootstrapLoginPage from './components/auth/BootstrapLoginPage';
import ExternalJobsPage from './pages/ExternalJobsPage';

import ResumeParserPage from './pages/ResumeParserPage';
import BootstrapJobCreationForm from './components/jobs/BootstrapJobCreationForm';
import KeywordGeneratorPage from './pages/KeywordGeneratorPage';
import EnhancedSearchPage from './pages/EnhancedSearchPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route element={<BootstrapMainLayout />}>
              {/* Job Routes */}
              <Route path="/jobs" element={<JobListingsPage />} />
              <Route path="/jobs/create" element={<BootstrapJobCreationForm />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/jobs/:id/edit" element={<BootstrapJobCreationForm />} />
              <Route path="/jobs/:id/matches" element={<JobMatchingPage />} />
              <Route path="/jobs/external" element={<ExternalJobsPage />} />
      
              
              {/* Candidate Routes */}
              <Route path="/candidates" element={<CandidatesPage />} />
              <Route path="/candidates/import" element={<ResumeImportPage />} />
              <Route path="/candidates/:id" element={<CandidateDetailPage />} />
              
              {/* Resume Parser Route */}
              <Route path="/resume-parser" element={<ResumeParserPage />} />
              
              {/* Search Utils Routes */}
              <Route path="/keyword-generator" element={<KeywordGeneratorPage />} />
              <Route path="/enhanced-search" element={<EnhancedSearchPage />} />
              
              {/* Analytics Route */}
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              {/* Default Route */}
              <Route path="/" element={<Navigate to="/jobs" replace />} />
              <Route path="*" element={<Navigate to="/jobs" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
