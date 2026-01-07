import { createClient } from '@/lib/supabase/client';
import type { ComposedClip, TimelineClip, TransitionEffect, ExportSettings } from '@/types/models';

const supabase = createClient();

/**
 * Service for managing video composition operations
 */
export class VideoCompositionService {
  /**
   * Get all clips for a project from database
   */
  static async getProjectClips(projectId: string): Promise<TimelineClip[]> {
    try {
      const { data: clips, error } = await supabase
        .from('clips')
        .select('*')
        .eq('project_id', projectId)
        .order('scene_index', { ascending: true });

      if (error) throw error;

      return clips?.map((clip, index) => ({
        id: clip.id,
        clipId: clip.id,
        sceneIndex: clip.scene_index,
        startTime: index * 5, // Default 5 second clips
        endTime: (index + 1) * 5,
        duration: 5,
        videoUrl: clip.video_url || undefined,
        thumbnailUrl: clip.video_url || undefined,
        transition: { type: 'cross-dissolve', duration: 0.5 },
      })) || [];
    } catch (error) {
      console.error('Error fetching project clips:', error);
      throw error;
    }
  }

  /**
   * Calculate total composition duration
   */
  static calculateTotalDuration(clips: ComposedClip[]): number {
    if (!clips?.length) return 0;
    
    const lastClip = clips[clips.length - 1];
    return lastClip ? lastClip.endTime : 0;
  }

  /**
   * Update clip timing
   */
  static updateClipTiming(
    clips: TimelineClip[],
    clipId: string,
    newStart: number,
    newEnd: number
  ): TimelineClip[] {
    return clips.map(clip => {
      if (clip.id === clipId) {
        return {
          ...clip,
          startTime: newStart,
          endTime: newEnd,
          duration: newEnd - newStart,
        };
      }
      return clip;
    });
  }

  /**
   * Update clip transition
   */
  static updateClipTransition(
    clips: TimelineClip[],
    clipId: string,
    transition: TransitionEffect
  ): TimelineClip[] {
    return clips.map(clip => {
      if (clip.id === clipId) {
        return { ...clip, transition };
      }
      return clip;
    });
  }

  /**
   * Reorder clips in timeline
   */
  static reorderClips(
    clips: TimelineClip[],
    sourceIndex: number,
    destinationIndex: number
  ): TimelineClip[] {
    const result = Array.from(clips);
    const [removed] = result.splice(sourceIndex, 1);
    result.splice(destinationIndex, 0, removed);

    // Recalculate timing after reorder
    let currentTime = 0;
    return result.map(clip => {
      const duration = clip.duration || 5;
      const updatedClip = {
        ...clip,
        startTime: currentTime,
        endTime: currentTime + duration,
      };
      currentTime += duration;
      return updatedClip;
    });
  }

  /**
   * Apply fade effects to clip
   */
  static applyFadeEffect(
    clips: TimelineClip[],
    clipId: string,
    fadeIn?: number,
    fadeOut?: number
  ): TimelineClip[] {
    return clips.map(clip => {
      if (clip.id === clipId) {
        return { ...clip, fadeIn, fadeOut };
      }
      return clip;
    });
  }

  /**
   * Trim clip duration
   */
  static trimClip(
    clips: TimelineClip[],
    clipId: string,
    trimStart: number,
    trimEnd: number
  ): TimelineClip[] {
    return clips.map(clip => {
      if (clip.id === clipId) {
        const newDuration = clip.duration - trimStart - trimEnd;
        return {
          ...clip,
          trimStart,
          trimEnd,
          duration: newDuration,
          endTime: clip.startTime + newDuration,
        };
      }
      return clip;
    });
  }

  /**
   * Get export presets for platforms
   */
  static getExportPresets(): Record<string, ExportSettings> {
    return {
      youtube: {
        format: 'mp4',
        quality: 'high',
        resolution: '1080p',
        platform: 'youtube',
      },
      instagram: {
        format: 'mp4',
        quality: 'high',
        resolution: '1080p',
        platform: 'instagram',
      },
      facebook: {
        format: 'mp4',
        quality: 'medium',
        resolution: '720p',
        platform: 'facebook',
      },
      twitter: {
        format: 'mp4',
        quality: 'medium',
        resolution: '720p',
        platform: 'twitter',
      },
      custom: {
        format: 'mp4',
        quality: 'high',
        resolution: '1080p',
        platform: 'custom',
      },
    };
  }

  /**
   * Get available transitions
   */
  static getAvailableTransitions(): TransitionEffect[] {
    return [
      { type: 'none', duration: 0 },
      { type: 'cross-dissolve', duration: 0.5 },
      { type: 'light-rays', duration: 0.75 },
      { type: 'gentle-wipe', duration: 0.5 },
      { type: 'fade-to-white', duration: 0.5 },
    ];
  }

  /**
   * Validate composition timing
   */
  static validateComposition(clips: ComposedClip[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!clips?.length) {
      errors.push('No clips in composition');
      return { valid: false, errors };
    }

    const totalDuration = this.calculateTotalDuration(clips);
    if (totalDuration < 30) {
      errors.push('Total duration must be at least 30 seconds');
    }

    if (totalDuration > 60) {
      errors.push('Total duration must not exceed 60 seconds');
    }

    // Check for overlapping clips
    for (let i = 0; i < clips.length - 1; i++) {
      const current = clips[i];
      const next = clips[i + 1];
      if (current.endTime > next.startTime) {
        errors.push(`Clip ${i + 1} overlaps with clip ${i + 2}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply subtitle burn-in to video composition
   * @param videoPath Path to the input video file
   * @param subtitlePath Path to the subtitle file (SRT or ASS)
   * @param outputPath Path for the output video with burned-in subtitles
   * @param templateStyle Style template name (e.g., "High Energy Promo", "Photorealistic Cinematic")
   * @returns FFmpeg command string for subtitle burn-in
   */
  static async applySubtitleBurnIn(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    templateStyle: string
  ): Promise<string> {
    // Import SubtitleService dynamically to avoid circular dependencies
    const { SubtitleService } = await import('./subtitleService');
    
    // Get style configuration for the template
    const style = SubtitleService.getStyleForTemplate(templateStyle);
    
    // Build FFmpeg subtitle filter based on template style
    let subtitleFilter = '';
    
    if (templateStyle === 'High Energy Promo') {
      // High Energy: Impact font, white with yellow highlight, center middle, all caps
      subtitleFilter = `subtitles=${subtitlePath}:force_style='Fontname=Impact,Fontsize=48,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H0000FFFF,BorderStyle=1,Outline=3,Shadow=0,Alignment=5'`;
    } else if (templateStyle === 'Photorealistic Cinematic') {
      // Cinematic: Cinzel/Lato font, white with subtle shadow, bottom center
      subtitleFilter = `subtitles=${subtitlePath}:force_style='Fontname=Cinzel,Fontsize=32,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=1,Outline=2,Shadow=2,Alignment=2'`;
    } else {
      // Default: Simple white text with black outline, bottom center
      subtitleFilter = `subtitles=${subtitlePath}:force_style='Fontname=Arial,Fontsize=32,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2'`;
    }

    // Generate FFmpeg command with subtitle burn-in
    const ffmpegCommand = `ffmpeg -i ${videoPath} -vf "${subtitleFilter}" -c:a copy -c:v libx264 -preset medium -crf 23 ${outputPath}`;

    return ffmpegCommand;
  }

  /**
   * Stitch video clips with subtitle burn-in
   * @param clips Array of video clip paths
   * @param audioPath Path to the audio narration file
   * @param subtitlePath Path to the subtitle file (generated from Whisper)
   * @param outputPath Path for the final stitched video
   * @param templateStyle Style template name for subtitle styling
   * @returns Promise resolving to output video path
   */
  static async stitchVideoWithSubtitles(
    clips: string[],
    audioPath: string,
    subtitlePath: string,
    outputPath: string,
    templateStyle: string
  ): Promise<string> {
    // Step 1: Concatenate video clips
    const concatListPath = '/tmp/concat_list.txt';
    const concatList = clips.map((clip) => `file '${clip}'`).join('\n');
    // In production, write this to a file or use FFmpeg's concat demuxer

    // Step 2: Stitch clips together
    const stitchedVideoPath = '/tmp/stitched_video.mp4';
    const stitchCommand = `ffmpeg -f concat -safe 0 -i ${concatListPath} -c copy ${stitchedVideoPath}`;

    // Step 3: Add audio narration
    const videoWithAudioPath = '/tmp/video_with_audio.mp4';
    const audioCommand = `ffmpeg -i ${stitchedVideoPath} -i ${audioPath} -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 ${videoWithAudioPath}`;

    // Step 4: Burn in subtitles with template-based styling
    const finalCommand = await this.applySubtitleBurnIn(
      videoWithAudioPath,
      subtitlePath,
      outputPath,
      templateStyle
    );

    // In production, execute these commands sequentially
    // For now, return the final FFmpeg command
    return `${stitchCommand} && ${audioCommand} && ${finalCommand}`;
  }

  /**
   * Generate FFmpeg filter for aspect ratio cropping
   * @param aspectRatio Target aspect ratio (9:16, 1:1, 16:9)
   * @param inputWidth Original video width
   * @param inputHeight Original video height
   * @returns FFmpeg video filter string
   */
  static getAspectRatioCropFilter(
    aspectRatio: string,
    inputWidth: number,
    inputHeight: number
  ): string {
    switch (aspectRatio) {
      case '9:16': {
        // Vertical (TikTok/Reels) - Center crop to 9:16
        const targetWidth = Math.floor(inputHeight * (9 / 16));
        const xOffset = Math.floor((inputWidth - targetWidth) / 2);
        return `crop=${targetWidth}:${inputHeight}:${xOffset}:0`;
      }
      case '1:1': {
        // Square (Instagram) - Center crop to square
        const size = Math.min(inputWidth, inputHeight);
        const xOffset = Math.floor((inputWidth - size) / 2);
        const yOffset = Math.floor((inputHeight - size) / 2);
        return `crop=${size}:${size}:${xOffset}:${yOffset}`;
      }
      case '16:9':
      default:
        // Landscape (YouTube) - No crop needed for standard format
        return '';
    }
  }

  /**
   * Generate FFmpeg subtitle filter with dynamic styling
   * @param subtitlePath Path to subtitle file (SRT or ASS)
   * @param templateStyle Style template name
   * @param aspectRatio Target aspect ratio for font size adjustment
   * @returns FFmpeg subtitle filter string
   */
  static getSubtitleFilter(
    subtitlePath: string,
    templateStyle: string,
    aspectRatio: string
  ): string {
    // Dynamic font size based on aspect ratio
    const fontSizeMultiplier = aspectRatio === '9:16' ? 1.5 : aspectRatio === '1:1' ? 1.2 : 1.0;
    
    if (templateStyle === 'High Energy Promo') {
      const fontSize = Math.floor(48 * fontSizeMultiplier);
      return `subtitles=${subtitlePath}:force_style='Fontname=Impact,Fontsize=${fontSize},Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H0000FFFF,BorderStyle=1,Outline=3,Shadow=0,Alignment=5'`;
    } else if (templateStyle === 'Photorealistic Cinematic') {
      const fontSize = Math.floor(32 * fontSizeMultiplier);
      return `subtitles=${subtitlePath}:force_style='Fontname=Cinzel,Fontsize=${fontSize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=1,Outline=2,Shadow=2,Alignment=2'`;
    } else {
      const fontSize = Math.floor(32 * fontSizeMultiplier);
      return `subtitles=${subtitlePath}:force_style='Fontname=Arial,Fontsize=${fontSize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2'`;
    }
  }

  /**
   * Build complete FFmpeg command for multi-format rendering
   * @param inputPath Input video file path
   * @param outputPath Output video file path
   * @param aspectRatio Target aspect ratio
   * @param burnSubtitles Whether to burn in subtitles
   * @param subtitlePath Path to subtitle file (required if burnSubtitles is true)
   * @param templateStyle Style template for subtitle styling
   * @returns Complete FFmpeg command string
   */
  static buildFFmpegRenderCommand(
    inputPath: string,
    outputPath: string,
    aspectRatio: string,
    burnSubtitles: boolean,
    subtitlePath?: string,
    templateStyle: string = 'Photorealistic Cinematic'
  ): string {
    // Start with base FFmpeg command
    let command = `ffmpeg -i ${inputPath}`;
    
    // Build video filter chain
    const filters: string[] = [];
    
    // Add aspect ratio crop filter if not 16:9
    if (aspectRatio !== '16:9') {
      const cropFilter = this.getAspectRatioCropFilter(aspectRatio, 1920, 1080);
      if (cropFilter) {
        filters.push(cropFilter);
      }
    }
    
    // Add subtitle burn-in filter if requested
    if (burnSubtitles && subtitlePath) {
      let subtitleFilter = this.getSubtitleFilter(subtitlePath, templateStyle, aspectRatio);
      filters.push(subtitleFilter);
    }
    
    // Apply video filters if any
    if (filters.length > 0) {
      command += ` -vf "${filters.join(',')}"`;
    }
    
    // Add encoding parameters
    command += ' -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 192k';
    
    // Add output path
    command += ` ${outputPath}`;
    
    return command;
  }

  /**
   * Create a render job in the social_render_queue
   * @param projectId Project UUID
   * @param aspectRatio Target aspect ratio
   * @param burnSubtitles Whether to burn in subtitles
   * @param subtitleStyle Optional subtitle style override
   * @param priority Job priority (higher = processed first)
   * @returns Render job ID
   */
  static async createRenderJob(
    projectId: string,
    aspectRatio: string,
    burnSubtitles: boolean,
    subtitleStyle?: string,
    priority: number = 0
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('social_render_queue')
        .insert({
          project_id: projectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          aspect_ratio: aspectRatio,
          burn_subtitles: burnSubtitles,
          subtitle_style: subtitleStyle,
          priority: priority,
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error creating render job:', error);
      throw error;
    }
  }

  /**
   * Get render job status
   * @param jobId Render job UUID
   * @returns Job status and metadata
   */
  static async getRenderJobStatus(jobId: string) {
    try {
      const { data, error } = await supabase
        .from('social_render_queue')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching render job status:', error);
      throw error;
    }
  }

  /**
   * Get all render jobs for a project
   * @param projectId Project UUID
   * @returns Array of render jobs
   */
  static async getProjectRenderJobs(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('social_render_queue')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching project render jobs:', error);
      throw error;
    }
  }

  /**
   * Process aspect ratio and subtitle parameters for external API
   * @param projectId Project UUID
   * @param aspectRatio Target aspect ratio
   * @param burnSubtitles Whether to burn in subtitles
   * @returns Processing result with download URL
   */
  static async processVideoRender(
    projectId: string,
    aspectRatio: string,
    burnSubtitles: boolean
  ): Promise<{ downloadUrl: string; jobId: string }> {
    try {
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Create render job
      const jobId = await this.createRenderJob(
        projectId,
        aspectRatio,
        burnSubtitles,
        project.subtitle_style || 'auto'
      );

      // In production, this would trigger n8n webhook or background worker
      // For now, return placeholder
      const downloadUrl = `https://storage.example.com/renders/${jobId}.mp4`;

      return { downloadUrl, jobId };
    } catch (error) {
      console.error('Error processing video render:', error);
      throw error;
    }
  }
}