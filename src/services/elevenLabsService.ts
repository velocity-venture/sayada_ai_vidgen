
import { generateSpeech, VoicePresetId } from '@/lib/elevenlabs-client';
import { handleElevenLabsError, retryElevenLabsOperation } from '@/lib/elevenlabs-error-handler';

/**
 * Enhanced ElevenLabs Service for AI Director Pipeline
 * 
 * Provides text-to-speech with precise duration tracking for video synchronization
 */

export interface GenerateAudioForSceneOptions {
  sceneText: string;
  voiceId: VoicePresetId;
  sceneIndex: number;
}

export interface SceneAudioResult {
  sceneIndex: number;
  audioBlob: Blob;
  audioDurationSeconds: number;
  success: boolean;
  error?: string;
}

/**
 * Generate audio for a single scene with precise duration
 * This is used by the AI Director for parallel processing
 */
export async function generateSceneAudio(
  options: GenerateAudioForSceneOptions
): Promise<SceneAudioResult> {
  try {
    // Generate audio using ElevenLabs with retry logic
    const { audio, durationSeconds } = await retryElevenLabsOperation(
      () => generateSpeech({
        text: options.sceneText,
        voiceId: options.voiceId,
        stability: 0.5,
        similarityBoost: 0.75
      }),
      3,
      2000
    );

    return {
      sceneIndex: options.sceneIndex,
      audioBlob: audio,
      audioDurationSeconds: durationSeconds,
      success: true
    };
  } catch (error) {
    console.error(`Scene ${options.sceneIndex} audio generation failed:`, error);
    const elevenLabsError = handleElevenLabsError(error);
    
    return {
      sceneIndex: options.sceneIndex,
      audioBlob: new Blob(),
      audioDurationSeconds: 0,
      success: false,
      error: elevenLabsError.userMessage
    };
  }
}

/**
 * Generate audio for multiple scenes in parallel
 * Returns array of results in scene order
 */
export async function generateMultiSceneAudio(
  scenes: Array<{ text: string; index: number }>,
  voiceId: VoicePresetId
): Promise<SceneAudioResult[]> {
  const audioPromises = scenes.map(scene =>
    generateSceneAudio({
      sceneText: scene.text,
      voiceId: voiceId,
      sceneIndex: scene.index
    })
  );

  const results = await Promise.all(audioPromises);
  
  // Sort by scene index to maintain order
  return results.sort((a, b) => a.sceneIndex - b.sceneIndex);
}

// ...existing code...