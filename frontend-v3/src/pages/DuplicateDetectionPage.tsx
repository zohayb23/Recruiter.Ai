import React, { useState, useEffect } from 'react';
import {
  Copy,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Merge,
  Split,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Target,
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  AlertCircle,
  Info,
  Settings,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';

interface DuplicateCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  job_title: string;
  company: string;
  experience_years: number;
  education: string;
  skills: string[];
  resume_url: string;
  created_at: string;
  updated_at: string;
  confidence_score: number;
  match_reasons: string[];
}

interface DuplicateGroup {
  id: string;
  candidates: DuplicateCandidate[];
  similarity_score: number;
  match_type: 'exact' | 'high' | 'medium' | 'low';
  created_at: string;
  status: 'pending' | 'reviewed' | 'merged' | 'ignored';
  reviewed_by?: string;
  reviewed_at?: string;
}

const DuplicateDetectionPage: React.FC = () => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatchType, setSelectedMatchType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockGroups: DuplicateGroup[] = [
          {
            id: '1',
            candidates: [
              {
                id: 'candidate_1',
                name: 'John Smith',
                email: 'john.smith@email.com',
                phone: '+1-555-0123',
                location: 'San Francisco, CA',
                job_title: 'Software Engineer',
                company: 'TechCorp Inc.',
                experience_years: 5,
                education: 'Bachelor of Computer Science',
                skills: ['Python', 'JavaScript', 'React', 'AWS'],
                resume_url: '/resumes/john_smith.pdf',
                created_at: '2024-09-20T10:00:00Z',
                updated_at: '2024-09-25T10:00:00Z',
                confidence_score: 95,
                match_reasons: ['Same name', 'Same email', 'Same phone number']
              },
              {
                id: 'candidate_2',
                name: 'John Smith',
                email: 'john.smith@email.com',
                phone: '+1-555-0123',
                location: 'San Francisco, CA',
                job_title: 'Senior Software Engineer',
                company: 'TechCorp Inc.',
                experience_years: 5,
                education: 'Bachelor of Computer Science',
                skills: ['Python', 'JavaScript', 'React', 'AWS', 'Docker'],
                resume_url: '/resumes/john_smith_v2.pdf',
                created_at: '2024-09-22T14:00:00Z',
                updated_at: '2024-09-24T16:00:00Z',
                confidence_score: 95,
                match_reasons: ['Same name', 'Same email', 'Same phone number']
              }
            ],
            similarity_score: 95,
            match_type: 'exact',
            created_at: '2024-09-25T10:00:00Z',
            status: 'pending'
          },
          {
            id: '2',
            candidates: [
              {
                id: 'candidate_3',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@email.com',
                phone: '+1-555-0456',
                location: 'New York, NY',
                job_title: 'Data Scientist',
                company: 'DataFlow Solutions',
                experience_years: 3,
                education: 'Master of Data Science',
                skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
                resume_url: '/resumes/sarah_johnson.pdf',
                created_at: '2024-09-18T09:00:00Z',
                updated_at: '2024-09-23T11:00:00Z',
                confidence_score: 87,
                match_reasons: ['Similar name', 'Same location', 'Same skills']
              },
              {
                id: 'candidate_4',
                name: 'Sarah J. Johnson',
                email: 's.johnson@email.com',
                phone: '+1-555-0457',
                location: 'New York, NY',
                job_title: 'Data Scientist',
                company: 'DataFlow Solutions',
                experience_years: 3,
                education: 'Master of Data Science',
                skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas'],
                resume_url: '/resumes/sarah_j_johnson.pdf',
                created_at: '2024-09-19T15:00:00Z',
                updated_at: '2024-09-24T13:00:00Z',
                confidence_score: 87,
                match_reasons: ['Similar name', 'Same location', 'Same skills']
              }
            ],
            similarity_score: 87,
            match_type: 'high',
            created_at: '2024-09-24T14:00:00Z',
            status: 'pending'
          }
        ];

        setDuplicateGroups(mockGroups);
      } catch (error) {
        console.error('Error fetching duplicate groups:', error);
        setError('Failed to load duplicate detection data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredGroups = duplicateGroups.filter(group => {
    const matchesSearch = group.candidates.some(candidate =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesType = selectedMatchType === 'all' || group.match_type === selectedMatchType;
    const matchesStatus = selectedStatus === 'all' || group.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const calculateMetrics = () => {
    const totalGroups = duplicateGroups.length;
    const totalCandidates = duplicateGroups.reduce((sum, group) => sum + group.candidates.length, 0);
    const pendingGroups = duplicateGroups.filter(group => group.status === 'pending').length;
    const avgSimilarity = duplicateGroups.length > 0 ? 
      Math.round(duplicateGroups.reduce((sum, group) => sum + group.similarity_score, 0) / duplicateGroups.length) : 0;

    return { totalGroups, totalCandidates, pendingGroups, avgSimilarity };
  };

  const metrics = calculateMetrics();

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'merged': return 'bg-green-100 text-green-800 border-green-200';
      case 'ignored': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <Copy size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Duplicate Detection</h1>
          <p className="text-gray-600 mt-1">Identify and manage duplicate candidate profiles</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <RefreshCw size={16} />
            <span>Scan for Duplicates</span>
          </button>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Settings size={16} />
            <span>Detection Settings</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duplicate Groups</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalGroups}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Copy size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.totalCandidates}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.pendingGroups}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Similarity</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.avgSimilarity}%</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates, emails, or job titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedMatchType}
              onChange={(e) => setSelectedMatchType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Match Types</option>
              <option value="exact">Exact Match</option>
              <option value="high">High Similarity</option>
              <option value="medium">Medium Similarity</option>
              <option value="low">Low Similarity</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="merged">Merged</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
        </div>
      </div>

      {/* Duplicate Groups */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Duplicate Groups</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredGroups.map((group) => (
            <div key={group.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Group #{group.id} - {group.candidates.length} candidates
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getMatchTypeColor(group.match_type)}`}>
                      {group.match_type} match
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(group.status)}`}>
                      {group.status}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {group.similarity_score}% similarity
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Detected on {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedGroup(group)}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <Merge size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Candidates in Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.candidates.map((candidate, index) => (
                  <div key={candidate.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                        <p className="text-sm text-gray-600">{candidate.job_title} at {candidate.company}</p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {candidate.confidence_score}% match
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail size={14} />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={14} />
                        <span>{candidate.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} />
                        <span>{candidate.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Briefcase size={14} />
                        <span>{candidate.experience_years} years experience</span>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Match Reasons:</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.match_reasons.map((reason, reasonIndex) => (
                          <span key={reasonIndex} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                    <Merge size={16} />
                    <span>Merge Profiles</span>
                  </button>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                    <Eye size={16} />
                    <span>Compare Details</span>
                  </button>
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                    <X size={16} />
                    <span>Mark as Different</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {group.candidates.length} potential duplicates
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Copy size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No duplicates found</h3>
            <p className="text-gray-600">Great! Your candidate database appears to be clean of duplicates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateDetectionPage;
