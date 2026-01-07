import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai-client';
import { handleOpenAIError } from '@/lib/openai-error-handler';
import { ApiResponse, WhisperTranscriptionResponse } from '@/lib/types/openai';

/**
 * POST /api/openai/transcribe
 * Transcribes audio using OpenAI Whisper with word-level timestamps
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          message: 'Audio file is required.',
          isInternal: false,
          statusCode: 400,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate file type (audio formats only)
    const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm'];
    if (!validAudioTypes.includes(audioFile.type)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          message: 'Invalid audio file format. Supported formats: mp3, wav, m4a, webm.',
          isInternal: false,
          statusCode: 400,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Use gpt-4o-transcribe for state-of-the-art transcription
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-transcribe',
      language: language || undefined,
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment'],
    });

    const successResponse: ApiResponse<WhisperTranscriptionResponse> = {
      success: true,
      data: {
        text: response.text,
        segments: response.segments?.map((seg: any) => ({
          id: seg.id,
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })),
        words: response.words?.map((word: any) => ({
          word: word.word,
          start: word.start,
          end: word.end,
        })),
        language: response.language,
        duration: response.duration,
      },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    const errorResponse = handleOpenAIError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}