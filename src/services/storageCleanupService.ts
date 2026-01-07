import { createClient } from '@/lib/supabase/server';

/**
 * Ephemeral Storage Cleanup Service
 * 
 * Implements self-destruct mechanism for video assets:
 * - Final MP4s retained for 24 hours
 * - Intermediate files (Pika clips, ElevenLabs audio) deleted immediately after stitching
 */

export interface CleanupPolicy {
  retentionHours: number;
  assetType: 'final-video' | 'intermediate-audio' | 'intermediate-video';
}

const CLEANUP_POLICIES: CleanupPolicy[] = [
  { retentionHours: 24, assetType: 'final-video' },
  { retentionHours: 0, assetType: 'intermediate-audio' }, // Immediate deletion
  { retentionHours: 0, assetType: 'intermediate-video' }  // Immediate deletion
];

/**
 * Delete intermediate audio files after video stitching
 */
export async function cleanupIntermediateAudio(projectId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  
  try {
    // List all temp audio files for this project
    const { data: files, error: listError } = await supabase.storage
      .from('audio-assets')
      .list(`temp-audio/${userId}`, {
        search: projectId
      });

    if (listError) throw listError;

    if (files && files.length > 0) {
      // Delete all temp audio files
      const filePaths = files.map(f => `temp-audio/${userId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('audio-assets')
        .remove(filePaths);

      if (deleteError) throw deleteError;
      
      console.log(`Cleaned up ${files.length} intermediate audio files for project ${projectId}`);
    }
  } catch (error) {
    console.error('Error cleaning up intermediate audio:', error);
  }
}

/**
 * Delete intermediate video clips after final stitching
 * Note: Pika Labs videos are external URLs, no cleanup needed
 */
export async function cleanupIntermediateVideos(projectId: string): Promise<void> {
  // Pika Labs videos are hosted externally and managed by their service
  // No cleanup action needed on our storage
  console.log(`Intermediate videos for project ${projectId} are external (Pika Labs)`);
}

/**
 * Schedule deletion of final video after 24 hours
 */
export async function scheduleFinalVideoDeletion(
  projectId: string,
  userId: string,
  videoUrl: string
): Promise<void> {
  const supabase = await createClient();
  
  try {
    const deleteAt = new Date();
    deleteAt.setHours(deleteAt.getHours() + 24);

    // In production, this would create a database trigger or cron job
    // For now, we log the scheduled deletion
    console.log(`Final video for project ${projectId} scheduled for deletion at ${deleteAt.toISOString()}`);
    
    // Could also store in a cleanup queue table
    await supabase
      .from('cleanup_queue')
      .insert({
        project_id: projectId,
        user_id: userId,
        asset_type: 'final-video',
        asset_url: videoUrl,
        scheduled_deletion_at: deleteAt.toISOString()
      });
  } catch (error) {
    console.error('Error scheduling final video deletion:', error);
  }
}

/**
 * Execute immediate cleanup after successful video stitching
 */
export async function executePostStitchCleanup(
  projectId: string,
  userId: string
): Promise<void> {
  console.log(`Executing post-stitch cleanup for project ${projectId}`);
  
  // Clean up intermediate assets immediately
  await Promise.all([
    cleanupIntermediateAudio(projectId, userId),
    cleanupIntermediateVideos(projectId)
  ]);
  
  console.log(`Post-stitch cleanup completed for project ${projectId}`);
}

/**
 * Process scheduled deletions (would be called by cron job)
 */
export async function processScheduledDeletions(): Promise<void> {
  const supabase = await createClient();
  
  try {
    const now = new Date().toISOString();
    
    // Get all assets scheduled for deletion
    const { data: scheduledDeletions, error: fetchError } = await supabase
      .from('cleanup_queue')
      .select('*')
      .lte('scheduled_deletion_at', now)
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (scheduledDeletions && scheduledDeletions.length > 0) {
      console.log(`Processing ${scheduledDeletions.length} scheduled deletions`);
      
      for (const deletion of scheduledDeletions) {
        try {
          // Extract file path from URL
          const urlParts = deletion.asset_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `final-videos/${deletion.user_id}/${fileName}`;
          
          // Delete from storage
          const { error: deleteError } = await supabase.storage
            .from('video-assets')
            .remove([filePath]);

          if (deleteError) throw deleteError;

          // Mark as completed in cleanup queue
          await supabase
            .from('cleanup_queue')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', deletion.id);
          
          console.log(`Deleted final video for project ${deletion.project_id}`);
        } catch (error) {
          console.error(`Error deleting asset ${deletion.id}:`, error);
          
          // Mark as failed
          await supabase
            .from('cleanup_queue')
            .update({ status: 'failed', error_message: String(error) })
            .eq('id', deletion.id);
        }
      }
    }
  } catch (error) {
    console.error('Error processing scheduled deletions:', error);
  }
}