import { ElevenLabsClient, ElevenLabs } from 'elevenlabs';

/**
 * ElevenLabs Client Configuration
 * 
 * Provides text-to-speech functionality with cinematic voice models
 * for scripture narration with emotive prosody and dramatic delivery.
 */

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

/**
 * Voice configuration for cinematic narration
 * Using eleven_multilingual_v2 for high-quality emotional delivery
 */
export const VOICE_PRESETS = {
  'voice-1': {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam - Deep, cinematic narrator voice
    name: 'Adam (Cinematic Narrator)',
    description: 'Deep, warm voice perfect for biblical narratives',
    model: 'eleven_multilingual_v2'
  },
  'voice-2': {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel - Clear, emotive female voice
    name: 'Rachel (Emotive Reader)',
    description: 'Clear, expressive voice with emotional depth',
    model: 'eleven_multilingual_v2'
  },
  'voice-3': {
    id: 'AZnzlk1XvdvUeBnXmlld', // Domi - Strong, dramatic voice
    name: 'Domi (Dramatic Narrator)',
    description: 'Strong, commanding voice for powerful passages',
    model: 'eleven_turbo_v2_5'
  }
} as const;

export type VoicePresetId = keyof typeof VOICE_PRESETS;

/**
 * Generate speech from text using ElevenLabs TTS
 */
export async function generateSpeech(options: {
  text: string;
  voiceId: VoicePresetId;
  stability?: number;
  similarityBoost?: number;
}): Promise<{
  audio: Buffer;
  durationSeconds: number;
}> {
  const voicePreset = VOICE_PRESETS[options.voiceId];
  
  if (!voicePreset) {
    throw new Error(`Invalid voice ID: ${options.voiceId}`);
  }

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(voicePreset.id, {
      text: options.text,
      model_id: voicePreset.model,
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: 0.5, // Cinematic style
        use_speaker_boost: true
      }
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    
    // Estimate duration (approximate based on text length and average speech rate)
    // Average speech rate: ~150 words per minute = 2.5 words per second
    const wordCount = options.text.trim().split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount / 2.5);

    return {
      audio: audioBuffer,
      durationSeconds: estimatedDuration
    };
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw new Error(
      error instanceof Error 
        ? `Audio generation failed: ${error.message}`
        : 'Audio generation failed due to an unknown error'
    );
  }
}

/**
 * Get available voice models
 */
export function getVoicePresets() {
  return Object.entries(VOICE_PRESETS).map(([id, preset]) => ({
    id: id as VoicePresetId,
    ...preset
  }));
}

/**
 * Validate ElevenLabs API key
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const voices = await elevenlabs.voices.getAll();
    return voices.voices.length > 0;
  } catch (error) {
    console.error('ElevenLabs API key validation failed:', error);
    return false;
  }
}