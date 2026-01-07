import { supabase } from '@/lib/supabase/client';

export interface WebhookDelivery {
  id: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  webhook_config_id?: string;
  project_id?: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  sent_at?: string;
  created_at: string;
  attempts: number;
  max_attempts: number;
  next_retry_at?: string;
}

export const webhookService = {
  /**
   * Get all webhook deliveries with optional status filter
   */
  async getWebhookDeliveries(statusFilter?: string): Promise<WebhookDelivery[]> {
    try {
      let query = supabase
        .from('webhook_deliveries')
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
      console.error('Error fetching webhook deliveries:', error);
      throw new Error(error?.message || 'Failed to fetch webhook deliveries');
    }
  },

  /**
   * Get webhook deliveries for a specific project
   */
  async getWebhookDeliveriesForProject(projectId: string): Promise<WebhookDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching webhook deliveries for project:', error);
      throw new Error(error?.message || 'Failed to fetch webhook deliveries');
    }
  },

  /**
   * Get a single webhook delivery by ID
   */
  async getWebhookDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching webhook delivery:', error);
      throw new Error(error?.message || 'Failed to fetch webhook delivery');
    }
  },

  /**
   * Subscribe to real-time updates for webhook deliveries
   */
  subscribeToWebhookDeliveries(callback: (delivery: WebhookDelivery) => void) {
    const channel = supabase
      .channel('webhook-deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_deliveries'
        },
        (payload) => {
          callback(payload.new as WebhookDelivery);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get webhook delivery statistics
   */
  async getWebhookDeliveryStats() {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('status, response_status');

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        pending: data.filter(d => d.status === 'pending').length,
        sent: data.filter(d => d.status === 'sent').length,
        failed: data.filter(d => d.status === 'failed').length,
        successRate: data.length > 0 
          ? ((data.filter(d => d.status === 'sent').length / data.length) * 100).toFixed(1)
          : '0'
      };

      return stats;
    } catch (error: any) {
      console.error('Error fetching webhook delivery stats:', error);
      return {
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0,
        successRate: '0'
      };
    }
  }
};