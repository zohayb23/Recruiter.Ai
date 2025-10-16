import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Award,
  TrendingUp,
  Target,
  Shield,
  Coffee,
  Gift,
  DollarSign,
  Home,
  Wifi,
  Car,
  Plane,
  Briefcase,
  Clock,
  Users,
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
  BookOpen
} from 'lucide-react';

interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

interface Education {
  degree: string;
  institution: string | null;
  year: string | null;
  gpa: string | null;
  location: string | null;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  experienceYears: number;
  skills: string[];
  jobMatchScore: number;
  status: string;
  lastActivity: string;
  resumeText: string;
  createdAt: string;
  updatedAt: string;
  work_experience: WorkExperience[];
  education: Education[];
  summary: string;
}

const CandidateDetailsPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) {
        setError('No candidate ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching candidate with ID:', candidateId);
        
        // Fetch all candidates and find the one with matching ID
        const response = await fetch('http://localhost:8804/api/candidates');
        
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }
        
        const data = await response.json();
        const candidates = data.candidates;
        
        // Find the candidate with matching ID
        const candidateData = candidates.find((c: any) => c.id === candidateId);
        
        if (!candidateData) {
          throw new Error('Candidate not found');
        }
        
        // Transform the data to match the expected format
        const transformedCandidate: Candidate = {
          id: candidateData.id,
          name: candidateData.name,
          email: candidateData.email || 'No email provided',
          phone: candidateData.phone || 'No phone provided',
          location: candidateData.location,
          position: 'Software Developer', // Default position
          experienceYears: candidateData.experience_years || 0,
          skills: candidateData.skills || [],
          jobMatchScore: candidateData.score || 0,
          status: candidateData.status || 'Active',
          lastActivity: candidateData.updated_at || candidateData.created_at,
          resumeText: candidateData.summary || '',
          createdAt: candidateData.created_at,
          updatedAt: candidateData.updated_at,
          work_experience: candidateData.work_experience || [],
          education: candidateData.education || [],
          summary: candidateData.summary || ''
        };
        
        setCandidate(transformedCandidate);
        console.log('Candidate loaded successfully:', transformedCandidate.name);
      } catch (error: any) {
        console.error('Error fetching candidate:', error);
        setError(error.message || 'Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

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

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendMessage = () => {
    if (candidate?.email) {
      window.open(`mailto:${candidate.email}?subject=Regarding Your Application`, '_blank');
      showNotification('info', 'Email client opened');
    } else {
      showNotification('error', 'No email address available for this candidate');
    }
  };

  const handleScheduleInterview = () => {
    showNotification('info', 'Interview scheduling feature coming soon!');
  };

  const handleViewResume = () => {
    if (candidate?.resumeText) {
      // Open resume in a new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Resume - ${candidate.name}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
              <h1>${candidate.name} - Resume</h1>
              <div style="white-space: pre-line;">${candidate.resumeText}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
        showNotification('success', 'Resume opened in new window');
      }
    } else {
      showNotification('error', 'No resume available for this candidate');
    }
  };

  const handleDownloadCV = () => {
    if (candidate?.resumeText) {
      const blob = new Blob([candidate.resumeText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate.name.replace(/\s+/g, '_')}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Resume downloaded successfully');
    } else {
      showNotification('error', 'No resume available for download');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Candidate Profile - ${candidate?.name}`,
        text: `Check out this candidate profile for ${candidate?.position}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Profile link copied to clipboard');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('success', 'Profile link copied to clipboard');
  };

  const getExperienceColor = (years: number) => {
    if (years >= 10) return 'from-purple-500 to-indigo-500';
    if (years >= 5) return 'from-blue-500 to-cyan-500';
    if (years >= 2) return 'from-green-500 to-teal-500';
    return 'from-orange-500 to-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading candidate details...</p>
          <p className="text-sm text-gray-500 mt-2">Candidate ID: {candidateId}</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Candidate Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The candidate you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/candidates')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft size={16} />
            <span>Back to Candidates</span>
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
              onClick={() => navigate('/candidates')}
              className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Candidates</span>
            </button>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleShare}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Share Profile"
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
                  <User size={40} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{candidate.name}</h1>
                  <p className="text-xl text-white/90">{candidate.position}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-lg">
                <div className="flex items-center space-x-2">
                  <Mail size={20} />
                  <span>{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={20} />
                  <span>{candidate.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase size={20} />
                  <span>{candidate.experienceYears} years exp</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Match Score</span>
                  <span className="text-white font-semibold">{candidate.jobMatchScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Last Activity</span>
                  <span className="text-white">{new Date(candidate.lastActivity).toLocaleDateString()}</span>
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
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Mail size={24} />
                  <span>Contact Information</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{candidate.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{candidate.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{candidate.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar size={20} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Last Activity</p>
                        <p className="font-medium text-gray-900">{new Date(candidate.lastActivity).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Zap size={24} />
                  <span>Skills & Expertise</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {candidate.skills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-full border border-green-200 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidate Summary */}
            {candidate.summary && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <FileText size={24} />
                    <span>Professional Summary</span>
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed">{candidate.summary}</p>
                </div>
              </div>
            )}

            {/* Work Experience */}
            {candidate.work_experience && candidate.work_experience.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Briefcase size={24} />
                    <span>Work Experience</span>
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {candidate.work_experience.map((exp, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                          <p className="text-lg font-semibold text-blue-600">{exp.company}</p>
                          <p className="text-sm text-gray-600">{exp.start_date} - {exp.end_date}</p>
                          <p className="text-sm text-gray-500 flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>{exp.location}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                      </div>
                      
                      {exp.achievements && exp.achievements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                            <Star size={16} className="text-yellow-500" />
                            <span>Key Achievements</span>
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {exp.achievements.map((achievement, achIndex) => (
                              <li key={achIndex}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                            <Zap size={16} className="text-blue-500" />
                            <span>Technologies Used</span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map((tech, techIndex) => (
                              <span key={techIndex} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {candidate.education && candidate.education.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <BookOpen size={24} />
                    <span>Education</span>
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{edu.degree}</h3>
                          {edu.institution && (
                            <p className="text-lg font-semibold text-green-600">{edu.institution}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            {edu.year && (
                              <span className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>{edu.year}</span>
                              </span>
                            )}
                            {edu.gpa && (
                              <span className="flex items-center space-x-1">
                                <Star size={14} />
                                <span>GPA: {edu.gpa}</span>
                              </span>
                            )}
                            {edu.location && (
                              <span className="flex items-center space-x-1">
                                <MapPin size={14} />
                                <span>{edu.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience & Qualifications Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Award size={24} />
                  <span>Experience & Qualifications Summary</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Briefcase size={20} className="text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Years of Experience</p>
                        <p className="text-2xl font-bold text-purple-600">{candidate.experienceYears} years</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r ${getExperienceColor(candidate.experienceYears)}`}>
                      {candidate.experienceYears >= 10 ? 'Senior' : 
                       candidate.experienceYears >= 5 ? 'Mid-Level' : 
                       candidate.experienceYears >= 2 ? 'Junior' : 'Entry Level'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Target size={20} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Job Match Score</p>
                        <p className="text-2xl font-bold text-blue-600">{candidate.jobMatchScore}%</p>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getScoreColor(candidate.jobMatchScore).replace('text-', 'bg-')}`}
                        style={{ width: `${candidate.jobMatchScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <TrendingUp size={20} />
                  <span>Quick Stats</span>
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Star size={20} className="text-purple-600" />
                    <span className="font-medium text-gray-700">Match Score</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{candidate.jobMatchScore}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Briefcase size={20} className="text-blue-600" />
                    <span className="font-medium text-gray-700">Experience</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">{candidate.experienceYears} years</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} className="text-green-600" />
                    <span className="font-medium text-gray-700">Last Active</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{new Date(candidate.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <CheckCircle size={20} />
                  <span>Application Status</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
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
                  onClick={handleSendMessage}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <MessageCircle size={20} />
                  <span>Send Message</span>
                </button>
                <button 
                  onClick={handleScheduleInterview}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Video size={20} />
                  <span>Schedule Interview</span>
                </button>
                <button 
                  onClick={handleViewResume}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <FileText size={20} />
                  <span>View Resume</span>
                </button>
                <button 
                  onClick={handleDownloadCV}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-semibold"
                >
                  <Download size={20} />
                  <span>Download CV</span>
                </button>
              </div>
            </div>

            {/* Candidate Metadata */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-500 to-slate-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Candidate Details</span>
                </h3>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Candidate ID:</span>
                  <span className="text-gray-900 font-mono">{candidate.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Position:</span>
                  <span className="text-gray-900">{candidate.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Location:</span>
                  <span className="text-gray-900">{candidate.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Skills Count:</span>
                  <span className="text-gray-900">{candidate.skills.length} skills</span>
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

export default CandidateDetailsPage;