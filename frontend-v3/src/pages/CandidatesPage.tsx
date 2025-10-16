import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Calendar,
  FileText,
  User,
  ChevronDown,
  MoreVertical,
  AlertCircle,
  BarChart3,
  Target,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronsUpDown,
  Trash2,
  Briefcase
} from 'lucide-react';
import { candidateApiService, type Candidate } from '../services/candidateApi';

type SortField = 'name' | 'position' | 'status' | 'experienceYears' | 'jobMatchScore' | 'lastActivity';
type SortDirection = 'asc' | 'desc' | null;

interface CandidatesPageProps {
  onNavigate?: (page: string) => void;
}

const CandidatesPage: React.FC<CandidatesPageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch candidates from API
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        const candidatesData = await candidateApiService.getAllCandidates();
        setCandidates(candidatesData);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        setError('Failed to load candidates. Please check if the backend is running.');
        // Fallback to mock data if API fails
        const mockCandidates = [
          {
            id: '339efb55-96ed-4d86-83f5-ca29714692ad',
            name: 'Jane Doe',
            email: 'janedoe@gmail.com',
            phone: '512-123-4567',
            location: 'Austin, TX',
            status: 'Shortlisted' as const,
            jobMatchScore: 85,
            experienceYears: '6 years',
            skills: ['Python', 'JavaScript', 'React', 'AWS'],
            lastActivity: '2025-09-29',
            resumeId: 'res_339efb55',
            position: 'Associate Software Engineer'
          },
          {
            id: '19232ce9-0d21-4907-a3f6-ac18e99ce98b',
            name: 'Alex Johnson',
            email: 'alex.johnson@email.com',
            phone: '(555) 234-5678',
            location: 'San Francisco, CA',
            status: 'Interviewed' as const,
            jobMatchScore: 78,
            experienceYears: '4 years',
            skills: ['Java', 'Spring Boot', 'MySQL', 'Docker'],
            lastActivity: '2025-09-28',
            resumeId: 'res_19232ce9',
            position: 'Backend Developer'
          },
          {
            id: 'a35faace-b6c1-4b1d-9cdc-7dab7cc944aa',
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '(555) 345-6789',
            location: 'New York, NY',
            status: 'Applied' as const,
            jobMatchScore: 72,
            experienceYears: '3 years',
            skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
            lastActivity: '2025-09-27',
            resumeId: 'res_a35faace',
            position: 'Full Stack Developer'
          }
        ];
        setCandidates(mockCandidates);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: desc -> asc -> null (no sort)
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown size={16} className="text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp size={16} className="text-gray-600" />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown size={16} className="text-gray-600" />;
    }
    return <ChevronsUpDown size={16} className="text-gray-400" />;
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || candidate.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (!sortDirection) return 0;

    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'position':
        aValue = a.position.toLowerCase();
        bValue = b.position.toLowerCase();
        break;
      case 'status':
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case 'experienceYears':
        aValue = a.experienceYears;
        bValue = b.experienceYears;
        break;
      case 'jobMatchScore':
        aValue = a.jobMatchScore;
        bValue = b.jobMatchScore;
        break;
      case 'lastActivity':
        aValue = new Date(a.lastActivity).getTime();
        bValue = new Date(b.lastActivity).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'interviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'applied':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-blue-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600 mt-1">Manage and track candidate profiles</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download size={16} />
            <span>Import Resumes</span>
          </button>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus size={16} />
            <span>Add Candidate</span>
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
              <span className="text-red-800 font-medium">Connection Error</span>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{candidates.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shortlisted</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {candidates.filter(c => c.status === 'Shortlisted').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviewed</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {candidates.filter(c => c.status === 'Interviewed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {Math.round(candidates.reduce((sum, c) => sum + c.jobMatchScore, 0) / candidates.length) || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">All Candidates</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Position</span>
                    {getSortIcon('position')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('experienceYears')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Experience</span>
                    {getSortIcon('experienceYears')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('jobMatchScore')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Match Score</span>
                    {getSortIcon('jobMatchScore')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('lastActivity')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Last Activity</span>
                    {getSortIcon('lastActivity')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Briefcase size={16} className="text-gray-400" />
                      <span className="text-gray-900">{candidate.position}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full whitespace-nowrap inline-block">
                      {candidate.experienceYears} years
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(candidate.jobMatchScore).replace('text-', 'bg-')}`}
                          style={{ width: `${candidate.jobMatchScore}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(candidate.jobMatchScore)}`}>
                        {candidate.jobMatchScore}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-900">{new Date(candidate.lastActivity).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/candidate-details/${candidate.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="More Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedCandidates.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or add new candidates.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CandidatesPage;