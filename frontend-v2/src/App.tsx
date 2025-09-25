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
import CandidateScoringPage from './pages/CandidateScoringPage';
import DuplicateDetectionPage from './pages/DuplicateDetectionPage';
import GapAnalysisPage from './pages/GapAnalysisPage';
import SemanticSearchPage from './pages/SemanticSearchPage';
import PipelineCRMPage from './pages/PipelineCRMPage';
import MassMailingPage from './pages/MassMailingPage';
import ABTestingPage from './pages/ABTestingPage';
import SegmentationPage from './pages/SegmentationPage';
import AutomationPage from './pages/AutomationPage';

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
              <Route path="/candidates/scoring" element={<CandidateScoringPage />} />
              
              {/* Duplicate Detection Route */}
              <Route path="/duplicates" element={<DuplicateDetectionPage />} />
              
              {/* Resume Parser Route */}
              <Route path="/resume-parser" element={<ResumeParserPage />} />
              
              {/* Gap Analysis Route */}
              <Route path="/gap-analysis" element={<GapAnalysisPage />} />
              
              {/* Semantic Search Route */}
              <Route path="/semantic-search" element={<SemanticSearchPage />} />
              
              {/* Pipeline CRM Route */}
              <Route path="/pipeline-crm" element={<PipelineCRMPage />} />
              
              {/* Mass Mailing Route */}
              <Route path="/mass-mailing" element={<MassMailingPage />} />
            <Route path="/ab-testing" element={<ABTestingPage />} />
            <Route path="/segmentation" element={<SegmentationPage />} />
            <Route path="/automation" element={<AutomationPage />} />
              
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
