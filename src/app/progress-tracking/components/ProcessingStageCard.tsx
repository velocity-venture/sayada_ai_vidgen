import Icon from '@/components/ui/AppIcon';

interface ProcessingStageCardProps {
  stage: {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    elapsedTime: string;
    estimatedTime: string;
    icon: string;
  };
}

const ProcessingStageCard = ({ stage }: ProcessingStageCardProps) => {
  const statusConfig = {
    pending: {
      bgColor: 'bg-muted',
      textColor: 'text-muted-foreground',
      borderColor: 'border-muted',
      iconColor: 'text-muted-foreground'
    },
    processing: {
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-primary',
      iconColor: 'text-primary'
    },
    completed: {
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      borderColor: 'border-success',
      iconColor: 'text-success'
    },
    error: {
      bgColor: 'bg-error/10',
      textColor: 'text-error',
      borderColor: 'border-error',
      iconColor: 'text-error'
    }
  };

  const config = statusConfig[stage.status];

  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 transition-all duration-300
        ${config.bgColor} ${config.borderColor}
        ${stage.status === 'processing' ? 'shadow-glow-medium' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`
            flex items-center justify-center w-12 h-12 rounded-full
            ${config.bgColor} ${config.borderColor} border-2
            ${stage.status === 'processing' ? 'animate-pulse' : ''}
          `}
        >
          <Icon
            name={stage.icon as any}
            size={24}
            className={`${config.iconColor} ${stage.status === 'processing' ? 'animate-spin' : ''}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {stage.label}
            </h3>
            <span className={`font-caption text-sm font-medium ${config.textColor}`}>
              {stage.progress}%
            </span>
          </div>

          <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className={`absolute inset-y-0 left-0 ${config.textColor.replace('text-', 'bg-')} transition-all duration-500 rounded-full`}
              style={{ width: `${stage.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 text-xs font-caption text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Icon name="ClockIcon" size={14} />
              <span>Elapsed: {stage.elapsedTime}</span>
            </div>
            {stage.status === 'processing' && (
              <div className="flex items-center gap-1.5">
                <Icon name="ArrowPathIcon" size={14} />
                <span>Est: {stage.estimatedTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStageCard;