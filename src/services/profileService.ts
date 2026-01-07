import { supabase } from '../lib/supabase/client';
import { Database } from '../types/database.types';
import { UserProfile, EmailPreferences, UserSubscription, SecuritySettings, ActiveSession } from '../types/models';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type EmailPreferencesRow = Database['public']['Tables']['user_email_preferences']['Row'];
type UserSubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row'];
type SecuritySettingsRow = Database['public']['Tables']['user_security_settings']['Row'];
type ActiveSessionRow = Database['public']['Tables']['user_active_sessions']['Row'];

type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];
type EmailPreferencesUpdate = Database['public']['Tables']['user_email_preferences']['Update'];
type SecuritySettingsUpdate = Database['public']['Tables']['user_security_settings']['Update'];

export const profileService = {
  // Get user profile with all related data
  async getProfile(userId: string): Promise<{
    profile: UserProfile | null;
    emailPreferences: EmailPreferences | null;
    subscription: UserSubscription | null;
    securitySettings: SecuritySettings | null;
    error: Error | null;
  }> {
    try {
      const [profileResult, prefsResult, subResult, secResult] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('user_email_preferences').select('*').eq('user_id', userId).single(),
        supabase.from('user_subscriptions').select('*').eq('user_id', userId).single(),
        supabase.from('user_security_settings').select('*').eq('user_id', userId).single(),
      ]);

      if (profileResult.error) throw profileResult.error;

      const profile: UserProfile = {
        id: profileResult.data.id,
        email: profileResult.data.email,
        fullName: profileResult.data.full_name,
        avatarUrl: profileResult.data.avatar_url,
        ministryAffiliation: profileResult.data.ministry_affiliation,
        bio: profileResult.data.bio,
        phone: profileResult.data.phone,
        createdAt: profileResult.data.created_at,
        updatedAt: profileResult.data.updated_at,
      };

      const emailPreferences: EmailPreferences | null = prefsResult.data ? {
        id: prefsResult.data.id,
        userId: prefsResult.data.user_id,
        videoCompletionAlerts: prefsResult.data.video_completion_alerts,
        platformUpdates: prefsResult.data.platform_updates,
        scriptureRecommendations: prefsResult.data.scripture_recommendations,
        marketingCommunications: prefsResult.data.marketing_communications,
        notificationFrequency: prefsResult.data.notification_frequency,
        createdAt: prefsResult.data.created_at,
        updatedAt: prefsResult.data.updated_at,
      } : null;

      const subscription: UserSubscription | null = subResult.data ? {
        id: subResult.data.id,
        userId: subResult.data.user_id,
        tier: subResult.data.tier,
        videosGeneratedThisMonth: subResult.data.videos_generated_this_month,
        monthlyVideoLimit: subResult.data.monthly_video_limit,
        storageUsedMb: subResult.data.storage_used_mb,
        storageLimitMb: subResult.data.storage_limit_mb,
        subscriptionStartDate: subResult.data.subscription_start_date,
        subscriptionEndDate: subResult.data.subscription_end_date,
        autoRenew: subResult.data.auto_renew,
        createdAt: subResult.data.created_at,
        updatedAt: subResult.data.updated_at,
      } : null;

      const securitySettings: SecuritySettings | null = secResult.data ? {
        id: secResult.data.id,
        userId: secResult.data.user_id,
        twoFactorEnabled: secResult.data.two_factor_enabled,
        twoFactorSecret: secResult.data.two_factor_secret,
        lastPasswordChange: secResult.data.last_password_change,
        createdAt: secResult.data.created_at,
        updatedAt: secResult.data.updated_at,
      } : null;

      return { profile, emailPreferences, subscription, securitySettings, error: null };
    } catch (error) {
      return { 
        profile: null, 
        emailPreferences: null, 
        subscription: null, 
        securitySettings: null, 
        error: error as Error 
      };
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: Error | null }> {
    try {
      const dbUpdates: UserProfileUpdate = {};
      
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.ministryAffiliation !== undefined) dbUpdates.ministry_affiliation = updates.ministryAffiliation;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', userId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Update email preferences
  async updateEmailPreferences(
    userId: string, 
    updates: Partial<EmailPreferences>
  ): Promise<{ error: Error | null }> {
    try {
      const dbUpdates: EmailPreferencesUpdate = {};
      
      if (updates.videoCompletionAlerts !== undefined) 
        dbUpdates.video_completion_alerts = updates.videoCompletionAlerts;
      if (updates.platformUpdates !== undefined) 
        dbUpdates.platform_updates = updates.platformUpdates;
      if (updates.scriptureRecommendations !== undefined) 
        dbUpdates.scripture_recommendations = updates.scriptureRecommendations;
      if (updates.marketingCommunications !== undefined) 
        dbUpdates.marketing_communications = updates.marketingCommunications;
      if (updates.notificationFrequency !== undefined) 
        dbUpdates.notification_frequency = updates.notificationFrequency;

      const { error } = await supabase
        .from('user_email_preferences')
        .update(dbUpdates)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Get active sessions
  async getActiveSessions(userId: string): Promise<{ 
    data: ActiveSession[] | null; 
    error: Error | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('user_active_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (error) throw error;

      const sessions: ActiveSession[] = (data || []).map((row: ActiveSessionRow) => ({
        id: row.id,
        userId: row.user_id,
        deviceName: row.device_name,
        browser: row.browser,
        ipAddress: row.ip_address,
        lastActive: row.last_active,
        createdAt: row.created_at,
      }));

      return { data: sessions, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // Update security settings
  async updateSecuritySettings(
    userId: string,
    updates: Partial<SecuritySettings>
  ): Promise<{ error: Error | null }> {
    try {
      const dbUpdates: SecuritySettingsUpdate = {};
      
      if (updates.twoFactorEnabled !== undefined) 
        dbUpdates.two_factor_enabled = updates.twoFactorEnabled;
      if (updates.twoFactorSecret !== undefined) 
        dbUpdates.two_factor_secret = updates.twoFactorSecret;

      const { error } = await supabase
        .from('user_security_settings')
        .update(dbUpdates)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Revoke session
  async revokeSession(sessionId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('user_active_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },
};