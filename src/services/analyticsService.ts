import { supabase } from '@/lib/supabase/client';
import { 
  VideoAnalytics, 
  VideoEngagementEvent, 
  AnalyticsDashboardSummary,
  AnalyticsMetrics,
  AnalyticsTimeSeriesData,
  EngagementEventType 
} from '@/types/models';

interface AnalyticsResponse<T> {
  data: T | null;
  error: Error | null;
}

interface AnalyticsListResponse<T> {
  data: T[] | null;
  error: Error | null;
}

export const analyticsService = {
  // Get analytics for a specific project
  async getProjectAnalytics(projectId: string): Promise<AnalyticsResponse<VideoAnalytics>> {
    try {
      const { data, error } = await supabase
        .from('video_analytics')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) throw error;

      if (!data) {
        return { data: null, error: null };
      }

      const analytics: VideoAnalytics = {
        id: data.id,
        projectId: data.project_id,
        totalViews: data.total_views,
        totalLikes: data.total_likes,
        totalShares: data.total_shares,
        totalDownloads: data.total_downloads,
        totalComments: data.total_comments,
        engagementRate: data.engagement_rate,
        averageWatchTimeSeconds: data.average_watch_time_seconds,
        performanceScore: data.performance_score,
        lastUpdated: data.last_updated,
        createdAt: data.created_at
      };

      return { data: analytics, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Get dashboard summary for all user projects
  async getDashboardSummary(): Promise<AnalyticsListResponse<AnalyticsDashboardSummary>> {
    try {
      const { data, error } = await supabase
        .from('analytics_dashboard_summary')
        .select('*')
        .order('performance_score', { ascending: false });

      if (error) throw error;

      const summary = (data || []).map(item => ({
        projectId: item.project_id,
        title: item.title,
        projectCreatedAt: item.project_created_at,
        status: item.status,
        totalViews: item.total_views,
        totalLikes: item.total_likes,
        totalShares: item.total_shares,
        totalDownloads: item.total_downloads,
        engagementRate: item.engagement_rate,
        performanceScore: item.performance_score,
        analyticsUpdatedAt: item.analytics_updated_at
      }));

      return { data: summary, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Get aggregated metrics for dashboard overview
  async getAggregatedMetrics(): Promise<AnalyticsResponse<AnalyticsMetrics>> {
    try {
      const { data: summaryData, error: summaryError } = await supabase
        .from('analytics_dashboard_summary')
        .select('*');

      if (summaryError) throw summaryError;

      const projects = summaryData || [];
      
      const metrics: AnalyticsMetrics = {
        totalProjects: projects.length,
        totalViews: projects.reduce((sum, p) => sum + (p.total_views || 0), 0),
        totalEngagements: projects.reduce((sum, p) => 
          sum + (p.total_likes || 0) + (p.total_shares || 0) + (p.total_downloads || 0), 0
        ),
        averageEngagementRate: projects.length > 0
          ? projects.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / projects.length
          : 0,
        topPerformingProjects: projects
          .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
          .slice(0, 5)
          .map(p => ({
            projectId: p.project_id,
            title: p.title,
            projectCreatedAt: p.project_created_at,
            status: p.status,
            totalViews: p.total_views,
            totalLikes: p.total_likes,
            totalShares: p.total_shares,
            totalDownloads: p.total_downloads,
            engagementRate: p.engagement_rate,
            performanceScore: p.performance_score,
            analyticsUpdatedAt: p.analytics_updated_at
          }))
      };

      return { data: metrics, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Get time-series data for charts
  async getTimeSeriesData(
    projectId?: string,
    days: number = 30
  ): Promise<AnalyticsListResponse<AnalyticsTimeSeriesData>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('video_engagement_events')
        .select('created_at, event_type')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group events by date
      const eventsByDate = (data || []).reduce((acc, event) => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { views: 0, engagements: 0, shares: 0, downloads: 0 };
        }
        
        if (event.event_type === 'view') acc[date].views++;
        if (event.event_type === 'share') acc[date].shares++;
        if (event.event_type === 'download') acc[date].downloads++;
        if (['like', 'share', 'download', 'comment'].includes(event.event_type)) {
          acc[date].engagements++;
        }
        
        return acc;
      }, {} as Record<string, { views: number; engagements: number; shares: number; downloads: number }>);

      const timeSeriesData: AnalyticsTimeSeriesData[] = Object.entries(eventsByDate)
        .map(([date, metrics]) => ({
          date,
          ...metrics
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { data: timeSeriesData, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Track engagement event
  async trackEngagement(
    projectId: string,
    eventType: EngagementEventType,
    metadata?: Record<string, any>
  ): Promise<AnalyticsResponse<VideoEngagementEvent>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('video_engagement_events')
        .insert({
          project_id: projectId,
          user_id: user?.id || null,
          event_type: eventType,
          event_metadata: metadata || null,
          ip_address: null,
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
        })
        .select()
        .single();

      if (error) throw error;

      const event: VideoEngagementEvent = {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        eventType: data.event_type,
        eventMetadata: data.event_metadata,
        watchDurationSeconds: data.watch_duration_seconds,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        createdAt: data.created_at
      };

      return { data: event, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Get recent engagement events for a project
  async getProjectEvents(
    projectId: string,
    limit: number = 50
  ): Promise<AnalyticsListResponse<VideoEngagementEvent>> {
    try {
      const { data, error } = await supabase
        .from('video_engagement_events')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const events = (data || []).map(event => ({
        id: event.id,
        projectId: event.project_id,
        userId: event.user_id,
        eventType: event.event_type as EngagementEventType,
        eventMetadata: event.event_metadata,
        watchDurationSeconds: event.watch_duration_seconds,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
        createdAt: event.created_at
      }));

      return { data: events, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Export analytics data as CSV
  async exportAnalytics(projectIds?: string[]): Promise<{ data: string | null; error: Error | null }> {
    try {
      let query = supabase
        .from('analytics_dashboard_summary')
        .select('*');

      if (projectIds && projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Convert to CSV
      const headers = [
        'Project ID',
        'Title',
        'Status',
        'Total Views',
        'Total Likes',
        'Total Shares',
        'Total Downloads',
        'Engagement Rate',
        'Performance Score',
        'Created At'
      ];

      const rows = (data || []).map(item => [
        item.project_id,
        item.title,
        item.status,
        item.total_views,
        item.total_likes,
        item.total_shares,
        item.total_downloads,
        item.engagement_rate,
        item.performance_score,
        item.project_created_at
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return { data: csv, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
};