'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  duration: number;
}

const VideoPlayer = ({ videoUrl, title, duration }: VideoPlayerProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !videoRef.current) return;

    const video = videoRef.current;
    const updateTime = () => setCurrentTime(video.currentTime);
    
    video.addEventListener('timeupdate', updateTime);
    return () => video.removeEventListener('timeupdate', updateTime);
  }, [isHydrated]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    if (!isHydrated) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  };

  if (!isHydrated) {
    return (
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="PlayIcon" size={64} className="text-muted-foreground opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full bg-background rounded-lg overflow-hidden shadow-glow-medium">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onEnded={() => setIsPlaying(false)}
          title={title}
        />
        
        {/* Play/Pause Overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-250 focus-ring"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-glow-strong">
            <Icon name={isPlaying ? 'PauseIcon' : 'PlayIcon'} size={40} className="text-primary-foreground" />
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-card p-4 space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-glow-soft"
            aria-label="Video progress"
          />
          <div className="flex items-center justify-between text-xs font-caption text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={skipBackward}
              className="p-2 rounded-md hover:bg-muted transition-all duration-250 focus-ring"
              aria-label="Skip backward 10 seconds"
            >
              <Icon name="BackwardIcon" size={20} className="text-foreground" />
            </button>
            
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-primary text-primary-foreground hover:shadow-glow-medium transition-all duration-250 focus-ring"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <Icon name={isPlaying ? 'PauseIcon' : 'PlayIcon'} size={24} />
            </button>
            
            <button
              onClick={skipForward}
              className="p-2 rounded-md hover:bg-muted transition-all duration-250 focus-ring"
              aria-label="Skip forward 10 seconds"
            >
              <Icon name="ForwardIcon" size={20} className="text-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-md hover:bg-muted transition-all duration-250 focus-ring"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <Icon 
                  name={isMuted ? 'SpeakerXMarkIcon' : volume > 0.5 ? 'SpeakerWaveIcon' : 'SpeakerWaveIcon'} 
                  size={20} 
                  className="text-foreground" 
                />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                aria-label="Volume control"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md hover:bg-muted transition-all duration-250 focus-ring"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <Icon 
                name={isFullscreen ? 'ArrowsPointingInIcon' : 'ArrowsPointingOutIcon'} 
                size={20} 
                className="text-foreground" 
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;