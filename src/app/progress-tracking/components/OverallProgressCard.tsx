import Icon from '@/components/ui/AppIcon';

interface OverallProgressCardProps {
  overallProgress: number;
  currentPhase: string;
  totalElapsedTime: string;
  estimatedCompletion: string;
  completedStages: number;
  totalStages: number;
}

const OverallProgressCard = ({
  overallProgress,
  currentPhase,
  totalElapsedTime,
  estimatedCompletion,
  completedStages,
  totalStages
}: OverallProgressCardProps) => {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/5 rounded-lg border-2 border-primary/30 p-6 shadow-glow-medium">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Overall Progress
          </h2>
          <p className="font-caption text-sm text-muted-foreground">
            {currentPhase}
          </p>
        </div>
        <div className="text-right">
          <div className="font-heading text-3xl font-bold text-primary">
            {overallProgress}%
          </div>
          <div className="font-caption text-xs text-muted-foreground mt-1">
            {completedStages} of {totalStages} stages
          </div>
        </div>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full shadow-glow-soft"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-card/50 rounded-md">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Icon name="ClockIcon" size={20} className="text-primary" />
          </div>
          <div>
            <div className="font-caption text-xs text-muted-foreground">
              Total Elapsed
            </div>
            <div className="font-caption text-sm font-semibold text-foreground">
              {totalElapsedTime}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-card/50 rounded-md">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
            <Icon name="CalendarIcon" size={20} className="text-accent" />
          </div>
          <div>
            <div className="font-caption text-xs text-muted-foreground">
              Est. Completion
            </div>
            <div className="font-caption text-sm font-semibold text-foreground">
              {estimatedCompletion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallProgressCard;