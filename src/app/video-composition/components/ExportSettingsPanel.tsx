'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { VideoCompositionService } from '@/services/videoCompositionService';
import type { ExportSettings } from '@/types/models';

interface ExportSettingsPanelProps {
  settings: ExportSettings;
  onSettingsChange: (settings: ExportSettings) => void;
  onClose: () => void;
  onExport: () => void;
}

const ExportSettingsPanel: React.FC<ExportSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onClose,
  onExport,
}) => {
  const [exporting, setExporting] = useState(false);
  const presets = VideoCompositionService.getExportPresets();

  const handlePresetSelect = (presetName: string) => {
    onSettingsChange(presets[presetName]);
  };

  const handleExportClick = async () => {
    setExporting(true);
    try {
      await onExport();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card rounded-lg shadow-glow-medium border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Export Settings
            </h2>
            <p className="text-sm text-muted-foreground font-caption mt-1">
              Configure video output format and quality
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
            aria-label="Close"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Platform Presets */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-3">
              Platform Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-md border-2 transition-all focus-ring
                    ${settings.platform === preset.platform
                      ? 'border-primary bg-primary/10 shadow-glow-soft'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon 
                    name={
                      key === 'youtube' ? 'PlayIcon' :
                      key === 'instagram' ? 'CameraIcon' :
                      key === 'facebook' ? 'UserGroupIcon' :
                      key === 'twitter'? 'ChatBubbleLeftIcon' : 'Cog6ToothIcon'
                    } 
                    size={24} 
                    className={settings.platform === preset.platform ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <span className="text-sm font-caption font-medium text-foreground capitalize">
                    {key}
                  </span>
                  <span className="text-xs font-caption text-muted-foreground">
                    {preset.resolution} • {preset.quality}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-3">
              Video Format
            </label>
            <div className="flex gap-3">
              {(['mp4', 'mov', 'webm'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => onSettingsChange({ ...settings, format })}
                  className={`
                    flex-1 px-4 py-3 rounded-md border-2 transition-all focus-ring
                    ${settings.format === format
                      ? 'border-primary bg-primary/10 text-primary shadow-glow-soft'
                      : 'border-border text-foreground hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <span className="text-sm font-caption font-medium uppercase">
                    {format}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-3">
              Video Quality
            </label>
            <div className="flex gap-3">
              {(['high', 'medium', 'low'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => onSettingsChange({ ...settings, quality })}
                  className={`
                    flex-1 px-4 py-3 rounded-md border-2 transition-all focus-ring
                    ${settings.quality === quality
                      ? 'border-primary bg-primary/10 text-primary shadow-glow-soft'
                      : 'border-border text-foreground hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <span className="text-sm font-caption font-medium capitalize">
                    {quality}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selection */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-3">
              Resolution
            </label>
            <div className="flex gap-3">
              {(['1080p', '720p', '480p'] as const).map((resolution) => (
                <button
                  key={resolution}
                  onClick={() => onSettingsChange({ ...settings, resolution })}
                  className={`
                    flex-1 px-4 py-3 rounded-md border-2 transition-all focus-ring
                    ${settings.resolution === resolution
                      ? 'border-primary bg-primary/10 text-primary shadow-glow-soft'
                      : 'border-border text-foreground hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <span className="text-sm font-caption font-medium">
                    {resolution}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Info */}
          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-start gap-3">
              <Icon name="InformationCircleIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-caption text-foreground">
                  Current Settings: {settings.format.toUpperCase()} • {settings.quality} quality • {settings.resolution}
                </p>
                <p className="text-xs font-caption text-muted-foreground">
                  Optimized for {settings.platform || 'custom'} platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
          >
            Cancel
          </button>
          <button
            onClick={handleExportClick}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span className="font-caption font-medium">Exporting...</span>
              </>
            ) : (
              <>
                <Icon name="ArrowDownTrayIcon" size={20} />
                <span className="font-caption font-medium">Export Video</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSettingsPanel;