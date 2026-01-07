'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface GenerationCostCardProps {
  scriptLength: number;
  videoDuration: number;
  sceneCount: number;
}

const GenerationCostCard = ({ scriptLength, videoDuration, sceneCount }: GenerationCostCardProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const calculateCosts = () => {
    const audioCredits = Math.ceil(scriptLength / 100) * 10;
    const videoCredits = sceneCount * 25;
    const totalCredits = audioCredits + videoCredits;
    const estimatedTime = Math.ceil(sceneCount * 2.5);

    return { audioCredits, videoCredits, totalCredits, estimatedTime };
  };

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const costs = calculateCosts();

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="CurrencyDollarIcon" size={24} className="text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Generation Cost
        </h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <Icon name="SpeakerWaveIcon" size={18} className="text-primary" />
            <span className="font-caption text-sm text-foreground">Audio Generation</span>
          </div>
          <span className="font-caption text-sm font-semibold text-foreground">
            {costs.audioCredits} credits
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <Icon name="FilmIcon" size={18} className="text-primary" />
            <span className="font-caption text-sm text-foreground">
              Video Clips ({sceneCount} scenes)
            </span>
          </div>
          <span className="font-caption text-sm font-semibold text-foreground">
            {costs.videoCredits} credits
          </span>
        </div>

        <div className="h-px bg-border my-2" />

        <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-md">
          <div className="flex items-center gap-2">
            <Icon name="SparklesIcon" size={20} className="text-primary" />
            <span className="font-caption text-base font-semibold text-foreground">
              Total Cost
            </span>
          </div>
          <span className="font-caption text-lg font-bold text-primary">
            {costs.totalCredits} credits
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <Icon name="ClockIcon" size={18} className="text-primary" />
            <span className="font-caption text-sm text-foreground">Estimated Time</span>
          </div>
          <span className="font-caption text-sm font-semibold text-foreground">
            {costs.estimatedTime} minutes
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/50">
        <div className="flex items-start gap-2">
          <Icon name="InformationCircleIcon" size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-caption text-xs text-muted-foreground mb-2">
              Credits are consumed only when generation is successful. Failed generations are automatically refunded.
            </p>
            <p className="font-caption text-xs text-primary font-medium">
              Current Balance: 500 credits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationCostCard;