'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import type { VideoTemplate } from '@/types/models';

interface TemplateSelectorProps {
  templates: VideoTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
  loading?: boolean;
}

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  loading = false
}: TemplateSelectorProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
        <h3 className="font-caption text-lg font-semibold text-foreground mb-4">
          Smart Video Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-caption text-lg font-semibold text-foreground mb-1">
            Smart Video Templates
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            Pre-configured AI templates with optimized voice, style, and pacing
          </p>
        </div>
        <Icon name="SparklesIcon" size={24} className="text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-250 text-left
              ${selectedTemplateId === template.id
                ? 'border-primary bg-primary/10 shadow-glow-soft'
                : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            {selectedTemplateId === template.id && (
              <div className="absolute top-2 right-2">
                <Icon name="CheckCircleIcon" size={20} className="text-primary" />
              </div>
            )}

            <div className="mb-2">
              <h4 className="font-caption text-base font-semibold text-foreground mb-1">
                {template.name}
              </h4>
              <p className="font-body text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-caption text-xs">
                {template.durationSeconds}s
              </span>
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full font-caption text-xs">
                {template.category.replace('_', ' ')}
              </span>
              {template.elevenLabsVoiceId && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-caption text-xs flex items-center gap-1">
                  <Icon name="SpeakerWaveIcon" size={12} />
                  Voice AI
                </span>
              )}
              {template.pikaStylePrompt && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-caption text-xs flex items-center gap-1">
                  <Icon name="VideoCameraIcon" size={12} />
                  Pika AI
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8">
          <Icon name="ExclamationTriangleIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-caption text-sm text-muted-foreground">
            No templates available. Please contact support.
          </p>
        </div>
      )}
    </div>
  );
}