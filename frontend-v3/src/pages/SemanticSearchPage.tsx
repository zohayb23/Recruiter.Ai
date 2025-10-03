import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Briefcase,
  Filter,
  Star,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import Tooltip from '../components/ui/Tooltip';
import HelpText from '../components/ui/HelpText';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface SearchResult {
  resume_id?: string;
  job_id?: string;
  full_name?: string;
  title?: string;
  company?: string;
  email?: string;
  summary?: string;
  overview?: string;
  skills: string[];
  required_skills?: string[];
  work_experience?: any[];
  responsibilities?: any[];
  similarity_score: number;
  distance: number;
}

interface SearchResponse {
  query: string;
  search_type: string;
  resumes: SearchResult[];
  jobs: SearchResult[];
  total_results: number;
  message?: string;
}

const SemanticSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'both' | 'resumes' | 'jobs'>('both');
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'resumes' | 'jobs'>('resumes');

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('semantic-search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  const performSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8804/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          type: searchType,
          limit: limit
        })
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      setResults(data);

      // Add to search history
      const newHistory = [query.trim(), ...searchHistory.filter(h => h !== query.trim())].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('semantic-search-history', JSON.stringify(newHistory));

    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score > 0.8) return 'text-green-600 bg-green-100';
    if (score > 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSimilarityLabel = (score: number) => {
    if (score > 0.8) return 'Excellent Match';
    if (score > 0.6) return 'Good Match';
    if (score > 0.4) return 'Fair Match';
    return 'Poor Match';
  };

  const renderResumeResult = (result: SearchResult) => (
    <div key={result.resume_id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Users size={20} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{result.full_name}</h3>
            <p className="text-sm text-gray-600">{result.email}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSimilarityColor(result.similarity_score)}`}>
          {getSimilarityLabel(result.similarity_score)}
        </div>
      </div>

      {result.summary && (
        <p className="text-gray-700 mb-4 line-clamp-3">{result.summary}</p>
      )}

      {result.skills && result.skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {result.skills.slice(0, 8).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
            {result.skills.length > 8 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{result.skills.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Similarity: {(result.similarity_score * 100).toFixed(1)}%</span>
        <button className="text-primary-600 hover:text-primary-700 font-medium">
          View Full Profile
        </button>
      </div>
    </div>
  );

  const renderJobResult = (result: SearchResult) => (
    <div key={result.job_id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Briefcase size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
            <p className="text-sm text-gray-600">{result.company}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSimilarityColor(result.similarity_score)}`}>
          {getSimilarityLabel(result.similarity_score)}
        </div>
      </div>

      {result.overview && (
        <p className="text-gray-700 mb-4 line-clamp-3">{result.overview}</p>
      )}

      {result.required_skills && result.required_skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {result.required_skills.slice(0, 8).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {skill}
              </span>
            ))}
            {result.required_skills.length > 8 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{result.required_skills.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Similarity: {(result.similarity_score * 100).toFixed(1)}%</span>
        <button className="text-primary-600 hover:text-primary-700 font-medium">
          View Job Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Semantic Search</h1>
            <p className="text-primary-100 text-lg">AI-powered resume and job search using vector similarity</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Search size={32} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for skills, experience, job titles, or any text..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Search Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
                <HelpText text="Choose what to search: resumes, jobs, or both" />
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'both' | 'resumes' | 'jobs')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="both">Both Resumes & Jobs</option>
                <option value="resumes">Resumes Only</option>
                <option value="jobs">Jobs Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Limit
                <HelpText text="Maximum number of results to return" />
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={performSearch}
                disabled={isLoading || !query.trim()}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 5).map((term, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                <p className="text-gray-600">
                  Found {results.total_results} results for "{results.query}"
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">AI-powered search</span>
              </div>
            </div>

            {/* Results Tabs */}
            {results.resumes.length > 0 && results.jobs.length > 0 && (
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('resumes')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'resumes'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  Resumes ({results.resumes.length})
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'jobs'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Briefcase size={16} className="inline mr-2" />
                  Jobs ({results.jobs.length})
                </button>
              </div>
            )}
          </div>

          {/* Resume Results */}
          {activeTab === 'resumes' && results.resumes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users size={20} className="mr-2" />
                Resume Matches ({results.resumes.length})
              </h3>
              <div className="grid gap-4">
                {results.resumes.map(renderResumeResult)}
              </div>
            </div>
          )}

          {/* Job Results */}
          {activeTab === 'jobs' && results.jobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Briefcase size={20} className="mr-2" />
                Job Matches ({results.jobs.length})
              </h3>
              <div className="grid gap-4">
                {results.jobs.map(renderJobResult)}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.total_results === 0 && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or search type to find more relevant results.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Zap className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How Semantic Search Works</h3>
            <p className="text-blue-800 mb-3">
              Our AI-powered semantic search uses vector embeddings to understand the meaning and context of your search query, 
              not just exact keyword matches. This allows you to find relevant resumes and jobs even when they use different 
              terminology or phrasing.
            </p>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Search by skills, experience, or job requirements</li>
              <li>• Find semantically similar content across resumes and job descriptions</li>
              <li>• Get similarity scores to understand match quality</li>
              <li>• Powered by Milvus vector database for fast, accurate results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemanticSearchPage;
