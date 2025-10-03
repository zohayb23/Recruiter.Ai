import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  Filter,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Info,
  AlertCircle,
  BookOpen,
  Users,
  MapPin,
  DollarSign,
  Star,
  Zap
} from 'lucide-react';

interface GapAnalysis {
  id: string;
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  company: string;
  analysis_date: string;
  overall_score: number;
  gaps: {
    skill_gaps: SkillGap[];
    experience_gaps: ExperienceGap[];
    education_gaps: EducationGap[];
    certification_gaps: CertificationGap[];
  };
  recommendations: {
    skill_development: string[];
    experience_building: string[];
    education_improvements: string[];
    certification_requirements: string[];
  };
  timeline_estimates: {
    skill_development: string;
    experience_building: string;
    education_improvements: string;
    certification_requirements: string;
  };
  priority_level: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
}

interface SkillGap {
  skill_name: string;
  required_level: number;
  current_level: number;
  gap_size: number;
  importance: 'critical' | 'important' | 'nice_to_have';
  learning_resources: string[];
  estimated_time: string;
}

interface ExperienceGap {
  experience_type: string;
  required_years: number;
  current_years: number;
  gap_years: number;
  importance: 'critical' | 'important' | 'nice_to_have';
  suggestions: string[];
}

interface EducationGap {
  education_type: string;
  required_level: string;
  current_level: string;
  gap_description: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  alternatives: string[];
}

interface CertificationGap {
  certification_name: string;
  required: boolean;
  current_status: 'none' | 'in_progress' | 'completed';
  importance: 'critical' | 'important' | 'nice_to_have';
  exam_info: string;
  study_resources: string[];
}

const GapAnalysisPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<GapAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<GapAnalysis | null>(null);

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockAnalyses: GapAnalysis[] = [
          {
            id: '1',
            candidate_id: 'candidate_1',
            candidate_name: 'Sarah Johnson',
            job_title: 'Senior Software Engineer',
            company: 'TechCorp Inc.',
            analysis_date: '2024-09-25T10:00:00Z',
            overall_score: 75,
            gaps: {
              skill_gaps: [
                {
                  skill_name: 'Docker',
                  required_level: 8,
                  current_level: 4,
                  gap_size: 4,
                  importance: 'critical',
                  learning_resources: ['Docker Official Documentation', 'Docker Deep Dive Course'],
                  estimated_time: '2-3 months'
                },
                {
                  skill_name: 'Kubernetes',
                  required_level: 6,
                  current_level: 2,
                  gap_size: 4,
                  importance: 'important',
                  learning_resources: ['Kubernetes Basics Course', 'Hands-on Labs'],
                  estimated_time: '3-4 months'
                }
              ],
              experience_gaps: [
                {
                  experience_type: 'Team Leadership',
                  required_years: 2,
                  current_years: 0,
                  gap_years: 2,
                  importance: 'critical',
                  suggestions: ['Lead a small project', 'Mentor junior developers']
                }
              ],
              education_gaps: [
                {
                  education_type: 'Advanced Degree',
                  required_level: 'Master\'s in Computer Science',
                  current_level: 'Bachelor\'s in Computer Science',
                  gap_description: 'Missing advanced degree',
                  importance: 'nice_to_have',
                  alternatives: ['Professional certifications', 'Advanced courses']
                }
              ],
              certification_gaps: [
                {
                  certification_name: 'AWS Solutions Architect',
                  required: true,
                  current_status: 'none',
                  importance: 'critical',
                  exam_info: 'AWS SAA-C03 Exam',
                  study_resources: ['AWS Training', 'Practice Tests']
                }
              ]
            },
            recommendations: {
              skill_development: ['Focus on Docker and Kubernetes', 'Practice with real projects'],
              experience_building: ['Take on leadership opportunities', 'Mentor team members'],
              education_improvements: ['Consider online master\'s program', 'Take advanced courses'],
              certification_requirements: ['Start AWS certification path', 'Study for SAA-C03']
            },
            timeline_estimates: {
              skill_development: '3-4 months',
              experience_building: '6-12 months',
              education_improvements: '12-18 months',
              certification_requirements: '2-3 months'
            },
            priority_level: 'high',
            status: 'pending'
          },
          {
            id: '2',
            candidate_id: 'candidate_2',
            candidate_name: 'Michael Chen',
            job_title: 'Data Scientist',
            company: 'DataFlow Solutions',
            analysis_date: '2024-09-24T14:00:00Z',
            overall_score: 85,
            gaps: {
              skill_gaps: [
                {
                  skill_name: 'Deep Learning',
                  required_level: 7,
                  current_level: 5,
                  gap_size: 2,
                  importance: 'important',
                  learning_resources: ['Deep Learning Specialization', 'PyTorch Tutorials'],
                  estimated_time: '1-2 months'
                }
              ],
              experience_gaps: [],
              education_gaps: [],
              certification_gaps: [
                {
                  certification_name: 'Google Cloud ML Engineer',
                  required: false,
                  current_status: 'in_progress',
                  importance: 'nice_to_have',
                  exam_info: 'GCP ML Engineer Exam',
                  study_resources: ['GCP Training', 'ML Engineering Course']
                }
              ]
            },
            recommendations: {
              skill_development: ['Enhance deep learning skills', 'Practice with real datasets'],
              experience_building: [],
              education_improvements: [],
              certification_requirements: ['Complete GCP ML certification']
            },
            timeline_estimates: {
              skill_development: '1-2 months',
              experience_building: 'N/A',
              education_improvements: 'N/A',
              certification_requirements: '1 month'
            },
            priority_level: 'medium',
            status: 'in_progress'
          }
        ];

        setAnalyses(mockAnalyses);
      } catch (error) {
        console.error('Error fetching gap analysis data:', error);
        setError('Failed to load gap analysis data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || analysis.priority_level === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || analysis.status === selectedStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const calculateMetrics = () => {
    const totalAnalyses = analyses.length;
    const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.overall_score, 0) / analyses.length) : 0;
    const highPriority = analyses.filter(analysis => analysis.priority_level === 'high').length;
    const inProgress = analyses.filter(analysis => analysis.status === 'in_progress').length;

    return { totalAnalyses, avgScore, highPriority, inProgress };
  };

  const metrics = calculateMetrics();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'reviewed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'important': return 'bg-orange-100 text-orange-800';
      case 'nice_to_have': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <BarChart3 size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Gap Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze candidate skill and experience gaps</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <RefreshCw size={16} />
            <span>Run Analysis</span>
          </button>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus size={16} />
            <span>New Analysis</span>
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
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalAnalyses}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-600" />
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
              <Target size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{metrics.highPriority}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-orange-600" />
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
                placeholder="Search candidates, jobs, or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gap Analyses */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Gap Analysis Reports</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAnalyses.map((analysis) => (
            <div key={analysis.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{analysis.candidate_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(analysis.priority_level)}`}>
                      {analysis.priority_level} priority
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(analysis.status)}`}>
                      {analysis.status}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {analysis.overall_score}% match
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>{analysis.job_title} at {analysis.company}</span>
                    <span>•</span>
                    <span>Analyzed: {new Date(analysis.analysis_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedAnalysis(analysis)}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
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

              {/* Gap Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">Skill Gaps</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">{analysis.gaps.skill_gaps.length}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Briefcase size={16} className="text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Experience Gaps</span>
                  </div>
                  <p className="text-lg font-bold text-orange-600">{analysis.gaps.experience_gaps.length}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <GraduationCap size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Education Gaps</span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">{analysis.gaps.education_gaps.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <Award size={16} className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Certification Gaps</span>
                  </div>
                  <p className="text-lg font-bold text-purple-600">{analysis.gaps.certification_gaps.length}</p>
                </div>
              </div>

              {/* Critical Gaps */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Critical Gaps</h4>
                <div className="space-y-2">
                  {analysis.gaps.skill_gaps.filter(gap => gap.importance === 'critical').map((gap, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle size={14} className="text-red-600" />
                        <span className="text-sm text-red-800">{gap.skill_name}</span>
                        <span className="text-xs text-red-600">({gap.gap_size} levels gap)</span>
                      </div>
                      <span className="text-xs text-red-600">{gap.estimated_time}</span>
                    </div>
                  ))}
                  {analysis.gaps.experience_gaps.filter(gap => gap.importance === 'critical').map((gap, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle size={14} className="text-red-600" />
                        <span className="text-sm text-red-800">{gap.experience_type}</span>
                        <span className="text-xs text-red-600">({gap.gap_years} years gap)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Estimates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Development Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skills:</span>
                      <span className="font-medium">{analysis.timeline_estimates.skill_development}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{analysis.timeline_estimates.experience_building}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Education:</span>
                      <span className="font-medium">{analysis.timeline_estimates.education_improvements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certifications:</span>
                      <span className="font-medium">{analysis.timeline_estimates.certification_requirements}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Top Recommendations</h4>
                  <div className="space-y-1">
                    {analysis.recommendations.skill_development.slice(0, 2).map((rec, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle size={14} className="text-green-600" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                    <Edit size={16} />
                    <span>Create Plan</span>
                  </button>
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2">
                    <Download size={16} />
                    <span>Export Report</span>
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {analysis.gaps.skill_gaps.length + analysis.gaps.experience_gaps.length + 
                   analysis.gaps.education_gaps.length + analysis.gaps.certification_gaps.length} total gaps
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No gap analyses found</h3>
            <p className="text-gray-600">Run gap analysis on candidates to identify skill and experience gaps.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GapAnalysisPage;
