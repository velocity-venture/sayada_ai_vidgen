import type { Metadata } from 'next';
import DashboardClient from './components/DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard - Sayada VidGen',
  description: 'Manage your scripture video projects, track AI generation progress, and access your completed videos in one centralized dashboard.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}