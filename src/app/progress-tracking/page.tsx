import type { Metadata } from 'next';
import ProgressTrackingInteractive from './components/ProgressTrackingInteractive';

export const metadata: Metadata = {
  title: 'Progress Tracking - WalkWithHim AI',
  description: 'Monitor real-time AI video generation progress with detailed status updates, scene processing logs, and completion estimates for your scripture promotional videos.',
};

export default function ProgressTrackingPage() {
  return <ProgressTrackingInteractive />;
}