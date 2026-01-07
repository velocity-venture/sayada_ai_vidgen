import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import WorkflowProgress from '@/components/common/WorkflowProgress';
import ProjectSettingsInteractive from './components/ProjectSettingsInteractive';

export const metadata: Metadata = {
  title: 'Project Settings - Sayada VidGen',
  description: 'Configure API keys, brand assets, and default settings for your video generation projects.',
};

export default function ProjectSettingsPage() {
  return (
    <>
      <Header />
      <WorkflowProgress />
      <ProjectSettingsInteractive />
    </>
  );
}