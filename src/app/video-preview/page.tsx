import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import WorkflowProgress from '@/components/common/WorkflowProgress';
import ProjectContextHeader from '@/components/common/ProjectContextHeader';
import VideoPreviewInteractive from './components/VideoPreviewInteractive';

export const metadata: Metadata = {
  title: 'Video Preview - WalkWithHim AI',
  description: 'Review and download your completed scripture video with playback controls, quality metrics, and sharing options for social media distribution.',
};

export default function VideoPreviewPage() {
  return (
    <>
      <Header />
      <WorkflowProgress />
      <ProjectContextHeader
        projectTitle="John 3:16 - Divine Love"
        projectDate="January 6, 2026"
        projectStatus="completed"
        showBackButton={true}
      />
      <VideoPreviewInteractive />
    </>
  );
}