'use client';

import React, { useEffect, useState } from 'react';
import { ApiKey } from '@/types/database.types';
import { apiKeyService } from '@/services/apiKeyService';
import Header from '@/components/common/Header';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setLoading(true);
    const { data, error } = await apiKeyService.getUserApiKeys();
    if (error) {
      setError('Failed to load API keys');
      console.error('Error loading API keys:', error);
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please provide a name for the API key');
      return;
    }

    const { data, error } = await apiKeyService.generateApiKey(newKeyName.trim());
    
    if (error) {
      setError('Failed to create API key');
      console.error('Error creating API key:', error);
      return;
    }

    if (data) {
      setNewApiKey(data.api_key);
      setNewKeyName('');
      await loadApiKeys();
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    const { error } = await apiKeyService.revokeApiKey(keyId);
    if (error) {
      setError('Failed to revoke API key');
      console.error('Error revoking API key:', error);
    } else {
      await loadApiKeys();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('API key copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-2 text-gray-600">
            Manage your API keys for external integrations with the video generation system.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New API Key
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Create New API Key</h3>
              
              {newApiKey ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Your API key has been created. Copy it now - you will not be able to see it again!
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <code className="text-sm break-all">{newApiKey}</code>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(newApiKey)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        setNewApiKey(null);
                        setShowCreateModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="API Key Name (e.g., Production, Development)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateKey}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Key
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewKeyName('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No API keys yet. Create your first key to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Prefix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <code>{key.api_key?.substring(0, 12)}...</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          key.status === 'active' ?'bg-green-100 text-green-800'
                            : key.status === 'revoked' ?'bg-red-100 text-red-800' :'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.rate_limit_per_minute || 10}/min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-600 hover:text-red-800"
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

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">API Usage Example</h3>
          <pre className="bg-white p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST https://your-domain.com/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \ -H"Content-Type: application/json" \\
  -d '{
    "prompt": "Create a high-energy promo for my new fitness app.",
    "template_mode": "auto",
    "webhook_url": "https://my-callback-url.com/result"
  }'`}
          </pre>
        </div>
      </main>
    </div>
  );
}