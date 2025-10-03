import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Plus,
  Search,
  Filter,
  Globe,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  Calendar,
  Building,
  Star,
  Share2,
  Download,
  Upload
} from 'lucide-react';

interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  job_type: string;
  experience_level: string;
  posted_date: string;
  application_deadline: string;
  platform: string;
  platform_url: string;
  status: 'active' | 'paused' | 'expired';
  applications_count: number;
  views_count: number;
  match_score: number;
  description: string;
  requirements: string[];
  benefits: string[];
}

const ExternalJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockJobs: ExternalJob[] = [
          {
            id: '1',
            title: 'Senior Software Engineer',
            company: 'TechCorp Inc.',
            location: 'San Francisco, CA',
            salary_range: '$120k - $150k',
            job_type: 'Full-time',
            experience_level: 'Senior',
            posted_date: '2024-09-25T10:00:00Z',
            application_deadline: '2024-10-25T23:59:59Z',
            platform: 'LinkedIn',
            platform_url: 'https://linkedin.com/jobs/view/123456',
            status: 'active',
            applications_count: 45,
            views_count: 234,
            match_score: 92,
            description: 'We are looking for a senior software engineer...',
            requirements: ['5+ years experience', 'Python/JavaScript', 'AWS'],
            benefits: ['Health insurance', '401k', 'Remote work']
          },
          {
            id: '2',
            title: 'Data Scientist',
            company: 'DataFlow Solutions',
            location: 'New York, NY',
            salary_range: '$100k - $130k',
            job_type: 'Full-time',
            experience_level: 'Mid-level',
            posted_date: '2024-09-24T14:00:00Z',
            application_deadline: '2024-10-24T23:59:59Z',
            platform: 'Indeed',
            platform_url: 'https://indeed.com/viewjob?jk=789012',
            status: 'active',
            applications_count: 23,
            views_count: 156,
            match_score: 87,
            description: 'Join our data science team...',
            requirements: ['3+ years experience', 'Python', 'Machine Learning'],
            benefits: ['Health insurance', 'Stock options', 'Flexible hours']
          }
        ];

        setJobs(mockJobs);
      } catch (error) {
        console.error('Error fetching external jobs:', error);
        setError('Failed to load external jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || job.platform.toLowerCase() === selectedPlatform;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const calculateMetrics = () => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalApplications = jobs.reduce((sum, job) => sum + job.applications_count, 0);
    const avgMatchScore = jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + job.match_score, 0) / jobs.length) : 0;

    return { totalJobs, activeJobs, totalApplications, avgMatchScore };
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
            <ExternalLink size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">External Jobs</h1>
          <p className="text-gray-600 mt-1">Manage job postings across external platforms</p>
        </div>
        <button
          onClick={() => setShowCreateJobModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Post Job</span>
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
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalJobs}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.activeJobs}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.totalApplications}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.avgMatchScore}%</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-orange-600" />
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
                placeholder="Search jobs, companies, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="glassdoor">Glassdoor</option>
              <option value="monster">Monster</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Job Postings</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredJobs.map((job) => (
            <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' :
                      job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {job.platform}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Building size={16} />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin size={16} />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign size={16} />
                      <span>{job.salary_range}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>{job.job_type}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span>Posted: {new Date(job.posted_date).toLocaleDateString()}</span>
                    <span>Applications: {job.applications_count}</span>
                    <span>Views: {job.views_count}</span>
                    <span>Match Score: {job.match_score}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <ExternalLink size={16} />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <ExternalLink size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Start by posting your first job to external platforms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalJobsPage;
