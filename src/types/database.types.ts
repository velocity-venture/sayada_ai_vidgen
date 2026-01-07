export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          script_content: string;
          status: 'draft' | 'processing' | 'completed' | 'failed';
          duration_seconds: number;
          style_preset: string;
          video_url: string | null;
          audio_url: string | null;
          audio_duration_seconds: number | null;
          voice_id: string | null;
          audio_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          script_content: string;
          status?: 'draft' | 'processing' | 'completed' | 'failed';
          duration_seconds: number;
          style_preset?: string;
          video_url?: string | null;
          audio_url?: string | null;
          audio_duration_seconds?: number | null;
          voice_id?: string | null;
          audio_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          script_content?: string;
          status?: 'draft' | 'processing' | 'completed' | 'failed';
          duration_seconds?: number;
          style_preset?: string;
          video_url?: string | null;
          audio_url?: string | null;
          audio_duration_seconds?: number | null;
          voice_id?: string | null;
          audio_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clips: {
        Row: {
          id: string;
          project_id: string;
          scene_index: number;
          video_url: string | null;
          status: 'pending' | 'generating' | 'completed' | 'failed';
          prompt_used: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          scene_index: number;
          video_url?: string | null;
          status?: 'pending' | 'generating' | 'completed' | 'failed';
          prompt_used: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          scene_index?: number;
          video_url?: string | null;
          status?: 'pending' | 'generating' | 'completed' | 'failed';
          prompt_used?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      user_email_preferences: {
        Row: {
          id: string;
          user_id: string | null;
          platform_updates: boolean | null;
          video_completion_alerts: boolean | null;
          marketing_communications: boolean | null;
          content_recommendations: boolean | null;
          notification_frequency: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          platform_updates?: boolean | null;
          video_completion_alerts?: boolean | null;
          marketing_communications?: boolean | null;
          content_recommendations?: boolean | null;
          notification_frequency?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          platform_updates?: boolean | null;
          video_completion_alerts?: boolean | null;
          marketing_communications?: boolean | null;
          content_recommendations?: boolean | null;
          notification_frequency?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'free' | 'basic' | 'pro' | 'enterprise';
          videos_generated_this_month: number;
          monthly_video_limit: number;
          storage_used_mb: number;
          storage_limit_mb: number;
          subscription_start_date: string;
          subscription_end_date: string | null;
          auto_renew: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: 'free' | 'basic' | 'pro' | 'enterprise';
          videos_generated_this_month?: number;
          monthly_video_limit?: number;
          storage_used_mb?: number;
          storage_limit_mb?: number;
          subscription_start_date?: string;
          subscription_end_date?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: 'free' | 'basic' | 'pro' | 'enterprise';
          videos_generated_this_month?: number;
          monthly_video_limit?: number;
          storage_used_mb?: number;
          storage_limit_mb?: number;
          subscription_start_date?: string;
          subscription_end_date?: string | null;
          auto_renew?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_security_settings: {
        Row: {
          id: string;
          user_id: string;
          two_factor_enabled: boolean;
          two_factor_secret: string | null;
          last_password_change: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          last_password_change?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          two_factor_enabled?: boolean;
          two_factor_secret?: string | null;
          last_password_change?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_active_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_name: string | null;
          browser: string | null;
          ip_address: string | null;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_name?: string | null;
          browser?: string | null;
          ip_address?: string | null;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_name?: string | null;
          browser?: string | null;
          ip_address?: string | null;
          last_active?: string;
          created_at?: string;
        };
      };
      video_analytics: {
        Row: {
          id: string;
          project_id: string;
          total_views: number;
          total_likes: number;
          total_shares: number;
          total_downloads: number;
          total_comments: number;
          engagement_rate: number;
          average_watch_time_seconds: number;
          performance_score: number;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          total_views?: number;
          total_likes?: number;
          total_shares?: number;
          total_downloads?: number;
          total_comments?: number;
          engagement_rate?: number;
          average_watch_time_seconds?: number;
          performance_score?: number;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          total_views?: number;
          total_likes?: number;
          total_shares?: number;
          total_downloads?: number;
          total_comments?: number;
          engagement_rate?: number;
          average_watch_time_seconds?: number;
          performance_score?: number;
          last_updated?: string;
          created_at?: string;
        };
      };
      video_engagement_events: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          event_type: Database['public']['Enums']['engagement_event_type'];
          event_metadata: Record<string, any> | null;
          watch_duration_seconds: number | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          event_type: Database['public']['Enums']['engagement_event_type'];
          event_metadata?: Record<string, any> | null;
          watch_duration_seconds?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          event_type?: Database['public']['Enums']['engagement_event_type'];
          event_metadata?: Record<string, any> | null;
          watch_duration_seconds?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      scheduled_posts: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          platform: 'youtube' | 'instagram' | 'facebook' | 'twitter';
          caption: string;
          hashtags: string[];
          scheduled_time: string;
          timezone: string;
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
          thumbnail_url: string | null;
          youtube_category: string | null;
          instagram_feed_type: string | null;
          facebook_page_id: string | null;
          twitter_is_thread: boolean;
          recurring_pattern: string | null;
          optimal_posting_time: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          platform: 'youtube' | 'instagram' | 'facebook' | 'twitter';
          caption: string;
          hashtags?: string[];
          scheduled_time: string;
          timezone?: string;
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
          thumbnail_url?: string | null;
          youtube_category?: string | null;
          instagram_feed_type?: string | null;
          facebook_page_id?: string | null;
          twitter_is_thread?: boolean;
          recurring_pattern?: string | null;
          optimal_posting_time?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          platform?: 'youtube' | 'instagram' | 'facebook' | 'twitter';
          caption?: string;
          hashtags?: string[];
          scheduled_time?: string;
          timezone?: string;
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
          thumbnail_url?: string | null;
          youtube_category?: string | null;
          instagram_feed_type?: string | null;
          facebook_page_id?: string | null;
          twitter_is_thread?: boolean;
          recurring_pattern?: string | null;
          optimal_posting_time?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      export_history: {
        Row: {
          id: string;
          scheduled_post_id: string;
          project_id: string;
          user_id: string;
          platform: 'youtube' | 'instagram' | 'facebook' | 'twitter';
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
          published_at: string | null;
          post_url: string | null;
          error_message: string | null;
          engagement_metrics: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          scheduled_post_id: string;
          project_id: string;
          user_id: string;
          platform: 'youtube' | 'instagram' | 'facebook' | 'twitter';
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
          published_at?: string | null;
          post_url?: string | null;
          error_message?: string | null;
          engagement_metrics?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          scheduled_post_id?: string;
          project_id?: string;
          user_id?: string;
          platform?: 'youtube' | 'instagram' | 'facebook' | 'twitter';
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
          published_at?: string | null;
          post_url?: string | null;
          error_message?: string | null;
          engagement_metrics?: Record<string, any>;
          created_at?: string;
        };
      };
      video_templates: {
        Row: {
          id: string;
          name: string;
          category: TemplateCategory;
          description: string | null;
          duration_seconds: number;
          style_preset: string;
          voice_id: string | null;
          thumbnail_url: string | null;
          is_system_template: boolean;
          usage_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: TemplateCategory;
          description?: string | null;
          duration_seconds: number;
          style_preset?: string;
          voice_id?: string | null;
          thumbnail_url?: string | null;
          is_system_template?: boolean;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: TemplateCategory;
          description?: string | null;
          duration_seconds?: number;
          style_preset?: string;
          voice_id?: string | null;
          thumbnail_url?: string | null;
          is_system_template?: boolean;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      analytics_dashboard_summary: {
        Row: {
          project_id: string;
          title: string;
          project_created_at: string;
          status: string;
          total_views: number;
          total_likes: number;
          total_shares: number;
          total_downloads: number;
          engagement_rate: number;
          performance_score: number;
          analytics_updated_at: string | null;
        };
      };
    };
    Enums: {
      engagement_event_type: 'view' | 'like' | 'share' | 'download' | 'comment';
      template_category: 'devotional' | 'testimony' | 'prayer' | 'worship' | 'teaching' | 'evangelism';
    };
  };
};

export type EngagementEventType = Database['public']['Enums']['engagement_event_type'];
export type TemplateCategory =
  | "cinematic_story" |"high_energy_promo" |"modern_minimalist"
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';
export type WebhookStatus = 'pending' | 'success' | 'failed' | 'retrying';

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  status: ApiKeyStatus;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  project_id: string;
  webhook_url: string;
  status: WebhookStatus;
  request_payload: Record<string, any>;
  response_payload: Record<string, any> | null;
  response_status_code: number | null;
  error_message: string | null;
  retry_count: number;
  next_retry_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}