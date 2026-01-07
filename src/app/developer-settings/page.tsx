'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiKeyService } from '@/services/apiKeyService';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';

interface ApiKey {
  id: string;
  key_name: string;
  api_key: string;
  status: 'active' | 'inactive' | 'revoked';
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  requests_count: number;
  rate_limit_per_minute: number;
}

interface ApiRequestLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  request_body: any;
  response_status: number;
  response_time_ms: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

type TabType = 'api-keys' | 'request-logs';

const DeveloperSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('api-keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [requestLogs, setRequestLogs] = useState<ApiRequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Key generation state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Revoke confirmation
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'request-logs' && requestLogs.length === 0) {
      loadRequestLogs();
    }
  }, [user, activeTab]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await apiKeyService.getUserApiKeys();
      
      if (fetchError) {
        setError(fetchError.message || 'Failed to load API keys');
        return;
      }
      
      setApiKeys(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestLogs = async () => {
    try {
      setLogsLoading(true);
      setError(null);
      
      // Get all API keys first
      const { data: keys } = await apiKeyService.getUserApiKeys();
      if (!keys || keys.length === 0) {
        setRequestLogs([]);
        return;
      }

      // Fetch logs for all user's API keys
      const allLogs: ApiRequestLog[] = [];
      for (const key of keys) {
        const { data: logs } = await apiKeyService.getApiUsageStats(key.id);
        if (logs && logs.length > 0) {
          allLogs.push(...logs);
        }
      }

      // Sort by timestamp descending
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRequestLogs(allLogs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load request logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const { data, error: genError } = await apiKeyService.generateApiKey(keyName.trim());
      
      if (genError) {
        setError(genError.message || 'Failed to generate API key');
        return;
      }
      
      if (data) {
        setGeneratedKey(data.api_key);
        setKeyName('');
        await loadApiKeys();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccess('API key copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      setError(null);
      const { error: revokeError } = await apiKeyService.revokeApiKey(keyId);
      
      if (revokeError) {
        setError(revokeError.message || 'Failed to revoke API key');
        return;
      }
      
      setSuccess('API key revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
      setRevokeKeyId(null);
      await loadApiKeys();
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke API key');
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return key;
    return `${key.substring(0, 8)}${'•'.repeat(32)}${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (status >= 400 && status < 500) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'POST': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'PUT': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'DELETE': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20">
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] gap-4">
            <Icon name="ExclamationTriangleIcon" size={48} className="text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Please sign in to access Developer Settings</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="KeyIcon" size={32} className="text-primary" />
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Developer Settings
              </h1>
            </div>
            <p className="text-muted-foreground font-caption">
              Manage API keys for n8n integration and view request logs
            </p>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <Icon name="ExclamationTriangleIcon" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-500 font-caption text-sm">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-400">
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
              <Icon name="CheckCircleIcon" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-500 font-caption text-sm flex-1">{success}</p>
              <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-400">
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="bg-card rounded-lg border border-border shadow-glow-soft overflow-hidden mb-8">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`flex-1 px-6 py-4 font-caption font-medium transition-all duration-250 flex items-center justify-center gap-2 ${
                  activeTab === 'api-keys' ?'bg-primary text-primary-foreground shadow-glow-soft' :'text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <Icon name="KeyIcon" size={20} />
                <span>API Keys</span>
              </button>
              <button
                onClick={() => setActiveTab('request-logs')}
                className={`flex-1 px-6 py-4 font-caption font-medium transition-all duration-250 flex items-center justify-center gap-2 ${
                  activeTab === 'request-logs' ?'bg-primary text-primary-foreground shadow-glow-soft' :'text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <Icon name="DocumentTextIcon" size={20} />
                <span>Request Logs</span>
                {requestLogs.length > 0 && (
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs">
                    {requestLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* API Keys Tab Content */}
            {activeTab === 'api-keys' && (
              <div className="p-6">
                {/* Generate New Key Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
                        Generate New API Key
                      </h2>
                      <p className="text-sm text-muted-foreground font-caption">
                        Create a secure Bearer token for n8n workflows
                      </p>
                    </div>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-250 flex items-center gap-2 shadow-glow-soft focus-ring"
                    >
                      <Icon name="PlusCircleIcon" size={20} />
                      <span className="font-caption font-medium">Generate Key</span>
                    </button>
                  </div>

                  {/* Security Warning */}
                  <div className="bg-accent/10 border border-accent/20 rounded-md p-4 flex items-start gap-3">
                    <Icon name="ShieldCheckIcon" size={20} className="text-accent mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground font-caption">
                      <p className="font-medium text-foreground mb-1">Security Best Practice</p>
                      <p>API keys are shown only once upon creation. Store them securely.</p>
                    </div>
                  </div>
                </div>

                {/* Active API Keys List */}
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
                    Active API Keys ({apiKeys.length})
                  </h2>

                  {apiKeys.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-lg border border-border">
                      <Icon name="KeyIcon" size={48} className="text-muted-foreground/50" />
                      <p className="text-muted-foreground font-caption">No API keys created yet</p>
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-250 font-caption text-sm"
                      >
                        Create Your First Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="bg-muted/20 rounded-lg border border-border p-6 hover:bg-muted/30 transition-colors duration-250">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Key Name and Status */}
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-heading text-lg font-semibold text-foreground">
                                  {key.key_name}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-caption font-medium border ${
                                    key.status === 'active' ?'bg-green-500/10 text-green-500 border-green-500/20'
                                      : key.status === 'revoked' ?'bg-red-500/10 text-red-500 border-red-500/20' :'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                  }`}
                                >
                                  {key.status.toUpperCase()}
                                </span>
                              </div>

                              {/* Masked API Key */}
                              <div className="bg-muted/50 rounded-md p-3 mb-4 flex items-center gap-2">
                                <code className="flex-1 text-sm font-mono text-foreground truncate">
                                  {maskApiKey(key.api_key)}
                                </code>
                                <button
                                  onClick={() => handleCopyKey(key.api_key)}
                                  className="p-1.5 hover:bg-background rounded transition-colors duration-250"
                                  title="Copy API key"
                                >
                                  <Icon name="ClipboardDocumentIcon" size={18} className="text-muted-foreground" />
                                </button>
                              </div>

                              {/* Key Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-caption">
                                <div>
                                  <p className="text-muted-foreground mb-1">Created</p>
                                  <p className="text-foreground">{formatDate(key.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Last Used</p>
                                  <p className="text-foreground">{formatDate(key.last_used_at)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Requests</p>
                                  <p className="text-foreground">{key.requests_count?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Rate Limit</p>
                                  <p className="text-foreground">{key.rate_limit_per_minute}/min</p>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            {key.status === 'active' && (
                              <button
                                onClick={() => setRevokeKeyId(key.id)}
                                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-all duration-250 flex items-center gap-2 font-caption text-sm focus-ring"
                              >
                                <Icon name="XCircleIcon" size={16} />
                                <span>Revoke</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* API Usage Info */}
                <div className="mt-8 bg-accent/10 border border-accent/20 rounded-lg p-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="InformationCircleIcon" size={20} className="text-primary" />
                    API Integration Guide
                  </h3>
                  <div className="space-y-4 text-sm font-caption text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">Authentication</p>
                      <p>Include your API key in the Authorization header:</p>
                      <code className="block mt-2 bg-muted/50 rounded-md p-3 text-xs font-mono">
                        Authorization: Bearer YOUR_API_KEY
                      </code>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">API Endpoint</p>
                      <code className="block mt-2 bg-muted/50 rounded-md p-3 text-xs font-mono">
                        POST /api/v1/generate
                      </code>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Example Payload</p>
                      <pre className="mt-2 bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
{`{
  "prompt": "Create a cinematic promo",
  "template_mode": "auto",
  "webhook_url": "https://n8n.example.com/webhook"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Request Logs Tab Content */}
            {activeTab === 'request-logs' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
                      API Request History
                    </h2>
                    <p className="text-sm text-muted-foreground font-caption">
                      Monitor n8n integration requests and responses
                    </p>
                  </div>
                  <button
                    onClick={loadRequestLogs}
                    disabled={logsLoading}
                    className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-all duration-250 flex items-center gap-2 font-caption text-sm focus-ring disabled:opacity-50"
                  >
                    <Icon name="ArrowPathIcon" size={16} className={logsLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : requestLogs.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-lg border border-border">
                    <Icon name="DocumentTextIcon" size={48} className="text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-muted-foreground font-caption mb-2">No API requests yet</p>
                      <p className="text-sm text-muted-foreground font-caption">
                        Request logs will appear here when your n8n workflows start using the API
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-muted/20 rounded-lg border border-border p-5 hover:bg-muted/30 transition-colors duration-250"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-mono font-medium border ${getMethodColor(log.method)}`}>
                              {log.method}
                            </span>
                            <code className="text-sm font-mono text-foreground">
                              {log.endpoint}
                            </code>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-mono font-medium border ${getStatusColor(log.response_status)}`}>
                            {log.response_status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-caption">
                          <div>
                            <p className="text-muted-foreground mb-1">Timestamp</p>
                            <p className="text-foreground font-mono text-xs">
                              {formatTimestamp(log.created_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Response Time</p>
                            <p className="text-foreground">
                              {log.response_time_ms}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">IP Address</p>
                            <p className="text-foreground font-mono text-xs">
                              {log.ip_address || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">User Agent</p>
                            <p className="text-foreground text-xs truncate" title={log.user_agent || 'N/A'}>
                              {log.user_agent || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {log.request_body && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-caption text-primary hover:text-primary/80 flex items-center gap-2">
                              <Icon name="ChevronRightIcon" size={16} className="transition-transform" />
                              <span>View Request Body</span>
                            </summary>
                            <pre className="mt-2 bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto text-foreground">
                              {JSON.stringify(log.request_body, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-lg border border-border shadow-glow-medium max-w-lg w-full animate-scale-in">
            <div className="p-6 border-b border-border">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Generate New API Key
              </h3>
            </div>
            
            {generatedKey ? (
              <div className="p-6 space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-md p-4 flex items-start gap-3">
                  <Icon name="ExclamationTriangleIcon" size={20} className="text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground font-caption">
                    <p className="font-medium text-foreground mb-1">Save This Key Now!</p>
                    <p>This key will only be shown once. Copy it to a secure location before closing.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-caption text-muted-foreground mb-2">
                    Your New API Key
                  </label>
                  <div className="bg-muted/50 rounded-md p-4 flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-foreground break-all">
                      {generatedKey}
                    </code>
                    <button
                      onClick={() => handleCopyKey(generatedKey)}
                      className="p-2 hover:bg-background rounded transition-colors duration-250 flex-shrink-0"
                      title="Copy API key"
                    >
                      <Icon name="ClipboardDocumentIcon" size={20} className="text-primary" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGeneratedKey(null);
                    setShowGenerateModal(false);
                  }}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-250 font-caption font-medium focus-ring"
                >
                  I've Saved My Key
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-caption text-muted-foreground mb-2">
                    Key Name *
                  </label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., n8n Production Key"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250 font-caption"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false);
                      setKeyName('');
                      setError(null);
                    }}
                    className="flex-1 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-all duration-250 font-caption font-medium focus-ring"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateKey}
                    disabled={isGenerating || !keyName.trim()}
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-250 font-caption font-medium focus-ring flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="KeyIcon" size={16} />
                        <span>Generate Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeKeyId && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card rounded-lg border border-border shadow-glow-medium max-w-md w-full animate-scale-in">
            <div className="p-6 border-b border-border">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Revoke API Key?
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 flex items-start gap-3">
                <Icon name="ExclamationTriangleIcon" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground font-caption">
                  <p className="font-medium text-foreground mb-1">This action cannot be undone</p>
                  <p>Any integrations using this API key will immediately stop working.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRevokeKeyId(null)}
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-all duration-250 font-caption font-medium focus-ring"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRevokeKey(revokeKeyId)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-250 font-caption font-medium focus-ring"
                >
                  Revoke Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeveloperSettings;