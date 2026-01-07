'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import WorkflowProgress from '@/components/common/WorkflowProgress';
import ProjectContextHeader from '@/components/common/ProjectContextHeader';
import StatusNotification, { Notification } from '@/components/common/StatusNotification';
import OverallProgressCard from './OverallProgressCard';
import ProcessingStageCard from './ProcessingStageCard';
import SceneProcessingLog from './SceneProcessingLog';
import PreviewSection from './PreviewSection';
import Icon from '@/components/ui/AppIcon';

interface ProcessingStage {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  elapsedTime: string;
  estimatedTime: string;
  icon: string;
}

interface SceneLog {
  id: string;
  sceneNumber: number;
  prompt: string;
  audioStatus: 'pending' | 'processing' | 'completed' | 'error';
  videoStatus: 'pending' | 'processing' | 'completed' | 'error';
  audioProvider: string;
  videoProvider: string;
  duration: string;
  timestamp: string;
}

interface PreviewAsset {
  id: string;
  type: 'audio' | 'video';
  sceneNumber: number;
  url: string;
  duration: string;
  status: 'completed';
  thumbnail?: string;
}

const ProgressTrackingInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [overallProgress, setOverallProgress] = useState(45);
  const [currentPhase, setCurrentPhase] = useState('Generating Audio');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const progressInterval = setInterval(() => {
      setOverallProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          handleProcessingComplete();
          return 100;
        }
        return Math.min(prev + 5, 100);
      });
    }, 3000);

    return () => clearInterval(progressInterval);
  }, [isHydrated]);

  const processingStages: ProcessingStage[] = [
  {
    id: 'stage-1',
    label: 'Analyzing Script',
    status: 'completed',
    progress: 100,
    elapsedTime: '00:15',
    estimatedTime: '00:00',
    icon: 'DocumentMagnifyingGlassIcon'
  },
  {
    id: 'stage-2',
    label: 'Generating Audio',
    status: 'processing',
    progress: 65,
    elapsedTime: '01:23',
    estimatedTime: '00:45',
    icon: 'MusicalNoteIcon'
  },
  {
    id: 'stage-3',
    label: 'Creating Video Clips',
    status: 'processing',
    progress: 30,
    elapsedTime: '00:42',
    estimatedTime: '01:30',
    icon: 'FilmIcon'
  },
  {
    id: 'stage-4',
    label: 'Stitching Final Video',
    status: 'pending',
    progress: 0,
    elapsedTime: '00:00',
    estimatedTime: '02:00',
    icon: 'SparklesIcon'
  }];


  const sceneProcessingLogs: SceneLog[] = [
  {
    id: 'scene-1',
    sceneNumber: 1,
    prompt: 'A serene sunrise over ancient Jerusalem, golden light illuminating stone walls and olive trees',
    audioStatus: 'completed',
    videoStatus: 'completed',
    audioProvider: 'ElevenLabs',
    videoProvider: 'Pika Labs',
    duration: '8.2s',
    timestamp: '01/06/2026 6:15 PM'
  },
  {
    id: 'scene-2',
    sceneNumber: 2,
    prompt: 'Close-up of weathered hands holding an ancient scroll with Hebrew text, soft candlelight',
    audioStatus: 'completed',
    videoStatus: 'processing',
    audioProvider: 'ElevenLabs',
    videoProvider: 'Pika Labs',
    duration: '7.8s',
    timestamp: '01/06/2026 6:16 PM'
  },
  {
    id: 'scene-3',
    sceneNumber: 3,
    prompt: 'Peaceful garden scene with flowing water, blooming flowers, and gentle sunbeams through trees',
    audioStatus: 'processing',
    videoStatus: 'pending',
    audioProvider: 'ElevenLabs',
    videoProvider: 'Pika Labs',
    duration: '8.5s',
    timestamp: '01/06/2026 6:17 PM'
  },
  {
    id: 'scene-4',
    sceneNumber: 4,
    prompt: 'Majestic mountain vista at sunset with dramatic clouds and golden hour lighting',
    audioStatus: 'pending',
    videoStatus: 'pending',
    audioProvider: 'ElevenLabs',
    videoProvider: 'Pika Labs',
    duration: '8.0s',
    timestamp: '01/06/2026 6:18 PM'
  }];


  const previewAssets: PreviewAsset[] = [
  {
    id: 'audio-1',
    type: 'audio',
    sceneNumber: 1,
    url: 'https://example.com/audio-1.mp3',
    duration: '8.2s',
    status: 'completed'
  },
  {
    id: 'audio-2',
    type: 'audio',
    sceneNumber: 2,
    url: 'https://example.com/audio-2.mp3',
    duration: '7.8s',
    status: 'completed'
  },
  {
    id: 'video-1',
    type: 'video',
    sceneNumber: 1,
    url: 'https://example.com/video-1.mp4',
    duration: '8.2s',
    status: 'completed',
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1150d3c03-1766757339295.png"
  }];


  const handleProcessingComplete = () => {
    const completionNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: 'success',
      title: 'Video Generation Complete!',
      message: 'Your scripture video has been successfully generated and is ready for preview.',
      duration: 5000,
      dismissible: true
    };

    setNotifications([completionNotification]);
    setCurrentPhase('Processing Complete');

    setTimeout(() => {
      router.push('/video-preview');
    }, 2000);
  };

  const handleRetryStage = (stageId: string) => {
    const retryNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: 'processing',
      title: 'Retrying Stage',
      message: 'Attempting to reprocess the failed stage...',
      duration: 3000,
      dismissible: true
    };

    setNotifications([retryNotification]);
  };

  const handleCancelProcessing = () => {
    const cancelNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: 'warning',
      title: 'Processing Cancelled',
      message: 'Video generation has been cancelled. You can resume from the dashboard.',
      duration: 4000,
      dismissible: true
    };

    setNotifications([cancelNotification]);

    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <WorkflowProgress />
        <ProjectContextHeader
          projectTitle="Psalm 23 - The Lord is My Shepherd"
          projectDate="01/06/2026"
          projectStatus="processing"
          showBackButton={true} />

        <main className="pt-6 pb-12 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <Icon name="ArrowPathIcon" size={48} className="text-primary animate-spin" />
            </div>
          </div>
        </main>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WorkflowProgress />
      <ProjectContextHeader
        projectTitle="Psalm 23 - The Lord is My Shepherd"
        projectDate="01/06/2026"
        projectStatus="processing"
        showBackButton={true} />


      <main className="pt-6 pb-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <OverallProgressCard
            overallProgress={overallProgress}
            currentPhase={currentPhase}
            totalElapsedTime="02:20"
            estimatedCompletion="01/06/2026 6:25 PM"
            completedStages={1}
            totalStages={4} />


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {processingStages.map((stage) =>
            <ProcessingStageCard key={stage.id} stage={stage} />
            )}
          </div>

          <SceneProcessingLog scenes={sceneProcessingLogs} />

          <PreviewSection assets={previewAssets} />

          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              onClick={handleCancelProcessing}
              className="flex items-center gap-2 px-6 py-3 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring">

              <Icon name="XMarkIcon" size={20} />
              <span className="font-caption text-sm font-medium">Cancel Processing</span>
            </button>

            <button
              onClick={() => router.push('/video-preview')}
              disabled={overallProgress < 100}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-250 focus-ring
                ${overallProgress >= 100 ?
              'bg-primary text-primary-foreground hover:shadow-glow-medium' :
              'bg-muted text-muted-foreground cursor-not-allowed opacity-50'}
              `
              }>

              <Icon name="EyeIcon" size={20} />
              <span className="font-caption text-sm font-medium">View Preview</span>
            </button>
          </div>
        </div>
      </main>

      <StatusNotification
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right" />

    </div>);

};

export default ProgressTrackingInteractive;