'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  tooltip: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'HomeIcon',
    tooltip: 'View and manage your video projects'
  },
  {
    label: 'Create Video',
    path: '/video-creation',
    icon: 'PlusCircleIcon',
    tooltip: 'Start creating a new scripture video'
  },
  {
    label: 'Track Progress',
    path: '/progress-tracking',
    icon: 'ClockIcon',
    tooltip: 'Monitor AI video generation progress'
  },
  {
    label: 'Automation & Jobs',
    path: '/automation-mission-control',
    icon: 'CommandLineIcon',
    tooltip: 'Monitor render queue and webhook deliveries'
  },
  {
    label: 'Compose Video',
    path: '/video-composition',
    icon: 'FilmIcon',
    tooltip: 'Edit and orchestrate video clips'
  },
  {
    label: 'Preview Video',
    path: '/video-preview',
    icon: 'PlayIcon',
    tooltip: 'Review and download completed videos'
  },
  {
    label: 'API Keys',
    path: '/developer-settings',
    icon: 'KeyIcon',
    tooltip: 'Manage API keys for n8n integration'
  },
  {
    label: 'Settings',
    path: '/project-settings',
    icon: 'Cog6ToothIcon',
    tooltip: 'Configure API keys and brand assets'
  }
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActivePath = (path: string) => pathname === path;

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="w-full">
        <div className="flex items-center justify-between h-20 px-6 lg:px-8">
          {/* Logo */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 transition-all duration-250 hover:opacity-80 focus-ring rounded-md"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <circle cx="20" cy="20" r="18" fill="var(--color-primary)" opacity="0.1" />
                <path
                  d="M20 8L24 16L32 18L26 24L28 32L20 28L12 32L14 24L8 18L16 16L20 8Z"
                  fill="var(--color-primary)"
                  className="drop-shadow-glow-soft"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-xl text-foreground leading-tight">
                Sayada VidGen
              </span>
              <span className="font-caption text-xs text-muted-foreground leading-tight">
                Powered by WalkWithHim.ai Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={item.tooltip}
                  className={`
                    group relative flex items-center gap-2 px-6 py-3 rounded-md
                    transition-all duration-250 focus-ring
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-glow-medium' 
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon 
                    name={item.icon as any} 
                    size={20} 
                    className={`transition-transform duration-250 ${isActive ? '' : 'group-hover:scale-110'}`}
                  />
                  <span className="font-caption font-medium text-sm">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
            
            <Link
              href="/settings/services"
              className={`px-4 py-2 rounded-lg transition-colors ${
                pathname === '/settings/services' ?'bg-purple-600 text-white' :'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Provider Settings
              </div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-foreground hover:bg-muted transition-all duration-250 focus-ring"
            aria-label="Toggle mobile menu"
          >
            <Icon name={mobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden bg-card border-t border-border animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-md
                      transition-all duration-250 focus-ring
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-glow-soft' 
                        : 'text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <Icon name={item.icon as any} size={20} />
                    <div className="flex-1">
                      <div className="font-caption font-medium text-sm">
                        {item.label}
                      </div>
                      <div className="font-caption text-xs opacity-70 mt-0.5">
                        {item.tooltip}
                      </div>
                    </div>
                    {isActive && (
                      <Icon name="CheckIcon" size={16} />
                    )}
                  </Link>
                );
              })}
              
              <Link
                href="/settings/services"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-md
                  transition-all duration-250 focus-ring
                  ${pathname === '/settings/services' ?'bg-primary text-primary-foreground shadow-glow-soft' :'text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon name="SettingsIcon" size={20} />
                <div className="flex-1">
                  <div className="font-caption font-medium text-sm">
                    Provider Settings
                  </div>
                  <div className="font-caption text-xs opacity-70 mt-0.5">
                    Configure provider services and integrations
                  </div>
                </div>
                {pathname === '/settings/services' && (
                  <Icon name="CheckIcon" size={16} />
                )}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}