import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Building,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Calendar,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { apiCall } from '../utils/apiConfig';

interface Job {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  location_type: string;
  experience_level: string;
  posted: string;
  status: 'PUBLISHED' | 'DRAFT' | 'CLOSED';
  applications: number;
  views: number;
  overview: string;
  responsibilities: string[];
  qualifications: string[];
  required_skills: string[];
  preferred_skills: string[];
  benefits: string[];
  company_description: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'title' | 'company' | 'department' | 'location' | 'experience_level' | 'posted';
type SortDirection = 'asc' | 'desc' | null;

const JobListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('posted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch jobs from Milvus API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch jobs from API
        const response = await apiCall('/api/jobs');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        
        const data = await response.json();
        const jobsData = data.jobs;
        
        // Transform API data to frontend format
        const transformedJobs: Job[] = jobsData.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          department: job.department,
          location: job.location,
          location_type: job.location_type,
          experience_level: job.experience_level,
          posted: new Date(job.created_at).toLocaleDateString(),
          status: job.status || 'PUBLISHED',
          applicants: job.applications || 0,
          views: job.views || 0,
          description: job.overview || job.description || '',
          overview: job.overview || '',
          responsibilities: job.responsibilities || '',
          qualifications: job.qualifications || '',
          required_skills: job.required_skills || [],
          preferred_skills: job.preferred_skills || [],
          benefits: job.benefits || '',
          company_description: job.company_description || '',
          created_at: job.created_at,
          updated_at: job.updated_at
        }));
        
        setJobs(transformedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load job listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || job.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (!sortDirection) return 0;

    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'company':
        aValue = a.company.toLowerCase();
        bValue = b.company.toLowerCase();
        break;
      case 'department':
        aValue = a.department.toLowerCase();
        bValue = b.department.toLowerCase();
        break;
      case 'location':
        aValue = a.location.toLowerCase();
        bValue = b.location.toLowerCase();
        break;
      case 'experience_level':
        aValue = a.experience_level.toLowerCase();
        bValue = b.experience_level.toLowerCase();
        break;
      case 'posted':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });


  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
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
            <Briefcase size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
          <p className="text-gray-600 mt-1">Manage and track your job postings</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus size={16} />
          <span>Post New Job</span>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{jobs.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {jobs.filter(j => j.status === 'PUBLISHED').length}
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
              <p className="text-sm font-medium text-gray-600">Total Applicants</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {jobs.reduce((sum, job) => sum + job.applications, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Applicants</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {Math.round(jobs.reduce((sum, job) => sum + job.applications, 0) / jobs.length) || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Active Job Postings</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
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
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Title</span>
                    {getSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Company</span>
                    {getSortIcon('company')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Location</span>
                    {getSortIcon('location')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none min-w-[180px]"
                  onClick={() => handleSort('experience_level')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Experience</span>
                    {getSortIcon('experience_level')}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('posted')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Posted</span>
                    {getSortIcon('posted')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Skills</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Benefits</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {job.overview ? (job.overview.length > 100 ? job.overview.substring(0, 100) + '...' : job.overview) : 'No description available'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">ID: {job.id.substring(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Building size={16} className="text-gray-400" />
                      <div>
                        <span className="text-gray-900 font-medium">{job.company}</span>
                        <div className="text-xs text-gray-500">{job.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <span className="text-gray-900">{job.location}</span>
                        <div className="text-xs text-gray-500">{job.location_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 min-w-[180px]">
                    <div className="space-y-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full whitespace-nowrap inline-block">
                        {job.experience_level}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800' 
                            : job.status === 'DRAFT' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {job.applications} apps
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-900">{job.posted}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {job.required_skills && job.required_skills.length > 0 ? (
                        job.required_skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No skills listed</span>
                      )}
                      {job.required_skills && job.required_skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{job.required_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {job.benefits && job.benefits.length > 0 ? (
                        job.benefits.slice(0, 2).map((benefit, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                            {benefit.length > 20 ? benefit.substring(0, 20) + '...' : benefit}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No benefits listed</span>
                      )}
                      {job.benefits && job.benefits.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{job.benefits.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/job-details/${job.id}`)}
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
                        onClick={() => deleteJob(job.id)}
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

        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or create a new job posting.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default JobListingsPage;
