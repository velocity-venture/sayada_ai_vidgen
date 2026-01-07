import Icon from '@/components/ui/AppIcon';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
}

const StatsCard = ({ title, value, icon, trend, description }: StatsCardProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-6 transition-all duration-300 hover:shadow-glow-soft hover:border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
            <Icon name={icon as any} size={24} />
          </div>
          <div>
            <p className="font-caption text-sm text-muted-foreground mb-1">{title}</p>
            <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-caption font-medium ${trend.isPositive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
            <Icon name={trend.isPositive ? 'ArrowUpIcon' : 'ArrowDownIcon'} size={12} />
            <span>{trend.value}</span>
          </div>
          <span className="font-caption text-xs text-muted-foreground">vs last month</span>
        </div>
      )}

      {description && (
        <p className="font-caption text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatsCard;