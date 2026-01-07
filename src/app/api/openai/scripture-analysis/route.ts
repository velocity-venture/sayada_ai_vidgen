import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai-client';
import { handleOpenAIError } from '@/lib/openai-error-handler';
import { 
  ApiResponse, 
  ScriptureAnalysisRequest,
  ScriptureAnalysisResponse 
} from '@/lib/types/openai';

/**
 * POST /api/openai/scripture-analysis
 * Analyzes scripture text and generates optimized Pika Labs video scene prompts.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ScriptureAnalysisRequest = await request.json();
    const { scriptureText, videoDuration, stylePreset } = body;

    // Validate request
    if (!scriptureText || !scriptureText.trim()) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          message: 'Scripture text is required and cannot be empty.',
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
        optimizationNotes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Notes about how the prompts were optimized for Pika Labs'
        }
      },
      required: ['scenes', 'totalScenes', 'estimatedDuration', 'styleApplied', 'optimizationNotes'],
      additionalProperties: false
    };

    // Calculate optimal number of scenes based on duration
    const sceneDuration = Math.floor(videoDuration / 3.5); // Average 3-4 scenes for 30-60 sec videos
    const targetScenes = Math.max(3, Math.min(4, sceneDuration));

    // Create system prompt for scripture analysis and Pika Labs optimization
    const systemPrompt = `You are an expert video production AI specializing in transforming scripture text into cinematic video scenes optimized for Pika Labs AI video generation.

Your expertise includes:
1. Breaking scripture into compelling visual narratives
2. Creating Pika Labs prompts that maximize video quality and coherence
3. Applying cinematic techniques: lighting (8k cinematic lighting, golden hour, soft diffused light), camera angles (establishing shots, close-ups, wide shots), and movement (slow pan, dolly zoom, tracking shot)
4. Ensuring visual consistency across scenes
5. Matching the requested style preset: ${stylePreset}

CRITICAL PIKA LABS OPTIMIZATION RULES:
- Include specific cinematography terms (e.g., "shallow depth of field", "bokeh background")
- Specify lighting conditions (e.g., "volumetric god rays", "rim lighting", "three-point lighting")
- Describe camera movements (e.g., "slow forward dolly", "aerial establishing shot", "handheld intimate close-up")
- Add quality markers (e.g., "8k resolution", "photorealistic", "hyperrealistic CGI")
- Include style descriptors matching ${stylePreset}
- Avoid abstract concepts; use concrete visual descriptions
- Keep prompts between 40-80 words for optimal Pika Labs results

Generate exactly ${targetScenes} scenes that total approximately ${videoDuration} seconds, with each scene being 8-15 seconds.`;

    const userPrompt = `Analyze this scripture text and create ${targetScenes} cinematic video scenes optimized for Pika Labs generation:

Scripture Text: "${scriptureText}"

Requirements:
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
          name: 'scripture_video_scenes',
          schema: videoSceneSchema,
        },
      },
      reasoning_effort: 'high', // High reasoning for complex creative analysis
      verbosity: 'medium',
      max_completion_tokens: 3000,
    });

    // Parse the structured response
    const analysisData = JSON.parse(response.choices[0].message.content || '{}');

    // Return success response
    const successResponse: ApiResponse<ScriptureAnalysisResponse> = {
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