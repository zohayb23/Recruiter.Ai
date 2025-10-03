import React, { useState, useEffect } from 'react';
import {
  Target,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Zap,
  Clock,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

interface CandidateScore {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  overall_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  cultural_fit_score: number;
  ai_analysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    risk_factors: string[];
  };
  scoring_criteria: {
    technical_skills: number;
    soft_skills: number;
    experience_relevance: number;
    education_match: number;
    cultural_alignment: number;
  };
  last_updated: string;
  scored_by: string;
  status: 'pending' | 'completed' | 'reviewed';
}

const CandidateScoringPage: React.FC = () => {
  const [scores, setScores] = useState<CandidateScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedScore, setSelectedScore] = useState('all');

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockScores: CandidateScore[] = [
          {
            id: '1',
            candidate_id: 'candidate_1',
            candidate_name: 'Sarah Johnson',
            candidate_email: 'sarah.johnson@email.com',
            job_title: 'Senior Software Engineer',
            overall_score: 92,
            skills_score: 95,
            experience_score: 88,
            education_score: 90,
            cultural_fit_score: 94,
            ai_analysis: {
              strengths: ['Strong technical skills', 'Excellent problem-solving', 'Good communication'],
              weaknesses: ['Limited cloud experience', 'No team lead experience'],
              recommendations: ['Consider for senior role', 'Provide cloud training'],
              risk_factors: ['Salary expectations may be high']
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
          },
          {
            id: '2',
            candidate_id: 'candidate_2',
            candidate_name: 'Michael Chen',
            candidate_email: 'michael.chen@email.com',
            job_title: 'Data Scientist',
            overall_score: 87,
            skills_score: 90,
            experience_score: 85,
            education_score: 88,
            cultural_fit_score: 85,
            ai_analysis: {
              strengths: ['Strong ML background', 'Good statistical knowledge', 'Python expertise'],
              weaknesses: ['Limited business experience', 'No leadership experience'],
              recommendations: ['Good fit for mid-level role', 'Consider mentorship program'],
              risk_factors: ['May need business context training']
            },
            scoring_criteria: {
              technical_skills: 90,
              soft_skills: 80,
              experience_relevance: 85,
              education_match: 88,
              cultural_alignment: 85
            },
            last_updated: '2024-09-24T14:00:00Z',
            scored_by: 'AI System',
            status: 'completed'
          }
        ];

        setScores(mockScores);
      } catch (error) {
        console.error('Error fetching candidate scores:', error);
        setError('Failed to load candidate scores. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredScores = scores.filter(score => {
    const matchesSearch = score.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         score.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         score.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJob = selectedJob === 'all' || score.job_title === selectedJob;
    const matchesStatus = selectedStatus === 'all' || score.status === selectedStatus;
    const matchesScore = selectedScore === 'all' || 
                        (selectedScore === 'high' && score.overall_score >= 85) ||
                        (selectedScore === 'medium' && score.overall_score >= 70 && score.overall_score < 85) ||
                        (selectedScore === 'low' && score.overall_score < 70);
    
    return matchesSearch && matchesJob && matchesStatus && matchesScore;
  });

  const calculateMetrics = () => {
    const totalScores = scores.length;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score.overall_score, 0) / scores.length) : 0;
    const highScores = scores.filter(score => score.overall_score >= 85).length;
    const completedScores = scores.filter(score => score.status === 'completed').length;

    return { totalScores, avgScore, highScores, completedScores };
  };

  const metrics = calculateMetrics();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <TrendingUp size={16} className="text-green-600" />;
    if (score >= 70) return <TrendingDown size={16} className="text-yellow-600" />;
    return <TrendingDown size={16} className="text-red-600" />;
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
            <Target size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Candidate Scoring</h1>
          <p className="text-gray-600 mt-1">AI-powered candidate evaluation and scoring</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <RefreshCw size={16} />
            <span>Refresh Scores</span>
          </button>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Brain size={16} />
            <span>Bulk Score</span>
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
              <p className="text-sm font-medium text-gray-600">Total Scores</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalScores}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.avgScore}%</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Scores</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.highScores}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.completedScores}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-orange-600" />
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
                placeholder="Search candidates, jobs, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Jobs</option>
              <option value="Senior Software Engineer">Senior Software Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Product Manager">Product Manager</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
            <select
              value={selectedScore}
              onChange={(e) => setSelectedScore(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Scores</option>
              <option value="high">High (85%+)</option>
              <option value="medium">Medium (70-84%)</option>
              <option value="low">Low (&lt;70%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scores List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Candidate Scores</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredScores.map((score) => (
            <div key={score.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{score.candidate_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score.overall_score)}`}>
                      {score.overall_score}%
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      score.status === 'completed' ? 'bg-green-100 text-green-800' :
                      score.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {score.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Briefcase size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{score.job_title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{score.candidate_email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {new Date(score.last_updated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{score.scored_by}</span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Skills</p>
                      <p className="text-lg font-semibold text-blue-600">{score.skills_score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="text-lg font-semibold text-green-600">{score.experience_score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Education</p>
                      <p className="text-lg font-semibold text-purple-600">{score.education_score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Cultural Fit</p>
                      <p className="text-lg font-semibold text-orange-600">{score.cultural_fit_score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Overall</p>
                      <p className="text-lg font-semibold text-gray-900">{score.overall_score}%</p>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                      <div className="space-y-1">
                        {score.ai_analysis.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="text-sm text-gray-700">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                      <div className="space-y-1">
                        {score.ai_analysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Brain size={14} className="text-blue-600" />
                            <span className="text-sm text-gray-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredScores.length === 0 && (
          <div className="text-center py-12">
            <Target size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No scores found</h3>
            <p className="text-gray-600">Start by scoring candidates for your job openings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateScoringPage;
