
/**
 * Enhanced Pika Labs Service for AI Director Pipeline
 * 
 * Uses Fal.ai to generate videos via Pika Labs
 * Provides real API integration with photorealistic style enforcement
 */

export interface PikaGenerationOptions {
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  durationSeconds: number;
  sceneIndex: number;
}

export interface SceneVideoResult {
  sceneIndex: number;
  videoUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Generate photorealistic video for a single scene using Fal.ai (Pika Labs)
 * Enforces cinematic, photorealistic style defaults
 */
export async function generateSceneVideo(
  options: PikaGenerationOptions
): Promise<SceneVideoResult> {
  try {
    // Validate API key
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      throw new Error('FAL_KEY environment variable is not set');
    }

    // Enhance prompt with photorealistic constraints
    const enhancedPrompt = `Cinematic, photorealistic, 8k quality, professional lighting, ${options.prompt}`;
    
    // Map aspect ratio to Fal.ai format
    const aspectRatio = options.aspectRatio === '16:9' ? '16:9' : 
                       options.aspectRatio === '9:16' ? '9:16' : 
                       '1:1';

    console.log(`Generating video for scene ${options.sceneIndex} with Fal.ai...`);
    console.log(`Prompt: ${enhancedPrompt}`);
    console.log(`Aspect Ratio: ${aspectRatio}`);

    // Use Fal.ai REST API to generate video
    // Model: fal-ai/pika/v2.2/text-to-video or fal-ai/fast-svd
    const modelEndpoint = 'https://queue.fal.run/fal-ai/pika/v2.2/text-to-video';
    
    // Submit job to queue
    const submitResponse = await fetch(modelEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        aspect_ratio: aspectRatio,
        // Additional parameters can be added here if supported by the model
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Fal.ai API error: ${submitResponse.status} - ${errorText}`);
    }

    const submitResult = await submitResponse.json();
    const requestId = submitResult.request_id;

    if (!requestId) {
      throw new Error('Failed to get request ID from Fal.ai');
    }

    // Poll for result
    const statusEndpoint = `https://queue.fal.run/fal-ai/pika/v2.2/text-to-video/requests/${requestId}/status`;
    let videoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 120; // Max 2 minutes (120 * 1s)
    
    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      
      const statusResponse = await fetch(statusEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${falKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check status: ${statusResponse.status}`);
      }

      const statusResult = await statusResponse.json();
      
      if (statusResult.status === 'COMPLETED') {
        // Extract video URL from response
        // Fal.ai typically returns video URL in the output.video field
        if (statusResult.output?.video) {
          videoUrl = typeof statusResult.output.video === 'string' 
            ? statusResult.output.video 
            : statusResult.output.video.url;
        } else if (statusResult.video) {
          videoUrl = typeof statusResult.video === 'string' 
            ? statusResult.video 
            : statusResult.video.url;
        } else {
          throw new Error('Video URL not found in Fal.ai response: ' + JSON.stringify(statusResult));
        }
        break;
      } else if (statusResult.status === 'FAILED') {
        throw new Error(`Video generation failed: ${statusResult.error?.message || 'Unknown error'}`);
      }
      
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out after maximum attempts');
    }

    console.log(`Video generated successfully for scene ${options.sceneIndex}: ${videoUrl}`);

    return {
      sceneIndex: options.sceneIndex,
      videoUrl: videoUrl,
      success: true
    };
  } catch (error) {
    console.error(`Scene ${options.sceneIndex} video generation failed:`, error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
      ? error
      : 'Video generation failed';
    
    return {
      sceneIndex: options.sceneIndex,
      videoUrl: '',
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Generate videos for multiple scenes in parallel
 * Returns array of results in scene order
 */
export async function generateMultiSceneVideos(
  scenes: Array<{
    prompt: string;
    index: number;
    duration: number;
  }>,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<SceneVideoResult[]> {
  const videoPromises = scenes.map(scene =>
    generateSceneVideo({
      prompt: scene.prompt,
      aspectRatio: aspectRatio,
      durationSeconds: scene.duration,
      sceneIndex: scene.index
    })
  );

  const results = await Promise.all(videoPromises);
  
  // Sort by scene index to maintain order
  return results.sort((a, b) => a.sceneIndex - b.sceneIndex);
}

// ...existing code...