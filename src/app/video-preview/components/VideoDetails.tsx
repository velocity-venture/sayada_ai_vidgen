import Icon from '@/components/ui/AppIcon';

interface VideoDetailsProps {
  generatedAt: string;
  duration: number;
  scriptureReference: string;
  audioProvider: string;
  videoProvider: string;
  totalScenes: number;
  resolution: string;
}

const VideoDetails = ({
  generatedAt,
  duration,
  scriptureReference,
  audioProvider,
  videoProvider,
  totalScenes,
  resolution
}: VideoDetailsProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const detailItems = [
    {
      icon: 'CalendarIcon',
      label: 'Generated',
      value: generatedAt
    },
    {
      icon: 'ClockIcon',
      label: 'Duration',
      value: formatDuration(duration)
    },
    {
      icon: 'BookOpenIcon',
      label: 'Scripture',
      value: scriptureReference
    },
    {
      icon: 'FilmIcon',
      label: 'Scenes',
      value: `${totalScenes} clips`
    },
    {
      icon: 'VideoCameraIcon',
      label: 'Resolution',
      value: resolution
    }
  ];

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-glow-soft">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="InformationCircleIcon" size={24} className="text-primary" />
        Video Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {detailItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
            <Icon name={item.icon as any} size={20} className="text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-caption text-xs text-muted-foreground mb-1">
                {item.label}
              </div>
              <div className="font-caption text-sm font-medium text-foreground truncate">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="font-caption text-sm font-semibold text-foreground mb-3">
          Processing Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
            <Icon name="SpeakerWaveIcon" size={18} className="text-accent" />
            <div>
              <div className="font-caption text-xs text-muted-foreground">Audio Provider</div>
              <div className="font-caption text-sm font-medium text-foreground">{audioProvider}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
            <Icon name="VideoCameraIcon" size={18} className="text-accent" />
            <div>
              <div className="font-caption text-xs text-muted-foreground">Video Provider</div>
              <div className="font-caption text-sm font-medium text-foreground">{videoProvider}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetails;