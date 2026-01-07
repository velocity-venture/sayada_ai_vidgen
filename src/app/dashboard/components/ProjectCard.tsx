'use client';
import Link from 'next/link';
import { ClockIcon, VideoCameraIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ShareIcon } from '@heroicons/react/24/solid';
import { Project } from '@/types/models';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusIcon = () => {
    switch (project?.status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <VideoCameraIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    return project?.status?.charAt(0)?.toUpperCase() + project?.status?.slice(1) || 'Unknown';
  };

  const getStatusColor = () => {
    switch (project?.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/share/${project?.id}`;
    navigator.clipboard.writeText(shareUrl);
    // You could add a toast notification here
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project?.title || 'Untitled Project'}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{project?.scriptContent || 'No script content'}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{Math.floor((project?.durationSeconds || 0) / 60)}:{String((project?.durationSeconds || 0) % 60).padStart(2, '0')} min</span>
          <span className="capitalize">{project?.stylePreset || 'Classic'}</span>
        </div>
        <div className="flex items-center space-x-2">
          {project?.status === 'completed' && project?.videoUrl && (
            <>
              <button
                onClick={handleCopyShareLink}
                className="p-2 text-gray-400 hover:text-primary transition-colors"
                title="Copy share link"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
              <Link
                href={`/share/${project?.id}`}
                target="_blank"
                className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-colors"
              >
                Watch
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}