import Icon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  onCreateNew: () => void;
}

const EmptyState = ({ onCreateNew }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="VideoCameraIcon" size={48} className="text-primary" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <Icon name="SparklesIcon" size={20} className="text-accent" />
        </div>
      </div>

      <h3 className="font-heading text-2xl font-semibold text-foreground mb-3 text-center">
        No Projects Yet
      </h3>
      
      <p className="font-caption text-sm text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
        Start your journey by creating your first AI-powered scripture video. Transform sacred texts into engaging visual content in minutes.
      </p>

      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:shadow-glow-medium transition-all duration-250 focus-ring"
      >
        <Icon name="PlusCircleIcon" size={20} />
        <span className="font-caption font-medium">Create Your First Video</span>
      </button>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Icon name="DocumentTextIcon" size={24} className="text-primary" />
          </div>
          <h4 className="font-caption font-semibold text-sm text-foreground mb-1">
            Input Scripture
          </h4>
          <p className="font-caption text-xs text-muted-foreground">
            Paste your sacred text or verse
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Icon name="SparklesIcon" size={24} className="text-primary" />
          </div>
          <h4 className="font-caption font-semibold text-sm text-foreground mb-1">
            AI Generation
          </h4>
          <p className="font-caption text-xs text-muted-foreground">
            Watch AI create your video
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Icon name="ArrowDownTrayIcon" size={24} className="text-primary" />
          </div>
          <h4 className="font-caption font-semibold text-sm text-foreground mb-1">
            Download & Share
          </h4>
          <p className="font-caption text-xs text-muted-foreground">
            Get your video ready to share
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;