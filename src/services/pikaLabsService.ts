import { createClient } from '@/lib/supabase/server';
import { VideoScene } from '@/lib/types/openai';

/**
 * Pika Labs Video Clip Generation Service
 * 
 * Orchestrates multi-scene video generation using Pika Labs API
 * to create 30-60 second videos from scripture analysis
 */

export type ClipStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface PikaLabsGenerateRequest {
  prompt: string;
  duration: number; // seconds (3-8s per scene)
  style?: string;
}

export interface PikaLabsClipResponse {
  clipId: string;
  videoUrl?: string;
  status: ClipStatus;
  error?: string;
}

export interface ClipRecord {
  id: string;
  project_id: string;
  scene_index: number;
  video_url: string | null;
  status: ClipStatus;
  prompt_used: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Generate video clips for all scenes in a project
 * This orchestrates the multi-scene generation process
 */
export async function generateProjectClips(
  projectId: string,
  scenes: VideoScene[],
  audioDuration: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Validate that we have scenes
    if (!scenes || scenes.length === 0) {
      return {
        success: false,
        error: 'No scenes provided for video generation'
      };
    }

    // Calculate total scene duration
    const totalSceneDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

    // Validate duration matches audio
    if (Math.abs(totalSceneDuration - audioDuration) > 5) {
      console.warn(`Scene duration mismatch: ${totalSceneDuration}s vs audio ${audioDuration}s`);
    }

    // Create clip records for each scene
    const clipRecords = scenes.map((scene, index) => ({
      project_id: projectId,
      scene_index: index,
      status: 'pending' as ClipStatus,
      prompt_used: scene.pikaPrompt
    }));

    // Insert all clip records
    const { error: insertError } = await supabase
      .from('clips')
      .insert(clipRecords);

    if (insertError) {
      throw new Error(`Failed to create clip records: ${insertError.message}`);
    }

    // Trigger asynchronous clip generation for each scene
    // In production, this would trigger a webhook/background job
    // For now, we return success and generation happens asynchronously
    for (let i = 0; i < scenes.length; i++) {
      // Queue each clip generation (non-blocking)
      queueClipGeneration(projectId, i, scenes[i]);
    }

    return { success: true };
  } catch (error) {
    console.error('Clip generation orchestration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to orchestrate clip generation'
    };
  }
}

/**
 * Queue individual clip generation (asynchronous)
 * This would integrate with Pika Labs API via webhook/polling
 */
async function queueClipGeneration(
  projectId: string,
  sceneIndex: number,
  scene: VideoScene
): Promise<void> {
  const supabase = await createClient();

  try {
    // Update status to generating
    await supabase
      .from('clips')
      .update({ status: 'generating' as ClipStatus })
      .eq('project_id', projectId)
      .eq('scene_index', sceneIndex);

    // PLACEHOLDER: Call Pika Labs API
    // In production, this would be:
    // const pikaResponse = await callPikaLabsAPI({
    //   prompt: scene.pikaPrompt,
    //   duration: scene.duration,
    //   style: scene.mood
    // });

    // MOCK: Simulate successful generation after delay
    setTimeout(async () => {
      const mockVideoUrl = `https://mock-pika-cdn.com/clips/${projectId}_scene_${sceneIndex}.mp4`;
      
      await supabase
        .from('clips')
        .update({
          status: 'completed' as ClipStatus,
          video_url: mockVideoUrl,
          completed_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('scene_index', sceneIndex);
    }, 5000 + (sceneIndex * 2000)); // Stagger completion for demo
  } catch (error) {
    console.error(`Clip generation failed for scene ${sceneIndex}:`, error);
    
    await supabase
      .from('clips')
      .update({
        status: 'failed' as ClipStatus,
        error_message: error instanceof Error ? error.message : 'Generation failed'
      })
      .eq('project_id', projectId)
      .eq('scene_index', sceneIndex);
  }
}

/**
 * Get all clips for a project
 */
export async function getProjectClips(projectId: string): Promise<ClipRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('project_id', projectId)
    .order('scene_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch clips:', error);
    return [];
  }

  return (data as ClipRecord[]) || [];
}

/**
 * Get clip generation progress for a project
 */
export async function getClipGenerationProgress(
  projectId: string
): Promise<{
  total: number;
  completed: number;
  generating: number;
  failed: number;
  pending: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clips')
    .select('status')
    .eq('project_id', projectId);

  if (error || !data) {
    return { total: 0, completed: 0, generating: 0, failed: 0, pending: 0 };
  }

  const progress = {
    total: data.length,
    completed: data.filter(c => c.status === 'completed').length,
    generating: data.filter(c => c.status === 'generating').length,
    failed: data.filter(c => c.status === 'failed').length,
    pending: data.filter(c => c.status === 'pending').length
  };

  return progress;
}

/**
 * Retry failed clip generation
 */
export async function retryFailedClip(
  projectId: string,
  sceneIndex: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get the clip record
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select('*')
      .eq('project_id', projectId)
      .eq('scene_index', sceneIndex)
      .single();

    if (fetchError || !clip) {
      return { success: false, error: 'Clip not found' };
    }

    // Reset status to pending
    const { error: updateError } = await supabase
      .from('clips')
      .update({
        status: 'pending' as ClipStatus,
        error_message: null
      })
      .eq('project_id', projectId)
      .eq('scene_index', sceneIndex);

    if (updateError) {
      throw new Error(`Failed to reset clip: ${updateError.message}`);
    }

    // Queue generation again
    // In production, this would trigger the Pika Labs API again
    // For now, we just update the status
    await supabase
      .from('clips')
      .update({ status: 'generating' as ClipStatus })
      .eq('project_id', projectId)
      .eq('scene_index', sceneIndex);

    return { success: true };
  } catch (error) {
    console.error('Retry clip generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Retry failed'
    };
  }
}