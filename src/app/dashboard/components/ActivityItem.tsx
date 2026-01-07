import Icon from '@/components/ui/AppIcon';

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'created' | 'completed' | 'downloaded' | 'deleted';
    projectTitle: string;
    timestamp: string;
    details?: string;
  };
}

const ActivityItem = ({ activity }: ActivityItemProps) => {
  const activityConfig = {
    created: {
      icon: 'PlusCircleIcon',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      label: 'Created'
    },
    completed: {
      icon: 'CheckCircleIcon',
      color: 'text-success',
      bgColor: 'bg-success/10',
      label: 'Completed'
    },
    downloaded: {
      icon: 'ArrowDownTrayIcon',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      label: 'Downloaded'
    },
    deleted: {
      icon: 'TrashIcon',
      color: 'text-error',
      bgColor: 'bg-error/10',
      label: 'Deleted'
    }
  };

  const config = activityConfig[activity.type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-250">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} ${config.color} shrink-0`}>
        <Icon name={config.icon as any} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-caption text-sm font-medium text-foreground">
            {config.label}
          </span>
          <span className="font-caption text-xs text-muted-foreground">
            {activity.timestamp}
          </span>
        </div>
        <p className="font-caption text-sm text-foreground truncate mb-1">
          {activity.projectTitle}
        </p>
        {activity.details && (
          <p className="font-caption text-xs text-muted-foreground line-clamp-2">
            {activity.details}
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;