'use client';

import React, { useState } from 'react';
import type { VideoTemplate } from '@/types/models';

interface TemplateCardProps {
  template: VideoTemplate;
  onUse?: (template: VideoTemplate) => void;
  onDelete?: (templateId: string) => void;
}

export function TemplateCard({ template, onUse, onDelete }: TemplateCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(template.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const motionStrengthLabel = (strength: number | null) => {
    if (!strength) return 'Not set';
    const labels = ['', 'Low', 'Medium', 'High', 'Very High'];
    return labels[strength] || 'Unknown';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
          {template.description && (
            <p className="text-slate-400 text-sm line-clamp-2">{template.description}</p>
          )}
        </div>
        {template.is_system_template && (
          <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
            System
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-slate-300">
          <span className="w-24">Category:</span>
          <span className="font-medium text-white capitalize">
            {template.category.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center text-slate-300">
          <span className="w-24">Duration:</span>
          <span className="font-medium text-white">{template.duration_seconds}s</span>
        </div>
        <div className="flex items-center text-slate-300">
          <span className="w-24">Usage:</span>
          <span className="font-medium text-white">{template.usage_count} times</span>
        </div>

        {/* AI Configuration Display */}
        {showDetails && (
          <div className="border-t border-slate-700 pt-3 mt-3 space-y-2">
            <div className="text-blue-400 font-semibold mb-2 flex items-center">
              <span className="mr-2">🎨</span> AI Configuration
            </div>
            
            {template.elevenlabs_voice_id && (
              <div className="flex items-start text-slate-300">
                <span className="w-32 flex items-center">
                  <span className="mr-1">🎤</span> Voice ID:
                </span>
                <span className="font-mono text-white text-xs bg-slate-900 px-2 py-1 rounded">
                  {template.elevenlabs_voice_id}
                </span>
              </div>
            )}
            
            {template.pika_style_prompt && (
              <div className="text-slate-300">
                <div className="flex items-center mb-1">
                  <span className="mr-1">✨</span> Style Prompt:
                </div>
                <p className="text-white text-xs bg-slate-900 p-2 rounded">
                  {template.pika_style_prompt}
                </p>
              </div>
            )}
            
            {template.pika_negative_prompt && (
              <div className="text-slate-300">
                <div className="flex items-center mb-1">
                  <span className="mr-1">🚫</span> Negative Prompt:
                </div>
                <p className="text-white text-xs bg-slate-900 p-2 rounded">
                  {template.pika_negative_prompt}
                </p>
              </div>
            )}
            
            {template.motion_strength && (
              <div className="flex items-center text-slate-300">
                <span className="w-32 flex items-center">
                  <span className="mr-1">🎬</span> Motion:
                </span>
                <span className="font-medium text-white">
                  {motionStrengthLabel(template.motion_strength)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
        >
          {showDetails ? 'Hide AI Config' : 'Show AI Config'}
        </button>
        {onUse && (
          <button
            onClick={() => onUse(template)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Use Template
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}