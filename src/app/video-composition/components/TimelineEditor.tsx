'use client';

import { useRef, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { VideoCompositionService } from '@/services/videoCompositionService';
import type { TimelineClip } from '@/types/models';

interface TimelineEditorProps {
  clips: TimelineClip[];
  currentTime: number;
  selectedClipId: string | null;
  onClipSelect: (clipId: string) => void;
  onClipsUpdate: (clips: TimelineClip[]) => void;
  onSeek: (time: number) => void;
}

const PIXELS_PER_SECOND = 50;
const TIMELINE_HEIGHT = 80;

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clips,
  currentTime,
  selectedClipId,
  onClipSelect,
  onClipsUpdate,
  onSeek,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);

  const totalDuration = VideoCompositionService.calculateTotalDuration(clips);
  const timelineWidth = totalDuration * PIXELS_PER_SECOND * zoom;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = (clickX / (PIXELS_PER_SECOND * zoom));
    onSeek(Math.max(0, Math.min(time, totalDuration)));
  };

  const handleReorder = (newClips: TimelineClip[]) => {
    const reorderedClips = VideoCompositionService.reorderClips(
      clips,
      clips.findIndex(c => c.id === newClips[0].id),
      newClips.findIndex(c => c.id === newClips[0].id)
    );
    onClipsUpdate(reorderedClips);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-xs font-caption text-muted-foreground">
            Timeline
          </span>
          <span className="text-xs font-caption text-foreground font-medium">
            {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
            aria-label="Zoom out"
          >
            <Icon name="MinusIcon" size={16} />
          </button>
          <span className="text-xs font-caption text-muted-foreground min-w-[48px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-md text-foreground hover:bg-muted transition-colors focus-ring"
            aria-label="Zoom in"
          >
            <Icon name="PlusIcon" size={16} />
          </button>
        </div>
      </div>

      {/* Timeline Ruler */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-6 bg-card border-b border-border flex">
          {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="relative"
              style={{ width: `${PIXELS_PER_SECOND * zoom}px` }}
            >
              <div className="absolute left-0 top-0 h-full w-px bg-border" />
              <span className="absolute left-1 top-0.5 text-xs font-caption text-muted-foreground">
                {i}s
              </span>
            </div>
          ))}
        </div>

        {/* Timeline Clips */}
        <div
          ref={timelineRef}
          className="relative mt-6 cursor-pointer"
          style={{ height: `${TIMELINE_HEIGHT}px`, width: `${timelineWidth}px` }}
          onClick={handleTimelineClick}
        >
          <Reorder.Group
            axis="x"
            values={clips}
            onReorder={handleReorder}
            className="relative h-full"
          >
            {clips.map((clip) => {
              const left = clip.startTime * PIXELS_PER_SECOND * zoom;
              const width = clip.duration * PIXELS_PER_SECOND * zoom;
              const isSelected = clip.id === selectedClipId;

              return (
                <Reorder.Item
                  key={clip.id}
                  value={clip}
                  className="absolute top-2"
                  style={{ left: `${left}px` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onClipSelect(clip.id);
                  }}
                >
                  <motion.div
                    className={`
                      relative rounded-md overflow-hidden cursor-move transition-all
                      ${isSelected 
                        ? 'ring-2 ring-primary shadow-glow-medium' 
                        : 'ring-1 ring-border hover:ring-primary/50'
                      }
                    `}
                    style={{ width: `${width}px`, height: `${TIMELINE_HEIGHT - 16}px` }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Clip Thumbnail */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5">
                      {clip.thumbnailUrl && (
                        <img
                          src={clip.thumbnailUrl}
                          alt={`Scene ${clip.sceneIndex + 1}`}
                          className="w-full h-full object-cover opacity-70"
                        />
                      )}
                    </div>

                    {/* Clip Info */}
                    <div className="absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-t from-background/90 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-caption font-medium text-foreground">
                          Scene {clip.sceneIndex + 1}
                        </span>
                        {clip.transition && clip.transition.type !== 'none' && (
                          <Icon name="SparklesIcon" size={12} className="text-accent" />
                        )}
                      </div>
                      <div className="text-xs font-caption text-muted-foreground">
                        {clip.duration.toFixed(1)}s
                      </div>
                    </div>

                    {/* Fade Indicators */}
                    {clip.fadeIn && (
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-primary/50 to-transparent" />
                    )}
                    {clip.fadeOut && (
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-primary/50 to-transparent" />
                    )}
                  </motion.div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>

          {/* Playhead */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-accent shadow-glow-soft pointer-events-none"
            style={{ left: `${currentTime * PIXELS_PER_SECOND * zoom}px` }}
            animate={{ left: `${currentTime * PIXELS_PER_SECOND * zoom}px` }}
            transition={{ type: 'tween', duration: 0 }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full shadow-glow-medium" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor;