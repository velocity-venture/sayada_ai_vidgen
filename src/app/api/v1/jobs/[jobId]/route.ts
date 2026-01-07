import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * GET /api/v1/jobs/[jobId] - Check render job status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const { jobId } = params;

    // Get render job with project details
    const { data: renderJob, error: jobError } = await supabaseAdmin
      .from('social_render_queue')
      .select(`
        *,
        projects (
          id,
          title,
          status,
          video_url
        )
      `)
      .eq('id', jobId)
      .eq('user_id', validation.userId)
      .single();

    if (jobError || !renderJob) {
      return NextResponse.json(
        { success: false, message: 'Render job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job_id: renderJob.id,
      project_id: renderJob.project_id,
      status: renderJob.status,
      aspect_ratio: renderJob.aspect_ratio,
      burn_subtitles: renderJob.burn_subtitles,
      output_url: renderJob.output_url,
      error_message: renderJob.error_message,
      attempts: renderJob.attempts,
      max_attempts: renderJob.max_attempts,
      processing_time_seconds: renderJob.processing_time_seconds,
      created_at: renderJob.created_at,
      started_at: renderJob.started_at,
      completed_at: renderJob.completed_at,
      project: renderJob.projects,
    }, { status: 200 });

  } catch (error: any) {
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