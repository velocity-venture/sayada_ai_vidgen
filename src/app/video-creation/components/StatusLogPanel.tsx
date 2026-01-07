'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface StatusUpdate {
  stage: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface StatusLogPanelProps {
  statusUpdates: StatusUpdate[];
  isVisible: boolean;
}

export default function StatusLogPanel({ statusUpdates, isVisible }: StatusLogPanelProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="BeakerIcon" size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="font-caption text-lg font-semibold text-foreground mb-1">
            AI Director - Live Status
          </h3>
          <p className="font-body text-sm text-muted-foreground">
            Real-time updates from the video generation pipeline
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {statusUpdates.map((update, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-lg border-l-4 transition-all duration-250
              ${update.status === 'completed' ? 'border-green-500 bg-green-50/50' : ''}
              ${update.status === 'processing' ? 'border-blue-500 bg-blue-50/50' : ''}
              ${update.status === 'failed' ? 'border-red-500 bg-red-50/50' : ''}
              ${update.status === 'pending' ? 'border-gray-400 bg-gray-50/50' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {update.status === 'completed' && (
                  <Icon name="CheckCircleIcon" size={20} className="text-green-600" />
                )}
                {update.status === 'processing' && (
                  <Icon name="ArrowPathIcon" size={20} className="text-blue-600 animate-spin" />
                )}
                {update.status === 'failed' && (
                  <Icon name="XCircleIcon" size={20} className="text-red-600" />
                )}
                {update.status === 'pending' && (
                  <Icon name="ClockIcon" size={20} className="text-gray-600" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-caption text-sm font-semibold text-foreground">
                    {update.stage}
                  </h4>
                  <span className="font-caption text-xs text-muted-foreground">
                    {update.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground">
                  {update.message}
                </p>
              </div>
            </div>
          </div>
        ))}

        {statusUpdates.length === 0 && (
          <div className="text-center py-8">
            <Icon name="BeakerIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-caption text-sm text-muted-foreground">
              Waiting for generation to start...
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <Icon name="InformationCircleIcon" size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-caption text-xs font-semibold text-blue-900 mb-1">
              Pipeline Stages:
            </p>
            <ul className="space-y-0.5 font-body text-xs text-blue-800">
              <li>• OpenAI Script Analysis → Scene Breakdown</li>
              <li>• ElevenLabs Audio Generation → Cinematic Narration</li>
              <li>• Pika Labs Video Generation → Scene Visuals</li>
              <li>• FFmpeg Final Stitching → Complete Video</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}