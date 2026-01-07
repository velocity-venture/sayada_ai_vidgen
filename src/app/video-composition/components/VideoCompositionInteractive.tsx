'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import TimelineEditor from './TimelineEditor';
import VideoPreviewPanel from './VideoPreviewPanel';
import ClipPropertiesPanel from './ClipPropertiesPanel';
import ExportSettingsPanel from './ExportSettingsPanel';
import SubtitleEditorPanel from './SubtitleEditorPanel';
import { VideoCompositionService } from '@/services/videoCompositionService';
import { createClient } from '@/lib/supabase/client';

import type { TimelineClip, ExportSettings, SubtitleEditorSegment, SubtitleStylePreset, AspectRatio } from '@/types/models';

const VideoCompositionInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const supabase = createClient();

  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(
    VideoCompositionService.getExportPresets().youtube
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);

  // Subtitle editor state
  const [showSubtitleEditor, setShowSubtitleEditor] = useState(false);
  const [subtitleSegments, setSubtitleSegments] = useState<SubtitleEditorSegment[]>([]);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStylePreset>('auto');

  // Aspect ratio state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectClips();
      loadSubtitleData();
      loadProjectAspectRatio();
    }
  }, [projectId]);

  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const totalDuration = VideoCompositionService.calculateTotalDuration(clips);
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, clips]);

  const loadProjectClips = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectClips = await VideoCompositionService.getProjectClips(projectId!);
      setClips(projectClips);
    } catch (err) {
      console.error('Error loading clips:', err);
      setError('Failed to load project clips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubtitleData = async () => {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('subtitle_segments, subtitle_style')
        .eq('id', projectId!)
        .single();

      if (project?.subtitle_segments) {
        setSubtitleSegments(project.subtitle_segments);
      }
      if (project?.subtitle_style) {
        setSubtitleStyle(project.subtitle_style as SubtitleStylePreset);
      }
    } catch (err) {
      console.error('Error loading subtitles:', err);
    }
  };

  const loadProjectAspectRatio = async () => {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('aspect_ratio')
        .eq('id', projectId!)
        .single();

      if (project?.aspect_ratio) {
        setAspectRatio(project.aspect_ratio as AspectRatio);
      }
    } catch (err) {
      console.error('Error loading aspect ratio:', err);
    }
  };

  const handleSubtitleSegmentsUpdate = async (segments: SubtitleEditorSegment[]) => {
    setSubtitleSegments(segments);
    
    // Save to Supabase
    try {
      await supabase
        .from('projects')
        .update({ subtitle_segments: segments })
        .eq('id', projectId!);
    } catch (err) {
      console.error('Error saving subtitles:', err);
    }
  };

  const handleSubtitleStyleChange = async (style: SubtitleStylePreset) => {
    setSubtitleStyle(style);
    
    // Save to Supabase
    try {
      await supabase
        .from('projects')
        .update({ subtitle_style: style })
        .eq('id', projectId!);
    } catch (err) {
      console.error('Error saving subtitle style:', err);
    }
  };

  const handleAspectRatioChange = async (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    
    // Save to Supabase
    try {
      await supabase
        .from('projects')
        .update({ aspect_ratio: ratio })
        .eq('id', projectId!);
    } catch (err) {
      console.error('Error saving aspect ratio:', err);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleClipSelect = (clipId: string) => {
    setSelectedClipId(clipId);
  };

  const handleClipUpdate = (updatedClips: TimelineClip[]) => {
    setClips(updatedClips);
  };

  const handleExport = () => {
    const validation = VideoCompositionService.validateComposition(clips);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }
    setShowExportPanel(true);
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);
  const totalDuration = VideoCompositionService.calculateTotalDuration(clips);

  // Get aspect ratio label
  const getAspectRatioLabel = (ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return 'Vertical (TikTok/Reels)';
      case '1:1':
        return 'Square (Instagram)';
      case '16:9':
      default:
        return 'Landscape (YouTube)';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground font-caption">Loading composition...</p>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="text-center">
          <Icon name="ExclamationTriangleIcon" size={48} className="mx-auto mb-4 text-destructive" />
          <p className="text-foreground text-lg mb-4">No project selected</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
            aria-label="Back to dashboard"
          >
            <Icon name="ArrowLeftIcon" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-heading font-semibold text-foreground">
              Video Composition
            </h1>
            <p className="text-sm text-muted-foreground font-caption">
              {clips.length} clips • {totalDuration.toFixed(1)}s total
              {subtitleSegments.length > 0 && ` • ${subtitleSegments.length} subtitles`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Canvas Size Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <Icon name="RectangleStackIcon" size={18} className="text-muted-foreground" />
            <select
              value={aspectRatio}
              onChange={(e) => handleAspectRatioChange(e.target.value as AspectRatio)}
              className="bg-transparent border-none text-sm font-caption text-foreground focus:outline-none cursor-pointer"
            >
              <option value="16:9">16:9 - YouTube Mode</option>
              <option value="9:16">9:16 - TikTok Mode</option>
              <option value="1:1">1:1 - Square Mode</option>
            </select>
          </div>

          <button
            onClick={() => setShowSubtitleEditor(!showSubtitleEditor)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors focus-ring ${
              showSubtitleEditor
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            <Icon name="ChatBubbleBottomCenterTextIcon" size={20} />
            <span className="font-caption font-medium">Subtitles</span>
          </button>

          <button
            onClick={handlePlayPause}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus-ring"
          >
            <Icon name={isPlaying ? 'PauseIcon' : 'PlayIcon'} size={20} />
            <span className="font-caption font-medium">
              {isPlaying ? 'Pause' : 'Play'}
            </span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors focus-ring"
          >
            <Icon name="ArrowDownTrayIcon" size={20} />
            <span className="font-caption font-medium">Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-destructive/10 border border-destructive rounded-md flex items-start gap-3">
          <Icon name="ExclamationTriangleIcon" size={20} className="text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-md text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Icon name="XMarkIcon" size={16} />
          </button>
        </div>
      )}

      {/* Aspect Ratio Info Banner */}
      <div className="mx-6 mt-4 p-3 bg-primary/10 border border-primary/30 rounded-md flex items-center gap-3">
        <Icon name="InformationCircleIcon" size={20} className="text-primary flex-shrink-0" />
        <p className="text-sm text-foreground font-caption">
          <strong>Canvas Size:</strong> {getAspectRatioLabel(aspectRatio)} - Subtitles will automatically adjust for safe zones
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Panel */}
        <div className="flex-1 border-r border-border">
          <VideoPreviewPanel
            clips={clips}
            currentTime={currentTime}
            isPlaying={isPlaying}
            subtitleSegments={subtitleSegments}
            subtitleStyle={subtitleStyle}
            aspectRatio={aspectRatio}
            onSeek={handleSeek}
            onPlayPause={handlePlayPause}
          />
        </div>

        {/* Subtitle Editor Panel */}
        {showSubtitleEditor && (
          <div className="w-96">
            <SubtitleEditorPanel
              projectId={projectId!}
              segments={subtitleSegments}
              currentStyle={subtitleStyle}
              currentTime={currentTime}
              onSegmentsUpdate={handleSubtitleSegmentsUpdate}
              onStyleChange={handleSubtitleStyleChange}
            />
          </div>
        )}

        {/* Properties Panel */}
        {selectedClip && !showSubtitleEditor && (
          <div className="w-80 border-r border-border overflow-y-auto">
            <ClipPropertiesPanel
              clip={selectedClip}
              clips={clips}
              onUpdate={handleClipUpdate}
            />
          </div>
        )}
      </div>

      {/* Timeline Editor */}
      <div className="h-64 border-t border-border bg-card">
        <TimelineEditor
          clips={clips}
          currentTime={currentTime}
          selectedClipId={selectedClipId}
          onClipSelect={handleClipSelect}
          onClipsUpdate={handleClipUpdate}
          onSeek={handleSeek}
        />
      </div>

      {/* Export Settings Modal */}
      {showExportPanel && (
        <ExportSettingsPanel
          settings={exportSettings}
          onSettingsChange={setExportSettings}
          onClose={() => setShowExportPanel(false)}
          onExport={() => {
            // Handle export logic
            console.log('Exporting with settings:', exportSettings);
            setShowExportPanel(false);
          }}
        />
      )}
    </div>
  );
};

export default VideoCompositionInteractive;