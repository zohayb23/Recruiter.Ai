import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Settings,
  Clock,
  Mail,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  Users,
  Activity,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Copy,
  Download,
  Bot,
  Workflow
} from 'lucide-react';

interface AutomationTrigger {
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  delay_minutes?: number;
}

interface AutomationAction {
  action_type: string;
  action_config: Record<string, any>;
  template_id?: string;
  subject?: string;
  content?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  conditions: Array<Record<string, any>>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AutomationCampaign {
  id: string;
  name: string;
  description: string;
  rules: AutomationRule[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  rule_count: number;
  execution_count: number;
}

interface AutomationExecution {
  id: string;
  campaign_id: string;
  rule_id: string;
  recipient_id: string;
  trigger_type: string;
  action_type: string;
  status: 'pending' | 'executed' | 'failed';
  executed_at: string;
  error_message?: string;
}

const AutomationPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch automation workflows from backend
        const response = await fetch('http://localhost:8804/api/automation/workflows');
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.workflows || []);
        }

        const mockCampaigns: AutomationCampaign[] = [
          {
            id: '1',
            name: 'New Candidate Welcome Series',
            description: 'Automated welcome emails for new candidates',
            rules: [],
            is_active: true,
            created_by: 'John Smith',
            created_at: '2024-09-01T10:00:00Z',
            updated_at: '2024-09-01T10:00:00Z',
            rule_count: 3,
            execution_count: 45
          },
          {
            id: '2',
            name: 'Follow-up Campaign',
            description: 'Follow-up emails for candidates who haven\'t responded',
            rules: [],
            is_active: true,
            created_by: 'Jane Doe',
            created_at: '2024-09-15T09:00:00Z',
            updated_at: '2024-09-15T09:00:00Z',
            rule_count: 2,
            execution_count: 23
          },
          {
            id: '3',
            name: 'Interview Reminder',
            description: 'Automated reminders for upcoming interviews',
            rules: [],
            is_active: false,
            created_by: 'Mike Johnson',
            created_at: '2024-09-20T11:00:00Z',
            updated_at: '2024-09-20T11:00:00Z',
            rule_count: 1,
            execution_count: 0
          }
        ];

        const mockRules: AutomationRule[] = [
          {
            id: '1',
            name: 'Welcome Email',
            description: 'Send welcome email when new candidate is added',
            trigger: {
              trigger_type: 'candidate_added',
              trigger_conditions: { source: 'any' }
            },
            action: {
              action_type: 'send_email',
              template_id: 'welcome_template',
              subject: 'Welcome to our talent pool!',
              content: 'Thank you for joining our talent pool...',
              action_config: {}
            },
            conditions: [],
            is_active: true,
            created_by: 'John Smith',
            created_at: '2024-09-01T10:00:00Z',
            updated_at: '2024-09-01T10:00:00Z'
          },
          {
            id: '2',
            name: 'Follow-up After 3 Days',
            description: 'Send follow-up email if no response after 3 days',
            trigger: {
              trigger_type: 'time_based',
              trigger_conditions: { delay_days: 3 },
              delay_minutes: 4320 // 3 days
            },
            action: {
              action_type: 'send_email',
              template_id: 'followup_template',
              subject: 'Following up on your application',
              content: 'We wanted to follow up on your recent application...',
              action_config: {}
            },
            conditions: [
              { field: 'last_email_sent', operator: 'is_null' }
            ],
            is_active: true,
            created_by: 'John Smith',
            created_at: '2024-09-01T10:00:00Z',
            updated_at: '2024-09-01T10:00:00Z'
          }
        ];

        const mockExecutions: AutomationExecution[] = [
          {
            id: '1',
            campaign_id: '1',
            rule_id: '1',
            recipient_id: 'recipient_1',
            trigger_type: 'candidate_added',
            action_type: 'send_email',
            status: 'executed',
            executed_at: '2024-09-25T10:00:00Z'
          },
          {
            id: '2',
            campaign_id: '1',
            rule_id: '2',
            recipient_id: 'recipient_2',
            trigger_type: 'time_based',
            action_type: 'send_email',
            status: 'executed',
            executed_at: '2024-09-24T14:00:00Z'
          }
        ];

        // Only set mock data if no data from backend
        if (campaigns.length === 0) {
          setCampaigns(mockCampaigns);
        }
        setRules(mockRules);
        setExecutions(mockExecutions);
      } catch (error) {
        console.error('Error fetching automation data:', error);
        setError('Failed to load automation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createWorkflow = async (workflowData: any) => {
    try {
      const response = await fetch('http://localhost:8804/api/automation/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }

      const result = await response.json();
      setCampaigns(prev => [...prev, result.workflow]);
      return result.workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Failed to create workflow. Please try again.');
      throw error;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive 
      ? <CheckCircle size={16} className="text-green-600" />
      : <XCircle size={16} className="text-gray-600" />;
  };

  const calculateMetrics = () => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.is_active).length;
    const totalRules = rules.length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'executed').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(1) : '0';

    return {
      totalCampaigns,
      activeCampaigns,
      totalRules,
      totalExecutions,
      successRate
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
            <Zap size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Automation</h1>
          <p className="text-gray-600 mt-1">Create automated workflows for candidate engagement</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateRuleModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Create Rule</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalCampaigns}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Workflow size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
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
              <p className="text-sm font-medium text-gray-600">Total Rules</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.totalRules}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.totalExecutions}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{metrics.successRate}%</p>
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
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rules
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'executions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Executions
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Automation Campaigns</h2>
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
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(campaign.is_active)}`}>
                            {getStatusIcon(campaign.is_active)}
                            <span>{campaign.is_active ? 'Active' : 'Inactive'}</span>
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{campaign.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created by {campaign.created_by}</span>
                          <span>•</span>
                          <span>{campaign.rule_count} rules</span>
                          <span>•</span>
                          <span>{campaign.execution_count} executions</span>
                          <span>•</span>
                          <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
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
                          <Copy size={16} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{campaign.rule_count}</p>
                        <p className="text-sm text-gray-600">Rules</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.execution_count}</p>
                        <p className="text-sm text-gray-600">Executions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {campaign.execution_count > 0 ? '95%' : '0%'}
                        </p>
                        <p className="text-sm text-gray-600">Success Rate</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        {campaign.is_active ? (
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <Pause size={16} className="inline mr-2" />
                            Pause Campaign
                          </button>
                        ) : (
                          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <Play size={16} className="inline mr-2" />
                            Activate Campaign
                          </button>
                        )}
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          View Rules
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          View Executions
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last updated {new Date(campaign.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCampaigns.length === 0 && (
                <div className="text-center py-12">
                  <Workflow size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-600">Create your first automation campaign to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Automation Rules</h2>
                <button
                  onClick={() => setShowCreateRuleModal(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus size={16} />
                  <span>Create Rule</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(rule.is_active)}`}>
                            {getStatusIcon(rule.is_active)}
                            <span>{rule.is_active ? 'Active' : 'Inactive'}</span>
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{rule.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created by {rule.created_by}</span>
                          <span>•</span>
                          <span>{rule.trigger.trigger_type}</span>
                          <span>•</span>
                          <span>{rule.action.action_type}</span>
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
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Rule Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Trigger</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Bot size={16} className="text-blue-600" />
                            <span className="text-sm text-gray-700 capitalize">
                              {rule.trigger.trigger_type.replace('_', ' ')}
                            </span>
                          </div>
                          {rule.trigger.delay_minutes && (
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-orange-600" />
                              <span className="text-sm text-gray-700">
                                Delay: {Math.round(rule.trigger.delay_minutes / 60)} hours
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Action</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Mail size={16} className="text-green-600" />
                            <span className="text-sm text-gray-700 capitalize">
                              {rule.action.action_type.replace('_', ' ')}
                            </span>
                          </div>
                          {rule.action.subject && (
                            <div className="text-sm text-gray-700">
                              Subject: {rule.action.subject}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        {rule.is_active ? (
                          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <Pause size={16} className="inline mr-2" />
                            Disable Rule
                          </button>
                        ) : (
                          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            <Play size={16} className="inline mr-2" />
                            Enable Rule
                          </button>
                        )}
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          Test Rule
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last updated {new Date(rule.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executions Tab */}
          {activeTab === 'executions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Download size={16} />
                  <span>Export Logs</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Campaign</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rule</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Trigger</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Executed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((execution) => (
                      <tr key={execution.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">
                            {campaigns.find(c => c.id === execution.campaign_id)?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">
                            {rules.find(r => r.id === execution.rule_id)?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900 capitalize">
                            {execution.trigger_type.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900 capitalize">
                            {execution.action_type.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            execution.status === 'executed' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : execution.status === 'failed'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            {execution.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-900">
                            {new Date(execution.executed_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                              <Eye size={16} />
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

export default AutomationPage;
