import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Target,
  Award,
  Mail,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  candidates: {
    total: number;
    recent_30_days: number;
    top_skills: Array<{ skill: string; count: number }>;
    experience_distribution: {
      Entry: number;
      Mid: number;
      Senior: number;
      Executive: number;
    };
  };
  jobs: {
    total: number;
    recent_30_days: number;
    status_distribution: Record<string, number>;
    top_companies: Array<{ company: string; count: number }>;
    experience_levels: Record<string, number>;
  };
  interviews: {
    total: number;
    recent_30_days: number;
    average_score: number;
    hiring_recommendations: Record<string, number>;
    score_distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
  campaigns: {
    total: number;
    status_distribution: Record<string, number>;
    email_metrics: {
      total_sent: number;
      total_opened: number;
      total_clicked: number;
      open_rate: number;
      click_rate: number;
    };
  };
  system: {
    milvus_connected: boolean;
    collections_count: number;
    last_updated: string;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8804/api/analytics/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalytics(data.analytics);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = "blue",
    trend = null 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color?: string;
    trend?: { value: number; label: string; positive: boolean } | null;
  }) => {
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
      indigo: "bg-indigo-500"
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp size={16} className="mr-1" />
                {trend.value}% {trend.label}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const ChartCard = ({ 
    title, 
    children, 
    icon: Icon 
  }: {
    title: string;
    children: React.ReactNode;
    icon: React.ElementType;
  }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center mb-4">
        <Icon className="h-5 w-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error loading analytics</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Real-time insights from your recruitment data
                {lastUpdated && (
                  <span className="ml-2 text-sm text-gray-500">
                    • Last updated: {lastUpdated}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Candidates"
            value={analytics.candidates.total}
            subtitle={`${analytics.candidates.recent_30_days} added in last 30 days`}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Jobs"
            value={analytics.jobs.total}
            subtitle={`${analytics.jobs.recent_30_days} posted recently`}
            icon={Briefcase}
            color="green"
          />
          <StatCard
            title="Interviews Conducted"
            value={analytics.interviews.total}
            subtitle={`Avg Score: ${analytics.interviews.average_score}`}
            icon={Award}
            color="purple"
          />
          <StatCard
            title="Email Campaigns"
            value={analytics.campaigns.total}
            subtitle={`${analytics.campaigns.email_metrics.open_rate}% open rate`}
            icon={Mail}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Skills */}
          <ChartCard title="Top Skills" icon={BarChart3}>
            <div className="space-y-3">
              {analytics.candidates.top_skills.slice(0, 8).map((skill, index) => (
                <div key={skill.skill} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(skill.count / analytics.candidates.top_skills[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{skill.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Experience Distribution */}
          <ChartCard title="Experience Levels" icon={PieChart}>
            <div className="space-y-4">
              {Object.entries(analytics.candidates.experience_distribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{level}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(count / analytics.candidates.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Companies */}
          <ChartCard title="Top Companies" icon={Briefcase}>
            <div className="space-y-3">
              {analytics.jobs.top_companies.slice(0, 6).map((company, index) => (
                <div key={company.company} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{company.company}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(company.count / analytics.jobs.top_companies[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{company.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Interview Score Distribution */}
          <ChartCard title="Interview Scores" icon={Target}>
            <div className="space-y-4">
              {Object.entries(analytics.interviews.score_distribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{level}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          level === 'excellent' ? 'bg-green-500' :
                          level === 'good' ? 'bg-blue-500' :
                          level === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analytics.interviews.total > 0 ? (count / analytics.interviews.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                analytics.system.milvus_connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-700">
                Milvus: {analytics.system.milvus_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
              <span className="text-sm text-gray-700">
                Collections: {analytics.system.collections_count}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">
                Updated: {new Date(analytics.system.last_updated).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
