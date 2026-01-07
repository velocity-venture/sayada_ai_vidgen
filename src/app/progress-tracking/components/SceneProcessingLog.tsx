import Icon from '@/components/ui/AppIcon';

interface SceneLog {
  id: string;
  sceneNumber: number;
  prompt: string;
  audioStatus: 'pending' | 'processing' | 'completed' | 'error';
  videoStatus: 'pending' | 'processing' | 'completed' | 'error';
  audioProvider: string;
  videoProvider: string;
  duration: string;
  timestamp: string;
}

interface SceneProcessingLogProps {
  scenes: SceneLog[];
}

const SceneProcessingLog = ({ scenes }: SceneProcessingLogProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: 'CheckCircleIcon', color: 'text-success' };
      case 'processing':
        return { icon: 'ArrowPathIcon', color: 'text-primary animate-spin' };
      case 'error':
        return { icon: 'XCircleIcon', color: 'text-error' };
      default:
        return { icon: 'ClockIcon', color: 'text-muted-foreground' };
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon name="DocumentTextIcon" size={24} className="text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Scene Processing Log
        </h2>
      </div>

      <div className="space-y-4">
        {scenes.map((scene) => {
          const audioStatusIcon = getStatusIcon(scene.audioStatus);
          const videoStatusIcon = getStatusIcon(scene.videoStatus);

          return (
            <div
              key={scene.id}
              className="bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/30 transition-all duration-250"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border-2 border-primary shrink-0">
                  <span className="font-heading text-sm font-semibold text-primary">
                    {scene.sceneNumber}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-caption text-sm text-foreground mb-3 leading-relaxed">
                    {scene.prompt}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-card rounded-md">
                      <Icon
                        name={audioStatusIcon.icon as any}
                        size={16}
                        className={audioStatusIcon.color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-caption text-xs text-muted-foreground">
                          Audio ({scene.audioProvider})
                        </div>
                        <div className="font-caption text-xs font-medium text-foreground capitalize">
                          {scene.audioStatus}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-card rounded-md">
                      <Icon
                        name={videoStatusIcon.icon as any}
                        size={16}
                        className={videoStatusIcon.color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-caption text-xs text-muted-foreground">
                          Video ({scene.videoProvider})
                        </div>
                        <div className="font-caption text-xs font-medium text-foreground capitalize">
                          {scene.videoStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs font-caption text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Icon name="ClockIcon" size={12} />
                      <span>{scene.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon name="CalendarIcon" size={12} />
                      <span>{scene.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SceneProcessingLog;