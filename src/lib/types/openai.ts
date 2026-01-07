// API Response Types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    isInternal: boolean;
    statusCode: number;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Chat Completion Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  verbosity?: 'low' | 'medium' | 'high';
  max_completion_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  message: string;
}

// Scripture Analysis Types
export interface ScriptureAnalysisRequest {
  scriptureText: string;
  videoDuration: number;
  stylePreset: string;
}

export interface VideoScene {
  sceneNumber: number;
  description: string;
  pikaPrompt: string;
  duration: number;
  visualElements: string[];
  mood: string;
  cameraMovement: string;
}

export interface ScriptureAnalysisResponse {
  scenes: VideoScene[];
  totalScenes: number;
  estimatedDuration: number;
  styleApplied: string;
  optimizationNotes: string[];
}

// Structured Output Types
export interface StructuredOutputRequest {
  messages: ChatMessage[];
  schema?: Record<string, any>;
  schemaName?: string;
}

export interface StructuredOutputResponse<T = any> {
  data: T;
}

/**
 * Request payload for content analysis API
 */
export interface ContentAnalysisRequest {
  contentText: string;
  videoDuration: number;
  stylePreset?: string;
}

/**
 * Individual video scene structure
 */
export interface VideoScene {
  sceneNumber: number;
  description: string;
  pikaPrompt: string;
  duration: number;
  visualElements: string[];
  mood: string;
  cameraMovement: string;
}

/**
 * Content analysis metadata
 */
export interface ContentAnalysis {
  sentiment: string;
  topic: string;
  recommendedTemplate: string;
}

/**
 * Response from content analysis API
 */
export interface ContentAnalysisResponse {
  scenes: VideoScene[];
  totalScenes: number;
  estimatedDuration: number;
  styleApplied: string;
  contentAnalysis: ContentAnalysis;
  optimizationNotes: string[];
}

// Legacy types for backward compatibility (deprecated)
export type ScriptureAnalysisRequest = ContentAnalysisRequest;
export type ScriptureAnalysisResponse = ContentAnalysisResponse;

// Assistant Types
export interface AssistantCreateRequest {
  name: string;
  instructions: string;
}

export interface AssistantInteractRequest {
  assistantId: string;
  threadId: string;
  message: string;
}

// Whisper Transcription Types
export interface WhisperTranscriptionRequest {
  audioFile: File;
  language?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  timestamp_granularities?: ('word' | 'segment')[];
}

export interface WhisperTranscriptionResponse {
  text: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  language?: string;
  duration?: number;
}