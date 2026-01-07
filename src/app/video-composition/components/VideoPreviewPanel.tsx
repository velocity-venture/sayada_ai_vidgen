'use client';

import { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SubtitleService } from '@/services/subtitleService';
import type { TimelineClip, SubtitleEditorSegment, SubtitleStylePreset, AspectRatio } from '@/types/models';

interface VideoPreviewPanelProps {
  clips: TimelineClip[];
  currentTime: number;
  isPlaying: boolean;
  subtitleSegments?: SubtitleEditorSegment[];
  subtitleStyle?: SubtitleStylePreset;
  aspectRatio?: AspectRatio;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
}

const VideoPreviewPanel: React.FC<VideoPreviewPanelProps> = ({
  clips,
  currentTime,
  isPlaying,
  subtitleSegments = [],
  subtitleStyle = 'auto',
  aspectRatio = '16:9',
  onSeek,
  onPlayPause,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentClip, setCurrentClip] = useState<TimelineClip | null>(null);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);

  useEffect(() => {
    const clip = clips.find(
      c => currentTime >= c.startTime && currentTime < c.endTime
    );
    setCurrentClip(clip || null);
  }, [currentTime, clips]);

  // Update current subtitle based on time
  useEffect(() => {
    const activeSegment = subtitleSegments.find(
      seg => currentTime >= seg.start && currentTime <= seg.end
    );
    setCurrentSubtitle(activeSegment?.text || null);
  }, [currentTime, subtitleSegments]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = clips.length > 0 
    ? clips[clips.length - 1].endTime 
    : 0;

  // Get aspect ratio class for video container
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-w-[360px]';
      case '1:1':
        return 'aspect-square max-w-[500px]';
      case '16:9':
      default:
        return 'aspect-video max-w-full';
    }
  };

  // Get subtitle CSS classes and styles
  const subtitleCSSClasses = SubtitleService.getSubtitleCSSClasses(subtitleStyle, aspectRatio);
  const subtitleInlineStyles = SubtitleService.getSubtitleInlineStyles(subtitleStyle, aspectRatio);

  return (
    <div 
      className="h-full flex flex-col bg-background relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {currentClip?.videoUrl ? (
          <div className={`relative ${getAspectRatioClass()}`}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={currentClip.videoUrl}
            />
            
            {/* Live Subtitle Overlay */}
            {currentSubtitle && (
              <div
                className={subtitleCSSClasses}
                style={subtitleInlineStyles}
              >
                {currentSubtitle}
              </div>
            )}

            {/* Overlay Controls */}
            {showControls && (
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/50 flex items-center justify-center">
                <button
                  onClick={onPlayPause}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow-medium hover:scale-110 transition-transform focus-ring"
                >
                  <Icon name={isPlaying ? 'PauseIcon' : 'PlayIcon'} size={32} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <Icon name="FilmIcon" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground font-caption text-lg">
              Preview will appear here
            </p>
            <p className="text-sm text-muted-foreground font-caption mt-2">
              Select a clip from the timeline to preview
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 bg-card border-t border-border">
        <div className="flex items-center gap-4">
          <span className="text-xs font-caption text-muted-foreground min-w-[48px]">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 relative group">
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-glow-soft
                group-hover:[&::-webkit-slider-thumb]:scale-125
                [&::-webkit-slider-thumb]:transition-transform"
            />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full pointer-events-none"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>

          <span className="text-xs font-caption text-muted-foreground min-w-[48px] text-right">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
              aria-label="Rewind 5 seconds"
            >
              <Icon name="BackwardIcon" size={20} />
            </button>

            <button
              onClick={onPlayPause}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <Icon name={isPlaying ? 'PauseIcon' : 'PlayIcon'} size={20} />
            </button>

            <button
              onClick={() => onSeek(Math.min(totalDuration, currentTime + 5))}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
              aria-label="Forward 5 seconds"
            >
              <Icon name="ForwardIcon" size={20} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Icon 
              name={volume === 0 ? 'SpeakerXMarkIcon' : 'SpeakerWaveIcon'} 
              size={20} 
              className="text-muted-foreground"
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-foreground
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>

        {/* Current Clip Info */}
        {currentClip && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-caption font-medium text-foreground">
                  Scene {currentClip.sceneIndex + 1}
                </p>
                <p className="text-xs font-caption text-muted-foreground">
                  {currentClip.duration.toFixed(1)}s • {currentClip.transition?.type || 'No transition'}
                </p>
              </div>
              {currentClip.fadeIn || currentClip.fadeOut ? (
                <div className="flex items-center gap-1 text-xs font-caption text-accent">
                  <Icon name="SparklesIcon" size={14} />
                  Fade effects applied
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreviewPanel;