// Application models using camelCase (Next.js convention)
export interface EmailPreferences {
  id: string;
  userId: string;
  videoCompletionAlerts: boolean;
  platformUpdates: boolean;
  scriptureRecommendations: boolean;
  marketingCommunications: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  videosGeneratedThisMonth: number;
  monthlyVideoLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettings {
  id: string;
  userId: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  lastPasswordChange: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
  deviceName: string | null;
  browser: string | null;
  ipAddress: string | null;
  lastActive: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  ministryAffiliation: string | null;
  bio: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface Project {
  id: string;
  userId: string;
  title: string;
  scriptContent: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  durationSeconds: number;
  stylePreset: string;
  videoUrl?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  voiceId?: string;
  audioGeneratedAt?: string;
  aspectRatio?: AspectRatio;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInsert {
  userId: string;
  title: string;
  scriptContent: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  durationSeconds: number;
  stylePreset?: string;
}

export interface ProjectUpdate {
  title?: string;
  scriptContent?: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  durationSeconds?: number;
  stylePreset?: string;
}

export interface ProjectStats {
  totalVideos: number;
  activeProjects: number;
  totalMinutes: number;
  avgQuality: number;
}

// Add Clip model types
export type ClipStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Clip {
  id: string;
  project_id: string;
  scene_index: number;
  video_url: string | null;
  status: ClipStatus;
  prompt_used: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ClipGenerationProgress {
  total: number;
  completed: number;
  generating: number;
  failed: number;
  pending: number;
}

// Add video composition models
export interface VideoComposition {
  id: string;
  projectId: string;
  clips: ComposedClip[];
  totalDuration: number;
  exportSettings: ExportSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ComposedClip {
  id: string;
  clipId: string;
  sceneIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  fadeIn?: number;
  fadeOut?: number;
  transition?: TransitionEffect;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface TransitionEffect {
  type: 'cross-dissolve' | 'light-rays' | 'gentle-wipe' | 'fade-to-white' | 'none';
  duration: number;
}

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm';
  quality: 'high' | 'medium' | 'low';
  resolution: '1080p' | '720p' | '480p';
  platform?: 'youtube' | 'instagram' | 'facebook' | 'twitter' | 'custom';
}

export interface TimelineClip extends ComposedClip {
  isSelected?: boolean;
  isPlaying?: boolean;
  error?: string;
}

export type EngagementEventType = 'view' | 'like' | 'share' | 'download' | 'comment';

export interface VideoAnalytics {
  id: string;
  projectId: string;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalComments: number;
  engagementRate: number;
  averageWatchTimeSeconds: number;
  performanceScore: number;
  lastUpdated: string;
  createdAt: string;
}

export interface VideoEngagementEvent {
  id: string;
  projectId: string;
  userId: string | null;
  eventType: EngagementEventType;
  eventMetadata?: Record<string, any>;
  watchDurationSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AnalyticsDashboardSummary {
  projectId: string;
  title: string;
  projectCreatedAt: string;
  status: string;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  engagementRate: number;
  performanceScore: number;
  analyticsUpdatedAt: string | null;
}

export interface AnalyticsMetrics {
  totalProjects: number;
  totalViews: number;
  totalEngagements: number;
  averageEngagementRate: number;
  topPerformingProjects: AnalyticsDashboardSummary[];
}

export interface AnalyticsTimeSeriesData {
  date: string;
  views: number;
  engagements: number;
  shares: number;
  downloads: number;
}

export type ExportStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
export type SocialPlatform = 'youtube' | 'instagram' | 'facebook' | 'twitter';

export interface ScheduledPost {
  id: string;
  projectId: string;
  userId: string;
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  scheduledTime: string;
  timezone: string;
  status: ExportStatus;
  thumbnailUrl?: string;
  youtubeCategory?: string;
  instagramFeedType?: string;
  facebookPageId?: string;
  twitterIsThread: boolean;
  recurringPattern?: string;
  optimalPostingTime: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportHistory {
  id: string;
  scheduledPostId: string;
  projectId: string;
  userId: string;
  platform: SocialPlatform;
  status: ExportStatus;
  publishedAt?: string;
  postUrl?: string;
  errorMessage?: string;
  engagementMetrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  createdAt: string;
}

export type TemplateCategory = 
  | 'cinematic_story' |'high_energy_promo' |'modern_minimalist' |'product_demo' |'testimonial' |'explainer';

export interface VideoTemplate {
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
  // AI Configuration Fields
  elevenlabs_voice_id: string | null;
  pika_style_prompt: string | null;
  pika_negative_prompt: string | null;
  motion_strength: number | null; // 1-4: Low to Very High motion
}

export interface CreateVideoTemplateInput {
  name: string;
  description?: string;
  category: TemplateCategory;
  style_preset: string;
  duration_seconds: number;
  voice_id?: string;
  thumbnail_url?: string;
  // AI Configuration
  elevenlabs_voice_id?: string;
  pika_style_prompt?: string;
  pika_negative_prompt?: string;
  motion_strength?: number;
}

export interface UpdateVideoTemplateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  style_preset?: string;
  duration_seconds?: number;
  voice_id?: string;
  thumbnail_url?: string;
  // AI Configuration
  elevenlabs_voice_id?: string;
  pika_style_prompt?: string;
  pika_negative_prompt?: string;
  motion_strength?: number;
}

// API Integration & Webhooks Types
export type ApiKeyStatus = 'active' | 'inactive' | 'revoked';
export type WebhookStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface ApiKey {
  id: string;
  user_id: string;
  key_name: string;
  api_key: string;
  status: ApiKeyStatus;
  last_used_at: string | null;
  expires_at: string | null;
  rate_limit_per_minute: number;
  requests_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookConfig {
  id: string;
  user_id: string;
  webhook_url: string;
  is_active: boolean;
  secret_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_config_id: string;
  project_id: string;
  status: WebhookStatus;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ApiRequestLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  request_body: Record<string, any> | null;
  response_status: number | null;
  response_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// API Request/Response Types
export interface GenerateVideoApiRequest {
  prompt: string;
  template?: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  burn_subtitles?: boolean;
  webhook_url?: string;
  duration_seconds?: number;
  voice_id?: string;
  assets?: Array<{ type: 'video' | 'audio' | 'image'; url: string }>; // For stitcher mode
}

export interface GenerateVideoApiResponse {
  success: boolean;
  job_id?: string;
  project_id?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  video_url?: string;
  webhook_delivery_id?: string;
  estimated_completion_time?: string;
  error?: string;
}

// Subtitle & Transcription Types
export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface WhisperTranscriptionResult {
  text: string;
  segments: SubtitleSegment[];
  language: string;
  duration: number;
}

export type SubtitleStylePreset = 'auto' | 'cinematic' | 'impact' | 'minimal';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  position: 'center-middle' | 'bottom-center' | 'top-center';
  alignment: 'center' | 'left' | 'right';
  bold: boolean;
  uppercase: boolean;
}

export interface TemplateSubtitleStyle {
  'High Energy Promo': SubtitleStyle;
  'Photorealistic Cinematic': SubtitleStyle;
  'Impact': SubtitleStyle;
  'Minimal': SubtitleStyle;
  [key: string]: SubtitleStyle;
}

// Subtitle Editor Types
export interface SubtitleEditorSegment extends SubtitleSegment {
  isEditing?: boolean;
  hasChanges?: boolean;
}

export interface SubtitleEditorState {
  segments: SubtitleEditorSegment[];
  selectedSegmentId: number | null;
  currentStyle: SubtitleStylePreset;
  isPlaying: boolean;
  currentTime: number;
}

/**
 * Render queue job status
 */
export type RenderQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Social render queue job
 */
export interface SocialRenderJob {
  id: string;
  project_id: string;
  user_id: string;
  aspect_ratio: string;
  burn_subtitles: boolean;
  subtitle_style?: string;
  status: RenderQueueStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  output_url?: string;
  error_message?: string;
  processing_time_seconds?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  next_retry_at?: string;
}

/**
 * Render job creation parameters
 */
export interface CreateRenderJobParams {
  projectId: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
  burnSubtitles: boolean;
  subtitleStyle?: string;
  priority?: number;
}

/**
 * Render processing result
 */
export interface RenderProcessingResult {
  downloadUrl: string;
  jobId: string;
  status: RenderQueueStatus;
}

/**
 * AI Director Orchestration Types
 */
export interface VideoScene {
  index: number;
  text: string;
  visualDescription: string;
  duration: number;
  pikaPrompt: string;
}

export interface VideoScript {
  title: string;
  totalDuration: number;
  scenes: VideoScene[];
}

export interface OrchestrationOptions {
  userPrompt: string;
  targetDuration: number;
  voiceId: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  userId: string;
}

export interface OrchestrationResult {
  success: boolean;
  projectId?: string;
  finalVideoUrl?: string;
  error?: string;
}

/**
 * Storage Cleanup Types
 */
export type AssetType = 'final-video' | 'intermediate-audio' | 'intermediate-video';
export type CleanupStatus = 'pending' | 'completed' | 'failed';

export interface CleanupQueueEntry {
  id: string;
  project_id: string;
  user_id: string;
  asset_type: AssetType;
  asset_url: string;
  scheduled_deletion_at: string;
  status: CleanupStatus;
  error_message?: string;
  completed_at?: string;
  created_at: string;
}

export interface CleanupPolicy {
  retentionHours: number;
  assetType: AssetType;
}