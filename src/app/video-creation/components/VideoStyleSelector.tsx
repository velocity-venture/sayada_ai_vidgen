'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface VideoStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  alt: string;
  tags: string[];
}

interface VideoStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (styleId: string) => void;
}

const mockVideoStyles: VideoStyle[] = [
{
  id: 'style-1',
  name: 'Cinematic Scripture',
  description: 'Epic landscapes with dramatic lighting and heavenly atmospheres',
  thumbnail: "https://images.unsplash.com/photo-1718895287246-6d60c9aed150",
  alt: 'Dramatic sunset over mountain range with golden rays breaking through clouds',
  tags: ['Dramatic', 'Epic', 'Spiritual']
},
{
  id: 'style-2',
  name: 'Peaceful Nature',
  description: 'Serene natural scenes with gentle movements and soft colors',
  thumbnail: "https://images.unsplash.com/photo-1669061756989-4de301b2e5c2",
  alt: 'Calm lake reflecting mountains at sunrise with misty atmosphere',
  tags: ['Calm', 'Natural', 'Reflective']
},
{
  id: 'style-3',
  name: 'Modern Worship',
  description: 'Contemporary church settings with warm lighting and community focus',
  thumbnail: "https://images.unsplash.com/photo-1570583898431-dc5b08af5344",
  alt: 'Modern church interior with warm ambient lighting and wooden pews',
  tags: ['Contemporary', 'Community', 'Warm']
},
{
  id: 'style-4',
  name: 'Abstract Divine',
  description: 'Ethereal light patterns and celestial movements with spiritual symbolism',
  thumbnail: "https://images.unsplash.com/photo-1675627452476-13f529c47279",
  alt: 'Abstract golden light rays streaming through darkness creating divine atmosphere',
  tags: ['Abstract', 'Ethereal', 'Symbolic']
}];


const VideoStyleSelector = ({ selectedStyle, onStyleChange }: VideoStyleSelectorProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) =>
          <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />
          )}
        </div>
      </div>);

  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="FilmIcon" size={24} className="text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Video Style
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockVideoStyles.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <div
              key={style.id}
              className={`
                group relative rounded-lg overflow-hidden cursor-pointer
                transition-all duration-250 border-2
                ${isSelected ?
              'border-primary shadow-glow-medium' :
              'border-border hover:border-primary/50'}
              `
              }
              onClick={() => onStyleChange(style.id)}>

              <div className="relative h-40 overflow-hidden">
                <AppImage
                  src={style.thumbnail}
                  alt={style.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                
                {isSelected &&
                <div className="absolute top-3 right-3 p-2 bg-primary text-primary-foreground rounded-full shadow-glow-medium">
                    <Icon name="CheckIcon" size={16} />
                  </div>
                }
              </div>

              <div className="p-4">
                <h3 className="font-caption text-base font-semibold text-foreground mb-1">
                  {style.name}
                </h3>
                <p className="font-caption text-sm text-muted-foreground mb-3">
                  {style.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {style.tags.map((tag) =>
                  <span
                    key={tag}
                    className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-caption">

                      {tag}
                    </span>
                  )}
                </div>
              </div>
            </div>);

        })}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/50">
        <div className="flex items-start gap-2">
          <Icon name="SparklesIcon" size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="font-caption text-xs text-muted-foreground">
            Video clips generated using Pika Labs AI with your selected style preferences
          </p>
        </div>
      </div>
    </div>);

};

export default VideoStyleSelector;