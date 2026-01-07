'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface DurationSettingsProps {
  duration: number;
  onDurationChange: (duration: number) => void;
}

const DurationSettings = ({ duration, onDurationChange }: DurationSettingsProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const durationOptions = [
    { value: 30, label: '30 seconds', description: 'Quick, impactful message', icon: 'BoltIcon' },
    { value: 45, label: '45 seconds', description: 'Balanced content delivery', icon: 'ScaleIcon' },
    { value: 60, label: '60 seconds', description: 'Comprehensive narrative', icon: 'BookOpenIcon' }
  ];

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="ClockIcon" size={24} className="text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Video Duration
        </h2>
      </div>

      <div className="space-y-3">
        {durationOptions.map((option) => {
          const isSelected = duration === option.value;

          return (
            <div
              key={option.value}
              className={`
                p-4 rounded-md border-2 transition-all duration-250 cursor-pointer
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-glow-soft' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onClick={() => onDurationChange(option.value)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`
                    p-2 rounded-md transition-all duration-250
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon name={option.icon as any} size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-caption text-base font-semibold text-foreground">
                      {option.label}
                    </h3>
                    <p className="font-caption text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <Icon name="CheckCircleIcon" size={20} className="text-primary" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-md border border-border/50">
        <div className="flex items-start gap-3">
          <Icon name="InformationCircleIcon" size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-caption text-sm font-semibold text-foreground mb-2">
              Duration Guidelines
            </h3>
            <ul className="space-y-1 font-caption text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>30 seconds: Ideal for social media posts and quick devotionals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>45 seconds: Perfect for sermon teasers and scripture highlights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>60 seconds: Best for complete messages and teaching moments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DurationSettings;