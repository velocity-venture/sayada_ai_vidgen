'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import ApiKeysTab from './ApiKeysTab';
import BrandAssetsTab from './BrandAssetsTab';

type TabType = 'api-keys' | 'brand-assets';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: 'KeyIcon',
    description: 'Configure ElevenLabs and Pika Labs API credentials'
  },
  {
    id: 'brand-assets',
    label: 'Brand Assets',
    icon: 'PhotoIcon',
    description: 'Manage logo, intro/outro videos, and call-to-action text'
  }
];

const ProjectSettingsInteractive = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('api-keys');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="w-full px-6 lg:px-8 py-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mb-8" />
          <div className="flex gap-4 mb-8">
            <div className="h-12 w-32 bg-muted animate-pulse rounded" />
            <div className="h-12 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="w-full px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Cog6ToothIcon" size={32} className="text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Project Settings
            </h1>
          </div>
          <p className="font-caption text-muted-foreground text-base">
            Configure API integrations and brand customization for your video generation projects
          </p>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="mb-6 bg-accent/10 border border-accent rounded-lg p-4 flex items-center gap-3">
            <Icon name="ExclamationTriangleIcon" size={20} className="text-accent" />
            <p className="font-caption text-sm text-foreground flex-1">
              You have unsaved changes. Make sure to save before leaving this page.
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-6 py-4 font-caption font-medium text-sm
                  transition-all duration-250 focus-ring rounded-t-lg
                  ${isActive 
                    ? 'text-primary bg-card border-t border-l border-r border-border' :'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }
                `}
              >
                <Icon name={tab.icon as any} size={18} />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-lg border border-border shadow-glow-soft">
          {activeTab === 'api-keys' && (
            <ApiKeysTab onChangeDetected={() => setHasUnsavedChanges(true)} />
          )}
          {activeTab === 'brand-assets' && (
            <BrandAssetsTab onChangeDetected={() => setHasUnsavedChanges(true)} />
          )}
        </div>
      </div>
    </main>
  );
};

export default ProjectSettingsInteractive;