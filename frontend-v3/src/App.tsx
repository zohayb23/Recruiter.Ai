import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import ResumeParsingPage from './pages/ResumeParsingPage';
import JobCreationPage from './pages/JobCreationPage';
import JobListingsPage from './pages/JobListingsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import CandidatesPage from './pages/CandidatesPage';
import CandidateDetailsPage from './pages/CandidateDetailsPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidateChatPage from './pages/CandidateChatPage';
import PipelineCRMPage from './pages/PipelineCRMPage';
import MassMailingPage from './pages/MassMailingPage';
import ABTestingPage from './pages/ABTestingPage';
import SegmentationPage from './pages/SegmentationPage';
import AutomationPage from './pages/AutomationPage';
import ExternalJobsPage from './pages/ExternalJobsPage';
import CandidateScoringPage from './pages/CandidateScoringPage';
import DuplicateDetectionPage from './pages/DuplicateDetectionPage';
import GapAnalysisPage from './pages/GapAnalysisPage';
import KeywordGeneratorPage from './pages/KeywordGeneratorPage';
import EnhancedSearchPage from './pages/EnhancedSearchPage';
import SemanticSearchPage from './pages/SemanticSearchPage';
import MilvusDatabasePage from './pages/MilvusDatabasePage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// Page title mapping
const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/dashboard': 'Overview',
  '/resume-parsing': 'Resume Parser',
  '/job-creation': 'Create Job',
  '/job-listings': 'Job Listings',
  '/job-details/:jobId': 'Job Details',
  '/external-jobs': 'External Jobs',
  '/candidates': 'Candidates',
  '/candidate-details/:candidateId': 'Candidate Details',
  '/candidate-profile': 'Candidate Profile',
  '/candidate-chat/:candidateId': 'Candidate Chat',
  '/pipeline-crm': 'Pipeline CRM',
  '/candidate-scoring': 'Candidate Scoring',
  '/duplicate-detection': 'Duplicate Detection',
  '/gap-analysis': 'Gap Analysis',
  '/mailing': 'Mass Mailing',
  '/ab-testing': 'A/B Testing',
  '/segmentation': 'Segmentation',
  '/automation': 'Automation',
  '/semantic-search': 'Semantic Search',
  '/keyword-generator': 'Keyword Generator',
  '/analytics': 'Analytics Dashboard',
  '/enhanced-search': 'Enhanced Search',
  '/milvus-database': 'Milvus Database'
};

// Page subtitle mapping
const pageSubtitles: Record<string, string> = {
  '/': 'Welcome to your recruitment dashboard',
  '/dashboard': 'Welcome to your recruitment dashboard',
  '/resume-parsing': 'AI-powered resume parsing and analysis',
  '/job-creation': 'Create job postings with AI assistance',
  '/job-listings': 'Manage and track your job postings',
  '/job-details/:jobId': 'View detailed job posting information',
  '/external-jobs': 'Manage job postings across external platforms',
  '/candidates': 'Track and manage candidate profiles',
  '/candidate-details/:candidateId': 'View detailed candidate information and profile',
  '/candidate-profile': 'Detailed candidate profile and assessment',
  '/candidate-chat/:candidateId': 'AI-powered candidate conversation and assessment',
  '/pipeline-crm': 'Manage candidate pipeline stages and track progress',
  '/candidate-scoring': 'AI-powered candidate evaluation and scoring',
  '/duplicate-detection': 'Identify and manage duplicate candidate profiles',
  '/gap-analysis': 'Analyze candidate skill and experience gaps',
  '/mailing': 'Create and manage email campaigns',
  '/ab-testing': 'Optimize email campaigns with data-driven testing',
  '/segmentation': 'Create and manage candidate segments for targeted campaigns',
  '/automation': 'Create automated workflows for candidate engagement',
  '/semantic-search': 'AI-powered resume and job search',
  '/keyword-generator': 'Generate and manage job posting keywords for better visibility',
  '/enhanced-search': 'AI-powered search across candidates, jobs, and companies',
  '/milvus-database': 'Direct access to your GCP Milvus vector database'
};

// Convert path to page ID for sidebar navigation
const pathToPageId = (pathname: string): string => {
  if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
  return pathname.substring(1).replace(/-/g, '-');
};

// Convert page ID to path for navigation
const pageIdToPath = (pageId: string): string => {
  if (pageId === 'dashboard') return '/dashboard';
  return `/${pageId}`;
};

// Main App Router Component
const AppRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activePage, setActivePage] = useState(() => {
    return pathToPageId(location.pathname);
  });

  // Update active page when route changes
  useEffect(() => {
    setActivePage(pathToPageId(location.pathname));
  }, [location.pathname]);

  // Handle page navigation
  const handlePageChange = (pageId: string) => {
    const path = pageIdToPath(pageId);
    navigate(path);
  };

  // Get current page title and subtitle
  const getPageTitle = () => {
    return pageTitles[location.pathname] || 'Recruiter.AI';
  };

  const getPageSubtitle = () => {
    return pageSubtitles[location.pathname] || '';
  };

  return (
    <Layout
      activePage={activePage}
      onPageChange={handlePageChange}
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
    >
      <Routes>
        <Route path="/" element={<Dashboard onNavigate={handlePageChange} />} />
        <Route path="/dashboard" element={<Dashboard onNavigate={handlePageChange} />} />
        <Route path="/resume-parsing" element={<ResumeParsingPage />} />
        <Route path="/job-creation" element={<JobCreationPage />} />
        <Route path="/job-listings" element={<JobListingsPage />} />
        <Route path="/job-details/:jobId" element={<JobDetailsPage />} />
        <Route path="/external-jobs" element={<ExternalJobsPage />} />
        <Route path="/candidates" element={<CandidatesPage onNavigate={handlePageChange} />} />
        <Route path="/candidate-details/:candidateId" element={<CandidateDetailsPage />} />
        <Route path="/candidate-profile" element={<CandidateProfilePage />} />
        <Route path="/candidate-chat/:candidateId" element={<CandidateChatPage />} />
        <Route path="/pipeline-crm" element={<PipelineCRMPage />} />
        <Route path="/candidate-scoring" element={<CandidateScoringPage />} />
        <Route path="/duplicate-detection" element={<DuplicateDetectionPage />} />
        <Route path="/gap-analysis" element={<GapAnalysisPage />} />
        <Route path="/mailing" element={<MassMailingPage />} />
        <Route path="/ab-testing" element={<ABTestingPage />} />
        <Route path="/segmentation" element={<SegmentationPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/semantic-search" element={<SemanticSearchPage />} />
        <Route path="/keyword-generator" element={<KeywordGeneratorPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/enhanced-search" element={<EnhancedSearchPage />} />
        <Route path="/milvus-database" element={<MilvusDatabasePage />} />
        {/* Fallback route */}
        <Route path="*" element={<Dashboard onNavigate={handlePageChange} />} />
      </Routes>
    </Layout>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppRouter />
      </Router>
    </ErrorBoundary>
  );
}

export default App;