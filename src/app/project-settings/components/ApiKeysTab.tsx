'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ApiKeyConfig {
  key: string;
  status: 'connected' | 'disconnected' | 'testing';
  lastUpdated: string | null;
}

interface ApiKeysTabProps {
  onChangeDetected: () => void;
}

const ApiKeysTab = ({ onChangeDetected }: ApiKeysTabProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState<ApiKeyConfig>({
    key: '',
    status: 'disconnected',
    lastUpdated: null
  });
  const [pikaLabsKey, setPikaLabsKey] = useState<ApiKeyConfig>({
    key: '',
    status: 'disconnected',
    lastUpdated: null
  });
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [showPikaLabsKey, setShowPikaLabsKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    // Load saved keys from localStorage
    const savedElevenLabs = localStorage.getItem('elevenLabsApiKey');
    const savedPikaLabs = localStorage.getItem('pikaLabsApiKey');
    
    if (savedElevenLabs) {
      setElevenLabsKey({
        key: savedElevenLabs,
        status: 'connected',
        lastUpdated: localStorage.getItem('elevenLabsLastUpdated')
      });
    }
    if (savedPikaLabs) {
      setPikaLabsKey({
        key: savedPikaLabs,
        status: 'connected',
        lastUpdated: localStorage.getItem('pikaLabsLastUpdated')
      });
    }
  }, []);

  const handleElevenLabsChange = (value: string) => {
    if (!isHydrated) return;
    setElevenLabsKey({ ...elevenLabsKey, key: value, status: 'disconnected' });
    onChangeDetected();
  };

  const handlePikaLabsChange = (value: string) => {
    if (!isHydrated) return;
    setPikaLabsKey({ ...pikaLabsKey, key: value, status: 'disconnected' });
    onChangeDetected();
  };

  const testConnection = async (service: 'elevenlabs' | 'pikalabs') => {
    if (!isHydrated) return;
    
    if (service === 'elevenlabs') {
      setElevenLabsKey({ ...elevenLabsKey, status: 'testing' });
      // Simulate API test
      setTimeout(() => {
        setElevenLabsKey({ 
          ...elevenLabsKey, 
          status: elevenLabsKey.key ? 'connected' : 'disconnected' 
        });
      }, 1500);
    } else {
      setPikaLabsKey({ ...pikaLabsKey, status: 'testing' });
      setTimeout(() => {
        setPikaLabsKey({ 
          ...pikaLabsKey, 
          status: pikaLabsKey.key ? 'connected' : 'disconnected' 
        });
      }, 1500);
    }
  };

  const handleSave = async () => {
    if (!isHydrated) return;
    setIsSaving(true);
    
    // Save to localStorage
    const timestamp = new Date().toISOString();
    localStorage.setItem('elevenLabsApiKey', elevenLabsKey.key);
    localStorage.setItem('elevenLabsLastUpdated', timestamp);
    localStorage.setItem('pikaLabsApiKey', pikaLabsKey.key);
    localStorage.setItem('pikaLabsLastUpdated', timestamp);
    
    setElevenLabsKey({ ...elevenLabsKey, lastUpdated: timestamp });
    setPikaLabsKey({ ...pikaLabsKey, lastUpdated: timestamp });
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Icon name="CheckCircleIcon" size={20} className="text-green-500" />;
      case 'testing':
        return <Icon name="ArrowPathIcon" size={20} className="text-primary animate-spin" />;
      default:
        return <Icon name="XCircleIcon" size={20} className="text-muted-foreground" />;
    }
  };

  if (!isHydrated) {
    return (
      <div className="p-8">
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* ElevenLabs API Key */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                ElevenLabs API Key
              </h3>
              {getStatusIcon(elevenLabsKey.status)}
            </div>
            <p className="font-caption text-sm text-muted-foreground">
              Required for AI voice generation and text-to-speech features
            </p>
            {elevenLabsKey.lastUpdated && (
              <p className="font-caption text-xs text-muted-foreground mt-1">
                Last updated: {new Date(elevenLabsKey.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showElevenLabsKey ? 'text' : 'password'}
              value={elevenLabsKey.key}
              onChange={(e) => handleElevenLabsChange(e.target.value)}
              placeholder="Enter your ElevenLabs API key"
              className="w-full px-4 py-3 pr-24 bg-background border border-border rounded-md font-caption text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250"
            />
            <button
              onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded"
              title={showElevenLabsKey ? 'Hide key' : 'Show key'}
            >
              <Icon name={showElevenLabsKey ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => testConnection('elevenlabs')}
              disabled={!elevenLabsKey.key || elevenLabsKey.status === 'testing'}
              className="px-4 py-2 bg-muted text-foreground rounded-md font-caption text-sm font-medium hover:bg-muted/80 transition-all duration-250 focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon name="BoltIcon" size={16} />
              {elevenLabsKey.status === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Pika Labs API Key */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Pika Labs API Key
              </h3>
              {getStatusIcon(pikaLabsKey.status)}
            </div>
            <p className="font-caption text-sm text-muted-foreground">
              Required for AI video generation and scene creation
            </p>
            {pikaLabsKey.lastUpdated && (
              <p className="font-caption text-xs text-muted-foreground mt-1">
                Last updated: {new Date(pikaLabsKey.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPikaLabsKey ? 'text' : 'password'}
              value={pikaLabsKey.key}
              onChange={(e) => handlePikaLabsChange(e.target.value)}
              placeholder="Enter your Pika Labs API key"
              className="w-full px-4 py-3 pr-24 bg-background border border-border rounded-md font-caption text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250"
            />
            <button
              onClick={() => setShowPikaLabsKey(!showPikaLabsKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded"
              title={showPikaLabsKey ? 'Hide key' : 'Show key'}
            >
              <Icon name={showPikaLabsKey ? 'EyeSlashIcon' : 'EyeIcon'} size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => testConnection('pikalabs')}
              disabled={!pikaLabsKey.key || pikaLabsKey.status === 'testing'}
              className="px-4 py-2 bg-muted text-foreground rounded-md font-caption text-sm font-medium hover:bg-muted/80 transition-all duration-250 focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon name="BoltIcon" size={16} />
              {pikaLabsKey.status === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-border flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-caption text-sm font-semibold hover:bg-primary/90 transition-all duration-250 focus-ring shadow-glow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Icon name={isSaving ? 'ArrowPathIcon' : 'CheckIcon'} size={18} className={isSaving ? 'animate-spin' : ''} />
          {isSaving ? 'Saving...' : 'Save API Keys'}
        </button>
      </div>
    </div>
  );
};

export default ApiKeysTab;