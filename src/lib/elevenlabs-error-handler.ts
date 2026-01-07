/**
 * ElevenLabs Error Handler
 * 
 * Centralized error handling for ElevenLabs API operations
 */

export class ElevenLabsError extends Error {
  public readonly statusCode?: number;
  public readonly isInternal: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      isInternal?: boolean;
      userMessage?: string;
    }
  ) {
    super(message);
    this.name = 'ElevenLabsError';
    this.statusCode = options?.statusCode;
    this.isInternal = options?.isInternal ?? false;
    this.userMessage = options?.userMessage ?? 'Audio generation failed. Please try again.';
  }
}

/**
 * Handle ElevenLabs API errors with user-friendly messages
 */
export function handleElevenLabsError(error: unknown): ElevenLabsError {
  // Handle ElevenLabs API errors
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    
    switch (statusCode) {
      case 401:
        return new ElevenLabsError('Invalid ElevenLabs API key', {
          statusCode: 401,
          isInternal: true,
          userMessage: 'Audio service authentication failed. Please contact support.'
        });
      
      case 429:
        return new ElevenLabsError('ElevenLabs rate limit exceeded', {
          statusCode: 429,
          isInternal: false,
          userMessage: 'Too many requests. Please try again in a few minutes.'
        });
      
      case 422:
        return new ElevenLabsError('Invalid audio generation parameters', {
          statusCode: 422,
          isInternal: false,
          userMessage: 'The provided text or voice settings are invalid.'
        });
      
      default:
        return new ElevenLabsError('ElevenLabs API error', {
          statusCode,
          isInternal: true,
          userMessage: 'Audio generation service error. Please try again.'
        });
    }
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new ElevenLabsError('Network error during audio generation', {
      isInternal: true,
      userMessage: 'Network connection failed. Please check your internet connection.'
    });
  }

  // Handle unknown errors
  return new ElevenLabsError(
    error instanceof Error ? error.message : 'Unknown audio generation error',
    {
      isInternal: true,
      userMessage: 'An unexpected error occurred. Please try again.'
    }
  );
}

/**
 * Retry logic for transient ElevenLabs errors
 */
export async function retryElevenLabsOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on client errors (4xx)
      const elevenLabsError = handleElevenLabsError(error);
      if (elevenLabsError.statusCode && elevenLabsError.statusCode >= 400 && elevenLabsError.statusCode < 500) {
        throw elevenLabsError;
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError ?? new Error('Operation failed after retries');
}