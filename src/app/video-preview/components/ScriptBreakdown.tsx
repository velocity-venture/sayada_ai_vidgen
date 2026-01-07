import Icon from '@/components/ui/AppIcon';

interface Scene {
  sceneNumber: number;
  text: string;
  prompt: string;
  duration: number;
  startTime: number;
}

interface ScriptBreakdownProps {
  originalScript: string;
  scenes: Scene[];
}

const ScriptBreakdown = ({ originalScript, scenes }: ScriptBreakdownProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-glow-soft">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="DocumentTextIcon" size={24} className="text-primary" />
        Script & Scene Breakdown
      </h2>

      {/* Original Script */}
      <div className="mb-6">
        <h3 className="font-caption text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Icon name="BookOpenIcon" size={16} className="text-accent" />
          Original Scripture Text
        </h3>
        <div className="p-4 rounded-md bg-muted/50 border border-border">
          <p className="font-caption text-sm text-foreground leading-relaxed">
            {originalScript}
          </p>
        </div>
      </div>

      {/* Scene Breakdown */}
      <div>
        <h3 className="font-caption text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon name="FilmIcon" size={16} className="text-accent" />
          Scene Segments ({scenes.length} clips)
        </h3>
        <div className="space-y-3">
          {scenes.map((scene) => (
            <div
              key={scene.sceneNumber}
              className="p-4 rounded-md bg-muted/50 border border-border hover:border-primary/50 transition-all duration-250"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-caption text-sm font-bold">
                    {scene.sceneNumber}
                  </div>
                  <div>
                    <div className="font-caption text-xs text-muted-foreground">
                      Scene {scene.sceneNumber}
                    </div>
                    <div className="font-caption text-sm font-medium text-foreground">
                      {formatTime(scene.startTime)} - {formatTime(scene.startTime + scene.duration)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent">
                  <Icon name="ClockIcon" size={14} />
                  <span className="font-caption text-xs font-medium">
                    {scene.duration}s
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="font-caption text-xs text-muted-foreground mb-1">
                    Scripture Text:
                  </div>
                  <p className="font-caption text-sm text-foreground leading-relaxed">
                    {scene.text}
                  </p>
                </div>
                <div>
                  <div className="font-caption text-xs text-muted-foreground mb-1">
                    Visual Prompt:
                  </div>
                  <p className="font-caption text-sm text-primary/90 leading-relaxed italic">
                    {scene.prompt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScriptBreakdown;