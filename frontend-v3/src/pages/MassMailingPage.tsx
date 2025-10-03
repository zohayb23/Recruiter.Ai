import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  Square,
  FileText,
  Settings,
  Download,
  Upload
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
  created_by: string;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Recipient {
  id: string;
  email: string;
  name: string;
  company: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounce_reason?: string;
}

const MassMailingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch campaigns and templates from backend
        const [campaignsResponse, templatesResponse] = await Promise.all([
          fetch('http://localhost:8804/api/mass-mailing/campaigns'),
          fetch('http://localhost:8804/api/mass-mailing/templates')
        ]);

        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          setCampaigns(campaignsData.campaigns || []);
        }

        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setTemplates(templatesData.templates || []);
        }

        const mockCampaigns: Campaign[] = [
          {
            id: '1',
            name: 'Q3 Tech Talent Outreach',
            subject: 'Exciting Software Engineering Opportunities at Microsoft',
            content: 'We have exciting opportunities for software engineers...',
            status: 'sent',
            created_by: 'John Smith',
            created_at: '2024-09-01T10:00:00Z',
            sent_at: '2024-09-01T14:00:00Z',
            total_recipients: 120,
            sent_count: 120,
            delivered_count: 115,
            opened_count: 89,
            clicked_count: 34
          },
          {
            id: '2',
            name: 'Fall Internship Program',
            subject: 'Join Our Fall Internship Program',
            content: 'Applications are now open for our fall internship program...',
            status: 'sending',
            created_by: 'Jane Doe',
            created_at: '2024-09-15T09:00:00Z',
            scheduled_at: '2024-09-20T10:00:00Z',
            total_recipients: 85,
            sent_count: 45,
            delivered_count: 42,
            opened_count: 28,
            clicked_count: 12
          },
          {
            id: '3',
            name: 'Senior Developer Recruitment',
            subject: 'Senior Developer Positions Available',
            content: 'We are looking for experienced senior developers...',
            status: 'draft',
            created_by: 'Mike Johnson',
            created_at: '2024-09-20T11:00:00Z',
            total_recipients: 0,
            sent_count: 0,
            delivered_count: 0,
            opened_count: 0,
            clicked_count: 0
          }
        ];

        const mockTemplates: EmailTemplate[] = [
          {
            id: '1',
            name: 'Software Engineer Outreach',
            subject: 'Exciting Software Engineering Opportunities',
            content: 'Dear [Name],\n\nWe have exciting opportunities for software engineers at our company...',
            category: 'Recruitment',
            created_by: 'John Smith',
            created_at: '2024-08-01T10:00:00Z',
            updated_at: '2024-08-01T10:00:00Z'
          },
          {
            id: '2',
            name: 'Internship Program',
            subject: 'Join Our Internship Program',
            content: 'Dear [Name],\n\nApplications are now open for our internship program...',
            category: 'Internship',
            created_by: 'Jane Doe',
            created_at: '2024-08-15T09:00:00Z',
            updated_at: '2024-08-15T09:00:00Z'
          }
        ];

        const mockRecipients: Recipient[] = [
          {
            id: '1',
            email: 'alex.johnson@email.com',
            name: 'Alex Johnson',
            company: 'Google',
            status: 'opened',
            sent_at: '2024-09-01T14:05:00Z',
            opened_at: '2024-09-01T16:30:00Z'
          },
          {
            id: '2',
            email: 'sarah.wilson@email.com',
            name: 'Sarah Wilson',
            company: 'Apple',
            status: 'clicked',
            sent_at: '2024-09-01T14:05:00Z',
            opened_at: '2024-09-01T15:20:00Z',
            clicked_at: '2024-09-01T15:25:00Z'
          },
          {
            id: '3',
            email: 'mike.chen@email.com',
            name: 'Mike Chen',
            company: 'Microsoft',
            status: 'delivered',
            sent_at: '2024-09-01T14:05:00Z'
          }
        ];

        // Only set mock data if no data from backend
        if (campaigns.length === 0) {
          setCampaigns(mockCampaigns);
        }
        if (templates.length === 0) {
          setTemplates(mockTemplates);
        }
        setRecipients(mockRecipients);
      } catch (error) {
        console.error('Error fetching mass mailing data:', error);
        setError('Failed to load mass mailing data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const createCampaign = async (campaignData: any) => {
    try {
      const response = await fetch('http://localhost:8804/api/mass-mailing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const result = await response.json();
      setCampaigns(prev => [...prev, result.campaign]);
      return result.campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign. Please try again.');
      throw error;
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:8804/api/mass-mailing/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }

      const result = await response.json();
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, ...result.campaign }
            : campaign
        )
      );
      return result.campaign;
    } catch (error) {
      console.error('Error sending campaign:', error);
      setError('Failed to send campaign. Please try again.');
      throw error;
    }
  };

  const createTemplate = async (templateData: any) => {
    try {
      const response = await fetch('http://localhost:8804/api/mass-mailing/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const result = await response.json();
      setTemplates(prev => [...prev, result.template]);
      return result.template;
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template. Please try again.');
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'sending':
        return <Play size={16} className="text-blue-600" />;
      case 'scheduled':
        return <Clock size={16} className="text-yellow-600" />;
      case 'draft':
        return <FileText size={16} className="text-gray-600" />;
      case 'paused':
        return <Pause size={16} className="text-orange-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const calculateMetrics = () => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.total_recipients, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked_count, 0);
    
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent * 100).toFixed(1) : '0';
    const avgClickRate = totalSent > 0 ? (totalClicked / totalSent * 100).toFixed(1) : '0';

    return {
      totalCampaigns,
      activeCampaigns,
      totalRecipients,
      totalSent,
      avgOpenRate,
      avgClickRate
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Development Mode Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Mail size={16} className="text-green-600" />
          </div>
          <div>
            <span className="text-green-800 font-medium">Development Mode</span>
            <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">DEV</span>
          </div>
        </div>
        <button className="text-green-700 hover:text-green-800 font-medium">
          Show Details
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mass Mailing</h1>
          <p className="text-gray-600 mt-1">Create and manage email campaigns</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Upload size={16} />
            <span>Import Contacts</span>
          </button>
          <button
            onClick={() => setShowCreateCampaignModal(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div>
              <span className="text-red-800 font-medium">Error</span>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalCampaigns}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.activeCampaigns}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Play size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.totalRecipients}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.totalSent}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Send size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.avgOpenRate}%</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{metrics.avgClickRate}%</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recipients'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recipients
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Email Campaigns</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                    />
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sending">Sending</option>
                    <option value="sent">Sent</option>
                    <option value="paused">Paused</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            <span className="capitalize">{campaign.status}</span>
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{campaign.subject}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created by {campaign.created_by}</span>
                          <span>•</span>
                          <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                          {campaign.sent_at && (
                            <>
                              <span>•</span>
                              <span>Sent {new Date(campaign.sent_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{campaign.total_recipients}</p>
                        <p className="text-sm text-gray-600">Recipients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{campaign.sent_count}</p>
                        <p className="text-sm text-gray-600">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.delivered_count}</p>
                        <p className="text-sm text-gray-600">Delivered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{campaign.opened_count}</p>
                        <p className="text-sm text-gray-600">Opened</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{campaign.clicked_count}</p>
                        <p className="text-sm text-gray-600">Clicked</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {campaign.status === 'draft' && (
                          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Send Now
                          </button>
                        )}
                        {campaign.status === 'sending' && (
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Pause
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Resume
                          </button>
                        )}
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          View Details
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.total_recipients > 0 && (
                          <>
                            Open Rate: {((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)}% • 
                            Click Rate: {((campaign.clicked_count / campaign.sent_count) * 100).toFixed(1)}%
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCampaigns.length === 0 && (
                <div className="text-center py-12">
                  <Mail size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-600">Create your first email campaign to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                <button
                  onClick={() => setShowCreateTemplateModal(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus size={16} />
                  <span>Create Template</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {template.category}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      Created by {template.created_by} • {new Date(template.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                        Use Template
                      </button>
                      <button className="p-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipients Tab */}
          {activeTab === 'recipients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recipients</h2>
                <div className="flex space-x-3">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <Upload size={16} />
                    <span>Import CSV</span>
                  </button>
                  <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <Plus size={16} />
                    <span>Add Recipient</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Sent</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Opened</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((recipient) => (
                      <tr key={recipient.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{recipient.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{recipient.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{recipient.company}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(recipient.status)}`}>
                            {recipient.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {recipient.sent_at ? new Date(recipient.sent_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {recipient.opened_at ? new Date(recipient.opened_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MassMailingPage;
