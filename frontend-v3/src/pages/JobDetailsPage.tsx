import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Share2,
  Copy,
  Edit,
  Trash2,
  Download,
  MessageCircle,
  Video,
  FileText,
  BarChart3,
  Zap,
  Globe,
  Heart,
  BookOpen,
  Home,
  Wifi,
  Car,
  Plane,
  Star,
  Award,
  Target,
  Shield,
  Coffee,
  Gift,
  DollarSign,
  Eye
} from 'lucide-react';

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
  applicants: number;
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

const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setError('No job ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching job with ID:', jobId);
        
        // Fetch job from API
        const response = await fetch(`http://localhost:8804/api/jobs/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const data = await response.json();
        const jobData = data.job;
        
        if (!jobData) {
          throw new Error('Job not found');
        }
        
        // Transform API data to frontend format
        const transformedJob: Job = {
          id: jobData.id,
          title: jobData.title,
          company: jobData.company,
          department: jobData.department,
          location: jobData.location,
          location_type: jobData.location_type,
          experience_level: jobData.experience_level,
          posted: new Date(jobData.created_at).toLocaleDateString(),
          status: jobData.status || 'PUBLISHED',
          applicants: jobData.applications || 0,
          views: jobData.views || 0,
          overview: jobData.overview || '',
          responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities : [],
          qualifications: Array.isArray(jobData.qualifications) ? jobData.qualifications : [],
          required_skills: Array.isArray(jobData.required_skills) ? jobData.required_skills : [],
          preferred_skills: Array.isArray(jobData.preferred_skills) ? jobData.preferred_skills : [],
          benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
          company_description: jobData.company_description || '',
          created_at: jobData.created_at,
          updated_at: jobData.updated_at
        };
        
        setJob(transformedJob);
        console.log('Job loaded successfully:', transformedJob.title);
      } catch (error: any) {
        console.error('Error fetching job:', error);
        setError(error.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'Entry Level (0-2 years)': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mid Level (3-5 years)': return 'bg-green-100 text-green-800 border-green-200';
      case 'Senior Level (5+ years)': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Senior Level (6-10 years)': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Lead/Principal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'remote': return <Wifi size={16} />;
      case 'onsite': return <Building size={16} />;
      case 'hybrid': return <Home size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleViewApplicants = () => {
    showNotification('info', 'Applicants view feature coming soon!');
  };

  const handleEditJob = () => {
    showNotification('info', 'Job editing feature coming soon!');
  };

  const handleShareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: `Job Opening - ${job?.title} at ${job?.company}`,
        text: `Check out this job opening for ${job?.title} at ${job?.company}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Job link copied to clipboard');
    }
  };

  const handleExportJob = () => {
    if (job) {
      const jobData = {
        title: job.title,
        company: job.company,
        department: job.department,
        location: job.location,
        location_type: job.location_type,
        experience_level: job.experience_level,
        overview: job.overview,
        responsibilities: job.responsibilities,
        qualifications: job.qualifications,
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        benefits: job.benefits,
        company_description: job.company_description,
        status: job.status,
        created_at: job.created_at,
        updated_at: job.updated_at
      };

      const blob = new Blob([JSON.stringify(jobData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title.replace(/\s+/g, '_')}_Job_Description.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Job description exported successfully');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Job Opening - ${job?.title} at ${job?.company}`,
        text: `Check out this job opening for ${job?.title} at ${job?.company}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Job link copied to clipboard');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('success', 'Job link copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CLOSED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading job details...</p>
          <p className="text-sm text-gray-500 mt-2">Job ID: {jobId}</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/job-listings')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft size={16} />
            <span>Back to Job Listings</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/job-listings')}
              className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Job Listings</span>
            </button>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleShare}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Share Job"
              >
                <Share2 size={20} />
              </button>
              <button 
                onClick={handleCopy}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Copy Link"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-6 mb-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Briefcase size={40} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{job.title}</h1>
                  <p className="text-xl text-white/90">{job.company} - {job.department}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-lg">
                <div className="flex items-center space-x-2">
                  <Building size={20} />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getLocationIcon(job.location_type)}
                  <span>{job.location} ({job.location_type})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={20} />
                  <span>Posted {job.posted}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Applicants</span>
                  <span className="text-white font-semibold">{job.applicants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Views</span>
                  <span className="text-white">{job.views}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Overview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <FileText size={24} />
                  <span>Job Overview</span>
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.overview}</p>
              </div>
            </div>

            {/* Key Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Target size={24} />
                    <span>Key Responsibilities</span>
                  </h2>
                </div>
                <div className="p-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.responsibilities.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Required Qualifications */}
            {job.qualifications && job.qualifications.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Award size={24} />
                    <span>Required Qualifications</span>
                  </h2>
                </div>
                <div className="p-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.qualifications.map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {job.required_skills && job.required_skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Zap size={20} />
                      <span>Required Skills</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {job.preferred_skills && job.preferred_skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Star size={20} />
                      <span>Preferred Skills</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {job.preferred_skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Gift size={24} />
                    <span>Benefits & Perks</span>
                  </h2>
                </div>
                <div className="p-6">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* About Company */}
            {job.company_description && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Building size={24} />
                    <span>About {job.company}</span>
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.company_description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <BarChart3 size={20} />
                  <span>Quick Stats</span>
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Users size={20} className="text-purple-600" />
                    <span className="font-medium text-gray-700">Applicants</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{job.applicants}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Clock size={20} className="text-blue-600" />
                    <span className="font-medium text-gray-700">Posted</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">{job.posted}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Eye size={20} className="text-green-600" />
                    <span className="font-medium text-gray-700">Views</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">{job.views}</span>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Briefcase size={20} />
                  <span>Job Details</span>
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <MapPin size={20} className="text-amber-600" />
                    <span className="font-medium text-gray-700">Location</span>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">{job.location}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Target size={20} className="text-blue-600" />
                    <span className="font-medium text-gray-700">Experience</span>
                  </div>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getExperienceLevelColor(job.experience_level)}`}>
                    {job.experience_level}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {getLocationIcon(job.location_type)}
                    <span className="font-medium text-gray-700">Type</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 capitalize">{job.location_type}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Users size={20} />
                  <span>Actions</span>
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={handleViewApplicants}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Users size={20} />
                  <span>View Applicants ({job.applications})</span>
                </button>
                <button 
                  onClick={handleEditJob}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Edit size={20} />
                  <span>Edit Job</span>
                </button>
                <button 
                  onClick={handleShareJob}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Share2 size={20} />
                  <span>Share Job</span>
                </button>
                <button 
                  onClick={handleExportJob}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Download size={20} />
                  <span>Export Job</span>
                </button>
              </div>
            </div>

            {/* Job Metadata */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-500 to-slate-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Job Metadata</span>
                </h3>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Job ID:</span>
                  <span className="text-gray-900 font-mono">{job.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Department:</span>
                  <span className="text-gray-900">{job.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className="text-gray-900">{job.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Created:</span>
                  <span className="text-gray-900">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Updated:</span>
                  <span className="text-gray-900">{new Date(job.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'error' && <XCircle size={20} />}
            {notification.type === 'info' && <AlertCircle size={20} />}
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;