'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { VideoCompositionService } from '@/services/videoCompositionService';
import type { TimelineClip, TransitionEffect } from '@/types/models';

interface ClipPropertiesPanelProps {
  clip: TimelineClip;
  clips: TimelineClip[];
  onUpdate: (updatedClips: TimelineClip[]) => void;
}

const ClipPropertiesPanel: React.FC<ClipPropertiesPanelProps> = ({
  clip,
  clips,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'timing' | 'effects' | 'transition'>('timing');
  const availableTransitions = VideoCompositionService.getAvailableTransitions();

  const handleTrimChange = (type: 'start' | 'end', value: number) => {
    const maxTrim = clip.duration * 0.3; // Max 30% trim
    const trimValue = Math.max(0, Math.min(value, maxTrim));
    
    const updatedClips = VideoCompositionService.trimClip(
      clips,
      clip.id,
      type === 'start' ? trimValue : clip.trimStart || 0,
      type === 'end' ? trimValue : clip.trimEnd || 0
    );
    onUpdate(updatedClips);
  };

  const handleFadeChange = (type: 'in' | 'out', value: number) => {
    const maxFade = clip.duration * 0.3; // Max 30% fade
    const fadeValue = Math.max(0, Math.min(value, maxFade));
    
    const updatedClips = VideoCompositionService.applyFadeEffect(
      clips,
      clip.id,
      type === 'in' ? fadeValue : clip.fadeIn,
      type === 'out' ? fadeValue : clip.fadeOut
    );
    onUpdate(updatedClips);
  };

  const handleTransitionChange = (transition: TransitionEffect) => {
    const updatedClips = VideoCompositionService.updateClipTransition(
      clips,
      clip.id,
      transition
    );
    onUpdate(updatedClips);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-caption font-semibold text-foreground">
          Scene {clip.sceneIndex + 1} Properties
        </h3>
        <p className="text-xs text-muted-foreground font-caption mt-1">
          {clip.duration.toFixed(2)}s • {clip.startTime.toFixed(2)}s - {clip.endTime.toFixed(2)}s
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['timing', 'effects', 'transition'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-4 py-2 text-xs font-caption font-medium transition-colors
              ${activeTab === tab
                ? 'text-primary border-b-2 border-primary bg-primary/5' :'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'timing' && (
          <>
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Trim Start
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={clip.duration * 0.3}
                  step={0.1}
                  value={clip.trimStart || 0}
                  onChange={(e) => handleTrimChange('start', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-xs font-caption text-muted-foreground min-w-[48px] text-right">
                  {(clip.trimStart || 0).toFixed(2)}s
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Trim End
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={clip.duration * 0.3}
                  step={0.1}
                  value={clip.trimEnd || 0}
                  onChange={(e) => handleTrimChange('end', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-xs font-caption text-muted-foreground min-w-[48px] text-right">
                  {(clip.trimEnd || 0).toFixed(2)}s
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs font-caption">
                <span className="text-muted-foreground">Effective Duration</span>
                <span className="font-medium text-foreground">
                  {(clip.duration - (clip.trimStart || 0) - (clip.trimEnd || 0)).toFixed(2)}s
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'effects' && (
          <>
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Fade In
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={clip.duration * 0.3}
                  step={0.1}
                  value={clip.fadeIn || 0}
                  onChange={(e) => handleFadeChange('in', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-xs font-caption text-muted-foreground min-w-[48px] text-right">
                  {(clip.fadeIn || 0).toFixed(2)}s
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Fade Out
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={clip.duration * 0.3}
                  step={0.1}
                  value={clip.fadeOut || 0}
                  onChange={(e) => handleFadeChange('out', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-xs font-caption text-muted-foreground min-w-[48px] text-right">
                  {(clip.fadeOut || 0).toFixed(2)}s
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-caption text-muted-foreground">
                <Icon name="InformationCircleIcon" size={16} />
                <span>Fade effects smooth clip transitions</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'transition' && (
          <>
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-3">
                Transition Effect
              </label>
              <div className="space-y-2">
                {availableTransitions.map((transition) => (
                  <button
                    key={transition.type}
                    onClick={() => handleTransitionChange(transition)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-md
                      transition-all focus-ring
                      ${clip.transition?.type === transition.type
                        ? 'bg-primary text-primary-foreground shadow-glow-soft'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                      }
                    `}
                  >
                    <span className="text-sm font-caption font-medium">
                      {transition.type.split('-').map(w => 
                        w.charAt(0).toUpperCase() + w.slice(1)
                      ).join(' ')}
                    </span>
                    {transition.duration > 0 && (
                      <span className="text-xs font-caption opacity-70">
                        {transition.duration.toFixed(2)}s
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-caption text-muted-foreground">
                <Icon name="SparklesIcon" size={16} />
                <span>Spiritual-themed transitions for scripture videos</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClipPropertiesPanel;