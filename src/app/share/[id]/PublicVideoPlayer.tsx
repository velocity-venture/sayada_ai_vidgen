'use client';
import { useState } from 'react';
import { ArrowDownTrayIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { Database } from '@/types/database.types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

interface PublicVideoPlayerProps {
  project: ProjectRow;
}

export default function PublicVideoPlayer({ project }: PublicVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayPause = () => {
    const video = document.getElementById('video-player') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    if (!project?.video_url) {
      setError('Video URL not available');
      return;
    }

    try {
      setDownloading(true);
      setError(null);

      const response = await fetch(project.video_url);
      if (!response.ok) throw new Error('Failed to download video');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download video');
    } finally {
      setDownloading(false);
    }
  };

  if (!project?.video_url) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Video Not Available</h1>
          <p className="text-gray-400">This video is still being processed or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-primary">Sayada VidGen</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Video Player */}
          <div className="relative rounded-lg overflow-hidden bg-black shadow-2xl mb-6">
            <video
              id="video-player"
              className="w-full aspect-video"
              controls
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={project.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play/Pause Overlay (optional for custom controls) */}
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="w-20 h-20 text-white" />
              ) : (
                <PlayIcon className="w-20 h-20 text-white" />
              )}
            </button>
          </div>

          {/* Video Details */}
          <div className="bg-slate-900/50 rounded-lg p-6 mb-6">
            <h2 className="text-3xl font-bold mb-4 text-white">{project.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-400 text-sm">Duration</span>
                <p className="text-white font-semibold">
                  {Math.floor((project.duration_seconds || 0) / 60)}:{String((project.duration_seconds || 0) % 60).padStart(2, '0')} min
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Style</span>
                <p className="text-white font-semibold capitalize">{project.style_preset || 'Classic'}</p>
              </div>
            </div>

            {project.script_content && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Scripture Content</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {project.script_content}
                </p>
              </div>
            )}
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center px-8 py-4 bg-primary hover:bg-primary/90 text-background font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-6 h-6 mr-3" />
              {downloading ? 'Downloading...' : 'Download Video'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400">
          <p>Powered by Sayada VidGen - Create and share scripture videos</p>
        </div>
      </footer>
    </div>
  );
}