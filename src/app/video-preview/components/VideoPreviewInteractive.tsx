'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoPlayer from './VideoPlayer';
import VideoDetails from './VideoDetails';
import ActionButtons from './ActionButtons';
import ScriptBreakdown from './ScriptBreakdown';
import QualityMetrics from './QualityMetrics';
import StatusNotification, { Notification } from '@/components/common/StatusNotification';

interface Scene {
  sceneNumber: number;
  text: string;
  prompt: string;
  duration: number;
  startTime: number;
}

interface VideoData {
  id: string;
  title: string;
  videoUrl: string;
  generatedAt: string;
  duration: number;
  scriptureReference: string;
  audioProvider: string;
  videoProvider: string;
  totalScenes: number;
  resolution: string;
  originalScript: string;
  scenes: Scene[];
  audioClarity: number;
  videoResolution: number;
  synchronization: number;
}

const mockVideoData: VideoData = {
  id: 'vid_001',
  title: 'John 3:16 - Divine Love',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  generatedAt: 'January 6, 2026 at 6:15 PM',
  duration: 45,
  scriptureReference: 'John 3:16',
  audioProvider: 'ElevenLabs',
  videoProvider: 'Pika Labs',
  totalScenes: 3,
  resolution: '1920x1080 (Full HD)',
  originalScript: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  scenes: [
    {
      sceneNumber: 1,
      text: 'For God so loved the world',
      prompt: 'Cinematic view of Earth from space with divine golden light rays illuminating the planet, stars twinkling in the background, ethereal and majestic atmosphere',
      duration: 12,
      startTime: 0
    },
    {
      sceneNumber: 2,
      text: 'that he gave his one and only Son',
      prompt: 'Warm golden cross standing on a hill at sunset, soft divine light emanating from behind, peaceful clouds in the sky, spiritual and reverent mood',
      duration: 15,
      startTime: 12
    },
    {
      sceneNumber: 3,
      text: 'that whoever believes in him shall not perish but have eternal life',
      prompt: 'Hands reaching upward toward bright heavenly light breaking through clouds, rays of hope and salvation, peaceful and uplifting atmosphere with gentle motion',
      duration: 18,
      startTime: 27
    }
  ],
  audioClarity: 95,
  videoResolution: 92,
  synchronization: 98
};

const VideoPreviewInteractive = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notif_${Date.now()}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRegenerate = () => {
    addNotification({
      type: 'info',
      title: 'Regeneration Started',
      message: 'Your video is being regenerated with the same settings. This may take a few minutes.',
      duration: 5000
    });

    setTimeout(() => {
      router.push('/progress-tracking');
    }, 2000);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
          {/* Video Player Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VideoPlayer
                videoUrl={mockVideoData.videoUrl}
                title={mockVideoData.title}
                duration={mockVideoData.duration}
              />
            </div>
            <div className="space-y-6">
              <ActionButtons
                videoUrl={mockVideoData.videoUrl}
                projectTitle={mockVideoData.title}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>

          {/* Video Details */}
          <VideoDetails
            generatedAt={mockVideoData.generatedAt}
            duration={mockVideoData.duration}
            scriptureReference={mockVideoData.scriptureReference}
            audioProvider={mockVideoData.audioProvider}
            videoProvider={mockVideoData.videoProvider}
            totalScenes={mockVideoData.totalScenes}
            resolution={mockVideoData.resolution}
          />

          {/* Script Breakdown and Quality Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ScriptBreakdown
                originalScript={mockVideoData.originalScript}
                scenes={mockVideoData.scenes}
              />
            </div>
            <div>
              <QualityMetrics
                audioClarity={mockVideoData.audioClarity}
                videoResolution={mockVideoData.videoResolution}
                synchronization={mockVideoData.synchronization}
              />
            </div>
          </div>
        </div>
      </div>

      <StatusNotification
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />
    </>
  );
};

export default VideoPreviewInteractive;