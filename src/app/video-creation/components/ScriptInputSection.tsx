'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ScriptInputSectionProps {
  value: string;
  onChange: (value: string) => void;
  maxCharacters?: number;
}

const ScriptInputSection = ({ 
  value, 
  onChange, 
  maxCharacters = 1000 
}: ScriptInputSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      setCharacterCount(value.length);
    }
  }, [value, isHydrated]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxCharacters) {
      onChange(newValue);
    }
  };

  const percentageUsed = isHydrated ? (characterCount / maxCharacters) * 100 : 0;
  const isNearLimit = percentageUsed > 80;
  const isAtLimit = percentageUsed >= 100;

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Scripture Text Input
          </h2>
          <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name="DocumentTextIcon" size={24} className="text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Scripture Text Input
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className={`font-caption text-sm font-medium ${
              isAtLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-muted-foreground'
            }`}
          >
            {characterCount} / {maxCharacters}
          </span>
          {isAtLimit && (
            <Icon name="ExclamationCircleIcon" size={18} className="text-error" />
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={handleTextChange}
          placeholder="Enter your scripture text or devotional message here. The AI will analyze and divide your content into 3-4 compelling scenes for video generation..."
          className="w-full h-64 px-4 py-3 bg-background text-foreground rounded-md border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-250 resize-none font-body text-base leading-relaxed placeholder:text-muted-foreground"
          aria-label="Scripture text input"
        />
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-md overflow-hidden"
          role="progressbar"
          aria-valuenow={percentageUsed}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div 
            className={`h-full transition-all duration-300 ${
              isAtLimit ? 'bg-error' : isNearLimit ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-md border border-border/50">
        <div className="flex items-start gap-3">
          <Icon name="InformationCircleIcon" size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-caption text-sm font-semibold text-foreground mb-2">
              Formatting Tips for Best Results
            </h3>
            <ul className="space-y-1 font-caption text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Break longer passages into clear paragraphs or verses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Include scripture references (e.g., John 3:16) for context</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Use natural pauses and punctuation for better audio flow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Aim for 150-250 words for optimal 30-60 second videos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptInputSection;