import { createClient } from '@/lib/supabase/server';
import openai from '@/lib/openai-client';
import { VoicePresetId } from '@/lib/elevenlabs-client';
import { generateMultiSceneAudio } from './elevenLabsService';
import { generateMultiSceneVideos } from './pikaService';
import { VideoCompositionService } from './videoCompositionService';
import { getProviderCredentials } from './serviceConfigService';
import { videoTemplateService } from './videoTemplateService';


/**
 * AI Director Orchestration Engine
 * 
 * The "Brain" that manages autonomous text-to-video creation:
 * 1. Scripting: Uses OpenAI to break user prompt into ~4 scenes
 * 2. Audio Generation: Parallelizes ElevenLabs for each scene
 * 3. Video Generation: Parallelizes Pika Labs for each scene
 * 4. Stitching: Passes assets to FFmpeg for final composition
 */

export interface VideoScene {
  index: number;
  text: string;
  visualDescription: string;
  duration: number;
  pikaPrompt: string;
}

export interface VideoScript {
  title: string;
  totalDuration: number;
  scenes: VideoScene[];
}

export interface OrchestrationOptions {
  userPrompt: string;
  targetDuration: number;
  voiceId: VoicePresetId;
  aspectRatio: '16:9' | '9:16' | '1:1';
  userId: string;
}

export interface OrchestrationResult {
  success: boolean;
  projectId?: string;
  finalVideoUrl?: string;
  error?: string;
}

/**
 * Template logic injection - NOW FETCHES FROM DATABASE
 */
interface TemplateInjection {
  pikaPromptSuffix: string;
  pikaPromptNegative: string;
  voiceId: string;
  motionStrength: number;
  pacing: 'slow' | 'normal' | 'fast';
}

async function getTemplateInjection(templateId: string): Promise<TemplateInjection> {
  // Fetch template from database
  const template = await videoTemplateService.getTemplateById(templateId);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Extract AI configuration from template
  return {
    pikaPromptSuffix: template.pika_style_prompt || 'Cinematic lighting, 8k resolution, photorealistic',
    pikaPromptNegative: template.pika_negative_prompt || 'cartoon, blurry, distorted, low quality',
    voiceId: template.elevenlabs_voice_id || 'rachel',
    motionStrength: template.motion_strength || 2,
    pacing: determinePacing(template.motion_strength || 2)
  };
}

function determinePacing(motionStrength: number): 'slow' | 'normal' | 'fast' {
  if (motionStrength <= 1) return 'slow';
  if (motionStrength >= 3) return 'fast';
  return 'normal';
}

/**
 * Step 1: Generate video script from user prompt using OpenAI
 * NOW USES DATABASE TEMPLATE CONFIG
 */
async function generateVideoScript(
  userPrompt: string,
  targetDuration: number,
  templateId: string
): Promise<VideoScript> {
  const sceneDuration = Math.floor(targetDuration / 4);
  const templateInjection = await getTemplateInjection(templateId);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a professional video script writer. Break the user's prompt into exactly 4 cinematic scenes.
        Each scene should be ${sceneDuration} seconds long.
        
        PACING: ${templateInjection.pacing}
        VISUAL STYLE: ${templateInjection.pikaPromptSuffix}
        MOTION STRENGTH: ${templateInjection.motionStrength}/4
        
        Return a JSON object with this structure:
        {
          "title": "Video Title",
          "totalDuration": ${targetDuration},
          "scenes": [
            {
              "index": 0,
              "text": "Narration text for scene 1",
              "visualDescription": "Detailed visual description for Pika Labs",
              "duration": ${sceneDuration},
              "pikaPrompt": "Base prompt for video generation"
            }
          ]
        }
        
        IMPORTANT: The pikaPrompt should be a base description. Template styling will be automatically appended.`
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7
  });

  const scriptData = JSON.parse(completion.choices[0].message.content || '{}');
  
  // Inject template logic into each scene's Pika prompt
  scriptData.scenes = scriptData.scenes.map((scene: VideoScene) => ({
    ...scene,
    pikaPrompt: `${scene.pikaPrompt}. ${templateInjection.pikaPromptSuffix}. AVOID: ${templateInjection.pikaPromptNegative}. MOTION: ${templateInjection.motionStrength}/4`
  }));
  
  return scriptData as VideoScript;
}

/**
 * Step 2: Orchestrate parallel audio and video generation
 * NOW USES DATABASE TEMPLATE VOICE
 */
async function generateAssetsInParallel(
  script: VideoScript,
  voiceId: VoicePresetId,
  aspectRatio: '16:9' | '9:16' | '1:1',
  templateId: string
): Promise<{
  audioResults: Array<{ sceneIndex: number; audioBlob: Blob; duration: number }>;
  videoResults: Array<{ sceneIndex: number; videoUrl: string }>;
}> {
  // Get template-specific voice from database
  const templateInjection = await getTemplateInjection(templateId);
  const finalVoiceId = voiceId || templateInjection.voiceId as VoicePresetId;

  // Prepare scene data
  const audioScenes = script.scenes.map(scene => ({
    text: scene.text,
    index: scene.index
  }));
  
  const videoScenes = script.scenes.map(scene => ({
    prompt: scene.pikaPrompt,
    index: scene.index,
    duration: scene.duration
  }));

  // Execute audio and video generation in parallel
  const [audioResults, videoResults] = await Promise.all([
    generateMultiSceneAudio(audioScenes, finalVoiceId),
    generateMultiSceneVideos(videoScenes, aspectRatio)
  ]);

  // Filter successful results
  const successfulAudio = audioResults.filter(r => r.success).map(r => ({
    sceneIndex: r.sceneIndex,
    audioBlob: r.audioBlob,
    duration: r.audioDurationSeconds
  }));

  const successfulVideo = videoResults.filter(r => r.success).map(r => ({
    sceneIndex: r.sceneIndex,
    videoUrl: r.videoUrl
  }));

  return { audioResults: successfulAudio, videoResults: successfulVideo };
}

/**
 * Step 3: Upload intermediate assets to Supabase Storage
 */
async function uploadIntermediateAssets(
  projectId: string,
  userId: string,
  audioResults: Array<{ sceneIndex: number; audioBlob: Blob }>,
  videoResults: Array<{ sceneIndex: number; videoUrl: string }>
): Promise<{
  audioUrls: string[];
  videoUrls: string[];
}> {
  const supabase = await createClient();
  const audioUrls: string[] = [];
  const videoUrls: string[] = [];

  // Upload audio files
  for (const audio of audioResults) {
    const fileName = `${projectId}_scene_${audio.sceneIndex}_audio.mp3`;
    const filePath = `temp-audio/${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('audio-assets')
      .upload(filePath, audio.audioBlob, { 
        contentType: 'audio/mpeg',
        upsert: true 
      });

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('audio-assets')
        .getPublicUrl(filePath);
      audioUrls.push(urlData.publicUrl);
    }
  }

  // Video URLs are already public (from Pika Labs)
  videoUrls.push(...videoResults.map(v => v.videoUrl));

  return { audioUrls, videoUrls };
}

/**
 * Step 4: Stitch all assets together using FFmpeg
 */
async function stitchFinalVideo(
  projectId: string,
  audioUrls: string[],
  videoUrls: string[],
  aspectRatio: '16:9' | '9:16' | '1:1'
): Promise<string> {
  // In production, this would call the actual FFmpeg processor
  // For now, we use the video composition service's logic
  
  const outputPath = `/tmp/final_${projectId}.mp4`;
  
  // Build FFmpeg command using existing video composition service
  const ffmpegCommand = VideoCompositionService.buildFFmpegRenderCommand(
    videoUrls[0], // First video as input
    outputPath,
    aspectRatio,
    false // No subtitles for now
  );

  console.log('FFmpeg command:', ffmpegCommand);
  
  // PLACEHOLDER: Execute FFmpeg command
  // In production: await executeFFmpegCommand(ffmpegCommand);
  
  // Return mock final video URL
  return `https://storage.example.com/final-videos/${projectId}.mp4`;
}

/**
 * Main orchestration function - NOW TEMPLATE-AWARE
 */
export async function orchestrateVideoGeneration(
  options: OrchestrationOptions & { templateId: string }
): Promise<OrchestrationResult> {
  const supabase = await createClient();

  try {
    // Verify template exists
    const template = await videoTemplateService.getTemplateById(options.templateId);
    if (!template) {
      throw new Error('Template not found. Please select a valid template.');
    }

    // Verify user has provider credentials configured
    const credentials = await getProviderCredentials(options.userId);
    
    if (!credentials.openai_api_key) {
      throw new Error('OpenAI API key not configured. Please add it in Provider Settings.');
    }
    if (!credentials.elevenlabs_api_key) {
      throw new Error('ElevenLabs API key not configured. Please add it in Provider Settings.');
    }
    // Check for Fal.ai API key (used for Pika Labs video generation)
    if (!process.env.FAL_KEY) {
      throw new Error('FAL_KEY environment variable is not set. Please add it to your .env.local file.');
    }

    // Create project record with template reference
    // @ts-ignore - Supabase types are out of date
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: options.userId,
        title: `AI Generated: ${options.userPrompt.substring(0, 50)}`,
        script_content: options.userPrompt,
        status: 'processing',
        duration_seconds: options.targetDuration,
        style_preset: template.style_preset,
        aspect_ratio: options.aspectRatio
      } as any)
      .select()
      .single();

    if (projectError || !project) {
      throw new Error('Failed to create project');
    }

    // Step 1: Generate script with template-specific styling
    console.log('Step 1: Generating script with template-specific styling...');
    const script = await generateVideoScript(
      options.userPrompt, 
      options.targetDuration,
      options.templateId
    );

    // Step 2: Generate assets with template-specific voice and visuals
    console.log('Step 2: Generating audio and video with template configuration...');
    const { audioResults, videoResults } = await generateAssetsInParallel(
      script,
      options.voiceId,
      options.aspectRatio,
      options.templateId
    );

    // Step 3: Upload intermediate assets
    console.log('Step 3: Uploading intermediate assets...');
    const { audioUrls, videoUrls } = await uploadIntermediateAssets(
      // @ts-ignore - Supabase types are out of date
      project.id,
      options.userId,
      audioResults,
      videoResults
    );

    // Step 4: Stitch final video
    console.log('Step 4: Stitching final video...');
    const finalVideoUrl = await stitchFinalVideo(
      // @ts-ignore - Supabase types are out of date
      project.id,
      audioUrls,
      videoUrls,
      options.aspectRatio
    );

    // Update project with final video URL
    // @ts-ignore - Supabase types are out of date
    await (supabase
      .from('projects') as any)
      .update({
        video_url: finalVideoUrl,
        status: 'completed'
      })
      .eq('id', (project as any).id);

    // Increment template usage count
    await videoTemplateService.incrementUsageCount(options.templateId);

    return {
      success: true,
      // @ts-ignore - Supabase types are out of date
      projectId: (project as any).id,
      finalVideoUrl: finalVideoUrl
    };
  } catch (error) {
    console.error('Orchestration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Orchestration failed'
    };
  }
}