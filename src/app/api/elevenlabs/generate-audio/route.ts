import { NextRequest, NextResponse } from 'next/server';
import { generateNarrationAudio } from '@/services/audioGenerationService';
import { VoicePresetId } from '@/lib/elevenlabs-client';

/**
 * ElevenLabs Audio Generation API Route
 * 
 * POST /api/elevenlabs/generate-audio
 * 
 * Generates narration audio from scripture text using ElevenLabs TTS
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateAudioRequest {
  projectId: string;
  scriptureText: string;
  voiceId: VoicePresetId;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'ElevenLabs API key not configured',
            isInternal: true
          }
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: GenerateAudioRequest = await request.json();

    // Validate required fields
    if (!body.projectId || !body.scriptureText || !body.voiceId || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields: projectId, scriptureText, voiceId, userId',
            isInternal: false
          }
        },
        { status: 400 }
      );
    }

    // Validate scripture text length
    if (body.scriptureText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Scripture text must be at least 50 characters',
            isInternal: false
          }
        },
        { status: 400 }
      );
    }

    // Generate audio
    const result = await generateNarrationAudio({
      projectId: body.projectId,
      scriptureText: body.scriptureText,
      voiceId: body.voiceId,
      userId: body.userId
    });

    // Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          audioUrl: result.audioUrl,
          audioDuration: result.audioDuration
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: result.error?.isInternal ? 500 : 400 }
      );
    }
  } catch (error) {
    console.error('Audio generation API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred during audio generation',
          isInternal: true
        }
      },
      { status: 500 }
    );
  }
}