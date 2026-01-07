import { 
  ApiResponse, 
  ScriptureAnalysisRequest, 
  ScriptureAnalysisResponse 
} from '@/lib/types/openai';

/**
 * Service for analyzing scripture text and generating video scene prompts using OpenAI.
 */
export const scriptureAnalysisService = {
  /**
   * Analyzes scripture text and generates optimized video scenes for Pika Labs.
   * @param request - Scripture analysis request parameters
   * @returns Promise with analysis results or error
   */
  async analyzeScripture(
    request: ScriptureAnalysisRequest
  ): Promise<ApiResponse<ScriptureAnalysisResponse>> {
    try {
      const response = await fetch('/api/openai/scripture-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<ScriptureAnalysisResponse> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to analyze scripture',
          isInternal: false,
          statusCode: 500,
        },
      };
    }
  },

  /**
   * Validates scripture text before analysis.
   * @param scriptureText - The scripture text to validate
   * @param videoDuration - The target video duration
   * @returns Validation result with errors if any
   */
  validateScripture(scriptureText: string, videoDuration: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!scriptureText || !scriptureText.trim()) {
      errors.push('Scripture text is required');
    } else if (scriptureText.trim().length < 50) {
      errors.push('Scripture text must be at least 50 characters');
    } else if (scriptureText.trim().length > 1000) {
      errors.push('Scripture text must not exceed 1000 characters');
    }

    if (!videoDuration || videoDuration < 30 || videoDuration > 60) {
      errors.push('Video duration must be between 30 and 60 seconds');
    }

    const wordCount = scriptureText.trim().split(/\s+/).length;
    if (wordCount < 20) {
      errors.push('Scripture text must contain at least 20 words for proper scene generation');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Calculates estimated scene count based on duration and word count.
   * @param scriptureText - The scripture text
   * @param videoDuration - The target video duration
   * @returns Estimated number of scenes
   */
  estimateSceneCount(scriptureText: string, videoDuration: number): number {
    const wordCount = scriptureText.trim().split(/\s+/).length;
    const avgSceneDuration = videoDuration / 3.5; // Target 3-4 scenes
    return Math.max(3, Math.min(4, Math.ceil(avgSceneDuration)));
  },
};