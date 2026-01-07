import { supabase } from '@/lib/supabase/client';
import { ApiKey, WebhookConfig, WebhookDelivery, ApiRequestLog } from '@/types/models';

export const apiKeyService = {
  /**
   * Generate a new API key for the authenticated user
   */
  async generateApiKey(keyName: string, expiresInDays?: number): Promise<{ data: ApiKey | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: keyData, error: keyError } = await supabase.rpc('generate_api_key');
      if (keyError) return { data: null, error: keyError };

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_name: keyName,
          api_key: keyData,
          expires_at: expiresAt,
          status: 'active'
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get all API keys for the authenticated user
   */
  async getUserApiKeys(): Promise<{ data: ApiKey[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: string): Promise<{ data: ApiKey | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', apiKeyId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(apiKeyId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', apiKeyId);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Get API usage statistics
   */
  async getApiUsageStats(apiKeyId: string): Promise<{ data: ApiRequestLog[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('api_request_logs')
        .select('*')
        .eq('api_key_id', apiKeyId)
        .order('created_at', { ascending: false })
        .limit(100);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
};

export const webhookService = {
  /**
   * Create a new webhook configuration
   */
  async createWebhookConfig(webhookUrl: string, secretKey?: string): Promise<{ data: WebhookConfig | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          user_id: user.id,
          webhook_url: webhookUrl,
          secret_key: secretKey,
          is_active: true
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get all webhook configurations for the authenticated user
   */
  async getUserWebhookConfigs(): Promise<{ data: WebhookConfig[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Update webhook configuration
   */
  async updateWebhookConfig(webhookId: string, updates: Partial<WebhookConfig>): Promise<{ data: WebhookConfig | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .update(updates)
        .eq('id', webhookId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Delete webhook configuration
   */
  async deleteWebhookConfig(webhookId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', webhookId);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  /**
   * Get webhook delivery history
   */
  async getWebhookDeliveries(webhookConfigId?: string): Promise<{ data: WebhookDelivery[] | null; error: any }> {
    try {
      let query = supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (webhookConfigId) {
        query = query.eq('webhook_config_id', webhookConfigId);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
};