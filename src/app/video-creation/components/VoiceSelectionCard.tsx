'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  description: string;
  previewUrl: string;
}

interface VoiceSelectionCardProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
}

const mockVoices: Voice[] = [
  {
    id: 'voice-1',
    name: 'David',
    gender: 'Male',
    accent: 'American',
    description: 'Warm, authoritative voice perfect for scripture reading',
    previewUrl: '#'
  },
  {
    id: 'voice-2',
    name: 'Sarah',
    gender: 'Female',
    accent: 'British',
    description: 'Clear, gentle voice ideal for devotional content',
    previewUrl: '#'
  },
  {
    id: 'voice-3',
    name: 'Michael',
    gender: 'Male',
    accent: 'Australian',
    description: 'Engaging, conversational tone for modern messages',
    previewUrl: '#'
  },
  {
    id: 'voice-4',
    name: 'Grace',
    gender: 'Female',
    accent: 'American',
    description: 'Soothing, compassionate voice for reflective passages',
    previewUrl: '#'
  }
];

const VoiceSelectionCard = ({ selectedVoice, onVoiceChange }: VoiceSelectionCardProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handlePlayPreview = (voiceId: string) => {
    if (!isHydrated) return;
    setIsPlaying(isPlaying === voiceId ? null : voiceId);
  };

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="SpeakerWaveIcon" size={24} className="text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Voice Selection
        </h2>
      </div>

      <div className="space-y-3">
        {mockVoices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isCurrentlyPlaying = isPlaying === voice.id;

          return (
            <div
              key={voice.id}
              className={`
                p-4 rounded-md border-2 transition-all duration-250 cursor-pointer
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-glow-soft' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onClick={() => onVoiceChange(voice.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-caption text-base font-semibold text-foreground">
                      {voice.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-caption">
                      {voice.gender}
                    </span>
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-caption">
                      {voice.accent}
                    </span>
                  </div>
                  <p className="font-caption text-sm text-muted-foreground">
                    {voice.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice.id);
                    }}
                    className="p-2 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-250 focus-ring"
                    aria-label={`Preview ${voice.name} voice`}
                  >
                    <Icon 
                      name={isCurrentlyPlaying ? 'PauseIcon' : 'PlayIcon'} 
                      size={18} 
                    />
                  </button>
                  {isSelected && (
                    <Icon name="CheckCircleIcon" size={20} className="text-primary" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/50">
        <div className="flex items-start gap-2">
          <Icon name="SparklesIcon" size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="font-caption text-xs text-muted-foreground">
            All voices are powered by ElevenLabs AI for natural, expressive speech synthesis
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelectionCard;