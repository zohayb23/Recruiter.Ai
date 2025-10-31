import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  Linkedin,
  Github,
  Play,
  Sparkles,
  MessageCircle,
  List,
  User as UserIcon,
  TrendingDown,
  Award,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Zap,
  Clock
} from 'lucide-react';
import { candidateApiService, type Candidate } from '../services/candidateApi';

interface CandidatesPageProps {
  onNavigate?: (page: string) => void;
}

const CandidatesPage: React.FC<CandidatesPageProps> = ({ onNavigate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'profile' | 'scoring'>('list');
  const [scores, setScores] = useState<any[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);

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
        setError('Failed to load candidates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(fetchCandidates, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch scoring data when scoring tab is active
  useEffect(() => {
    if (activeTab === 'scoring' && scores.length === 0) {
      fetchScoringData();
    }
  }, [activeTab, scores.length]);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || candidate.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 80) return 'bg-blue-50';
    if (score >= 70) return 'bg-yellow-50';
    if (score >= 60) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setActiveTab('profile');
  };

  // Fetch scoring data
  const fetchScoringData = async () => {
    try {
      setScoringLoading(true);
      // Mock scoring data - in real implementation, this would come from API
      const mockScores = [
        {
          id: '1',
          candidate_id: candidates[0]?.id || 'candidate_1',
          candidate_name: candidates[0]?.name || 'Sarah Johnson',
          candidate_email: candidates[0]?.email || 'sarah.johnson@email.com',
          job_title: 'Senior Software Engineer',
          overall_score: 92,
          skills_score: 95,
          experience_score: 88,
          education_score: 90,
          cultural_fit_score: 94,
          ai_analysis: {
            strengths: ['Strong technical skills', 'Excellent problem-solving'],
            weaknesses: ['Limited leadership experience'],
            recommendations: ['Consider for senior role', 'Provide cloud training'],
            risk_factors: ['May need mentorship']
          },
          scoring_criteria: {
            technical_skills: 95,
            soft_skills: 90,
            experience_relevance: 88,
            education_match: 90,
            cultural_alignment: 94
          },
          last_updated: '2024-09-25T10:00:00Z',
          scored_by: 'AI System',
          status: 'completed'
        }
      ];
      setScores(mockScores);
    } catch (error) {
      console.error('Error fetching scoring data:', error);
    } finally {
      setScoringLoading(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600 mt-1">Track and manage candidate profiles</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate?.('resume-parsing')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <List size={16} />
              <span>Candidate List</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserIcon size={16} />
              <span>Profile View</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scoring'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Target size={16} />
              <span>Scoring & Analysis</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Search and Filter */}
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

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <User size={24} className="text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.position || 'Software Engineer'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={14} className="mr-2" />
                      <span>{candidate.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={14} className="mr-2" />
                      <span>{candidate.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{candidate.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewProfile(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="More"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.experienceYears || candidate.experience_years || 0} years exp
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {selectedCandidate ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <User size={48} className="text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedCandidate.name}</h2>
                    <p className="text-gray-600 mb-4">{selectedCandidate.position || selectedCandidate.work_experience?.[0]?.title || 'Software Engineer'}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedCandidate.status)}`}>
                      {selectedCandidate.status}
                    </span>
                    
                    {/* Match Score */}
                    <div className={`w-full mt-6 p-4 rounded-lg ${getScoreBgColor(selectedCandidate.jobMatchScore || selectedCandidate.score || 85)}`}>
                      <div className="text-sm font-medium text-gray-700 mb-2">Match Score</div>
                      <div className={`text-4xl font-bold ${getScoreColor(selectedCandidate.jobMatchScore || selectedCandidate.score || 85)}`}>
                        {selectedCandidate.jobMatchScore || selectedCandidate.score || 85}%
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="w-full mt-6 space-y-3 text-left">
                      <div className="flex items-center space-x-3 text-gray-700">
                        <Mail size={18} className="text-gray-400" />
                        <span className="text-sm">{selectedCandidate.email || 'No email provided'}</span>
                      </div>
                      {selectedCandidate.phone && (
                        <div className="flex items-center space-x-3 text-gray-700">
                          <Phone size={18} className="text-gray-400" />
                          <span className="text-sm">{selectedCandidate.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-3 text-gray-700">
                        <MapPin size={18} className="text-gray-400" />
                        <span className="text-sm">{selectedCandidate.location || 'Location not specified'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full mt-6 space-y-2">
                      <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg transition-colors">
                        Schedule Interview
                      </button>
                      <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg transition-colors">
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  {((selectedCandidate.experience && selectedCandidate.experience.length > 0) || (selectedCandidate.work_experience && selectedCandidate.work_experience.length > 0)) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
                      <div className="space-y-4">
                        {(selectedCandidate.work_experience || selectedCandidate.experience || []).map((exp: any, index: number) => (
                          <div key={index} className="border-l-2 border-blue-500 pl-4">
                            <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                            <p className="text-gray-600">{exp.company}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {exp.period || `${exp.start_date || ''} - ${exp.end_date || 'Present'}`}
                            </p>
                            {exp.description && (
                              <div className="text-sm text-gray-700 mb-2">
                                {typeof exp.description === 'string' ? (
                                  <p>{exp.description}</p>
                                ) : (
                                  <ul className="list-disc list-inside space-y-1">
                                    {exp.description.map((desc: any, i: number) => (
                                      <li key={i}>{desc}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
                      <div className="space-y-3">
                        {selectedCandidate.education.map((edu, index) => (
                          <div key={index} className="border-l-2 border-green-500 pl-4">
                            <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                            <p className="text-gray-600">{edu.institution || 'Institution not specified'}</p>
                            <p className="text-sm text-gray-500">{edu.period || edu.year || 'Period not specified'}</p>
                            {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary/Description */}
                  {(selectedCandidate.description || selectedCandidate.summary) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h3>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {selectedCandidate.summary || selectedCandidate.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No candidate selected</h3>
              <p className="text-gray-600">Select a candidate from the list to view their profile.</p>
              <button
                onClick={() => setActiveTab('list')}
                className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Candidate List
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scoring Tab */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          {/* Scoring Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Scores</p>
                  <p className="text-2xl font-bold text-gray-900">{scores.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target size={24} className="text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scores.length > 0 ? Math.round(scores.reduce((acc, score) => acc + score.overall_score, 0) / scores.length) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={24} className="text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Scores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scores.filter(score => score.overall_score >= 90).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {scores.filter(score => score.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={24} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchScoringData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh Scores</span>
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
              <Download size={16} />
              <span>Bulk Score</span>
            </button>
          </div>

          {/* Candidate Scores List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Candidate Scores</h2>
            
            {scoringLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : scores.length > 0 ? (
              <div className="space-y-6">
                {scores.map((score) => (
                  <div key={score.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <User size={24} className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{score.candidate_name}</h3>
                          <p className="text-sm text-gray-600">{score.job_title}</p>
                          <p className="text-sm text-gray-500">{score.candidate_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          score.overall_score >= 90 ? 'bg-green-100 text-green-800' :
                          score.overall_score >= 80 ? 'bg-blue-100 text-blue-800' :
                          score.overall_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {score.overall_score}% completed
                        </span>
                        <div className="flex items-center space-x-1">
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{score.skills_score}%</div>
                        <div className="text-sm text-gray-600">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{score.experience_score}%</div>
                        <div className="text-sm text-gray-600">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{score.education_score}%</div>
                        <div className="text-sm text-gray-600">Education</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{score.cultural_fit_score}%</div>
                        <div className="text-sm text-gray-600">Cultural Fit</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{score.overall_score}%</div>
                        <div className="text-sm text-gray-600">Overall</div>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {score.ai_analysis.strengths.map((strength: any, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {score.ai_analysis.recommendations.map((recommendation: any, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scores available</h3>
                <p className="text-gray-600">Click "Refresh Scores" to load candidate scoring data.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesPage;
