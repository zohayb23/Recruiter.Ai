import React, { useState, useEffect } from 'react';
import {
  Hash,
  Search,
  TrendingUp,
  Target,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  Filter,
  BarChart3,
  Zap,
  Brain,
  Lightbulb,
  Tag,
  BookOpen,
  Globe,
  Users,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Save,
  Upload,
  FileText,
  Sparkles
} from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  category: string;
  search_volume: number;
  competition_level: 'low' | 'medium' | 'high';
  relevance_score: number;
  trend: 'rising' | 'stable' | 'declining';
  suggestions: string[];
  related_keywords: string[];
  created_at: string;
  usage_count: number;
}

interface KeywordSet {
  id: string;
  name: string;
  description: string;
  job_title: string;
  industry: string;
  keywords: Keyword[];
  created_at: string;
  updated_at: string;
  usage_count: number;
  performance_score: number;
}

interface KeywordGeneration {
  id: string;
  job_title: string;
  company: string;
  industry: string;
  location: string;
  experience_level: string;
  generated_keywords: Keyword[];
  ai_suggestions: string[];
  market_insights: {
    trending_skills: string[];
    salary_keywords: string[];
    location_keywords: string[];
    company_keywords: string[];
  };
  created_at: string;
  status: 'generating' | 'completed' | 'failed';
}

const KeywordGeneratorPage: React.FC = () => {
  const [keywordSets, setKeywordSets] = useState<KeywordSet[]>([]);
  const [generations, setGenerations] = useState<KeywordGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sets');

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockKeywordSets: KeywordSet[] = [
          {
            id: '1',
            name: 'Software Engineer Keywords',
            description: 'Comprehensive keyword set for software engineering roles',
            job_title: 'Software Engineer',
            industry: 'Technology',
            keywords: [
              {
                id: 'k1',
                keyword: 'Python',
                category: 'Programming Languages',
                search_volume: 15000,
                competition_level: 'high',
                relevance_score: 95,
                trend: 'rising',
                suggestions: ['Python Developer', 'Python Programming', 'Python Skills'],
                related_keywords: ['Django', 'Flask', 'Pandas', 'NumPy'],
                created_at: '2024-09-20T10:00:00Z',
                usage_count: 45
              },
              {
                id: 'k2',
                keyword: 'React',
                category: 'Frontend Frameworks',
                search_volume: 12000,
                competition_level: 'high',
                relevance_score: 90,
                trend: 'stable',
                suggestions: ['React Developer', 'React.js', 'React Native'],
                related_keywords: ['JavaScript', 'Node.js', 'Redux', 'TypeScript'],
                created_at: '2024-09-20T10:00:00Z',
                usage_count: 38
              }
            ],
            created_at: '2024-09-20T10:00:00Z',
            updated_at: '2024-09-25T10:00:00Z',
            usage_count: 83,
            performance_score: 92
          },
          {
            id: '2',
            name: 'Data Scientist Keywords',
            description: 'Keywords for data science and machine learning positions',
            job_title: 'Data Scientist',
            industry: 'Technology',
            keywords: [
              {
                id: 'k3',
                keyword: 'Machine Learning',
                category: 'AI/ML',
                search_volume: 8000,
                competition_level: 'medium',
                relevance_score: 98,
                trend: 'rising',
                suggestions: ['ML Engineer', 'Machine Learning Engineer', 'ML Specialist'],
                related_keywords: ['Deep Learning', 'Neural Networks', 'TensorFlow', 'PyTorch'],
                created_at: '2024-09-22T14:00:00Z',
                usage_count: 32
              }
            ],
            created_at: '2024-09-22T14:00:00Z',
            updated_at: '2024-09-24T16:00:00Z',
            usage_count: 32,
            performance_score: 88
          }
        ];

        const mockGenerations: KeywordGeneration[] = [
          {
            id: '1',
            job_title: 'Senior Software Engineer',
            company: 'TechCorp Inc.',
            industry: 'Technology',
            location: 'San Francisco, CA',
            experience_level: 'Senior',
            generated_keywords: mockKeywordSets[0].keywords,
            ai_suggestions: [
              'Focus on trending technologies like AI/ML integration',
              'Include remote work keywords for better reach',
              'Add diversity and inclusion keywords'
            ],
            market_insights: {
              trending_skills: ['AI Integration', 'Cloud Computing', 'DevOps'],
              salary_keywords: ['Competitive Salary', 'Equity', 'Benefits'],
              location_keywords: ['Remote', 'Hybrid', 'San Francisco'],
              company_keywords: ['Startup', 'Innovation', 'Growth']
            },
            created_at: '2024-09-25T10:00:00Z',
            status: 'completed'
          }
        ];

        setKeywordSets(mockKeywordSets);
        setGenerations(mockGenerations);
      } catch (error) {
        console.error('Error fetching keyword data:', error);
        setError('Failed to load keyword data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredKeywordSets = keywordSets.filter(set =>
    set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMetrics = () => {
    const totalSets = keywordSets.length;
    const totalKeywords = keywordSets.reduce((sum, set) => sum + set.keywords.length, 0);
    const avgPerformance = keywordSets.length > 0 ? 
      Math.round(keywordSets.reduce((sum, set) => sum + set.performance_score, 0) / keywordSets.length) : 0;
    const totalGenerations = generations.length;

    return { totalSets, totalKeywords, avgPerformance, totalGenerations };
  };

  const metrics = calculateMetrics();

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp size={16} className="text-green-600" />;
      case 'stable': return <Target size={16} className="text-blue-600" />;
      case 'declining': return <TrendingUp size={16} className="text-red-600 rotate-180" />;
      default: return <Target size={16} className="text-gray-600" />;
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
            <Hash size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Keyword Generator</h1>
          <p className="text-gray-600 mt-1">Generate and manage job posting keywords for better visibility</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Sparkles size={16} />
          <span>Generate Keywords</span>
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
              <p className="text-sm font-medium text-gray-600">Keyword Sets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalSets}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Hash size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Keywords</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{metrics.totalKeywords}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{metrics.avgPerformance}%</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Generations</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{metrics.totalGenerations}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('sets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sets'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Keyword Sets
            </button>
            <button
              onClick={() => setActiveTab('generations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Generations
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Keyword Sets Tab */}
          {activeTab === 'sets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Keyword Sets</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search keyword sets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredKeywordSets.map((set) => (
                  <div key={set.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{set.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {set.keywords.length} keywords
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {set.performance_score}% performance
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{set.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{set.job_title} • {set.industry}</span>
                          <span>•</span>
                          <span>Used {set.usage_count} times</span>
                          <span>•</span>
                          <span>Updated {new Date(set.updated_at).toLocaleDateString()}</span>
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
                          <Download size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Keywords Preview */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Top Keywords</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {set.keywords.slice(0, 4).map((keyword) => (
                          <div key={keyword.id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{keyword.keyword}</span>
                                {getTrendIcon(keyword.trend)}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCompetitionColor(keyword.competition_level)}`}>
                                {keyword.competition_level}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{keyword.search_volume.toLocaleString()} searches</span>
                              <span>{keyword.relevance_score}% relevance</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                          Use for Job Posting
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          View All Keywords
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          Export CSV
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(set.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredKeywordSets.length === 0 && (
                <div className="text-center py-12">
                  <Hash size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No keyword sets found</h3>
                  <p className="text-gray-600">Generate your first keyword set to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* AI Generations Tab */}
          {activeTab === 'generations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">AI Keyword Generations</h2>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Sparkles size={16} />
                  <span>New Generation</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {generations.map((generation) => (
                  <div key={generation.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{generation.job_title}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {generation.generated_keywords.length} keywords
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            generation.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            generation.status === 'generating' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {generation.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span>{generation.company} • {generation.industry}</span>
                          <span>•</span>
                          <span>{generation.location}</span>
                          <span>•</span>
                          <span>{generation.experience_level}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <Copy size={16} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI Suggestions</h4>
                      <div className="space-y-2">
                        {generation.ai_suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <Brain size={14} className="text-blue-600 mt-0.5" />
                            <span className="text-sm text-blue-800">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Market Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Trending Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {generation.market_insights.trending_skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Salary Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {generation.market_insights.salary_keywords.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                          Use Keywords
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          Save as Set
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                          Regenerate
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Generated {new Date(generation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {generations.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No generations found</h3>
                  <p className="text-gray-600">Generate AI-powered keywords for your job postings.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordGeneratorPage;
