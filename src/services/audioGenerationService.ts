import { createClient } from '@/lib/supabase/server';
import { generateSpeech, VoicePresetId } from '@/lib/elevenlabs-client';
import { handleElevenLabsError, retryElevenLabsOperation } from '@/lib/elevenlabs-error-handler';

/**
 * Audio Generation Service
 * 
 * Handles scripture-to-speech conversion using ElevenLabs API
 * and stores audio files in Supabase Storage
 */

export interface GenerateAudioOptions {
  projectId: string;
  scriptureText: string;
  voiceId: VoicePresetId;
  userId: string;
}

export interface AudioGenerationResult {
  success: boolean;
  audioUrl?: string;
  audioDuration?: number;
  error?: {
    message: string;
    isInternal: boolean;
  };
}

/**
 * Generate narration audio from scripture text
 */
export async function generateNarrationAudio(
  options: GenerateAudioOptions
): Promise<AudioGenerationResult> {
  const supabase = await createClient();

  try {
    // Validate scripture text
    if (!options.scriptureText || options.scriptureText.trim().length < 50) {
      return {
        success: false,
        error: {
          message: 'Scripture text must be at least 50 characters',
          isInternal: false
        }
      };
    }

    // Generate audio using ElevenLabs with retry logic
    const { audio, durationSeconds } = await retryElevenLabsOperation(
      () => generateSpeech({
        text: options.scriptureText,
        voiceId: options.voiceId,
        stability: 0.5, // Balanced stability for natural delivery
        similarityBoost: 0.75 // High similarity for cinematic voice texture
      }),
      3, // Max 3 retries
      2000 // 2 second delay between retries
    );

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${options.projectId}_${timestamp}.mp3`;
    const filePath = `audio-assets/${options.userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-assets')
      .upload(filePath, audio, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Audio upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-assets')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get audio URL');
    }

    // Update project with audio details
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        audio_url: urlData.publicUrl,
        audio_duration_seconds: durationSeconds,
        voice_id: options.voiceId,
        audio_generated_at: new Date().toISOString()
      })
      .eq('id', options.projectId)
      .eq('user_id', options.userId);

    if (updateError) {
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    return {
      success: true,
      audioUrl: urlData.publicUrl,
      audioDuration: durationSeconds
    };
  } catch (error) {
    console.error('Audio generation error:', error);
    
    const elevenLabsError = handleElevenLabsError(error);
    
    return {
      success: false,
      error: {
        message: elevenLabsError.userMessage,
        isInternal: elevenLabsError.isInternal
      }
    };
  }
}

/**
 * Delete audio file from storage
 */
export async function deleteProjectAudio(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get project audio URL
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('audio_url')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !project?.audio_url) {
      return { success: true }; // No audio to delete
    }

    // Extract file path from URL
    const urlParts = project.audio_url.split('/audio-assets/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid audio URL' };
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('audio-assets')
      .remove([`audio-assets/${filePath}`]);

    if (deleteError) {
      throw new Error(`Audio deletion failed: ${deleteError.message}`);
    }

    // Clear audio fields in project
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        audio_url: null,
        audio_duration_seconds: null,
        voice_id: null,
        audio_generated_at: null
      })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Audio deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Audio deletion failed'
    };
  }
}