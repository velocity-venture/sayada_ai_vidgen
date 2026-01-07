'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import { renderQueueService, RenderJob } from '@/services/renderQueueService';
import { webhookService, WebhookDelivery } from '@/services/webhookService';

const AutomationMissionControl = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'webhooks'>('queue');
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [queueFilter, setQueueFilter] = useState('all');
  const [webhookFilter, setWebhookFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 });
  const [webhookStats, setWebhookStats] = useState({ total: 0, pending: 0, sent: 0, failed: 0, successRate: '0' });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadData();
      loadStats();
    }
  }, [user, queueFilter, webhookFilter]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubscribeQueue = renderQueueService.subscribeToRenderQueue((job) => {
      setRenderJobs((prev) => {
        const existing = prev.find(j => j.id === job.id);
        if (existing) {
          return prev.map(j => j.id === job.id ? job : j);
        }
        return [job, ...prev];
      });
      loadStats();
    });

    const unsubscribeWebhooks = webhookService.subscribeToWebhookDeliveries((delivery) => {
      setWebhookDeliveries((prev) => {
        const existing = prev.find(d => d.id === delivery.id);
        if (existing) {
          return prev.map(d => d.id === delivery.id ? delivery : d);
        }
        return [delivery, ...prev];
      });
      loadStats();
    });

    return () => {
      unsubscribeQueue();
      unsubscribeWebhooks();
    };
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobs, deliveries] = await Promise.all([
        renderQueueService.getRenderJobs(queueFilter),
        webhookService.getWebhookDeliveries(webhookFilter)
      ]);
      setRenderJobs(jobs);
      setWebhookDeliveries(deliveries);
    } catch (error: any) {
      showNotification('error', error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const [qStats, wStats] = await Promise.all([
      renderQueueService.getRenderQueueStats(),
      webhookService.getWebhookDeliveryStats()
    ]);
    setQueueStats(qStats);
    setWebhookStats(wStats);
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await renderQueueService.retryRenderJob(jobId);
      showNotification('success', 'Job queued for retry');
      loadData();
    } catch (error: any) {
      showNotification('error', error?.message || 'Failed to retry job');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('success', 'Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      sent: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="ExclamationTriangleIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please sign in to access Automation Mission Control</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-lg shadow-glow-medium border animate-fade-in ${
          notification.type === 'success' ?'bg-green-500/20 text-green-400 border-green-500/30' :'bg-red-500/20 text-red-400 border-red-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <Icon name={notification.type === 'success' ? 'CheckCircleIcon' : 'XCircleIcon'} size={20} />
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="pt-24 pb-12 px-6 lg:px-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Automation Mission Control
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time monitoring of render queue jobs and webhook delivery logs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 shadow-glow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="QueueListIcon" size={20} className="text-primary" />
              <span className="text-sm text-muted-foreground">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{queueStats.total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-glow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="ClockIcon" size={20} className="text-yellow-400" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{queueStats.pending}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-glow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="ArrowPathIcon" size={20} className="text-blue-400" />
              <span className="text-sm text-muted-foreground">Processing</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{queueStats.processing}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-glow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="CheckCircleIcon" size={20} className="text-green-400" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{queueStats.completed}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-glow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="XCircleIcon" size={20} className="text-red-400" />
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{queueStats.failed}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-3 font-medium transition-all duration-250 ${
              activeTab === 'queue' ?'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="QueueListIcon" size={20} />
              <span>Render Queue</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-6 py-3 font-medium transition-all duration-250 ${
              activeTab === 'webhooks' ?'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="BoltIcon" size={20} />
              <span>Webhook Deliveries</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {webhookStats.successRate}% success
              </span>
            </div>
          </button>
        </div>

        {/* Render Queue Panel */}
        {activeTab === 'queue' && (
          <div className="bg-card border border-border rounded-lg shadow-glow-soft">
            {/* Filter Controls */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-4">
                <label className="text-sm text-muted-foreground">Filter by status:</label>
                <div className="flex gap-2">
                  {['all', 'pending', 'processing', 'completed', 'failed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setQueueFilter(filter)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-250 ${
                        queueFilter === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Icon name="ArrowPathIcon" size={32} className="text-primary animate-spin" />
                </div>
              ) : renderJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="QueueListIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No render jobs found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Job ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Format</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duration</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {renderJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyToClipboard(job.id)}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                            title="Click to copy"
                          >
                            <span className="font-mono text-sm">{job.id.slice(0, 8)}...</span>
                            <Icon name="ClipboardDocumentIcon" size={16} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon 
                              name={job.aspect_ratio === '9:16' ? 'DevicePhoneMobileIcon' : job.aspect_ratio === '1:1' ? 'Square2StackIcon' : 'RectangleStackIcon'} 
                              size={20} 
                              className="text-muted-foreground" 
                            />
                            <span className="text-sm text-foreground">{job.aspect_ratio}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {job.processing_time_seconds ? `${job.processing_time_seconds}s` : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {job.status === 'failed' && (
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-md hover:bg-primary/30 transition-all duration-250"
                            >
                              <Icon name="ArrowPathIcon" size={16} />
                              <span className="text-sm font-medium">Retry</span>
                            </button>
                          )}
                          {job.status === 'completed' && job.output_url && (
                            <button
                              onClick={() => copyToClipboard(job.output_url!)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/30 transition-all duration-250"
                            >
                              <Icon name="LinkIcon" size={16} />
                              <span className="text-sm font-medium">Copy URL</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Webhook Deliveries Panel */}
        {activeTab === 'webhooks' && (
          <div className="bg-card border border-border rounded-lg shadow-glow-soft">
            {/* Filter Controls */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-4">
                <label className="text-sm text-muted-foreground">Filter by status:</label>
                <div className="flex gap-2">
                  {['all', 'pending', 'sent', 'failed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setWebhookFilter(filter)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-250 ${
                        webhookFilter === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Webhooks Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Icon name="ArrowPathIcon" size={32} className="text-primary animate-spin" />
                </div>
              ) : webhookDeliveries.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="BoltIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No webhook deliveries found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">HTTP Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Sent</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {webhookDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          {getStatusBadge(delivery.status)}
                        </td>
                        <td className="px-4 py-3">
                          {delivery.response_status ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              delivery.response_status >= 200 && delivery.response_status < 300
                                ? 'bg-green-500/20 text-green-400' :'bg-red-500/20 text-red-400'
                            }`}>
                              {delivery.response_status}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(delivery.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(delivery.sent_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedPayload(delivery.payload)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-md hover:bg-primary/30 transition-all duration-250"
                          >
                            <Icon name="DocumentTextIcon" size={16} />
                            <span className="text-sm font-medium">View Payload</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Payload Modal */}
        {selectedPayload && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" onClick={() => setSelectedPayload(null)}>
            <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto shadow-glow-medium" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">Webhook Payload</h3>
                <button
                  onClick={() => setSelectedPayload(null)}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <Icon name="XMarkIcon" size={24} className="text-muted-foreground" />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <pre className="text-sm text-foreground overflow-x-auto">
                    {JSON.stringify(selectedPayload, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    copyToClipboard(JSON.stringify(selectedPayload, null, 2));
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-250"
                >
                  <Icon name="ClipboardDocumentIcon" size={20} />
                  <span className="font-medium">Copy to Clipboard</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationMissionControl;