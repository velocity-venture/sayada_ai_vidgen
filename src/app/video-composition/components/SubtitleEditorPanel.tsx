'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SubtitleService } from '@/services/subtitleService';
import type { SubtitleEditorSegment, SubtitleStylePreset } from '@/types/models';

interface SubtitleEditorPanelProps {
  projectId: string;
  segments: SubtitleEditorSegment[];
  currentStyle: SubtitleStylePreset;
  currentTime: number;
  onSegmentsUpdate: (segments: SubtitleEditorSegment[]) => void;
  onStyleChange: (style: SubtitleStylePreset) => void;
}

const SubtitleEditorPanel = ({
  projectId,
  segments,
  currentStyle,
  currentTime,
  onSegmentsUpdate,
  onStyleChange,
}: SubtitleEditorPanelProps) => {
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const styleOptions: { value: SubtitleStylePreset; label: string }[] = [
    { value: 'auto', label: 'Auto (Smart Detection)' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'impact', label: 'Impact' },
    { value: 'minimal', label: 'Minimal' },
  ];

  const handleStartEdit = (segment: SubtitleEditorSegment) => {
    setEditingSegmentId(segment.id);
    setEditText(segment.text);
  };

  const handleSaveEdit = () => {
    if (editingSegmentId === null) return;
    
    const updatedSegments = SubtitleService.updateSegmentText(
      segments,
      editingSegmentId,
      editText
    );
    
    onSegmentsUpdate(updatedSegments);
    setEditingSegmentId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingSegmentId(null);
    setEditText('');
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const isSegmentActive = (segment: SubtitleEditorSegment): boolean => {
    return currentTime >= segment.start && currentTime <= segment.end;
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Subtitle Editor
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-caption">
            {segments.length} segments
          </span>
        </div>
      </div>

      {/* Style Selector */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <label className="block text-sm font-medium text-foreground mb-2">
          Subtitle Style
        </label>
        <select
          value={currentStyle}
          onChange={(e) => onStyleChange(e.target.value as SubtitleStylePreset)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {styleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground font-caption">
          Auto mode detects the best style based on content
        </p>
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto">
        {segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Icon name="ChatBubbleBottomCenterTextIcon" size={48} className="text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">No Subtitles Yet</p>
            <p className="text-sm text-muted-foreground font-caption">
              Subtitles will appear here once generated
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {segments.map((segment) => {
              const isActive = isSegmentActive(segment);
              const isEditing = editingSegmentId === segment.id;

              return (
                <div
                  key={segment.id}
                  className={`p-3 rounded-md border transition-colors ${
                    isActive
                      ? 'bg-primary/10 border-primary' :'bg-card border-border hover:border-muted-foreground'
                  }`}
                >
                  {/* Timestamp */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatTimestamp(segment.start)} → {formatTimestamp(segment.end)}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(segment)}
                        className="p-1 rounded text-foreground hover:bg-muted transition-colors"
                        aria-label="Edit segment"
                      >
                        <Icon name="PencilIcon" size={14} />
                      </button>
                    )}
                  </div>

                  {/* Text Content */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-background border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-3 py-1.5 bg-muted text-foreground text-sm rounded hover:bg-muted/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">
                      {segment.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtitleEditorPanel;