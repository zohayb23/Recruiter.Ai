import { useState, useEffect } from 'react';
import { searchJobs, type AdzunaJob, type JobSearchParams } from '../services/adzunaService';

function ExternalJobs() {
  const [jobs, setJobs] = useState<AdzunaJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    query: '',
    location: '',
    page: 1,
    resultsPerPage: 10
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Only search if we have at least one search term
      if (!searchParams.query && !searchParams.location) {
        setError('Please enter a job title, keywords, or location to search');
        setLoading(false);
        return;
      }

      const response = await searchJobs(searchParams);
      
      setJobs(response.results || []);
      if (response.results?.length === 0) {
        setError('No jobs found matching your criteria. Try broadening your search.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search External Jobs</h1>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                Job title or keywords
              </label>
              <input
                id="query"
                type="text"
                placeholder="e.g. Software Engineer"
                value={searchParams.query}
                onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Austin, Texas"
                value={searchParams.location}
                onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={searchParams.fullTime}
                onChange={(e) => setSearchParams(prev => ({ ...prev, fullTime: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2">Full Time</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={searchParams.partTime}
                onChange={(e) => setSearchParams(prev => ({ ...prev, partTime: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2">Part Time</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={searchParams.contract}
                onChange={(e) => setSearchParams(prev => ({ ...prev, contract: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2">Contract</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={searchParams.permanent}
                onChange={(e) => setSearchParams(prev => ({ ...prev, permanent: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2">Permanent</span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Searching...' : 'Search Jobs'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
              <p className="text-gray-600 mb-2">{job.company.display_name}</p>
              <p className="text-gray-600 mb-2">{job.location.display_name}</p>
              <p className="text-gray-600 mb-4">{formatSalary(job.salary_min, job.salary_max)}</p>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {job.contract_type || 'Not specified'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Posted: {new Date(job.created).toLocaleDateString()}
              </p>
              <a
                href={job.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && !error && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Ready to search</h3>
          <p className="mt-2 text-gray-500">Enter a job title, keywords, or location to start searching.</p>
        </div>
      )}
    </div>
  );
}

export default ExternalJobs; 