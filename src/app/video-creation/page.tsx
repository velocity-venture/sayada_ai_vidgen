import type { Metadata } from 'next';
import VideoCreationInteractive from './components/VideoCreationInteractive';

export const metadata: Metadata = {
  title: 'Create Video - WalkWithHim AI',
  description: 'Transform your scripture text into compelling AI-powered promotional videos with professional narration and stunning visuals. Configure voice, style, and duration settings for optimal video generation.',
};

export default function VideoCreationPage() {
  return <VideoCreationInteractive />;
}