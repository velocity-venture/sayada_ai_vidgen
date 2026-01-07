import { supabase } from '@/lib/supabase/client';
import { ScheduledPost, ExportHistory, SocialPlatform, ExportStatus } from '@/types/models';
import { Database } from '@/types/database.types';

type ScheduledPostRow = Database['public']['Tables']['scheduled_posts']['Row'];
type ScheduledPostInsert = Database['public']['Tables']['scheduled_posts']['Insert'];
type ScheduledPostUpdate = Database['public']['Tables']['scheduled_posts']['Update'];
type ExportHistoryRow = Database['public']['Tables']['export_history']['Row'];

const convertToScheduledPost = (row: ScheduledPostRow): ScheduledPost => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  platform: row.platform as SocialPlatform,
  caption: row.caption,
  hashtags: row.hashtags || [],
  scheduledTime: row.scheduled_time,
  timezone: row.timezone,
  status: row.status as ExportStatus,
  thumbnailUrl: row.thumbnail_url || undefined,
  youtubeCategory: row.youtube_category || undefined,
  instagramFeedType: row.instagram_feed_type || undefined,
  facebookPageId: row.facebook_page_id || undefined,
  twitterIsThread: row.twitter_is_thread,
  recurringPattern: row.recurring_pattern || undefined,
  optimalPostingTime: row.optimal_posting_time,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const convertToExportHistory = (row: ExportHistoryRow): ExportHistory => ({
  id: row.id,
  scheduledPostId: row.scheduled_post_id,
  projectId: row.project_id,
  userId: row.user_id,
  platform: row.platform as SocialPlatform,
  status: row.status as ExportStatus,
  publishedAt: row.published_at || undefined,
  postUrl: row.post_url || undefined,
  errorMessage: row.error_message || undefined,
  engagementMetrics: row.engagement_metrics || {},
  createdAt: row.created_at
});

export const socialMediaExportService = {
  async getScheduledPosts(userId: string, projectId?: string): Promise<ScheduledPost[]> {
    try {
      let query = supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: true });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(convertToScheduledPost);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      return [];
    }
  },

  async getScheduledPostById(postId: string): Promise<ScheduledPost | null> {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      return data ? convertToScheduledPost(data) : null;
    } catch (error) {
      console.error('Error fetching scheduled post:', error);
      return null;
    }
  },

  async createScheduledPost(post: Omit<ScheduledPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledPost | null> {
    try {
      const insertData: ScheduledPostInsert = {
        project_id: post.projectId,
        user_id: post.userId,
        platform: post.platform,
        caption: post.caption,
        hashtags: post.hashtags,
        scheduled_time: post.scheduledTime,
        timezone: post.timezone,
        status: post.status,
        thumbnail_url: post.thumbnailUrl,
        youtube_category: post.youtubeCategory,
        instagram_feed_type: post.instagramFeedType,
        facebook_page_id: post.facebookPageId,
        twitter_is_thread: post.twitterIsThread,
        recurring_pattern: post.recurringPattern,
        optimal_posting_time: post.optimalPostingTime
      };

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      return data ? convertToScheduledPost(data) : null;
    } catch (error) {
      console.error('Error creating scheduled post:', error);
      return null;
    }
  },

  async updateScheduledPost(postId: string, updates: Partial<ScheduledPost>): Promise<ScheduledPost | null> {
    try {
      const updateData: ScheduledPostUpdate = {};
      
      if (updates.caption !== undefined) updateData.caption = updates.caption;
      if (updates.hashtags !== undefined) updateData.hashtags = updates.hashtags;
      if (updates.scheduledTime !== undefined) updateData.scheduled_time = updates.scheduledTime;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnail_url = updates.thumbnailUrl;
      if (updates.youtubeCategory !== undefined) updateData.youtube_category = updates.youtubeCategory;
      if (updates.instagramFeedType !== undefined) updateData.instagram_feed_type = updates.instagramFeedType;
      if (updates.facebookPageId !== undefined) updateData.facebook_page_id = updates.facebookPageId;
      if (updates.twitterIsThread !== undefined) updateData.twitter_is_thread = updates.twitterIsThread;

      const { data, error } = await supabase
        .from('scheduled_posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data ? convertToScheduledPost(data) : null;
    } catch (error) {
      console.error('Error updating scheduled post:', error);
      return null;
    }
  },

  async deleteScheduledPost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      return false;
    }
  },

  async getExportHistory(userId: string, projectId?: string): Promise<ExportHistory[]> {
    try {
      let query = supabase
        .from('export_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(convertToExportHistory);
    } catch (error) {
      console.error('Error fetching export history:', error);
      return [];
    }
  },

  async createExportHistory(history: Omit<ExportHistory, 'id' | 'createdAt'>): Promise<ExportHistory | null> {
    try {
      const { data, error } = await supabase
        .from('export_history')
        .insert({
          scheduled_post_id: history.scheduledPostId,
          project_id: history.projectId,
          user_id: history.userId,
          platform: history.platform,
          status: history.status,
          published_at: history.publishedAt,
          post_url: history.postUrl,
          error_message: history.errorMessage,
          engagement_metrics: history.engagementMetrics
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data ? convertToExportHistory(data) : null;
    } catch (error) {
      console.error('Error creating export history:', error);
      return null;
    }
  },

  async getOptimalPostingTimes(userId: string, platform: SocialPlatform): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('export_history')
        .select('published_at, engagement_metrics')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const engagementByHour: Record<number, number[]> = {};
      
      data?.forEach(record => {
        if (record?.published_at && record?.engagement_metrics) {
          const hour = new Date(record.published_at).getHours();
          const engagement = 
            (record.engagement_metrics?.views || 0) +
            (record.engagement_metrics?.likes || 0) * 2 +
            (record.engagement_metrics?.comments || 0) * 3 +
            (record.engagement_metrics?.shares || 0) * 4;
          
          if (!engagementByHour[hour]) {
            engagementByHour[hour] = [];
          }
          engagementByHour[hour].push(engagement);
        }
      });
      
      const avgEngagementByHour = Object.entries(engagementByHour)
        .map(([hour, engagements]) => ({
          hour: parseInt(hour),
          avgEngagement: engagements.reduce((a, b) => a + b, 0) / engagements.length
        }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement);
      
      return avgEngagementByHour.slice(0, 3).map(({ hour }) => 
        `${hour.toString().padStart(2, '0')}:00`
      );
    } catch (error) {
      console.error('Error calculating optimal posting times:', error);
      return ['09:00', '12:00', '18:00'];
    }
  }
};