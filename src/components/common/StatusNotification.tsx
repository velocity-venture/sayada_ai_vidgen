'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'processing';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

interface StatusNotificationProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const StatusNotification = ({
  notifications,
  onDismiss,
  position = 'top-right'
}: StatusNotificationProps) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);

    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onDismiss]);

  const notificationConfig = {
    success: {
      icon: 'CheckCircleIcon',
      className: 'bg-success text-success-foreground border-success',
      iconColor: 'text-success-foreground'
    },
    error: {
      icon: 'XCircleIcon',
      className: 'bg-error text-error-foreground border-error',
      iconColor: 'text-error-foreground'
    },
    warning: {
      icon: 'ExclamationTriangleIcon',
      className: 'bg-warning text-warning-foreground border-warning',
      iconColor: 'text-warning-foreground'
    },
    info: {
      icon: 'InformationCircleIcon',
      className: 'bg-card text-foreground border-primary',
      iconColor: 'text-primary'
    },
    processing: {
      icon: 'ArrowPathIcon',
      className: 'bg-card text-foreground border-primary',
      iconColor: 'text-primary animate-spin'
    }
  };

  const positionClasses = {
    'top-right': 'top-24 right-6',
    'top-left': 'top-24 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-center': 'top-24 left-1/2 -translate-x-1/2'
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div
      className={`fixed z-[200] flex flex-col gap-3 max-w-md w-full ${positionClasses[position]}`}
      role="region"
      aria-label="Notifications"
    >
      {visibleNotifications.map((notification) => {
        const config = notificationConfig[notification.type];
        const dismissible = notification.dismissible !== false;

        return (
          <div
            key={notification.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg border-2 shadow-glow-medium
              animate-fade-in ${config.className}
            `}
            role="alert"
            aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          >
            <Icon
              name={config.icon as any}
              size={20}
              className={`shrink-0 mt-0.5 ${config.iconColor}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-caption font-semibold text-sm mb-1">
                {notification.title}
              </h3>
              {notification.message && (
                <p className="font-caption text-xs opacity-90 leading-relaxed">
                  {notification.message}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                onClick={() => onDismiss(notification.id)}
                className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-all duration-250 focus-ring"
                aria-label="Dismiss notification"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusNotification;