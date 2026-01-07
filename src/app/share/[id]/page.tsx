import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicVideoPlayer from './PublicVideoPlayer';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient();
  
  const { data: project } = await supabase
    .from('projects')
    .select('title, script_content')
    .eq('id', params.id)
    .single();

  return {
    title: project?.title ? `${project.title} - Sayada VidGen` : 'Video - Sayada VidGen',
    description: project?.script_content?.substring(0, 160) || 'Watch this scripture video',
  };
}

export default async function SharePage({ params }: PageProps) {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Track view event (anonymous)
  await supabase
    .from('video_engagement_events')
    .insert({
      project_id: project.id,
      event_type: 'view',
      user_id: null,
    })
    .select()
    .single();

  return <PublicVideoPlayer project={project} />;
}