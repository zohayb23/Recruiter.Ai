import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Plus,
  Download,
  Upload,
  Activity,
  Server,
  HardDrive
} from 'lucide-react';
import { milvusService } from '../services/milvusService';
import type { CollectionInfo, SearchResult } from '../services/milvusService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MilvusDatabasePage: React.FC = () => {
  const [connection, setConnection] = useState(milvusService.getConnectionInfo());
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('both');
  const [stats, setStats] = useState<any>(null);

  // Check connection on component mount
  useEffect(() => {
    checkConnection();
    loadCollections();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    const conn = await milvusService.checkConnection();
    setConnection(conn);
    setIsLoading(false);
  };

  const loadCollections = async () => {
    setIsLoading(true);
    const cols = await milvusService.getCollections();
    setCollections(cols);
    setIsLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    const results = await milvusService.search(searchQuery, selectedCollection, 20);
    setSearchResults(results);
    setIsLoading(false);
  };

  const getConnectionStatusColor = () => {
    switch (connection.status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connection.status) {
      case 'connected': return <CheckCircle size={20} />;
      case 'connecting': return <RefreshCw size={20} className="animate-spin" />;
      default: return <XCircle size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Milvus Database</h1>
            <p className="text-blue-100 text-lg">Direct access to your GCP Milvus vector database</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Database size={32} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
          <button
            onClick={checkConnection}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${connection.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">Database Status</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Host: {connection.host}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-gray-600">Port: {connection.port}</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getConnectionStatusColor()}`}>
              {getConnectionStatusIcon()}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {connection.status === 'connected' ? 'Connected to Milvus' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-600">
                Last checked: {new Date(connection.lastChecked).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collections Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Collections</h3>
          <button
            onClick={loadCollections}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Reload</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((collection) => (
            <div key={collection.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <HardDrive size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                    <p className="text-sm text-gray-600">{collection.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{collection.entityCount}</div>
                  <div className="text-xs text-gray-500">entities</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Fields:</h5>
                <div className="flex flex-wrap gap-2">
                  {collection.fields.slice(0, 3).map((field) => (
                    <span key={field.name} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {field.name}
                    </span>
                  ))}
                  {collection.fields.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{collection.fields.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Vector Search</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your search query..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="both">All Collections</option>
              <option value="resumes">Resumes Only</option>
              <option value="jobs">Jobs Only</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <Search size={20} />}
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h4>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.collection === 'resumes' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {result.collection}
                      </span>
                      <span className="text-sm text-gray-600">Score: {(result.score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs">
                      {JSON.stringify(result.entity, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database Statistics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Database Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Server size={32} className="text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-gray-600">Collections</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Activity size={32} className="text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {collections.reduce((sum, col) => sum + col.entityCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Entities</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BarChart3 size={32} className="text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">768</div>
            <div className="text-sm text-gray-600">Vector Dimensions</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Database size={32} className="text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">1.2GB</div>
            <div className="text-sm text-gray-600">Storage Used</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus size={20} className="text-green-600" />
            <span className="text-gray-700">Add New Data</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={20} className="text-blue-600" />
            <span className="text-gray-700">Export Data</span>
          </button>
          
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload size={20} className="text-purple-600" />
            <span className="text-gray-700">Import Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilvusDatabasePage;
