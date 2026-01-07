import { 
  ApiResponse, 
  ContentAnalysisRequest, 
  ContentAnalysisResponse 
} from '@/lib/types/openai';

/**
 * Service for analyzing any text content and generating video scene prompts using OpenAI.
 * Universal content analysis for any industry (Real Estate, Tech, Personal, etc.)
 */
export const contentAnalysisService = {
  /**
   * Analyzes text content and generates optimized video scenes for Pika Labs.
   * @param request - Content analysis request parameters
   * @returns Promise with analysis results or error
   */
  async analyzeContent(
    request: ContentAnalysisRequest
  ): Promise<ApiResponse<ContentAnalysisResponse>> {
    try {
      const response = await fetch('/api/openai/content-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<ContentAnalysisResponse> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to analyze content',
          isInternal: false,
          statusCode: 500,
        },
      };
    }
  },

  /**
   * Validates content text before analysis.
   * @param contentText - The text content to validate
   * @param videoDuration - The target video duration
   * @returns Validation result with errors if any
   */
  validateContent(contentText: string, videoDuration: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contentText || !contentText.trim()) {
      errors.push('Content text is required');
    } else if (contentText.trim().length < 50) {
      errors.push('Content text must be at least 50 characters');
    } else if (contentText.trim().length > 1000) {
      errors.push('Content text must not exceed 1000 characters');
    }

    if (!videoDuration || videoDuration < 30 || videoDuration > 60) {
      errors.push('Video duration must be between 30 and 60 seconds');
    }

    const wordCount = contentText.trim().split(/\s+/).length;
    if (wordCount < 20) {
      errors.push('Content text must contain at least 20 words for proper scene generation');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Calculates estimated scene count based on duration and word count.
   * @param contentText - The content text
   * @param videoDuration - The target video duration
   * @returns Estimated number of scenes
   */
  estimateSceneCount(contentText: string, videoDuration: number): number {
    const wordCount = contentText.trim().split(/\s+/).length;
    const avgSceneDuration = videoDuration / 3.5; // Target 3-4 scenes
    return Math.max(3, Math.min(4, Math.ceil(avgSceneDuration)));
  },

  /**
   * Analyzes content sentiment and topic for autonomous template selection.
   * @param contentText - The text content to analyze
   * @returns Analysis result with sentiment and topic
   */
  analyzeContentContext(contentText: string): { sentiment: string; topic: string } {
    const text = contentText.toLowerCase();
    
    // Sentiment analysis (simplified)
    let sentiment = 'neutral';
    const happyWords = ['happy', 'joy', 'excited', 'love', 'great', 'amazing', 'wonderful'];
    const seriousWords = ['important', 'serious', 'critical', 'significant', 'essential'];
    const urgentWords = ['urgent', 'now', 'immediately', 'quick', 'fast', 'hurry'];
    
    const happyCount = happyWords.filter(word => text.includes(word)).length;
    const seriousCount = seriousWords.filter(word => text.includes(word)).length;
    const urgentCount = urgentWords.filter(word => text.includes(word)).length;
    
    if (happyCount > seriousCount && happyCount > urgentCount) sentiment = 'happy';
    else if (seriousCount > happyCount && seriousCount > urgentCount) sentiment = 'serious';
    else if (urgentCount > happyCount && urgentCount > seriousCount) sentiment = 'urgent';
    
    // Topic analysis (simplified)
    let topic = 'general';
    if (text.includes('nature') || text.includes('environment') || text.includes('outdoor')) topic = 'nature';
    else if (text.includes('tech') || text.includes('technology') || text.includes('software')) topic = 'tech';
    else if (text.includes('people') || text.includes('person') || text.includes('human')) topic = 'people';
    else if (text.includes('product') || text.includes('sell') || text.includes('buy')) topic = 'product';
    
    return { sentiment, topic };
  },

  /**
   * Determines the best template based on content analysis
   */
  determineRecommendedTemplate(
    sentiment: ContentAnalysisResult['sentiment'],
    topic: ContentAnalysisResult['topic']
  ): ContentAnalysisResult['recommendedTemplate'] {
    // High Energy Promo - For urgent, promotional, and tech content
    if (sentiment === 'urgent' || topic === 'tech' || topic === 'product') {
      return 'high_energy_promo';
    }

    // Modern Minimalist - For professional, business, and product demos
    if (sentiment === 'professional' || topic === 'business') {
      return 'modern_minimalist';
    }

    // Cinematic Story - For emotional, narrative, and people-focused content
    if (sentiment === 'serious' || sentiment === 'inspirational' || topic === 'people' || topic === 'nature') {
      return 'cinematic_story';
    }

    // Default to Modern Minimalist for neutral content
    return 'modern_minimalist';
  },
};

interface ContentAnalysisResult {
  sentiment: 'happy' | 'serious' | 'urgent' | 'inspirational' | 'professional';
  topic: 'nature' | 'tech' | 'people' | 'product' | 'abstract' | 'business';
  recommendedTemplate: 'cinematic_story' | 'high_energy_promo' | 'modern_minimalist';
  visualKeywords: string[];
  pacing: 'slow' | 'medium' | 'fast';
  musicStyle: 'orchestral' | 'electronic' | 'ambient' | 'upbeat';
}