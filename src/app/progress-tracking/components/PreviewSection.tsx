'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface PreviewAsset {
  id: string;
  type: 'audio' | 'video';
  sceneNumber: number;
  url: string;
  duration: string;
  status: 'completed';
  thumbnail?: string;
}

interface PreviewSectionProps {
  assets: PreviewAsset[];
}

const PreviewSection = ({ assets }: PreviewSectionProps) => {
  const [selectedAsset, setSelectedAsset] = useState<PreviewAsset | null>(
    assets.length > 0 ? assets[0] : null
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const audioAssets = assets.filter((a) => a.type === 'audio');
  const videoAssets = assets.filter((a) => a.type === 'video');

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon name="PlayIcon" size={24} className="text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Preview Assets
        </h2>
        <span className="ml-auto font-caption text-sm text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? 's' : ''} ready
        </span>
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="FilmIcon" size={48} className="text-muted-foreground mb-4" />
          <p className="font-caption text-sm text-muted-foreground">
            No assets available for preview yet
          </p>
          <p className="font-caption text-xs text-muted-foreground mt-1">
            Assets will appear here as they are generated
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selectedAsset && (
              <div className="bg-muted/50 rounded-lg overflow-hidden border border-border">
                <div className="aspect-video bg-background flex items-center justify-center relative">
                  {selectedAsset.type === 'video' && selectedAsset.thumbnail ? (
                    <img
                      src={selectedAsset.thumbnail}
                      alt={`Preview thumbnail for scene ${selectedAsset.sceneNumber} video clip`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Icon
                        name={selectedAsset.type === 'audio' ? 'MusicalNoteIcon' : 'FilmIcon'}
                        size={64}
                        className="text-muted-foreground"
                      />
                      <p className="font-caption text-sm text-muted-foreground">
                        {selectedAsset.type === 'audio' ? 'Audio Track' : 'Video Clip'}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all duration-250 group"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-glow-medium group-hover:scale-110 transition-transform duration-250">
                      <Icon
                        name={isPlaying ? 'PauseIcon' : 'PlayIcon'}
                        size={32}
                        className="text-primary-foreground"
                      />
                    </div>
                  </button>
                </div>

                <div className="p-4 bg-card">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-caption text-sm font-semibold text-foreground">
                        Scene {selectedAsset.sceneNumber} - {selectedAsset.type === 'audio' ? 'Audio' : 'Video'}
                      </h3>
                      <p className="font-caption text-xs text-muted-foreground mt-1">
                        Duration: {selectedAsset.duration}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring"
                      aria-label="Download asset"
                    >
                      <Icon name="ArrowDownTrayIcon" size={16} />
                      <span className="font-caption text-xs font-medium">Download</span>
                    </button>
                  </div>

                  <div className="relative h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                      style={{ width: isPlaying ? '45%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-caption text-sm font-semibold text-foreground mb-3">
                Audio Tracks ({audioAssets.length})
              </h3>
              <div className="space-y-2">
                {audioAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-md transition-all duration-250 focus-ring
                      ${selectedAsset?.id === asset.id
                        ? 'bg-primary/10 border-2 border-primary' :'bg-muted/50 border-2 border-transparent hover:border-primary/30'
                      }
                    `}
                  >
                    <Icon
                      name="MusicalNoteIcon"
                      size={20}
                      className={selectedAsset?.id === asset.id ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-caption text-xs font-medium text-foreground">
                        Scene {asset.sceneNumber}
                      </div>
                      <div className="font-caption text-xs text-muted-foreground">
                        {asset.duration}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-caption text-sm font-semibold text-foreground mb-3">
                Video Clips ({videoAssets.length})
              </h3>
              <div className="space-y-2">
                {videoAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-md transition-all duration-250 focus-ring
                      ${selectedAsset?.id === asset.id
                        ? 'bg-primary/10 border-2 border-primary' :'bg-muted/50 border-2 border-transparent hover:border-primary/30'
                      }
                    `}
                  >
                    <Icon
                      name="FilmIcon"
                      size={20}
                      className={selectedAsset?.id === asset.id ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-caption text-xs font-medium text-foreground">
                        Scene {asset.sceneNumber}
                      </div>
                      <div className="font-caption text-xs text-muted-foreground">
                        {asset.duration}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewSection;