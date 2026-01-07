import { SubtitleSegment, SubtitleStyle, TemplateSubtitleStyle, WhisperTranscriptionResult, SubtitleStylePreset } from '@/types/models';
import { ApiResponse, WhisperTranscriptionResponse } from '@/lib/types/openai';

/**
 * Service for managing subtitle generation, styling, and burn-in operations
 */
export class SubtitleService {
  /**
   * Template-based subtitle styles
   */
  private static readonly TEMPLATE_STYLES: TemplateSubtitleStyle = {
    'High Energy Promo': {
      fontFamily: 'Impact',
      fontSize: 48,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      borderColor: '#FFFF00',
      position: 'center-middle',
      alignment: 'center',
      bold: true,
      uppercase: true,
    },
    'Photorealistic Cinematic': {
      fontFamily: 'Cinzel',
      fontSize: 32,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderColor: 'rgba(0, 0, 0, 0.8)',
      position: 'bottom-center',
      alignment: 'center',
      bold: false,
      uppercase: false,
    },
    'Impact': {
      fontFamily: 'Impact',
      fontSize: 56,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      borderColor: '#FF0000',
      position: 'center-middle',
      alignment: 'center',
      bold: true,
      uppercase: true,
    },
    'Minimal': {
      fontFamily: 'Arial',
      fontSize: 28,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      position: 'bottom-center',
      alignment: 'center',
      bold: false,
      uppercase: false,
    },
  };

  /**
   * Auto-detect subtitle style based on content analysis
   */
  static async autoDetectStyle(prompt: string, contentTone?: string): Promise<SubtitleStylePreset> {
    // If content analysis service provided a tone, use it
    if (contentTone) {
      const toneLower = contentTone.toLowerCase();
      if (toneLower.includes('high energy') || toneLower.includes('exciting')) {
        return 'impact';
      }
      if (toneLower.includes('cinematic') || toneLower.includes('dramatic')) {
        return 'cinematic';
      }
      if (toneLower.includes('minimal') || toneLower.includes('clean')) {
        return 'minimal';
      }
    }

    // Fallback to prompt-based detection
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('promo') || promptLower.includes('energy') || promptLower.includes('exciting')) {
      return 'impact';
    }
    
    if (promptLower.includes('story') || promptLower.includes('narrative') || promptLower.includes('cinematic')) {
      return 'cinematic';
    }
    
    if (promptLower.includes('minimal') || promptLower.includes('clean') || promptLower.includes('modern')) {
      return 'minimal';
    }
    
    return 'cinematic'; // Default
  }

  /**
   * Get style configuration for a preset
   */
  static getStyleForPreset(preset: SubtitleStylePreset): SubtitleStyle {
    const styleMap: Record<SubtitleStylePreset, string> = {
      'auto': 'Photorealistic Cinematic', // Default to cinematic for auto
      'cinematic': 'Photorealistic Cinematic',
      'impact': 'Impact',
      'minimal': 'Minimal',
    };

    const templateName = styleMap[preset];
    return this.TEMPLATE_STYLES[templateName];
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  static async transcribeAudio(audioFile: File, language?: string): Promise<WhisperTranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioFile);
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch('/api/openai/transcribe', {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<WhisperTranscriptionResponse> = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return {
      text: result.data.text,
      segments: result.data.segments || [],
      language: result.data.language || 'en',
      duration: result.data.duration || 0,
    };
  }

  /**
   * Get subtitle style for a specific template
   */
  static getStyleForTemplate(templateName: string): SubtitleStyle {
    return (
      this.TEMPLATE_STYLES[templateName] ||
      this.TEMPLATE_STYLES['Photorealistic Cinematic']
    );
  }

  /**
   * Convert transcription segments to SRT format
   */
  static convertToSRT(segments: SubtitleSegment[]): string {
    return segments
      .map((segment, index) => {
        const startTime = this.formatSRTTimestamp(segment.start);
        const endTime = this.formatSRTTimestamp(segment.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
      })
      .join('\n');
  }

  /**
   * Convert transcription segments to ASS format with styling
   */
  static convertToASS(segments: SubtitleSegment[], style: SubtitleStyle): string {
    const header = this.generateASSHeader(style);
    const events = segments
      .map((segment) => {
        const start = this.formatASSTimestamp(segment.start);
        const end = this.formatASSTimestamp(segment.end);
        const text = style.uppercase ? segment.text.toUpperCase() : segment.text;
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
      })
      .join('\n');

    return `${header}\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events}`;
  }

  /**
   * Generate ASS header with template-based styling
   */
  private static generateASSHeader(style: SubtitleStyle): string {
    const alignment = this.getASSAlignment(style.position, style.alignment);
    const borderStyle = style.borderColor ? '1' : '0';

    return `[Script Info]
Title: Subtitle
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},${this.colorToASS(style.color)},&H000000FF,${this.colorToASS(style.borderColor || '#000000')},${this.colorToASS(style.backgroundColor || '#000000')},${style.bold ? '-1' : '0'},0,0,0,100,100,0,0,${borderStyle},2,0,${alignment},10,10,10,1`;
  }

  /**
   * Convert hex color to ASS format
   */
  private static colorToASS(hex: string): string {
    // Convert #RRGGBB to &H00BBGGRR
    const rgb = hex.replace('#', '');
    const r = rgb.substring(0, 2);
    const g = rgb.substring(2, 4);
    const b = rgb.substring(4, 6);
    return `&H00${b}${g}${r}`;
  }

  /**
   * Get ASS alignment code based on position and alignment
   */
  private static getASSAlignment(
    position: 'center-middle' | 'bottom-center' | 'top-center',
    alignment: 'center' | 'left' | 'right'
  ): string {
    const positionMap = {
      'bottom-center': { center: '2', left: '1', right: '3' },
      'center-middle': { center: '5', left: '4', right: '6' },
      'top-center': { center: '8', left: '7', right: '9' },
    };
    return positionMap[position][alignment];
  }

  /**
   * Format timestamp for SRT (HH:MM:SS,mmm)
   */
  private static formatSRTTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * Format timestamp for ASS (H:MM:SS.cc)
   */
  private static formatASSTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);

    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  }

  /**
   * Generate FFmpeg subtitle burn-in command
   */
  static generateFFmpegSubtitleCommand(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    subtitleFormat: 'srt' | 'ass' = 'ass'
  ): string {
    const filterComplex =
      subtitleFormat === 'ass'
        ? `subtitles=${subtitlePath}:force_style='Fontname=Impact,Fontsize=48,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2'`
        : `subtitles=${subtitlePath}`;

    return `ffmpeg -i ${videoPath} -vf "${filterComplex}" -c:a copy ${outputPath}`;
  }

  /**
   * Validate subtitle file format
   */
  static validateSubtitleFile(file: File): { valid: boolean; error?: string } {
    const validExtensions = ['.srt', '.ass', '.ssa', '.vtt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Invalid subtitle file format. Supported formats: ${validExtensions.join(', ')}`,
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: 'Subtitle file size exceeds 5MB limit',
      };
    }

    return { valid: true };
  }

  /**
   * Update subtitle segment text
   */
  static updateSegmentText(segments: SubtitleSegment[], segmentId: number, newText: string): SubtitleSegment[] {
    return segments.map(segment => 
      segment.id === segmentId 
        ? { ...segment, text: newText }
        : segment
    );
  }

  /**
   * Update segment timing
   */
  static updateSegmentTiming(
    segments: SubtitleSegment[], 
    segmentId: number, 
    start?: number, 
    end?: number
  ): SubtitleSegment[] {
    return segments.map(segment => 
      segment.id === segmentId 
        ? { 
            ...segment, 
            start: start !== undefined ? start : segment.start,
            end: end !== undefined ? end : segment.end
          }
        : segment
    );
  }

  /**
   * Validate segment doesn't overlap with others
   */
  static validateSegmentTiming(segments: SubtitleSegment[], segmentId: number, start: number, end: number): boolean {
    if (start >= end) return false;
    
    return !segments.some(segment => {
      if (segment.id === segmentId) return false;
      return (start < segment.end && end > segment.start);
    });
  }

  /**
   * Get subtitle positioning based on aspect ratio
   */
  static getSubtitlePositionForAspectRatio(
    aspectRatio: '16:9' | '9:16' | '1:1',
    style: SubtitleStylePreset
  ): { bottom: string; paddingBottom: string } {
    // Vertical (9:16) - TikTok/Reels Mode - Clear bottom safe zone for UI elements
    if (aspectRatio === '9:16') {
      return {
        bottom: '20%',
        paddingBottom: '2rem'
      };
    }
    
    // Square (1:1) - Instagram Post Mode - Balanced positioning
    if (aspectRatio === '1:1') {
      return {
        bottom: '15%',
        paddingBottom: '1.5rem'
      };
    }
    
    // Landscape (16:9) - YouTube Mode - Traditional lower-thirds
    return {
      bottom: '10%',
      paddingBottom: '1rem'
    };
  }

  /**
   * Get CSS classes for live subtitle preview overlay
   */
  static getSubtitleCSSClasses(
    style: SubtitleStylePreset,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
  ): string {
    const position = this.getSubtitlePositionForAspectRatio(aspectRatio, style);
    
    const baseClasses = `
      absolute left-0 right-0 text-center pointer-events-none z-50
      transition-all duration-300 ease-in-out
    `;
    
    const styleClasses = {
      auto: 'text-white text-shadow-lg font-bold',
      cinematic: 'text-white text-shadow-md font-light tracking-wide',
      impact: 'text-white text-yellow-300 text-shadow-xl font-black uppercase',
      minimal: 'text-white text-shadow-sm font-normal',
    };
    
    return `${baseClasses} ${styleClasses[style]}`;
  }

  /**
   * Get inline styles for live subtitle preview
   */
  static getSubtitleInlineStyles(
    style: SubtitleStylePreset,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
  ): React.CSSProperties {
    const position = this.getSubtitlePositionForAspectRatio(aspectRatio, style);
    const styleConfig = this.subtitleStyles[style];
    
    const baseStyles: React.CSSProperties = {
      bottom: position.bottom,
      paddingBottom: position.paddingBottom,
      paddingLeft: '2rem',
      paddingRight: '2rem',
      fontSize: aspectRatio === '9:16' ? '1.25rem' : aspectRatio === '1:1' ? '1.125rem' : '1rem',
      lineHeight: '1.4',
      textAlign: styleConfig.alignment as 'center' | 'left' | 'right',
      fontWeight: styleConfig.bold ? 'bold' : 'normal',
      textTransform: styleConfig.uppercase ? 'uppercase' : 'none',
      fontFamily: styleConfig.fontFamily,
      color: styleConfig.color,
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    };
    
    if (styleConfig.backgroundColor) {
      baseStyles.backgroundColor = styleConfig.backgroundColor;
      baseStyles.padding = '0.5rem 1rem';
      baseStyles.borderRadius = '0.25rem';
    }
    
    return baseStyles;
  }
}