'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/common/Header';
import { 
  getUserServiceConfigs, 
  saveServiceConfig, 
  deleteServiceConfig,
  validateProviderKey,
  ServiceConfig,
  ServiceProvider 
} from '@/services/serviceConfigService';

interface ProviderCardProps {
  provider: ServiceProvider;
  displayName: string;
  description: string;
  config: ServiceConfig | null;
  onSave: (provider: ServiceProvider, apiKey: string) => Promise<void>;
  onDelete: (provider: ServiceProvider) => Promise<void>;
  onValidate: (provider: ServiceProvider, apiKey: string) => Promise<void>;
}

function ProviderCard({ 
  provider, 
  displayName, 
  description, 
  config, 
  onSave, 
  onDelete,
  onValidate 
}: ProviderCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasConfig = !!config;
  const isActive = config?.status === 'active';
  const hasError = config?.status === 'error';

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await onSave(provider, apiKey);
      setSuccess('API key saved successfully');
      setIsEditing(false);
      setApiKey('');
    } catch (err: any) {
      setError(err.message || 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError('Enter API key to validate');
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(null);

    try {
      await onValidate(provider, apiKey);
      setSuccess('API key validated successfully');
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${displayName} configuration?`)) return;

    try {
      await onDelete(provider);
      setSuccess('Configuration removed');
    } catch (err: any) {
      setError(err.message || 'Failed to delete configuration');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{displayName}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        
        {hasConfig && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-500/20 text-green-400' : hasError ?'bg-red-500/20 text-red-400': 'bg-gray-500/20 text-gray-400'
            }`}>
              {isActive ? 'Active' : hasError ? 'Error' : 'Inactive'}
            </span>
          </div>
        )}
      </div>

      {/* Configuration Status */}
      {hasConfig && !isEditing && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Last Validated:</span>
            <span className="text-white">
              {config.last_validated_at 
                ? new Date(config.last_validated_at).toLocaleDateString() 
                : 'Never'}
            </span>
          </div>
          
          {config.last_used_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Last Used:</span>
              <span className="text-white">
                {new Date(config.last_used_at).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Requests Count:</span>
            <span className="text-white">{config.requests_count}</span>
          </div>

          {hasError && config.validation_error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{config.validation_error}</p>
            </div>
          )}
        </div>
      )}

      {/* API Key Input */}
      {(isEditing || !hasConfig) && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${displayName} API key`}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleValidate}
              disabled={isValidating || isSaving}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Test Connection'}
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || isValidating}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save API Key'}
            </button>

            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setApiKey('');
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {hasConfig && !isEditing && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Update Key
          </button>
          
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 border border-red-600/30"
          >
            Remove
          </button>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}
    </div>
  );
}

export default function ProviderSettingsPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await getUserServiceConfigs();
      setConfigs(data);
    } catch (error: any) {
      setGlobalError(error.message || 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (provider: ServiceProvider, apiKey: string) => {
    const result = await saveServiceConfig(provider, apiKey);
    if (!result.success) {
      throw new Error(result.error);
    }
    await loadConfigs();
  };

  const handleDelete = async (provider: ServiceProvider) => {
    const result = await deleteServiceConfig(provider);
    if (!result.success) {
      throw new Error(result.error);
    }
    await loadConfigs();
  };

  const handleValidate = async (provider: ServiceProvider, apiKey: string) => {
    const result = await validateProviderKey(provider, apiKey);
    if (!result.valid) {
      throw new Error(result.error || 'Validation failed');
    }
  };

  const getConfig = (provider: ServiceProvider) => 
    configs.find(c => c.provider_name === provider) || null;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Please sign in to access provider settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Provider Settings</h1>
          <p className="text-gray-400">
            Manage your AI service provider API keys. All keys are encrypted and stored securely.
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-400 mb-1">Security Notice</h3>
              <p className="text-sm text-gray-400">
                Your API keys are encrypted using industry-standard encryption before storage. 
                They are only decrypted when needed for AI generation requests.
              </p>
            </div>
          </div>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{globalError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <ProviderCard
              provider="openai"
              displayName="OpenAI"
              description="Required for AI scripting and content generation"
              config={getConfig('openai')}
              onSave={handleSave}
              onDelete={handleDelete}
              onValidate={handleValidate}
            />

            <ProviderCard
              provider="elevenlabs"
              displayName="ElevenLabs"
              description="Required for AI voice generation and audio synthesis"
              config={getConfig('elevenlabs')}
              onSave={handleSave}
              onDelete={handleDelete}
              onValidate={handleValidate}
            />

            <ProviderCard
              provider="pikalabs"
              displayName="Pika Labs"
              description="Required for AI video generation and visual effects"
              config={getConfig('pikalabs')}
              onSave={handleSave}
              onDelete={handleDelete}
              onValidate={handleValidate}
            />
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Where to find your API keys</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-white font-medium mb-1">OpenAI:</p>
              <p className="text-gray-400">Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">platform.openai.com/api-keys</a></p>
            </div>
            
            <div>
              <p className="text-white font-medium mb-1">ElevenLabs:</p>
              <p className="text-gray-400">Visit <a href="https://elevenlabs.io/api" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">elevenlabs.io/api</a></p>
            </div>
            
            <div>
              <p className="text-white font-medium mb-1">Pika Labs:</p>
              <p className="text-gray-400">Visit <a href="https://pika.art/api" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">pika.art/api</a></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}