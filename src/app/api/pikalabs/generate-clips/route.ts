import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateProjectClips } from '@/services/pikaLabsService';
import { scriptureAnalysisService } from '@/services/scriptureAnalysisService';

/**
 * Pika Labs Multi-Scene Clip Generation API
 * 
 * POST /api/pikalabs/generate-clips
 * 
 * Orchestrates scene-based video generation to match 30-60s audio duration
 */

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            isInternal: false,
            statusCode: 401
          }
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Project ID is required',
            isInternal: false,
            statusCode: 400
          }
        },
        { status: 400 }
      );
    }

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Project not found',
            isInternal: false,
            statusCode: 404
          }
        },
        { status: 404 }
      );
    }

    // Validate audio has been generated
    if (!project.audio_url || !project.audio_duration_seconds) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Audio must be generated before creating video clips',
            isInternal: false,
            statusCode: 400
          }
        },
        { status: 400 }
      );
    }

    // Generate scripture analysis to get scenes
    const analysisResponse = await scriptureAnalysisService.analyzeScripture({
      scriptureText: project.script_content,
      videoDuration: project.audio_duration_seconds,
      stylePreset: project.style_preset
    });

    if (!analysisResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: analysisResponse.error.message,
            isInternal: analysisResponse.error.isInternal,
            statusCode: 500
          }
        },
        { status: 500 }
      );
    }

    const scenes = analysisResponse.data.scenes;

    // Generate clips for all scenes
    const clipResult = await generateProjectClips(
      projectId,
      scenes,
      project.audio_duration_seconds
    );

    if (!clipResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: clipResult.error || 'Clip generation failed',
            isInternal: true,
            statusCode: 500
          }
        },
        { status: 500 }
      );
    }

    // Update project status to processing
    await supabase
      .from('projects')
      .update({ status: 'processing' })
      .eq('id', projectId)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        projectId: projectId,
        totalScenes: scenes.length,
        message: `Generating ${scenes.length} video clips to match ${project.audio_duration_seconds}s audio`
      }
    });
  } catch (error) {
    console.error('Pika Labs clip generation API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          isInternal: true,
          statusCode: 500
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pikalabs/generate-clips?projectId=xxx
 * 
 * Get clip generation progress
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
            isInternal: false,
            statusCode: 401
          }
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Project ID is required',
            isInternal: false,
            statusCode: 400
          }
        },
        { status: 400 }
      );
    }

    // Fetch clips for project
    const { data: clips, error: clipsError } = await supabase
      .from('clips')
      .select('*')
      .eq('project_id', projectId)
      .order('scene_index', { ascending: true });

    if (clipsError) {
      throw new Error(`Failed to fetch clips: ${clipsError.message}`);
    }

    // Calculate progress
    const progress = {
      total: clips?.length || 0,
      completed: clips?.filter(c => c.status === 'completed').length || 0,
      generating: clips?.filter(c => c.status === 'generating').length || 0,
      failed: clips?.filter(c => c.status === 'failed').length || 0,
      pending: clips?.filter(c => c.status === 'pending').length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        clips: clips || [],
        progress: progress
      }
    });
  } catch (error) {
    console.error('Clip progress API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          isInternal: true,
          statusCode: 500
        }
      },
      { status: 500 }
    );
  }
}