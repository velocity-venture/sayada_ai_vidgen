'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import { apiKeyService, webhookService } from '@/services/apiKeyService';
import { ApiKey, WebhookConfig, WebhookDelivery } from '@/types/models';
import { KeyIcon, GlobeAltIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function ApiManagementInteractive() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'api-keys' | 'webhooks'>('api-keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [keysResult, webhooksResult, deliveriesResult] = await Promise.all([
        apiKeyService.getUserApiKeys(),
        webhookService.getUserWebhookConfigs(),
        webhookService.getWebhookDeliveries()
      ]);

      if (keysResult.error) {
        setError('Failed to load API keys');
      } else {
        setApiKeys(keysResult.data || []);
      }

      if (webhooksResult.error) {
        setError('Failed to load webhook configurations');
      } else {
        setWebhookConfigs(webhooksResult.data || []);
      }

      if (deliveriesResult.error) {
        setError('Failed to load webhook deliveries');
      } else {
        setWebhookDeliveries(deliveriesResult.data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    try {
      const { data, error } = await apiKeyService.generateApiKey(newKeyName);
      if (error) {
        setError(error.message);
      } else if (data) {
        setApiKeys([data, ...apiKeys]);
        setShowCreateKeyModal(false);
        setNewKeyName('');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create API key');
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      const { error } = await apiKeyService.revokeApiKey(keyId);
      if (error) {
        setError(error.message);
      } else {
        setApiKeys(apiKeys.map(key => 
          key.id === keyId ? { ...key, status: 'revoked' } : key
        ));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke API key');
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) {
      setError('Please enter a webhook URL');
      return;
    }

    try {
      const { data, error } = await webhookService.createWebhookConfig(newWebhookUrl);
      if (error) {
        setError(error.message);
      } else if (data) {
        setWebhookConfigs([data, ...webhookConfigs]);
        setShowCreateWebhookModal(false);
        setNewWebhookUrl('');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create webhook configuration');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await webhookService.deleteWebhookConfig(webhookId);
      if (error) {
        setError(error.message);
      } else {
        setWebhookConfigs(webhookConfigs.filter(config => config.id !== webhookId));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete webhook');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
          <p className="mt-2 text-gray-600">
            Manage API keys and webhook configurations for external integrations
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api-keys' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <KeyIcon className="h-5 w-5 inline mr-2" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'webhooks' ?'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GlobeAltIcon className="h-5 w-5 inline mr-2" />
              Webhooks
            </button>
          </nav>
        </div>

        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your API Keys</h2>
              <button
                onClick={() => setShowCreateKeyModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Generate New Key
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by generating your first API key.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        API Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map((key) => (
                      <tr key={key.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {key.key_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          <div className="flex items-center space-x-2">
                            <span>{key.api_key.substring(0, 20)}...</span>
                            <button
                              onClick={() => copyToClipboard(key.api_key)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              key.status === 'active' ?'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
                            }`}
                          >
                            {key.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {key.requests_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {key.status === 'active' && (
                            <button
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Webhook Configurations</h2>
              <button
                onClick={() => setShowCreateWebhookModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add Webhook
              </button>
            </div>

            {webhookConfigs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No webhooks configured</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add a webhook URL to receive notifications when videos are completed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhookConfigs.map((config) => (
                  <div key={config.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <GlobeAltIcon className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{config.webhook_url}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Created {new Date(config.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            config.is_active
                              ? 'bg-green-100 text-green-800' :'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleDeleteWebhook(config.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Webhook Deliveries</h3>
              {webhookDeliveries.length === 0 ? (
                <p className="text-gray-500 text-sm">No webhook deliveries yet.</p>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Project ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Attempts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Sent At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {webhookDeliveries.map((delivery) => (
                        <tr key={delivery.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {delivery.project_id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                delivery.status === 'sent' ?'bg-green-100 text-green-800'
                                  : delivery.status === 'failed' ?'bg-red-100 text-red-800' :'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {delivery.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {delivery.attempts} / {delivery.max_attempts}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {delivery.sent_at
                              ? new Date(delivery.sent_at).toLocaleString()
                              : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New API Key</h3>
              <input
                type="text"
                placeholder="API Key Name (e.g., Production, Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateKeyModal(false);
                    setNewKeyName('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateWebhookModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Webhook Configuration</h3>
              <input
                type="url"
                placeholder="Webhook URL (https://your-domain.com/webhook)"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateWebhookModal(false);
                    setNewWebhookUrl('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}