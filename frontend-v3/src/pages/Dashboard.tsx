import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/apiConfig';
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  Target,
  Send,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  UserCheck,
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react';
import Tooltip from '../components/ui/Tooltip';
import HelpText from '../components/ui/HelpText';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

interface DashboardMetrics {
  totalCandidates: number;
  activeCampaigns: number;
  pipelineStages: {
    applied: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
  };
  campaignStats: {
    totalSent: number;
    openRate: number;
    clickRate: number;
    responseRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'candidate_added' | 'candidate_moved' | 'campaign_sent' | 'template_created';
    message: string;
    timestamp: string;
  }>;
}

interface BackendStatus {
  milvus: boolean;
  crm: boolean;
  massMailing: boolean;
  lastChecked: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    milvus: false,
    crm: false,
    massMailing: false,
    lastChecked: new Date().toISOString()
  });
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCandidates: 0,
    activeCampaigns: 0,
    pipelineStages: {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      hired: 0
    },
    campaignStats: {
      totalSent: 0,
      openRate: 0,
      clickRate: 0,
      responseRate: 0
    },
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [healthResponse, crmResponse, campaignsResponse] = await Promise.all([
          apiCall('/health'),
          apiCall('/api/crm/pipeline'),
          apiCall('/api/mass-mailing/campaigns')
        ]);

        // Update backend status
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setBackendStatus({
            milvus: healthData.milvus_connected || false,
            crm: true,
            massMailing: true,
            lastChecked: new Date().toISOString()
          });
        }

        // Process CRM data
        if (crmResponse.ok) {
          const crmData = await crmResponse.json();
          const totalCandidates = crmData.stages.reduce((sum: number, stage: any) => 
            sum + (stage.candidates?.length || 0), 0
          );
          
          const pipelineStages = {
            applied: crmData.stages.find((s: any) => s.id === 'applied')?.candidates?.length || 0,
            screening: crmData.stages.find((s: any) => s.id === 'screening')?.candidates?.length || 0,
            interview: crmData.stages.find((s: any) => s.id === 'interview')?.candidates?.length || 0,
            offer: crmData.stages.find((s: any) => s.id === 'offer')?.candidates?.length || 0,
            hired: crmData.stages.find((s: any) => s.id === 'hired')?.candidates?.length || 0
          };

          setMetrics(prev => ({
            ...prev,
            totalCandidates,
            pipelineStages
          }));
        }

        // Process campaign data
        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          const campaigns = campaignsData.campaigns || [];
          const activeCampaigns = campaigns.filter((c: any) => c.status === 'sent').length;
          
          const campaignStats = campaigns.reduce((stats: any, campaign: any) => {
            stats.totalSent += campaign.recipients?.length || 0;
            stats.openRate += campaign.open_rate || 0;
            stats.clickRate += campaign.click_rate || 0;
            stats.responseRate += campaign.response_rate || 0;
            return stats;
          }, { totalSent: 0, openRate: 0, clickRate: 0, responseRate: 0 });

          // Calculate averages
          if (campaigns.length > 0) {
            campaignStats.openRate = campaignStats.openRate / campaigns.length;
            campaignStats.clickRate = campaignStats.clickRate / campaigns.length;
            campaignStats.responseRate = campaignStats.responseRate / campaigns.length;
          }

          setMetrics(prev => ({
            ...prev,
            activeCampaigns,
            campaignStats
          }));
        }

        // Generate recent activity (simulated for now)
        const recentActivity = [
          {
            id: '1',
            type: 'candidate_added' as const,
            message: 'New candidate added to pipeline',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
          },
          {
            id: '2',
            type: 'campaign_sent' as const,
            message: 'Q4 Recruitment campaign sent to 50 candidates',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
          },
          {
            id: '3',
            type: 'candidate_moved' as const,
            message: 'John Doe moved to Interview stage',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          }
        ];

        setMetrics(prev => ({
          ...prev,
          recentActivity
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setBackendStatus({
          milvus: false,
          crm: false,
          massMailing: false,
          lastChecked: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    };

  // Fetch data on component mount and set up interval
  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 5 minutes (less frequent)
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic metrics based on real data
  const metricsCards = [
    {
      title: 'Total Candidates',
      value: metrics.totalCandidates.toString(),
      change: { value: 12.5, type: 'increase' as const, period: 'this month' },
      icon: <Users size={24} />,
      color: 'primary' as const,
      helpText: 'Total number of candidates across all pipeline stages'
    },
    {
      title: 'Active Campaigns',
      value: metrics.activeCampaigns.toString(),
      change: { value: 8.3, type: 'increase' as const, period: 'this month' },
      icon: <Mail size={24} />,
      color: 'success' as const,
      helpText: 'Number of email campaigns that have been sent'
    },
    {
      title: 'Pipeline Candidates',
      value: (metrics.pipelineStages.applied + metrics.pipelineStages.screening + metrics.pipelineStages.interview).toString(),
      change: { value: 15.2, type: 'increase' as const, period: 'this month' },
      icon: <Activity size={24} />,
      color: 'warning' as const,
      helpText: 'Candidates currently in the recruitment pipeline (excluding hired)'
    },
    {
      title: 'Hired This Month',
      value: metrics.pipelineStages.hired.toString(),
      change: { value: 25.1, type: 'increase' as const, period: 'this month' },
      icon: <UserCheck size={24} />,
      color: 'purple' as const,
      helpText: 'Number of candidates who have been successfully hired'
    }
  ];

  // Simple metric card component
  const MetricCard = ({ title, value, change, icon, color, helpText }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          color === 'primary' ? 'bg-primary-100' :
          color === 'success' ? 'bg-success-100' :
          color === 'warning' ? 'bg-warning-100' :
          'bg-purple-100'
        }`}>
          <div className={`${
            color === 'primary' ? 'text-primary-600' :
            color === 'success' ? 'text-success-600' :
            color === 'warning' ? 'text-warning-600' :
            'text-purple-600'
            }`}>
              {icon}
            </div>
          </div>
          <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 text-sm ${
            change.type === 'increase' ? 'text-success-600' : 'text-warning-600'
            }`}>
              {change.type === 'increase' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{change.value}%</span>
          </div>
          {helpText && <HelpText text={helpText} />}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-gray-500 text-xs mt-2">{change.period}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Loading Dashboard...</h1>
              <p className="text-primary-100 text-lg">Fetching your recruitment data</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <LoadingSpinner size="lg" className="text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard Error</h1>
              <p className="text-red-100 text-lg">{error}</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">Failed to load dashboard data. Please check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, John Smith!</h1>
            <p className="text-primary-100 text-lg">IT Recruiter • Department: IT • Jan - Jun '24</p>
            {lastUpdated && (
              <p className="text-primary-200 text-sm mt-2">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Users size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <div className="flex items-center space-x-2">
            {backendStatus.milvus ? (
              <CheckCircle size={20} className="text-success-500" />
            ) : (
              <XCircle size={20} className="text-danger-500" />
            )}
            <span className="text-sm text-gray-600">
              {backendStatus.milvus ? 'All systems operational' : 'Offline mode'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${backendStatus.milvus ? 'bg-success-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">AI Services</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${backendStatus.crm ? 'bg-success-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">CRM Pipeline</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${backendStatus.massMailing ? 'bg-success-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">Email Campaigns</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Create Job Listing */}
          <div 
            className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 flex flex-col items-center justify-center hover:from-primary-100 hover:to-primary-200 transition-all duration-200 cursor-pointer border border-primary-200"
            onClick={() => onNavigate?.('job-creation')}
          >
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
              <Plus size={24} className="text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Create Job</h4>
            <p className="text-gray-600 text-sm text-center">Post a new job opening</p>
          </div>

          {/* Resume Parser */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 flex flex-col items-center justify-center hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer border border-blue-200"
            onClick={() => onNavigate?.('resume-parsing')}
          >
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <FileText size={24} className="text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Parse Resume</h4>
            <p className="text-gray-600 text-sm text-center">AI-powered resume analysis</p>
          </div>

          {/* View Candidates */}
          <div 
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 flex flex-col items-center justify-center hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-pointer border border-green-200"
            onClick={() => onNavigate?.('candidates')}
          >
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
              <Users size={24} className="text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Candidates</h4>
            <p className="text-gray-600 text-sm text-center">Browse candidate profiles</p>
          </div>

          {/* Mass Mailing */}
          <div 
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 flex flex-col items-center justify-center hover:from-orange-100 hover:to-orange-200 transition-all duration-200 cursor-pointer border border-orange-200"
            onClick={() => onNavigate?.('mailing')}
          >
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
              <Send size={24} className="text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Email Campaign</h4>
            <p className="text-gray-600 text-sm text-center">Send bulk emails</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New candidate applied</p>
              <p className="text-xs text-gray-500">Sarah Johnson applied for Software Engineer position</p>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Resume parsed</p>
              <p className="text-xs text-gray-500">AI successfully parsed resume for Michael Chen</p>
            </div>
            <span className="text-xs text-gray-500">4 hours ago</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Send size={20} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Email campaign sent</p>
              <p className="text-xs text-gray-500">"Software Engineer Opportunities" sent to 150 candidates</p>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Candidate Scoring */}
          <div 
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => onNavigate?.('candidate-scoring')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target size={24} className="text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Candidate Scoring</h4>
                <p className="text-gray-600 text-sm">AI-powered evaluation</p>
              </div>
            </div>
          </div>

          {/* CRM Pipeline */}
          <div 
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => onNavigate?.('pipeline-crm')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">CRM Pipeline</h4>
                <p className="text-gray-600 text-sm">Manage candidate stages</p>
              </div>
            </div>
          </div>

          {/* Semantic Search */}
          <div 
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => onNavigate?.('semantic-search')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Search size={24} className="text-teal-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Semantic Search</h4>
                <p className="text-gray-600 text-sm">AI-powered search</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Campaign Statistics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
          <HelpText text="Performance metrics for all email campaigns sent through the platform" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tooltip content="Total number of emails sent across all campaigns">
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-help">
              <div className="text-3xl font-bold text-primary-600">{metrics.campaignStats.totalSent}</div>
              <div className="text-sm text-gray-600">Total Emails Sent</div>
            </div>
          </Tooltip>
          <Tooltip content="Average percentage of emails that were opened by recipients">
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-help">
              <div className="text-3xl font-bold text-green-600">{(metrics.campaignStats.openRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Average Open Rate</div>
            </div>
          </Tooltip>
          <Tooltip content="Average percentage of emails where recipients clicked on links">
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-help">
              <div className="text-3xl font-bold text-blue-600">{(metrics.campaignStats.clickRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Average Click Rate</div>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Candidate Pipeline</h3>
          <HelpText text="Number of candidates in each stage of the recruitment process" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(metrics.pipelineStages).map(([stage, count]) => (
            <Tooltip key={stage} content={`${count} candidates in ${stage} stage`}>
              <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-help">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg sm:text-2xl font-bold text-primary-600">{count}</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{stage}</div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Recruitment Statistics Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recruitment Statistics</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">Weekly</button>
            <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full">Monthly</button>
            <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-full">Yearly</button>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Applications Trend */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Applications</span>
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">1,247</div>
              <div className="text-xs text-green-600">+12.5% vs last month</div>
              <div className="mt-3 h-16 bg-gradient-to-t from-green-100 to-green-50 rounded flex items-end">
                <div className="w-full h-3/4 bg-green-400 rounded-t"></div>
              </div>
            </div>
            
            {/* Interviews Trend */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Interviews</span>
                <TrendingUp size={16} className="text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">89</div>
              <div className="text-xs text-blue-600">+8.3% vs last month</div>
              <div className="mt-3 h-16 bg-gradient-to-t from-blue-100 to-blue-50 rounded flex items-end">
                <div className="w-full h-2/3 bg-blue-400 rounded-t"></div>
              </div>
            </div>
            
            {/* Offers Trend */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Offers</span>
                <TrendingUp size={16} className="text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">34</div>
              <div className="text-xs text-purple-600">+15.2% vs last month</div>
              <div className="mt-3 h-16 bg-gradient-to-t from-purple-100 to-purple-50 rounded flex items-end">
                <div className="w-full h-1/2 bg-purple-400 rounded-t"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring by Department */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Hiring by Department</h3>
          <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
            <option>Jan - Jun '24</option>
            <option>Jul - Dec '23</option>
          </select>
        </div>
        <div className="space-y-6">
          {[
            { dept: 'Engineering', open: 12, filled: 8, color: 'bg-blue-500', icon: '⚙️' },
            { dept: 'Marketing', open: 5, filled: 3, color: 'bg-green-500', icon: '📈' },
            { dept: 'Sales', open: 8, filled: 6, color: 'bg-orange-500', icon: '💼' },
            { dept: 'HR', open: 3, filled: 2, color: 'bg-purple-500', icon: '👥' },
            { dept: 'Finance', open: 4, filled: 3, color: 'bg-red-500', icon: '💰' }
          ].map((dept, index) => {
            const fillPercentage = (dept.filled / dept.open) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{dept.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{dept.dept}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">{dept.filled}/{dept.open} filled</span>
                    <span className="font-medium text-gray-900">{Math.round(fillPercentage)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${dept.color}`}
                    style={{ width: `${fillPercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending User Profiles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Trending User Profiles</h3>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">View More</button>
        </div>
        <div className="space-y-4">
          {[
            { name: 'Jane Doe', role: 'Front-end Developer', score: 80, experience: 'Entry-Level 0-2 years', avatar: '👩‍💻', skills: ['React', 'TypeScript', 'CSS'] },
            { name: 'John Smith', role: 'Backend Developer', score: 85, experience: 'Mid-Level 3-5 years', avatar: '👨‍💻', skills: ['Python', 'Node.js', 'AWS'] },
            { name: 'Sarah Wilson', role: 'Full Stack Developer', score: 90, experience: 'Senior 6+ years', avatar: '👩‍💼', skills: ['React', 'Python', 'Docker'] },
            { name: 'Mike Johnson', role: 'DevOps Engineer', score: 75, experience: 'Mid-Level 3-5 years', avatar: '👨‍🔧', skills: ['Kubernetes', 'Terraform', 'CI/CD'] }
          ].map((profile, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-xl">
                  {profile.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-600 mb-1">{profile.experience}</p>
                  <div className="flex space-x-1">
                    {profile.skills.slice(0, 2).map((skill, skillIndex) => (
                      <span key={skillIndex} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{profile.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{profile.role}</span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{profile.score}%</div>
                  <div className="text-xs text-gray-500">Match Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Interviews</h3>
        <div className="space-y-4">
          {[
            { name: 'Sarah Adams', role: 'Project Manager', jobId: '21356', date: 'Sept. 10th', time: '10:00am', status: 'Pending', avatar: '👩‍💼', priority: 'High' },
            { name: 'David Brown', role: 'UI/UX Designer', jobId: '21357', date: 'Sept. 11th', time: '2:00pm', status: 'Confirmed', avatar: '👨‍🎨', priority: 'Medium' },
            { name: 'Lisa Garcia', role: 'Data Analyst', jobId: '21358', date: 'Sept. 12th', time: '11:00am', status: 'Pending', avatar: '👩‍💻', priority: 'High' }
          ].map((interview, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center text-xl">
                  {interview.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-900">{interview.name}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      interview.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {interview.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{interview.role} • Job ID: {interview.jobId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{interview.date}</p>
                <p className="text-xs text-gray-600">{interview.time}</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${
                  interview.status === 'Confirmed' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                  {interview.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-900">Time to Hire</h4>
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">12 days</div>
            <div className="text-xs text-blue-700">Industry avg: 18 days</div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-green-900">Quality Score</h4>
              <Target size={20} className="text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">8.7/10</div>
            <div className="text-xs text-green-700">Based on 47 reviews</div>
            <div className="mt-2 w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-purple-900">Retention Rate</h4>
              <Users size={20} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">94%</div>
            <div className="text-xs text-purple-700">12-month retention</div>
            <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Candidate Scoring */}
        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => onNavigate?.('candidate-scoring')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Candidate Scoring</h4>
              <p className="text-gray-600 text-sm">AI-powered evaluation</p>
            </div>
          </div>
        </div>

        {/* CRM Pipeline */}
        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => onNavigate?.('pipeline-crm')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">CRM Pipeline</h4>
              <p className="text-gray-600 text-sm">Manage candidate stages</p>
            </div>
          </div>
        </div>

        {/* Semantic Search */}
        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => onNavigate?.('semantic-search')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Search size={24} className="text-teal-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Semantic Search</h4>
              <p className="text-gray-600 text-sm">AI-powered search</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;