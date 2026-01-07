'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface ProjectContextHeaderProps {
  projectTitle?: string;
  projectDate?: string;
  projectStatus?: 'draft' | 'processing' | 'completed' | 'error';
  onSave?: () => void;
  showBackButton?: boolean;
}

const ProjectContextHeader = ({
  projectTitle = 'Untitled Project',
  projectDate,
  projectStatus = 'draft',
  onSave,
  showBackButton = true
}: ProjectContextHeaderProps) => {
  const router = useRouter();

  const statusConfig = {
    draft: {
      label: 'Draft',
      icon: 'DocumentTextIcon',
      className: 'bg-muted text-muted-foreground'
    },
    processing: {
      label: 'Processing',
      icon: 'ArrowPathIcon',
      className: 'bg-warning text-warning-foreground animate-pulse'
    },
    completed: {
      label: 'Completed',
      icon: 'CheckCircleIcon',
      className: 'bg-success text-success-foreground'
    },
    error: {
      label: 'Error',
      icon: 'ExclamationCircleIcon',
      className: 'bg-error text-error-foreground'
    }
  };

  const currentStatus = statusConfig[projectStatus];

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="bg-card border-b border-border py-4 px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Back Button & Project Info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring shrink-0"
                aria-label="Back to dashboard"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span className="hidden sm:inline font-caption text-sm font-medium">
                  Dashboard
                </span>
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading text-xl lg:text-2xl font-semibold text-foreground truncate">
                  {projectTitle}
                </h1>
                <div
                  className={`
                    flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-caption font-medium
                    ${currentStatus.className} shrink-0
                  `}
                >
                  <Icon name={currentStatus.icon as any} size={14} />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
              {projectDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="CalendarIcon" size={14} />
                  <span className="font-caption text-xs">
                    Created {projectDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onSave && (
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:shadow-glow-medium transition-all duration-250 focus-ring"
                aria-label="Save project"
              >
                <Icon name="BookmarkIcon" size={18} />
                <span className="hidden sm:inline font-caption text-sm font-medium">
                  Save
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectContextHeader;