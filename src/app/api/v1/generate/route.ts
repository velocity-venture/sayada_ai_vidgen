import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GenerateVideoApiRequest, GenerateVideoApiResponse } from '@/types/models';
import { orchestrateVideoGeneration } from '@/services/aiDirectorService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Validate API Key and get user ID
 */
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId: string | null; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('validate_api_key', {
      key_to_validate: apiKey
    });

    if (error) {
      return { valid: false, userId: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { valid: false, userId: null, error: 'Invalid API key' };
    }

    const validationResult = data[0];
    if (!validationResult.is_valid) {
      return { valid: false, userId: null, error: 'API key is inactive or expired' };
    }

    return { valid: true, userId: validationResult.user_uuid };
  } catch (error: any) {
    return { valid: false, userId: null, error: error?.message || 'API key validation failed' };
  }
}

/**
 * POST /api/v1/generate - External API endpoint for video generation (Async Queue Pattern)
 * NOW WITH AI DIRECTOR ORCHESTRATION
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let apiKeyId: string | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    
    const validation = await validateApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    const { data: keyData } = await supabaseAdmin
      .from('api_keys')
      .select('id')
      .eq('api_key', apiKey)
      .single();
    
    apiKeyId = keyData?.id || null;

    const body: GenerateVideoApiRequest = await request.json();
    const { prompt, template, aspect_ratio, burn_subtitles, webhook_url, duration_seconds, voice_id, assets } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate aspect_ratio
    const validAspectRatios = ['16:9', '9:16', '1:1'];
    const selectedAspectRatio = aspect_ratio && validAspectRatios.includes(aspect_ratio) ? aspect_ratio : '16:9';

    // CRITICAL DECISION: Check if assets are provided
    const useStitcherMode = assets && assets.length > 0;

    if (useStitcherMode) {
      // =========================================
      // EXISTING STITCHER LOGIC (Asset Upload Mode)
      // =========================================
      
      // Create project record
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          user_id: validation.userId,
          title: `Uploaded Assets: ${prompt.substring(0, 50)}...`,
          script_content: prompt,
          style_preset: template || 'cinematic_story',
          duration_seconds: duration_seconds || 30,
          voice_id: voice_id || null,
          status: 'draft',
          aspect_ratio: selectedAspectRatio,
          subtitles_enabled: burn_subtitles !== false,
          subtitle_style: 'auto',
        })
        .select()
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { success: false, message: 'Failed to create video project' },
          { status: 500 }
        );
      }

      // Enqueue render job
      const { data: renderJob, error: renderJobError } = await supabaseAdmin
        .from('social_render_queue')
        .insert({
          project_id: project.id,
          user_id: validation.userId,
          aspect_ratio: selectedAspectRatio,
          burn_subtitles: burn_subtitles !== false,
          subtitle_style: 'auto',
          priority: 5,
          status: 'pending',
        })
        .select()
        .single();

      if (renderJobError || !renderJob) {
        return NextResponse.json(
          { success: false, message: 'Failed to enqueue render job' },
          { status: 500 }
        );
      }

      // Schedule webhook delivery if webhook_url provided
      let webhookDeliveryId: string | null = null;
      if (webhook_url) {
        const { data: webhookData } = await supabaseAdmin.rpc('schedule_webhook_delivery', {
          webhook_url_param: webhook_url,
          project_uuid: project.id,
          payload_data: {
            job_id: renderJob.id,
            project_id: project.id,
            status: 'queued',
            aspect_ratio: selectedAspectRatio,
            burn_subtitles: burn_subtitles !== false,
          }
        });
        
        webhookDeliveryId = webhookData;
      }

      const response: GenerateVideoApiResponse = {
        success: true,
        job_id: renderJob.id,
        project_id: project.id,
        status: 'queued',
        message: 'Video generation job queued successfully (Stitcher Mode)',
        webhook_delivery_id: webhookDeliveryId || undefined,
        estimated_completion_time: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      };

      return NextResponse.json(response, { status: 200 });
      
    } else {
      // =========================================
      // NEW AI DIRECTOR MODE (Text-to-Video Autonomous)
      // =========================================
      
      console.log('Using AI Director orchestration for autonomous text-to-video generation');

      // Call the AI Director orchestration service
      const orchestrationResult = await orchestrateVideoGeneration({
        userPrompt: prompt,
        targetDuration: duration_seconds || 60,
        voiceId: voice_id as any, // ElevenLabs voice ID
        aspectRatio: selectedAspectRatio as '16:9' | '9:16' | '1:1',
        userId: validation.userId,
        templateCategory: template || 'cinematic_story'
      });

      if (!orchestrationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'AI Director orchestration failed',
            error: orchestrationResult.error 
          },
          { status: 500 }
        );
      }

      // Fire webhook if provided
      let webhookDeliveryId: string | null = null;
      if (webhook_url) {
        const { data: webhookData } = await supabaseAdmin.rpc('schedule_webhook_delivery', {
          webhook_url_param: webhook_url,
          project_uuid: orchestrationResult.projectId,
          payload_data: {
            project_id: orchestrationResult.projectId,
            status: 'completed',
            video_url: orchestrationResult.finalVideoUrl,
            mode: 'ai_director'
          }
        });
        
        webhookDeliveryId = webhookData;
      }

      // Log successful API request
      const responseTime = Date.now() - startTime;
      
      if (apiKeyId) {
        await supabaseAdmin
          .from('api_request_logs')
          .insert({
            api_key_id: apiKeyId,
            endpoint: '/api/v1/generate',
            method: 'POST',
            request_body: body,
            response_status: 200,
            response_time_ms: responseTime,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            user_agent: request.headers.get('user-agent') || null
          });
      }

      const response: GenerateVideoApiResponse = {
        success: true,
        project_id: orchestrationResult.projectId!,
        status: 'completed',
        message: 'Video generated successfully via AI Director',
        video_url: orchestrationResult.finalVideoUrl,
        webhook_delivery_id: webhookDeliveryId || undefined,
        estimated_completion_time: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 200 });
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (apiKeyId) {
      await supabaseAdmin
        .from('api_request_logs')
        .insert({
          api_key_id: apiKeyId,
          endpoint: '/api/v1/generate',
          method: 'POST',
          request_body: null,
          response_status: 500,
          response_time_ms: responseTime,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null
        });
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Video Generation API (Async Queue Pattern)',
      version: '1.0',
      endpoints: {
        generate: {
          method: 'POST',
          path: '/api/v1/generate',
          description: 'Enqueue a video generation job',
          authentication: 'Bearer token (API key)',
          parameters: {
            prompt: 'string (required) - Text description for video generation',
            template: 'string (optional) - cinematic_story | high_energy_promo | modern_minimalist',
            aspect_ratio: 'string (optional) - 16:9 | 9:16 | 1:1 (default: 16:9)',
            burn_subtitles: 'boolean (optional) - Whether to burn subtitles into video (default: true)',
            webhook_url: 'string (optional) - URL to receive completion webhook',
            duration_seconds: 'number (optional) - Video duration (default: 30)',
            voice_id: 'string (optional) - ElevenLabs voice ID'
          },
          response: {
            success: 'boolean',
            job_id: 'string (UUID) - Render job ID for tracking',
            project_id: 'string (UUID) - Project ID',
            status: 'string - "queued"',
            message: 'string',
            webhook_delivery_id: 'string (UUID) - Optional webhook delivery ID',
            estimated_completion_time: 'string (ISO timestamp)'
          }
        },
        checkStatus: {
          method: 'GET',
          path: '/api/v1/jobs/{job_id}',
          description: 'Check render job status',
          authentication: 'Bearer token (API key)'
        }
      }
    },
    { status: 200 }
  );
}