import { supabase } from '@/lib/supabase/client';

export interface RenderJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  project_id: string;
  user_id: string;
  aspect_ratio: string;
  burn_subtitles: boolean;
  subtitle_style?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  output_url?: string;
  attempts: number;
  max_attempts: number;
  priority: number;
  processing_time_seconds?: number;
}

export const renderQueueService = {
  /**
   * Get all render jobs for current user with optional status filter
   */
  async getRenderJobs(statusFilter?: string): Promise<RenderJob[]> {
    try {
      let query = supabase
        .from('social_render_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching render jobs:', error);
      throw new Error(error?.message || 'Failed to fetch render jobs');
    }
  },

  /**
   * Get a single render job by ID
   */
  async getRenderJob(jobId: string): Promise<RenderJob | null> {
    try {
      const { data, error } = await supabase
        .from('social_render_queue')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching render job:', error);
      throw new Error(error?.message || 'Failed to fetch render job');
    }
  },

  /**
   * Retry a failed render job
   */
  async retryRenderJob(jobId: string): Promise<RenderJob | null> {
    try {
      const { data, error } = await supabase
        .from('social_render_queue')
        .update({
          status: 'pending',
          error_message: null,
          attempts: 0,
          next_retry_at: null
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error retrying render job:', error);
      throw new Error(error?.message || 'Failed to retry render job');
    }
  },

  /**
   * Subscribe to real-time updates for render queue
   */
  subscribeToRenderQueue(callback: (job: RenderJob) => void) {
    const channel = supabase
      .channel('render-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_render_queue'
        },
        (payload) => {
          callback(payload.new as RenderJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get render queue statistics
   */
  async getRenderQueueStats() {
    try {
      const { data, error } = await supabase
        .from('social_render_queue')
        .select('status');

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        pending: data.filter(j => j.status === 'pending').length,
        processing: data.filter(j => j.status === 'processing').length,
        completed: data.filter(j => j.status === 'completed').length,
        failed: data.filter(j => j.status === 'failed').length
      };

      return stats;
    } catch (error: any) {
      console.error('Error fetching render queue stats:', error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
    }
  }
};