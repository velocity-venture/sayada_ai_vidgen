'use client';

import Header from '@/components/common/Header';
import WorkflowProgress from '@/components/common/WorkflowProgress';
import DashboardInteractive from './DashboardInteractive';

export default function DashboardClient() {
  return (
    <>
      <Header />
      <WorkflowProgress />
      <DashboardInteractive />
    </>
  );
}