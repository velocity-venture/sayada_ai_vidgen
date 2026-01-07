'use client';
import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/services/projectService';
import { supabase } from '@/lib/supabase/client';
import { Project, ProjectStats } from '@/types/models';
import EmptyState from './EmptyState';
import StatsCard from './StatsCard';
import FilterControls from './FilterControls';
import ProjectCard from './ProjectCard';
import ActivityItem from './ActivityItem';

export default function DashboardInteractive() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, [user]);

  // Real-time subscription for project updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'UPDATE') {
            // Update the specific project in state
            setProjects((current) =>
              current?.map((project) =>
                project?.id === payload?.new?.id
                  ? {
                      id: payload.new.id,
                      userId: payload.new.user_id,
                      title: payload.new.title,
                      scriptContent: payload.new.script_content,
                      status: payload.new.status,
                      videoUrl: payload.new.video_url ?? undefined,
                      durationSeconds: payload.new.duration_seconds,
                      stylePreset: payload.new.style_preset,
                      createdAt: payload.new.created_at,
                      updatedAt: payload.new.updated_at,
                    }
                  : project
              ) || []
            );

            // Refresh stats when a project completes
            if (payload.new.status === 'completed') {
              const statsData = await projectService.getProjectStats(user.id);
              setStats(statsData);
            }
          } else if (payload.eventType === 'INSERT') {
            // Add new project to state
            const newProject: Project = {
              id: payload.new.id,
              userId: payload.new.user_id,
              title: payload.new.title,
              scriptContent: payload.new.script_content,
              status: payload.new.status,
              videoUrl: payload.new.video_url ?? undefined,
              durationSeconds: payload.new.duration_seconds,
              stylePreset: payload.new.style_preset,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            };
            setProjects((current) => [newProject, ...current]);
          } else if (payload.eventType === 'DELETE') {
            // Remove project from state
            setProjects((current) =>
              current?.filter((project) => project?.id !== payload?.old?.id) || []
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadProjects = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [projectsData, statsData] = await Promise.all([
        projectService.getUserProjects(user.id),
        projectService.getProjectStats(user.id),
      ]);

      setProjects(projectsData || []);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search and status
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project?.title
      ?.toLowerCase()
      ?.includes(searchQuery?.toLowerCase() || '');
    const matchesStatus = statusFilter === 'all' || project?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Generate activity items from projects
  const recentActivity = projects
    ?.slice(0, 3)
    ?.map((project) => ({
      action: project?.status === 'completed' ? 'Video Generated' : 
              project?.status === 'processing' ? 'Processing Started' : 'Draft Created',
      project: project?.title || 'Untitled Project',
      time: new Date(project?.createdAt || '').toLocaleString(),
    }));

  const statsCards = stats ? [
    { 
      label: 'Total Videos', 
      value: stats.totalVideos.toString(), 
      trend: '+2.5%', 
      isPositive: true 
    },
    { 
      label: 'Active Projects', 
      value: stats.activeProjects.toString(), 
      trend: '+1', 
      isPositive: true 
    },
    { 
      label: 'Total Minutes', 
      value: stats.totalMinutes.toFixed(1), 
      trend: '+5.8%', 
      isPositive: true 
    },
    { 
      label: 'Avg. Quality', 
      value: `${stats.avgQuality}/10`, 
      trend: '+0.3', 
      isPositive: true 
    },
  ] : [];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <button
            onClick={loadProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards?.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <FilterControls />
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              {filteredProjects?.length === 0 ? (
                <EmptyState />
              ) : (
                filteredProjects?.map((project) => (
                  <ProjectCard key={project?.id} project={project} />
                ))
              )}
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                ) : (
                  recentActivity?.map((item, index) => (
                    <ActivityItem key={index} {...item} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}