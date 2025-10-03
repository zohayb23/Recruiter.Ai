import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Square,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Mail,
  MousePointer,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  MoreVertical,
  Settings,
  Download,
  Award,
  Zap
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';
  test_type: string;
  test_duration_hours: number;
  winner_determined: boolean;
  winner_variant_id: string;
  total_recipients: number;
  test_recipients: number;
  remaining_recipients: number;
  created_by: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  variant_count: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

interface ABTestVariant {
  id: string;
  ab_test_id: string;
  name: string;
  subject: string;
  content: string;
  send_percentage: number;
  is_winner: boolean;
  created_at: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

interface ABTestRecipient {
  id: string;
  ab_test_id: string;
  variant_id: string;
  email: string;
  name: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounce_reason?: string;
}

const ABTestingPage: React.FC = () => {
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [testVariants, setTestVariants] = useState<ABTestVariant[]>([]);
  const [testRecipients, setTestRecipients] = useState<ABTestRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch A/B testing experiments from backend
        const response = await fetch('http://localhost:8804/api/ab-testing/experiments');
        if (response.ok) {
          const data = await response.json();
          setAbTests(data.experiments || []);
        }

        const mockABTests: ABTest[] = [
          {
            id: '1',
            name: 'Subject Line Optimization',
            description: 'Testing different subject lines for software engineer recruitment emails',
            status: 'completed',
            test_type: 'subject_line',
            test_duration_hours: 48,
            winner_determined: true,
            winner_variant_id: 'variant_2',
            total_recipients: 1000,
            test_recipients: 200,
            remaining_recipients: 800,
            created_by: 'John Smith',
            created_at: '2024-09-01T10:00:00Z',
            started_at: '2024-09-01T14:00:00Z',
            completed_at: '2024-09-03T14:00:00Z',
            variant_count: 2,
            delivery_rate: 98.5,
            open_rate: 24.3,
            click_rate: 8.7,
            conversion_rate: 3.2
          },
          {
            id: '2',
            name: 'Email Content A/B Test',
            description: 'Testing different email content styles for better engagement',
            status: 'running',
            test_type: 'content',
            test_duration_hours: 72,
            winner_determined: false,
            winner_variant_id: '',
            total_recipients: 1500,
            test_recipients: 300,
            remaining_recipients: 1200,
            created_by: 'Jane Doe',
            created_at: '2024-09-15T09:00:00Z',
            started_at: '2024-09-15T10:00:00Z',
            completed_at: '',
            variant_count: 3,
            delivery_rate: 97.8,
            open_rate: 22.1,
            click_rate: 7.3,
            conversion_rate: 2.8
          },
          {
            id: '3',
            name: 'Call-to-Action Button Test',
            description: 'Testing different CTA button colors and text',
            status: 'draft',
            test_type: 'cta',
            test_duration_hours: 24,
            winner_determined: false,
            winner_variant_id: '',
            total_recipients: 800,
            test_recipients: 160,
            remaining_recipients: 640,
            created_by: 'Mike Johnson',
            created_at: '2024-09-20T11:00:00Z',
            started_at: '',
            completed_at: '',
            variant_count: 2,
            delivery_rate: 0,
            open_rate: 0,
            click_rate: 0,
            conversion_rate: 0
          }
        ];

        const mockVariants: ABTestVariant[] = [
          {
            id: 'variant_1',
            ab_test_id: '1',
            name: 'Control - Standard Subject',
            subject: 'Software Engineer Opportunities at Microsoft',
            content: 'Standard email content...',
            send_percentage: 50,
            is_winner: false,
            created_at: '2024-09-01T10:00:00Z',
            total_sent: 100,
            delivered: 98,
            opened: 22,
            clicked: 7,
            delivery_rate: 98.0,
            open_rate: 22.4,
            click_rate: 7.1,
            conversion_rate: 2.5
          },
          {
            id: 'variant_2',
            ab_test_id: '1',
            name: 'Variant A - Urgent Subject',
            subject: 'URGENT: Limited Software Engineer Positions Available',
            content: 'Urgent email content...',
            send_percentage: 50,
            is_winner: true,
            created_at: '2024-09-01T10:00:00Z',
            total_sent: 100,
            delivered: 99,
            opened: 27,
            clicked: 10,
            delivery_rate: 99.0,
            open_rate: 27.3,
            click_rate: 10.1,
            conversion_rate: 3.8
          }
        ];

        const mockRecipients: ABTestRecipient[] = [
          {
            id: '1',
            ab_test_id: '1',
            variant_id: 'variant_1',
            email: 'alex.johnson@email.com',
            name: 'Alex Johnson',
            status: 'clicked',
            sent_at: '2024-09-01T14:05:00Z',
            delivered_at: '2024-09-01T14:06:00Z',
            opened_at: '2024-09-01T16:30:00Z',
            clicked_at: '2024-09-01T16:35:00Z'
          },
          {
            id: '2',
            ab_test_id: '1',
            variant_id: 'variant_2',
            email: 'sarah.wilson@email.com',
            name: 'Sarah Wilson',
            status: 'opened',
            sent_at: '2024-09-01T14:05:00Z',
            delivered_at: '2024-09-01T14:06:00Z',
            opened_at: '2024-09-01T15:20:00Z'
          }
        ];

        // Only set mock data if no data from backend
        if (abTests.length === 0) {
          setAbTests(mockABTests);
        }
        setTestVariants(mockVariants);
        setTestRecipients(mockRecipients);
      } catch (error) {
        console.error('Error fetching A/B testing data:', error);
        setError('Failed to load A/B testing data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTests = abTests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || test.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const createABTest = async (testData: any) => {
    try {
      const response = await fetch('http://localhost:8804/api/ab-testing/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        throw new Error('Failed to create A/B test');
      }

      const result = await response.json();
      setAbTests(prev => [...prev, result.experiment]);
      return result.experiment;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      setError('Failed to create A/B test. Please try again.');
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'running':
        return <Play size={16} className="text-blue-600" />;
      case 'draft':
        return <Edit size={16} className="text-gray-600" />;
      case 'paused':
        return <Pause size={16} className="text-orange-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Edit size={16} className="text-gray-600" />;
    }
  };

  const calculateMetrics = () => {
    const totalTests = abTests.length;
    const activeTests = abTests.filter(t => t.status === 'running').length;
    const completedTests = abTests.filter(t => t.status === 'completed').length;
    const avgOpenRate = abTests.length > 0 
      ? (abTests.reduce((sum, t) => sum + t.open_rate, 0) / abTests.length).toFixed(1)
      : '0';
    const avgClickRate = abTests.length > 0 
      ? (abTests.reduce((sum, t) => sum + t.click_rate, 0) / abTests.length).toFixed(1)
      : '0';
    const avgConversionRate = abTests.length > 0 
      ? (abTests.reduce((sum, t) => sum + t.conversion_rate, 0) / abTests.length).toFixed(1)
      : '0';

    return {
      totalTests,
      activeTests,
      completedTests,
      avgOpenRate,
      avgClickRate,
      avgConversionRate
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
            <FlaskConical size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
          <p className="text-gray-600 mt-1">Optimize email campaigns with data-driven testing</p>
        </div>
        <button
          onClick={() => setShowCreateTestModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Create A/B Test</span>
        </button>
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
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalTests}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FlaskConical size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tests</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.activeTests}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Play size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.completedTests}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
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
              <p className="text-sm font-medium text-gray-600">Avg Click Rate</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.avgClickRate}%</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MousePointer size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{metrics.avgConversionRate}%</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* A/B Tests List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">A/B Tests</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
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
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTests.map((test) => {
            const variants = testVariants.filter(v => v.ab_test_id === test.id);
            const winner = variants.find(v => v.is_winner);
            
            return (
              <div key={test.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(test.status)}`}>
                        {getStatusIcon(test.status)}
                        <span className="capitalize">{test.status}</span>
                      </span>
                      {test.winner_determined && winner && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center space-x-1">
                          <Award size={12} />
                          <span>Winner: {winner.name}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{test.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created by {test.created_by}</span>
                      <span>•</span>
                      <span>{test.variant_count} variants</span>
                      <span>•</span>
                      <span>{test.test_recipients} test recipients</span>
                      {test.started_at && (
                        <>
                          <span>•</span>
                          <span>Started {new Date(test.started_at).toLocaleDateString()}</span>
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

                {/* Test Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{test.delivery_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Delivery Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{test.open_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Open Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{test.click_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Click Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{test.conversion_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                </div>

                {/* Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Test Variants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variants.map((variant) => (
                      <div key={variant.id} className={`p-4 rounded-lg border-2 ${
                        variant.is_winner 
                          ? 'border-yellow-300 bg-yellow-50' 
                          : 'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{variant.name}</h5>
                          {variant.is_winner && (
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                              Winner
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{variant.subject}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{variant.open_rate.toFixed(1)}%</p>
                            <p className="text-gray-600">Open Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{variant.click_rate.toFixed(1)}%</p>
                            <p className="text-gray-600">Click Rate</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    {test.status === 'draft' && (
                      <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        Start Test
                      </button>
                    )}
                    {test.status === 'running' && (
                      <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        Pause Test
                      </button>
                    )}
                    {test.status === 'paused' && (
                      <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        Resume Test
                      </button>
                    )}
                    <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                      View Details
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {test.status === 'running' && (
                      <span>Running for {Math.floor((Date.now() - new Date(test.started_at).getTime()) / (1000 * 60 * 60))} hours</span>
                    )}
                    {test.status === 'completed' && (
                      <span>Completed {new Date(test.completed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <FlaskConical size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No A/B tests found</h3>
            <p className="text-gray-600">Create your first A/B test to optimize your email campaigns.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestingPage;
