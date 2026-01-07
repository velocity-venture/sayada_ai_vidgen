'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Scene {
  id: number;
  prompt: string;
  duration: number;
  visualDescription: string;
}

interface ScriptAnalysisPreviewProps {
  scriptText: string;
  videoDuration: number;
}

const ScriptAnalysisPreview = ({ scriptText, videoDuration }: ScriptAnalysisPreviewProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !scriptText.trim()) {
      setScenes([]);
      return;
    }

    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const wordCount = scriptText.trim().split(/\s+/).length;
      const sceneCount = Math.min(4, Math.max(3, Math.ceil(wordCount / 50)));
      const sceneDuration = Math.floor(videoDuration / sceneCount);

      const mockScenes: Scene[] = Array.from({ length: sceneCount }, (_, i) => ({
        id: i + 1,
        prompt: `Scene ${i + 1}: ${scriptText.slice(i * 50, (i + 1) * 50).trim() || 'Visual representation of scripture message'}`,
        duration: sceneDuration,
        visualDescription: i === 0 
          ? 'Opening scene with dramatic lighting and spiritual atmosphere'
          : i === sceneCount - 1
          ? 'Closing scene with peaceful resolution and divine presence'
          : `Mid-scene ${i} with thematic visual elements and smooth transitions`
      }));

      setScenes(mockScenes);
      setIsAnalyzing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [scriptText, videoDuration, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!scriptText.trim()) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="EyeIcon" size={24} className="text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Script Analysis Preview
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="DocumentTextIcon" size={48} className="text-muted-foreground mb-4" />
          <p className="font-caption text-sm text-muted-foreground max-w-md">
            Enter your scripture text above to see how it will be divided into scenes for video generation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name="EyeIcon" size={24} className="text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Script Analysis Preview
          </h2>
        </div>
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-primary">
            <Icon name="ArrowPathIcon" size={18} className="animate-spin" />
            <span className="font-caption text-sm">Analyzing...</span>
          </div>
        )}
      </div>

      {scenes.length > 0 && (
        <>
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="SparklesIcon" size={16} className="text-primary" />
              <span className="font-caption text-sm font-semibold text-foreground">
                AI Analysis Complete
              </span>
            </div>
            <p className="font-caption text-xs text-muted-foreground">
              Your script will be divided into {scenes.length} scenes, each approximately {scenes[0]?.duration} seconds long
            </p>
          </div>

          <div className="space-y-3">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="p-4 bg-muted/30 rounded-md border border-border hover:border-primary/50 transition-all duration-250"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-caption text-sm font-semibold shrink-0">
                    {scene.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-caption text-sm font-semibold text-foreground">
                        Scene {scene.id}
                      </h3>
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-caption">
                        {scene.duration}s
                      </span>
                    </div>
                    <p className="font-caption text-sm text-foreground mb-2 line-clamp-2">
                      {scene.prompt}
                    </p>
                    <div className="flex items-start gap-2 p-2 bg-background/50 rounded">
                      <Icon name="FilmIcon" size={14} className="text-primary shrink-0 mt-0.5" />
                      <p className="font-caption text-xs text-muted-foreground">
                        {scene.visualDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/50">
            <div className="flex items-start gap-2">
              <Icon name="InformationCircleIcon" size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="font-caption text-xs text-muted-foreground">
                Each scene will be generated as an 8-second video clip and automatically looped/trimmed to match the audio duration
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScriptAnalysisPreview;