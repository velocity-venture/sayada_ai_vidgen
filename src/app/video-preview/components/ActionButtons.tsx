'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ActionButtonsProps {
  videoUrl: string;
  projectTitle: string;
  onRegenerate: () => void;
}

const ActionButtons = ({ videoUrl, projectTitle, onRegenerate }: ActionButtonsProps) => {
  const [downloadFormat, setDownloadFormat] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    // Simulate download process
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${projectTitle.replace(/\s+/g, '_')}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }, 1000);
  };

  const shareOptions = [
    { name: 'Facebook', icon: 'ShareIcon', color: 'text-blue-500' },
    { name: 'Twitter', icon: 'ShareIcon', color: 'text-sky-500' },
    { name: 'Instagram', icon: 'ShareIcon', color: 'text-pink-500' },
    { name: 'YouTube', icon: 'ShareIcon', color: 'text-red-500' },
    { name: 'Copy Link', icon: 'LinkIcon', color: 'text-primary' }
  ];

  const handleShare = (platform: string) => {
    if (platform === 'Copy Link') {
      navigator.clipboard.writeText(videoUrl);
      alert('Link copied to clipboard!');
    } else {
      alert(`Sharing to ${platform} - Feature coming soon!`);
    }
    setShowShareMenu(false);
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-glow-soft">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="BoltIcon" size={24} className="text-primary" />
        Actions
      </h2>

      <div className="space-y-4">
        {/* Download Section */}
        <div className="space-y-3">
          <label className="font-caption text-sm font-medium text-foreground block">
            Download Format
          </label>
          <div className="flex gap-2">
            {(['mp4', 'webm', 'mov'] as const).map((format) => (
              <button
                key={format}
                onClick={() => setDownloadFormat(format)}
                className={`
                  flex-1 px-4 py-2 rounded-md font-caption text-sm font-medium
                  transition-all duration-250 focus-ring
                  ${downloadFormat === format
                    ? 'bg-primary text-primary-foreground shadow-glow-soft'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                  }
                `}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:shadow-glow-medium transition-all duration-250 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon 
              name={isDownloading ? 'ArrowPathIcon' : 'ArrowDownTrayIcon'} 
              size={20} 
              className={isDownloading ? 'animate-spin' : ''} 
            />
            <span className="font-caption text-sm font-semibold">
              {isDownloading ? 'Downloading...' : 'Download Video'}
            </span>
          </button>
        </div>

        {/* Share Section */}
        <div className="space-y-3 pt-4 border-t border-border">
          <label className="font-caption text-sm font-medium text-foreground block">
            Share Video
          </label>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-accent text-accent-foreground hover:shadow-glow-soft transition-all duration-250 focus-ring"
            >
              <Icon name="ShareIcon" size={20} />
              <span className="font-caption text-sm font-semibold">Share on Social Media</span>
            </button>

            {showShareMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-glow-medium overflow-hidden z-10 animate-fade-in">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => handleShare(option.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all duration-250 focus-ring"
                  >
                    <Icon name={option.icon as any} size={18} className={option.color} />
                    <span className="font-caption text-sm text-foreground">{option.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Regenerate Section */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={onRegenerate}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring"
          >
            <Icon name="ArrowPathIcon" size={20} />
            <span className="font-caption text-sm font-semibold">Regenerate Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;