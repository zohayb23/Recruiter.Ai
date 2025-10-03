import React, { useState, useEffect } from 'react';
import {
  Filter,
  Plus,
  Edit,
  Trash2,
  Users,
  Target,
  BarChart3,
  Search,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Copy,
  Download
} from 'lucide-react';

interface SegmentationRule {
  field: string;
  operator: string;
  value: any;
  logical_operator?: string;
}

interface Segmentation {
  id: string;
  name: string;
  description: string;
  rules: SegmentationRule[];
  created_by: string;
  created_at: string;
  updated_at: string;
  recipient_count: number;
}

interface RecipientProfile {
  id: string;
  email: string;
  name: string;
  company: string;
  location: string;
  skills: string[];
  experience_years: number;
  job_title: string;
  industry: string;
  salary_range: string;
  education_level: string;
  last_engagement: string;
  engagement_score: number;
  created_at: string;
  updated_at: string;
}

const SegmentationPage: React.FC = () => {
  const [segmentations, setSegmentations] = useState<Segmentation[]>([]);
  const [recipientProfiles, setRecipientProfiles] = useState<RecipientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('segments');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateSegmentModal, setShowCreateSegmentModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segmentation | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch segments from backend
        const response = await fetch('http://localhost:8804/api/segmentation/segments');
        if (response.ok) {
          const data = await response.json();
          setSegmentations(data.segments || []);
        }

        const mockSegmentations: Segmentation[] = [
          {
            id: '1',
            name: 'Senior Software Engineers',
            description: 'Experienced software engineers with 5+ years of experience',
            rules: [
              { field: 'job_title', operator: 'contains', value: 'Software Engineer' },
              { field: 'experience_years', operator: '>=', value: 5 }
            ],
            created_by: 'John Smith',
            created_at: '2024-09-01T10:00:00Z',
            updated_at: '2024-09-01T10:00:00Z',
            recipient_count: 45
          },
          {
            id: '2',
            name: 'Data Scientists',
            description: 'Data scientists with Python and machine learning skills',
            rules: [
              { field: 'job_title', operator: 'contains', value: 'Data Scientist' },
              { field: 'skills', operator: 'contains', value: 'Python' },
              { field: 'skills', operator: 'contains', value: 'Machine Learning' }
            ],
            created_by: 'Jane Doe',
            created_at: '2024-09-15T09:00:00Z',
            updated_at: '2024-09-15T09:00:00Z',
            recipient_count: 23
          },
          {
            id: '3',
            name: 'High Engagement Candidates',
            description: 'Candidates with high engagement scores',
            rules: [
              { field: 'engagement_score', operator: '>=', value: 80 }
            ],
            created_by: 'Mike Johnson',
            created_at: '2024-09-20T11:00:00Z',
            updated_at: '2024-09-20T11:00:00Z',
            recipient_count: 67
          }
        ];

        const mockRecipients: RecipientProfile[] = [
          {
            id: '1',
            email: 'alex.johnson@email.com',
            name: 'Alex Johnson',
            company: 'Google',
            location: 'Mountain View, CA',
            skills: ['Python', 'JavaScript', 'React', 'AWS'],
            experience_years: 6,
            job_title: 'Senior Software Engineer',
            industry: 'Technology',
            salary_range: '$120k - $150k',
            education_level: 'Bachelor\'s Degree',
            last_engagement: '2024-09-25T10:00:00Z',
            engagement_score: 85,
            created_at: '2024-08-01T10:00:00Z',
            updated_at: '2024-09-25T10:00:00Z'
          },
          {
            id: '2',
            email: 'sarah.wilson@email.com',
            name: 'Sarah Wilson',
            company: 'Apple',
            location: 'Cupertino, CA',
            skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL'],
            experience_years: 4,
            job_title: 'Data Scientist',
            industry: 'Technology',
            salary_range: '$100k - $130k',
            education_level: 'Master\'s Degree',
            last_engagement: '2024-09-24T14:00:00Z',
            engagement_score: 92,
            created_at: '2024-08-15T09:00:00Z',
            updated_at: '2024-09-24T14:00:00Z'
          }
        ];

        // Only set mock data if no data from backend
        if (segmentations.length === 0) {
          setSegmentations(mockSegmentations);
        }
        setRecipientProfiles(mockRecipients);
      } catch (error) {
        console.error('Error fetching segmentation data:', error);
        setError('Failed to load segmentation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSegmentations = segmentations.filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMetrics = () => {
    const totalSegments = segmentations.length;
    const totalRecipients = segmentations.reduce((sum, s) => sum + s.recipient_count, 0);
    const avgSegmentSize = totalSegments > 0 ? Math.round(totalRecipients / totalSegments) : 0;
    const activeSegments = segmentations.filter(s => s.recipient_count > 0).length;

    return {
      totalSegments,
      totalRecipients,
      avgSegmentSize,
      activeSegments
    };
  };

  const metrics = calculateMetrics();

  const createSegment = async (segmentData: any) => {
    try {
      const response = await fetch('http://localhost:8804/api/segmentation/segments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(segmentData)
      });

      if (!response.ok) {
        throw new Error('Failed to create segment');
      }

      const result = await response.json();
      setSegmentations(prev => [...prev, result.segment]);
      return result.segment;
    } catch (error) {
      console.error('Error creating segment:', error);
      setError('Failed to create segment. Please try again.');
      throw error;
    }
  };

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
            <Filter size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Segmentation</h1>
          <p className="text-gray-600 mt-1">Create and manage candidate segments for targeted campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateSegmentModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Create Segment</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Segments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalSegments}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Filter size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.totalRecipients}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Segment Size</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.avgSegmentSize}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Segments</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.activeSegments}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('segments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'segments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Segments
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
          {/* Segments Tab */}
          {activeTab === 'segments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Candidate Segments</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search segments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredSegmentations.map((segment) => (
                  <div key={segment.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{segment.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {segment.recipient_count} recipients
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{segment.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created by {segment.created_by}</span>
                          <span>•</span>
                          <span>{new Date(segment.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{segment.rules.length} rules</span>
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

                    {/* Segmentation Rules */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Segmentation Rules</h4>
                      <div className="space-y-2">
                        {segment.rules.map((rule, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 text-xs font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 capitalize">{rule.field.replace('_', ' ')}</span>
                              <span className="mx-2 text-gray-500">{rule.operator}</span>
                              <span className="text-gray-700">{rule.value}</span>
                            </div>
                            {index < segment.rules.length - 1 && (
                              <span className="text-sm text-gray-500 font-medium">AND</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                          Use for Campaign
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          View Recipients
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          Export
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Last updated {new Date(segment.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSegmentations.length === 0 && (
                <div className="text-center py-12">
                  <Filter size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No segments found</h3>
                  <p className="text-gray-600">Create your first candidate segment to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Recipients Tab */}
          {activeTab === 'recipients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Recipients</h2>
                <div className="flex space-x-3">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <Download size={16} />
                    <span>Export CSV</span>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Job Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Experience</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Engagement</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipientProfiles.map((recipient) => (
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
                          <div className="text-gray-900">{recipient.job_title}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{recipient.experience_years} years</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  recipient.engagement_score >= 80 ? 'bg-green-500' :
                                  recipient.engagement_score >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${recipient.engagement_score}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{recipient.engagement_score}%</span>
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

export default SegmentationPage;
