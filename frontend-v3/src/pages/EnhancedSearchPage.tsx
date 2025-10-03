import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Users,
  Star,
  Clock,
  Eye,
  Heart,
  Share2,
  Download,
  Bookmark,
  Tag,
  Award,
  GraduationCap,
  Building,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Minus,
  Sliders,
  Target,
  Zap,
  Brain,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Save,
  Upload,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'candidate' | 'job' | 'company';
  title: string;
  subtitle: string;
  description: string;
  location: string;
  salary?: string;
  experience?: string;
  skills: string[];
  match_score: number;
  relevance_factors: string[];
  last_updated: string;
  source: string;
  metadata: {
    [key: string]: any;
  };
}

interface SearchFilter {
  id: string;
  name: string;
  type: 'range' | 'select' | 'multiselect' | 'date';
  options?: string[];
  min?: number;
  max?: number;
  value: any;
}

interface SearchFacet {
  name: string;
  count: number;
  selected: boolean;
}

const EnhancedSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<SearchFilter[]>([]);
  const [facets, setFacets] = useState<Record<string, SearchFacet[]>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize filters
        const initialFilters: SearchFilter[] = [
          {
            id: 'location',
            name: 'Location',
            type: 'multiselect',
            options: ['San Francisco, CA', 'New York, NY', 'Remote', 'Austin, TX', 'Seattle, WA'],
            value: []
          },
          {
            id: 'experience',
            name: 'Experience Level',
            type: 'select',
            options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
            value: ''
          },
          {
            id: 'salary',
            name: 'Salary Range',
            type: 'range',
            min: 50000,
            max: 300000,
            value: { min: 50000, max: 300000 }
          },
          {
            id: 'skills',
            name: 'Skills',
            type: 'multiselect',
            options: ['Python', 'JavaScript', 'React', 'AWS', 'Machine Learning', 'Docker', 'Kubernetes'],
            value: []
          },
          {
            id: 'date_posted',
            name: 'Date Posted',
            type: 'date',
            value: null
          }
        ];

        setSelectedFilters(initialFilters);

        // Initialize facets
        const initialFacets = {
          'Type': [
            { name: 'Candidates', count: 45, selected: false },
            { name: 'Jobs', count: 23, selected: false },
            { name: 'Companies', count: 12, selected: false }
          ],
          'Location': [
            { name: 'San Francisco, CA', count: 28, selected: false },
            { name: 'New York, NY', count: 22, selected: false },
            { name: 'Remote', count: 18, selected: false },
            { name: 'Austin, TX', count: 8, selected: false }
          ],
          'Experience': [
            { name: 'Senior Level', count: 32, selected: false },
            { name: 'Mid Level', count: 25, selected: false },
            { name: 'Entry Level', count: 13, selected: false }
          ]
        };

        setFacets(initialFacets);

        // Mock search history
        setSearchHistory([
          'Senior Software Engineer Python',
          'Data Scientist Machine Learning',
          'Frontend Developer React',
          'DevOps Engineer AWS'
        ]);

        // Mock saved searches
        setSavedSearches([
          'My Python Developers',
          'Remote Senior Engineers',
          'AI/ML Candidates'
        ]);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load search data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'candidate',
          title: 'Sarah Johnson',
          subtitle: 'Senior Software Engineer',
          description: 'Experienced software engineer with 5+ years in Python, React, and AWS. Strong background in full-stack development and team leadership.',
          location: 'San Francisco, CA',
          salary: '$120k - $150k',
          experience: '5+ years',
          skills: ['Python', 'React', 'AWS', 'Docker', 'Kubernetes'],
          match_score: 95,
          relevance_factors: ['Exact skill match', 'Location match', 'Experience level'],
          last_updated: '2024-09-25T10:00:00Z',
          source: 'LinkedIn',
          metadata: {
            company: 'TechCorp Inc.',
            education: 'Bachelor of Computer Science',
            availability: 'Available in 2 weeks'
          }
        },
        {
          id: '2',
          type: 'job',
          title: 'Senior Python Developer',
          subtitle: 'TechCorp Inc.',
          description: 'We are looking for a senior Python developer to join our growing team. You will work on exciting projects using modern technologies.',
          location: 'San Francisco, CA',
          salary: '$130k - $160k',
          experience: '5+ years',
          skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'],
          match_score: 92,
          relevance_factors: ['Skill match', 'Location match', 'Salary range'],
          last_updated: '2024-09-24T14:00:00Z',
          source: 'Company Website',
          metadata: {
            job_type: 'Full-time',
            remote: 'Hybrid',
            benefits: ['Health insurance', '401k', 'Stock options']
          }
        },
        {
          id: '3',
          type: 'candidate',
          title: 'Michael Chen',
          subtitle: 'Data Scientist',
          description: 'Data scientist with expertise in machine learning, Python, and big data technologies. PhD in Computer Science with 3+ years industry experience.',
          location: 'New York, NY',
          salary: '$110k - $140k',
          experience: '3+ years',
          skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'],
          match_score: 88,
          relevance_factors: ['Skill match', 'Education level', 'Experience'],
          last_updated: '2024-09-23T16:00:00Z',
          source: 'Indeed',
          metadata: {
            company: 'DataFlow Solutions',
            education: 'PhD in Computer Science',
            availability: 'Available immediately'
          }
        }
      ];

      setSearchResults(mockResults);

      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
      }

    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setSelectedFilters(prev => 
      prev.map(filter => 
        filter.id === filterId ? { ...filter, value } : filter
      )
    );
  };

  const handleFacetToggle = (facetCategory: string, facetName: string) => {
    setFacets(prev => ({
      ...prev,
      [facetCategory]: prev[facetCategory].map(facet =>
        facet.name === facetName ? { ...facet, selected: !facet.selected } : facet
      )
    }));
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'candidate': return <Users size={20} className="text-blue-600" />;
      case 'job': return <Briefcase size={20} className="text-green-600" />;
      case 'company': return <Building size={20} className="text-purple-600" />;
      default: return <Search size={20} className="text-gray-600" />;
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'candidate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'job': return 'bg-green-100 text-green-800 border-green-200';
      case 'company': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Development Mode Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Search size={16} className="text-green-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Search</h1>
          <p className="text-gray-600 mt-1">AI-powered search across candidates, jobs, and companies</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Save size={16} />
            <span>Save Search</span>
          </button>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Settings size={16} />
            <span>Search Settings</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates, jobs, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                />
              </div>
              <button
                onClick={() => handleSearch(searchQuery)}
                className="w-full mt-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Search
              </button>
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Searches</h3>
                <div className="space-y-2">
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(query);
                        handleSearch(query);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Searches</h3>
                <div className="space-y-2">
                  {savedSearches.map((search, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>{search}</span>
                      <Bookmark size={14} className="text-yellow-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Facets */}
            <div className="space-y-4">
              {Object.entries(facets).map(([category, facetList]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {facetList.map((facet, index) => (
                      <button
                        key={index}
                        onClick={() => handleFacetToggle(category, facet.name)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                          facet.selected 
                            ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{facet.name}</span>
                        <span className="text-xs text-gray-500">({facet.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="salary">Salary</option>
                    <option value="experience">Experience</option>
                  </select>
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{result.subtitle}</p>
                        <p className="text-gray-700 text-sm line-clamp-2">{result.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {result.match_score}% match
                      </span>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Heart size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span>{result.location}</span>
                    </div>
                    {result.salary && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <DollarSign size={16} />
                        <span>{result.salary}</span>
                      </div>
                    )}
                    {result.experience && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>{result.experience}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {result.skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {result.skills.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{result.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Updated: {new Date(result.last_updated).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Source: {result.source}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                        View Details
                      </button>
                      <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchPage;
