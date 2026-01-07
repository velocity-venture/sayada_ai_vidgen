import { Suspense } from 'react';
import Header from '@/components/common/Header';
import VideoCompositionInteractive from './components/VideoCompositionInteractive';

export const metadata = {
  title: 'Video Composition | Sayada VidGen',
  description: 'Orchestrate generated Pika Labs clips into cohesive scripture videos with advanced editing capabilities',
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-foreground font-caption">Loading composition editor...</p>
    </div>
  </div>
);

export default function VideoCompositionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <Suspense fallback={<LoadingSpinner />}>
          <VideoCompositionInteractive />
        </Suspense>
      </main>
    </div>
  );
}