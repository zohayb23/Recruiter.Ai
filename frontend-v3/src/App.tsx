import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ResumeParsingPage from './pages/ResumeParsingPage';
import JobCreationPage from './pages/JobCreationPage';
import JobListingsPage from './pages/JobListingsPage';
import CandidatesPage from './pages/CandidatesPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
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

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Overview';
      case 'resume-parsing':
        return 'Resume Parser';
      case 'job-creation':
        return 'Create Job';
      case 'job-listings':
        return 'Job Listings';
      case 'external-jobs':
        return 'External Jobs';
      case 'candidates':
        return 'Candidates';
      case 'candidate-profile':
        return 'Candidate Profile';
      case 'pipeline-crm':
        return 'Pipeline CRM';
      case 'candidate-scoring':
        return 'Candidate Scoring';
      case 'duplicate-detection':
        return 'Duplicate Detection';
      case 'gap-analysis':
        return 'Gap Analysis';
      case 'mailing':
        return 'Mass Mailing';
      case 'ab-testing':
        return 'A/B Testing';
      case 'segmentation':
        return 'Segmentation';
      case 'automation':
        return 'Automation';
      case 'crm':
        return 'CRM Pipeline';
      case 'semantic-search':
        return 'Semantic Search';
      case 'keyword-generator':
        return 'Keyword Generator';
      case 'enhanced-search':
        return 'Enhanced Search';
      case 'milvus-database':
        return 'Milvus Database';
      default:
        return 'Recruiter.AI';
    }
  };

  const getPageSubtitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Welcome to your recruitment dashboard';
      case 'resume-parsing':
        return 'AI-powered resume parsing and analysis';
      case 'job-creation':
        return 'Create job postings with AI assistance';
      case 'job-listings':
        return 'Manage and track your job postings';
      case 'external-jobs':
        return 'Manage job postings across external platforms';
      case 'candidates':
        return 'Track and manage candidate profiles';
      case 'candidate-profile':
        return 'Detailed candidate profile and assessment';
      case 'pipeline-crm':
        return 'Manage candidate pipeline stages and track progress';
      case 'candidate-scoring':
        return 'AI-powered candidate evaluation and scoring';
      case 'duplicate-detection':
        return 'Identify and manage duplicate candidate profiles';
      case 'gap-analysis':
        return 'Analyze candidate skill and experience gaps';
      case 'mailing':
        return 'Create and manage email campaigns';
      case 'ab-testing':
        return 'Optimize email campaigns with data-driven testing';
      case 'segmentation':
        return 'Create and manage candidate segments for targeted campaigns';
      case 'automation':
        return 'Create automated workflows for candidate engagement';
      case 'crm':
        return 'Pipeline management and candidate tracking';
      case 'semantic-search':
        return 'AI-powered resume and job search';
      case 'keyword-generator':
        return 'Generate and manage job posting keywords for better visibility';
      case 'enhanced-search':
        return 'AI-powered search across candidates, jobs, and companies';
      case 'milvus-database':
        return 'Direct access to your GCP Milvus vector database';
      default:
        return '';
    }
  };

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} />;
      case 'resume-parsing':
        return <ResumeParsingPage />;
      case 'job-creation':
        return <JobCreationPage />;
      case 'job-listings':
        return <JobListingsPage />;
      case 'external-jobs':
        return <ExternalJobsPage />;
      case 'candidates':
        return <CandidatesPage onNavigate={setActivePage} />;
      case 'candidate-profile':
        return <CandidateProfilePage />;
      case 'pipeline-crm':
        return <PipelineCRMPage />;
      case 'candidate-scoring':
        return <CandidateScoringPage />;
      case 'duplicate-detection':
        return <DuplicateDetectionPage />;
      case 'gap-analysis':
        return <GapAnalysisPage />;
      case 'mailing':
        return <MassMailingPage />;
      case 'ab-testing':
        return <ABTestingPage />;
      case 'segmentation':
        return <SegmentationPage />;
      case 'automation':
        return <AutomationPage />;
      case 'crm':
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">CRM Pipeline</h2>
              <p className="text-gray-600">Pipeline management features coming soon...</p>
            </div>
          </div>
        );
      case 'semantic-search':
        return <SemanticSearchPage />;
      case 'keyword-generator':
        return <KeywordGeneratorPage />;
      case 'enhanced-search':
        return <EnhancedSearchPage />;
      case 'milvus-database':
        return <MilvusDatabasePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onPageChange={setActivePage}
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
    >
      {renderPageContent()}
    </Layout>
  );
}

export default App;