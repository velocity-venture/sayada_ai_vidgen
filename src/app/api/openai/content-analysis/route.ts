import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai-client';
import { handleOpenAIError } from '@/lib/openai-error-handler';
import { 
  ApiResponse, 
  ContentAnalysisRequest,
  ContentAnalysisResponse 
} from '@/lib/types/openai';

/**
 * POST /api/openai/content-analysis
 * Analyzes any text content and generates optimized Pika Labs video scene prompts.
 * Universal content analysis for any industry.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ContentAnalysisRequest = await request.json();
    const { contentText, videoDuration, stylePreset } = body;

    // Validate request
    if (!contentText || !contentText.trim()) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          message: 'Content text is required and cannot be empty.',
          isInternal: false,
          statusCode: 400,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!videoDuration || videoDuration < 30 || videoDuration > 60) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          message: 'Video duration must be between 30 and 60 seconds.',
          isInternal: false,
          statusCode: 400,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Define the structured output schema for video scenes
    const videoSceneSchema = {
      type: 'object',
      properties: {
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sceneNumber: { type: 'number', description: 'Sequential scene number' },
              description: { type: 'string', description: 'Brief description of the scene content' },
              pikaPrompt: { 
                type: 'string', 
                description: 'Optimized prompt for Pika Labs video generation including cinematography, lighting, and visual style'
              },
              duration: { type: 'number', description: 'Scene duration in seconds' },
              visualElements: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Key visual elements to include in the scene'
              },
              mood: { type: 'string', description: 'Emotional tone of the scene' },
              cameraMovement: { type: 'string', description: 'Camera movement or angle description' }
            },
            required: ['sceneNumber', 'description', 'pikaPrompt', 'duration', 'visualElements', 'mood', 'cameraMovement']
          }
        },
        totalScenes: { type: 'number', description: 'Total number of scenes generated' },
        estimatedDuration: { type: 'number', description: 'Total estimated video duration' },
        styleApplied: { type: 'string', description: 'Style preset applied to the scenes' },
        contentAnalysis: {
          type: 'object',
          properties: {
            sentiment: { type: 'string', description: 'Detected sentiment: Happy, Serious, or Urgent' },
            topic: { type: 'string', description: 'Detected topic: Nature, Tech, People, Product, etc.' },
            recommendedTemplate: { type: 'string', description: 'AI-recommended template based on analysis' }
          },
          required: ['sentiment', 'topic', 'recommendedTemplate']
        },
        optimizationNotes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Notes about how the prompts were optimized for Pika Labs'
        }
      },
      required: ['scenes', 'totalScenes', 'estimatedDuration', 'styleApplied', 'contentAnalysis', 'optimizationNotes'],
      additionalProperties: false
    };

    // Calculate optimal number of scenes based on duration
    const sceneDuration = Math.floor(videoDuration / 3.5);
    const targetScenes = Math.max(3, Math.min(4, sceneDuration));

    // Create system prompt for universal content analysis
    const systemPrompt = `You are an expert video production AI specializing in transforming ANY text content into cinematic video scenes optimized for Pika Labs AI video generation.

Your expertise includes:
1. Analyzing content sentiment (Happy, Serious, Urgent) and topic (Nature, Tech, People, Product, etc.)
2. Breaking any content into compelling visual narratives
3. Creating Pika Labs prompts that maximize video quality and coherence
4. Applying cinematic techniques: lighting (8k cinematic lighting, golden hour, soft diffused light), camera angles (establishing shots, close-ups, wide shots), and movement (slow pan, dolly zoom, tracking shot)
5. Ensuring visual consistency across scenes
6. Matching the requested style preset: ${stylePreset}

AUTONOMOUS DIRECTOR LOGIC:
- Analyze the content sentiment and topic first
- Recommend the most suitable template based on analysis
- Examples:
  * "Sell this pen" → Product Demo (Modern Minimalist)
  * "Join our mission"→ High Energy Promo *"Our story began..."→ Cinematic Story *"Here is how it works" → Explainer

CRITICAL PIKA LABS OPTIMIZATION RULES:
- Include specific cinematography terms (e.g., "shallow depth of field", "bokeh background")
- Specify lighting conditions (e.g., "volumetric god rays", "rim lighting", "three-point lighting")
- Describe camera movements (e.g., "slow forward dolly", "aerial establishing shot", "handheld intimate close-up")
- Add quality markers (e.g., "8k resolution", "photorealistic", "hyperrealistic CGI")
- Include style descriptors matching ${stylePreset}
- Avoid abstract concepts; use concrete visual descriptions
- Keep prompts between 40-80 words for optimal Pika Labs results

Generate exactly ${targetScenes} scenes that total approximately ${videoDuration} seconds, with each scene being 8-15 seconds.`;

    const userPrompt = `Analyze this content and create ${targetScenes} cinematic video scenes optimized for Pika Labs generation:

Content: "${contentText}"

Requirements:
- First, analyze the sentiment (Happy/Serious/Urgent) and topic (Nature/Tech/People/Product/etc.)
- Recommend the most suitable template based on your analysis
- Total video duration: ${videoDuration} seconds
- Style preset: ${stylePreset}
- Create concrete, visually descriptive Pika Labs prompts
- Include cinematography and lighting details in each prompt
- Ensure visual and narrative flow between scenes
- Each pikaPrompt should be 40-80 words with specific technical details`;

    // Call OpenAI API with structured output
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'content_video_scenes',
          schema: videoSceneSchema,
        },
      },
      reasoning_effort: 'high',
      verbosity: 'medium',
      max_completion_tokens: 3000,
    });

    // Parse the structured response
    const analysisData = JSON.parse(response.choices[0].message.content || '{}');

    // Return success response
    const successResponse: ApiResponse<ContentAnalysisResponse> = {
      success: true,
      data: analysisData,
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    // Handle OpenAI errors
    const errorResponse = handleOpenAIError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}