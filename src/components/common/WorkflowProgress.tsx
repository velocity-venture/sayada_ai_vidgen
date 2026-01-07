'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface WorkflowStep {
  label: string;
  path: string;
  icon: string;
  step: number;
}

const workflowSteps: WorkflowStep[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'HomeIcon',
    step: 1
  },
  {
    label: 'Create',
    path: '/video-creation',
    icon: 'PlusCircleIcon',
    step: 2
  },
  {
    label: 'Track',
    path: '/progress-tracking',
    icon: 'ClockIcon',
    step: 3
  },
  {
    label: 'Preview',
    path: '/video-preview',
    icon: 'PlayIcon',
    step: 4
  }
];

const WorkflowProgress = () => {
  const pathname = usePathname();

  const getCurrentStep = () => {
    const currentStep = workflowSteps.find(step => step.path === pathname);
    return currentStep?.step || 1;
  };

  const currentStepNumber = getCurrentStep();

  return (
    <div className="bg-card border-b border-border py-4 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const isActive = step.path === pathname;
            const isCompleted = step.step < currentStepNumber;
            const isAccessible = step.step <= currentStepNumber;

            return (
              <div key={step.path} className="flex items-center flex-1">
                <Link
                  href={isAccessible ? step.path : '#'}
                  className={`
                    flex flex-col items-center gap-2 transition-all duration-250
                    ${isAccessible ? 'cursor-pointer focus-ring rounded-lg p-2' : 'cursor-not-allowed opacity-40'}
                  `}
                  aria-disabled={!isAccessible}
                >
                  <div
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full
                      transition-all duration-250
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-glow-medium scale-110' 
                        : isCompleted
                        ? 'bg-success text-success-foreground shadow-glow-soft'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Icon name="CheckIcon" size={20} />
                    ) : (
                      <Icon name={step.icon as any} size={20} />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full border-2 border-accent animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`
                      font-caption text-xs font-medium
                      ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'}
                    `}
                  >
                    {step.label}
                  </span>
                </Link>

                {index < workflowSteps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 relative">
                    <div className="absolute inset-0 bg-muted" />
                    <div
                      className={`
                        absolute inset-0 transition-all duration-500
                        ${step.step < currentStepNumber ? 'bg-success w-full' : 'bg-primary w-0'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="font-caption text-sm text-muted-foreground">
              Step {currentStepNumber} of {workflowSteps.length}
            </span>
            <span className="font-caption text-sm font-medium text-foreground">
              {workflowSteps.find(s => s.step === currentStepNumber)?.label}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 rounded-full shadow-glow-soft"
              style={{ width: `${(currentStepNumber / workflowSteps.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 gap-2">
            {workflowSteps.map((step) => {
              const isAccessible = step.step <= currentStepNumber;
              return (
                <Link
                  key={step.path}
                  href={isAccessible ? step.path : '#'}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    transition-all duration-250
                    ${step.path === pathname
                      ? 'bg-primary text-primary-foreground shadow-glow-medium'
                      : step.step < currentStepNumber
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                    }
                    ${isAccessible ? 'focus-ring' : 'opacity-40 cursor-not-allowed'}
                  `}
                  aria-label={step.label}
                  aria-disabled={!isAccessible}
                >
                  {step.step < currentStepNumber ? (
                    <Icon name="CheckIcon" size={16} />
                  ) : (
                    <Icon name={step.icon as any} size={16} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;