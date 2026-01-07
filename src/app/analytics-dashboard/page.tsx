'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analyticsService';
import { 
  AnalyticsMetrics, 
  AnalyticsDashboardSummary, 
  AnalyticsTimeSeriesData 
} from '@/types/models';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface FilterOptions {
  timeRange: 'daily' | 'weekly' | 'monthly';
  sortBy: 'views' | 'engagement' | 'performance' | 'date';
  scriptureType?: string;
}

export default function AnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [projects, setProjects] = useState<AnalyticsDashboardSummary[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<AnalyticsTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: 'monthly',
    sortBy: 'performance'
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadAnalytics();
    }
  }, [user, authLoading, filters.timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsResult, summaryResult, timeSeriesResult] = await Promise.all([
        analyticsService.getAggregatedMetrics(),
        analyticsService.getDashboardSummary(),
        analyticsService.getTimeSeriesData(
          undefined,
          filters.timeRange === 'daily' ? 7 : filters.timeRange === 'weekly' ? 30 : 90
        )
      ]);

      if (metricsResult.error) throw metricsResult.error;
      if (summaryResult.error) throw summaryResult.error;
      if (timeSeriesResult.error) throw timeSeriesResult.error;

      setMetrics(metricsResult.data);
      setProjects(summaryResult.data || []);
      setTimeSeriesData(timeSeriesResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const projectIds = selectedProject ? [selectedProject] : undefined;
      const { data, error } = await analyticsService.exportAnalytics(projectIds);
      
      if (error) throw error;
      
      const blob = new Blob([data || ''], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
    }
  };

  const getSortedProjects = () => {
    const sorted = [...projects];
    
    switch (filters.sortBy) {
      case 'views':
        return sorted.sort((a, b) => (b?.totalViews || 0) - (a?.totalViews || 0));
      case 'engagement':
        return sorted.sort((a, b) => (b?.engagementRate || 0) - (a?.engagementRate || 0));
      case 'performance':
        return sorted.sort((a, b) => (b?.performanceScore || 0) - (a?.performanceScore || 0));
      case 'date':
        return sorted.sort((a, b) => 
          new Date(b?.projectCreatedAt || 0).getTime() - new Date(a?.projectCreatedAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-purple-200">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Analytics</h2>
          <p className="text-purple-200 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-purple-200">Track your video performance and engagement metrics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 items-center">
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as FilterOptions['timeRange'] })}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="daily">Last 7 Days</option>
              <option value="weekly">Last 30 Days</option>
              <option value="monthly">Last 90 Days</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="performance">Sort by Performance</option>
              <option value="views">Sort by Views</option>
              <option value="engagement">Sort by Engagement</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-200 text-sm font-medium">Total Projects</h3>
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{metrics?.totalProjects || 0}</p>
            <p className="text-xs text-purple-300 mt-1">Generated videos</p>
          </div>

          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-200 text-sm font-medium">Total Views</h3>
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{(metrics?.totalViews || 0).toLocaleString()}</p>
            <p className="text-xs text-purple-300 mt-1">Across all videos</p>
          </div>

          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-200 text-sm font-medium">Total Engagements</h3>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{(metrics?.totalEngagements || 0).toLocaleString()}</p>
            <p className="text-xs text-purple-300 mt-1">Likes, shares & downloads</p>
          </div>

          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-200 text-sm font-medium">Avg. Engagement Rate</h3>
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{(metrics?.averageEngagementRate || 0).toFixed(2)}%</p>
            <p className="text-xs text-purple-300 mt-1">User interaction rate</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-4">Performance Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="date" stroke="#cbd5e0" />
                <YAxis stroke="#cbd5e0" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #805ad5' }}
                  labelStyle={{ color: '#cbd5e0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#60a5fa" name="Views" strokeWidth={2} />
                <Line type="monotone" dataKey="engagements" stroke="#34d399" name="Engagements" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution Chart */}
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
            <h3 className="text-xl font-semibold text-white mb-4">Engagement Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="date" stroke="#cbd5e0" />
                <YAxis stroke="#cbd5e0" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #805ad5' }}
                  labelStyle={{ color: '#cbd5e0' }}
                />
                <Legend />
                <Bar dataKey="shares" fill="#f59e0b" name="Shares" />
                <Bar dataKey="downloads" fill="#8b5cf6" name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Table */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-6 border border-purple-500">
          <h3 className="text-xl font-semibold text-white mb-4">Video Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500">
                  <th className="text-left text-purple-200 py-3 px-4">Title</th>
                  <th className="text-center text-purple-200 py-3 px-4">Views</th>
                  <th className="text-center text-purple-200 py-3 px-4">Engagement Rate</th>
                  <th className="text-center text-purple-200 py-3 px-4">Shares</th>
                  <th className="text-center text-purple-200 py-3 px-4">Downloads</th>
                  <th className="text-center text-purple-200 py-3 px-4">Performance Score</th>
                  <th className="text-center text-purple-200 py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {getSortedProjects()?.map((project) => (
                  <tr 
                    key={project?.projectId} 
                    className="border-b border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedProject(project?.projectId)}
                  >
                    <td className="py-4 px-4">
                      <div className="text-white font-medium">{project?.title}</div>
                      <div className="text-purple-300 text-sm">{project?.status}</div>
                    </td>
                    <td className="py-4 px-4 text-center text-white">{project?.totalViews?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        (project?.engagementRate || 0) >= 50 ? 'bg-green-500 text-white' :
                        (project?.engagementRate || 0) >= 25 ? 'bg-yellow-500 text-gray-900': 'bg-red-500 text-white'
                      }`}>
                        {project?.engagementRate?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-white">{project?.totalShares}</td>
                    <td className="py-4 px-4 text-center text-white">{project?.totalDownloads}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${project?.performanceScore}%` }}
                          />
                        </div>
                        <span className="text-white font-medium">{project?.performanceScore?.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-purple-200 text-sm">
                      {new Date(project?.projectCreatedAt || '').toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {projects?.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-purple-200">No analytics data available yet</p>
                <p className="text-purple-300 text-sm mt-2">Start generating videos to see performance metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}