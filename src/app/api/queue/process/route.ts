import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VideoCompositionService } from '@/services/videoCompositionService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Process video render from queue
 */
async function processRenderJob(jobId: string) {
  const startTime = Date.now();

  try {
    // Get job details with project info
    const { data: job, error: jobError } = await supabaseAdmin
      .from('social_render_queue')
      .select(`
        *,
        projects (
          id,
          title,
          script_content,
          style_preset,
          audio_url,
          subtitle_segments,
          subtitle_style,
          video_url
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Render job not found');
    }

    const project = job.projects as any;

    // Build FFmpeg command for video rendering
    const inputVideoPath = project.video_url || '/tmp/input_video.mp4';
    const outputPath = `/tmp/rendered_${jobId}.mp4`;
    const subtitlePath = project.subtitle_segments ? `/tmp/subtitles_${jobId}.srt` : undefined;

    const ffmpegCommand = VideoCompositionService.buildFFmpegRenderCommand(
      inputVideoPath,
      outputPath,
      job.aspect_ratio,
      job.burn_subtitles,
      subtitlePath,
      project.style_preset || 'Photorealistic Cinematic'
    );

    // In production, execute FFmpeg command here
    // For now, simulate processing
    console.log('FFmpeg Command:', ffmpegCommand);

    // Simulate video processing delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Upload to Supabase Storage
    const outputUrl = `https://storage.supabase.co/renders/${jobId}.mp4`;

    // Mark job as completed
    const processingTime = Math.floor((Date.now() - startTime) / 1000);
    await supabaseAdmin.rpc('complete_render_job', {
      job_uuid: jobId,
      output_video_url: outputUrl,
      processing_seconds: processingTime
    });

    // Update project with output URL
    await supabaseAdmin
      .from('projects')
      .update({
        video_url: outputUrl,
        status: 'completed'
      })
      .eq('id', project.id);

    // Send webhook if configured
    const { data: webhookDeliveries } = await supabaseAdmin
      .from('webhook_deliveries')
      .select(`
        *,
        webhook_configs (
          webhook_url,
          secret_key
        )
      `)
      .eq('project_id', project.id)
      .eq('status', 'pending');

    if (webhookDeliveries && webhookDeliveries.length > 0) {
      for (const delivery of webhookDeliveries) {
        const webhookConfig = delivery.webhook_configs as any;
        
        try {
          const webhookPayload = {
            job_id: jobId,
            project_id: project.id,
            status: 'completed',
            video_url: outputUrl,
            aspect_ratio: job.aspect_ratio,
            processing_time_seconds: processingTime,
            timestamp: new Date().toISOString()
          };

          const response = await fetch(webhookConfig.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'VidGen-Worker/1.0',
              'X-Webhook-Secret': webhookConfig.secret_key || ''
            },
            body: JSON.stringify(webhookPayload)
          });

          const responseBody = await response.text();

          // Update webhook delivery status
          await supabaseAdmin
            .from('webhook_deliveries')
            .update({
              status: response.ok ? 'sent' : 'failed',
              response_status: response.status,
              response_body: responseBody,
              sent_at: new Date().toISOString()
            })
            .eq('id', delivery.id);

        } catch (webhookError) {
          console.error('Webhook delivery failed:', webhookError);
          
          await supabaseAdmin
            .from('webhook_deliveries')
            .update({
              status: 'failed',
              response_body: webhookError instanceof Error ? webhookError.message : 'Webhook delivery failed',
              sent_at: new Date().toISOString()
            })
            .eq('id', delivery.id);
        }
      }
    }

    return { success: true, outputUrl };

  } catch (error) {
    console.error('Error processing render job:', error);
    
    // Mark job as failed
    await supabaseAdmin.rpc('fail_render_job', {
      job_uuid: jobId,
      error_msg: error instanceof Error ? error.message : 'Processing failed'
    });

    throw error;
  }
}

/**
 * POST /api/queue/process - Queue processor worker endpoint
 * This should be called by a cron job or background worker
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal/cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get next pending job from queue
    const { data: jobId, error: queueError } = await supabaseAdmin.rpc('get_next_render_job');

    if (queueError) {
      throw queueError;
    }

    if (!jobId) {
      return NextResponse.json({
        success: true,
        message: 'No pending jobs in queue',
        processed: false
      }, { status: 200 });
    }

    // Process the job
    const result = await processRenderJob(jobId);

    return NextResponse.json({
      success: true,
      message: 'Job processed successfully',
      job_id: jobId,
      output_url: result.outputUrl,
      processed: true
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Queue processing failed',
        error: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/queue/process - Get queue status
 */
export async function GET(request: NextRequest) {
  try {
    const { data: queueStats, error } = await supabaseAdmin
      .from('social_render_queue')
      .select('status', { count: 'exact' });

    if (error) throw error;

    const stats = {
      total: queueStats?.length || 0,
      pending: queueStats?.filter(j => j.status === 'pending').length || 0,
      processing: queueStats?.filter(j => j.status === 'processing').length || 0,
      completed: queueStats?.filter(j => j.status === 'completed').length || 0,
      failed: queueStats?.filter(j => j.status === 'failed').length || 0,
    };

    return NextResponse.json({
      success: true,
      queue_stats: stats
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get queue stats',
        error: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}