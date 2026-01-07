'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/common/Header';
import WorkflowProgress from '@/components/common/WorkflowProgress';
import ProjectContextHeader from '@/components/common/ProjectContextHeader';
import StatusNotification, { Notification } from '@/components/common/StatusNotification';
import ScriptInputSection from './ScriptInputSection';
import VoiceSelectionCard from './VoiceSelectionCard';
import VideoStyleSelector from './VideoStyleSelector';
import DurationSettings from './DurationSettings';
import ScriptAnalysisPreview from './ScriptAnalysisPreview';
import AdvancedSettings from './AdvancedSettings';
import GenerationCostCard from './GenerationCostCard';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/services/projectService';
import { videoTemplateService } from '@/services/videoTemplateService';
import { supabase } from '@/lib/supabase/client';
import type { VideoTemplate } from '@/types/models';
import TemplateSelector from './TemplateSelector';
import StatusLogPanel from './StatusLogPanel';

interface AdvancedSettingsState {
  audioSpeed: number;
  transitionStyle: string;
  sceneTransitionDuration: number;
  backgroundMusic: boolean;
  subtitles: boolean;
}

interface StatusUpdate {
  stage: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function VideoCreationInteractive() {
  const router = useRouter();
  const { user } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('voice-1');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic Cinematic');
  const [videoDuration, setVideoDuration] = useState(45);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettingsState>({
    audioSpeed: 1.0,
    transitionStyle: 'fade',
    sceneTransitionDuration: 1.0,
    backgroundMusic: false,
    subtitles: true
  });

  // Template state
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Generation state
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [showStatusLog, setShowStatusLog] = useState(false);

  // Read template params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
    const stylePreset = params.get('stylePreset');
    const duration = params.get('duration');
    const voiceId = params.get('voiceId');

    if (templateId) {
      setSelectedTemplateId(templateId);
    }

    if (stylePreset) {
      setSelectedStyle(stylePreset);
    }

    if (duration) {
      setVideoDuration(parseInt(duration));
    }

    if (voiceId) {
      setSelectedVoice(voiceId);
    }
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load templates on mount
  useEffect(() => {
    if (isHydrated) {
      loadTemplates();
    }
  }, [isHydrated]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const fetchedTemplates = await videoTemplateService.getSystemTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Load Templates',
        message: 'Could not fetch video templates. Please refresh the page.',
        duration: 4000
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Subscribe to real-time updates when job starts
  useEffect(() => {
    if (!projectId || !jobId) return;

    // Subscribe to projects table for status updates
    const projectsChannel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          const newStatus = payload.new?.status;
          
          if (newStatus === 'processing') {
            addStatusUpdate({
              stage: 'AI Processing',
              message: 'Creating script with OpenAI...',
              timestamp: new Date(),
              status: 'processing'
            });
          } else if (newStatus === 'completed') {
            addStatusUpdate({
              stage: 'Complete',
              message: 'Video generation completed!',
              timestamp: new Date(),
              status: 'completed'
            });
            
            addNotification({
              type: 'success',
              title: 'Video Generated',
              message: 'Your video has been successfully created!',
              duration: 5000
            });
            
            // Redirect to preview
            setTimeout(() => {
              router.push(`/video-preview?projectId=${projectId}`);
            }, 2000);
          } else if (newStatus === 'failed') {
            addStatusUpdate({
              stage: 'Failed',
              message: 'Video generation failed. Please try again.',
              timestamp: new Date(),
              status: 'failed'
            });
          }
        }
      )
      .subscribe();

    // Subscribe to social_render_queue for detailed progress
    const queueChannel = supabase
      .channel(`queue-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_render_queue',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const queueStatus = payload.new?.status;
          
          if (queueStatus === 'processing') {
            addStatusUpdate({
              stage: 'Video Rendering',
              message: 'Generating visuals with Pika Labs...',
              timestamp: new Date(),
              status: 'processing'
            });
          } else if (queueStatus === 'completed') {
            addStatusUpdate({
              stage: 'Final Stitching',
              message: 'Stitching final video with FFmpeg...',
              timestamp: new Date(),
              status: 'processing'
            });
          }
        }
      )
      .subscribe();

    return () => {
      projectsChannel.unsubscribe();
      queueChannel.unsubscribe();
    };
  }, [projectId, jobId]);

  const addStatusUpdate = (update: StatusUpdate) => {
    setStatusUpdates(prev => [...prev, update]);
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Project title is required');
    }

    if (!scriptText.trim()) {
      errors.push('Scripture text is required');
    } else if (scriptText.trim().length < 50) {
      errors.push('Scripture text must be at least 50 characters');
    }

    if (!selectedStyle.trim()) {
      errors.push('Video style preset is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      setSelectedTemplateId(templateId);
      const templateConfig = await videoTemplateService.applyTemplateToProject(templateId);
      
      // Apply template settings
      setSelectedStyle(templateConfig.stylePreset);
      setVideoDuration(templateConfig.durationSeconds);
      if (templateConfig.voiceId) {
        setSelectedVoice(templateConfig.voiceId);
      }

      addNotification({
        type: 'success',
        title: 'Template Applied',
        message: 'Template settings have been configured.',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Template Error',
        message: error instanceof Error ? error.message : 'Failed to apply template',
        duration: 4000
      });
    }
  };

  const handleSaveProject = async () => {
    if (!isHydrated || !user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to save your project',
        duration: 3000
      });
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      addNotification({
        type: 'warning',
        title: 'Validation Error',
        message: validation.errors[0],
        duration: 3000
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const newProject = await projectService.createProject({
        userId: user.id,
        title: title.trim(),
        scriptContent: scriptText.trim(),
        status: 'draft',
        durationSeconds: videoDuration,
        stylePreset: selectedStyle
      });

      addNotification({
        type: 'success',
        title: 'Project Saved',
        message: 'Your video project has been saved as a draft',
        duration: 3000
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save project. Please try again.',
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!isHydrated || !user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to generate video',
        duration: 3000
      });
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: validation.errors[0],
        duration: 4000
      });
      return;
    }

    if (scriptText.trim().split(/\s+/).length < 20) {
      addNotification({
        type: 'warning',
        title: 'Script Too Short',
        message: 'Please provide at least 20 words for optimal video generation',
        duration: 4000
      });
      return;
    }

    setIsGenerating(true);
    setShowStatusLog(true);
    setStatusUpdates([]);

    try {
      // Initial status
      addStatusUpdate({
        stage: 'Initializing',
        message: 'Preparing video generation request...',
        timestamp: new Date(),
        status: 'processing'
      });

      // Call the /api/v1/generate endpoint
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY || 'demo-key'}`
        },
        body: JSON.stringify({
          prompt: scriptText.trim(),
          template_id: selectedTemplateId,
          duration_mode: videoDuration >= 60 ? '60s' : '30s',
          voice_id: selectedVoice,
          aspect_ratio: '16:9',
          burn_subtitles: advancedSettings.subtitles
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Video generation failed');
      }

      // Store job and project IDs for real-time tracking
      setJobId(result.job_id);
      setProjectId(result.project_id);

      addStatusUpdate({
        stage: 'Queued',
        message: 'Video generation job queued successfully',
        timestamp: new Date(),
        status: 'completed'
      });

      addNotification({
        type: 'success',
        title: 'Generation Started',
        message: 'AI Director is orchestrating your video creation...',
        duration: 3000
      });

      // Start showing live status updates
      addStatusUpdate({
        stage: 'AI Director',
        message: 'Analyzing script and planning scenes...',
        timestamp: new Date(),
        status: 'processing'
      });

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to start video generation. Please try again.',
        duration: 4000
      });
      setIsGenerating(false);
      setShowStatusLog(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!isHydrated || !user) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to generate audio',
        duration: 3000
      });
      return;
    }

    if (!scriptText.trim() || scriptText.trim().length < 50) {
      addNotification({
        type: 'warning',
        title: 'Validation Error',
        message: 'Scripture text must be at least 50 characters',
        duration: 3000
      });
      return;
    }

    setIsGeneratingAudio(true);
    setAudioGenerationResult(null);

    addNotification({
      type: 'processing',
      title: 'Generating Audio',
      message: 'ElevenLabs is converting your scripture text to cinematic narration...',
      duration: 2000
    });

    try {
      // First, save the project to get a project ID
      let projectId = '';
      
      const newProject = await projectService.createProject({
        userId: user.id,
        title: title.trim() || 'Untitled Project',
        scriptContent: scriptText.trim(),
        status: 'draft',
        durationSeconds: videoDuration,
        stylePreset: selectedStyle
      });

      projectId = newProject.id;

      // Generate audio
      const response = await fetch('/api/elevenlabs/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId,
          scriptureText: scriptText.trim(),
          voiceId: selectedVoice,
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setAudioGenerationResult({
          audioUrl: result.data.audioUrl,
          audioDuration: result.data.audioDuration
        });

        addNotification({
          type: 'success',
          title: 'Audio Generated',
          message: `Cinematic narration created successfully (${result.data.audioDuration}s)`,
          duration: 3000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Audio Generation Failed',
          message: result.error.message,
          duration: 4000
        });

        if (!result.error.isInternal) {
          console.error('Audio generation error:', result.error.message);
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Audio Generation Error',
        message: 'Failed to generate audio. Please try again.',
        duration: 4000
      });
      console.error('Audio generation error:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const calculateSceneCount = () => {
    if (!scriptText.trim()) return 0;
    const wordCount = scriptText.trim().split(/\s+/).length;
    return Math.min(4, Math.max(3, Math.ceil(wordCount / 50)));
  };

  const isFormValid = title.trim().length > 0 && scriptText.trim().length >= 50 && selectedStyle.trim().length > 0;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />
        <WorkflowProgress />
        <div className="pt-32 pb-12 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <WorkflowProgress />
      <ProjectContextHeader
        projectTitle={title || "New Video Project"}
        projectStatus="draft"
        onSave={handleSaveProject}
        showBackButton={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Template Notification */}
        {selectedTemplateId && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200">
              ✅ Template applied! Settings have been pre-configured.
              <a
                href="/video-templates"
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                Browse more templates
              </a>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Title Input */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
              <label htmlFor="project-title" className="block font-caption text-sm font-semibold text-foreground mb-2">
                Project Title *
              </label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., John 3:16 - Love of God"
                className="w-full px-4 py-3 bg-background border border-border rounded-md font-body text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-250"
                maxLength={100}
              />
              <p className="mt-2 font-caption text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            <TemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={handleTemplateSelect}
              loading={loadingTemplates}
            />

            <ScriptInputSection
              value={scriptText}
              onChange={setScriptText}
              maxCharacters={1000}
            />

            {/* NEW: Live Status Log Panel */}
            {showStatusLog && (
              <StatusLogPanel
                statusUpdates={statusUpdates}
                isVisible={showStatusLog}
              />
            )}

            {/* AI Analysis Section */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-caption text-lg font-semibold text-foreground mb-1">
                    AI Scripture Analysis
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Let AI analyze your scripture and generate optimized Pika Labs prompts
                  </p>
                </div>
                <button
                  onClick={handleAnalyzeScripture}
                  disabled={!scriptText.trim() || scriptText.trim().length < 50 || isAnalyzing}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md font-caption text-sm font-medium
                    transition-all duration-250
                    ${scriptText.trim().length >= 50 && !isAnalyzing
                      ? 'bg-primary text-primary-foreground hover:shadow-glow-strong'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="SparklesIcon" size={16} />
                      <span>Analyze Scripture</span>
                    </>
                  )}
                </button>
              </div>

              {analysisResult && (
                <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-start gap-3 mb-3">
                    <Icon name="CheckCircleIcon" size={20} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-caption text-sm font-semibold text-foreground mb-1">
                        Analysis Complete
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {analysisResult.totalScenes} scenes generated • {analysisResult.estimatedDuration}s total duration • {analysisResult.styleApplied}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {analysisResult.scenes.map((scene, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-md">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="font-caption text-xs font-semibold text-primary">
                            Scene {scene.sceneNumber}
                          </span>
                          <span className="font-caption text-xs text-muted-foreground">
                            {scene.duration}s • {scene.mood}
                          </span>
                        </div>
                        <p className="font-body text-xs text-foreground mb-2">
                          {scene.description}
                        </p>
                        <div className="p-2 bg-background rounded border border-border">
                          <p className="font-caption text-xs font-medium text-foreground mb-1">
                            Pika Labs Prompt:
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {scene.pikaPrompt}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scene.visualElements.map((element, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-caption text-xs"
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {analysisResult.optimizationNotes.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="font-caption text-xs font-semibold text-blue-900 mb-2">
                        Optimization Notes:
                      </p>
                      <ul className="space-y-1">
                        {analysisResult.optimizationNotes.map((note, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Icon name="InformationCircleIcon" size={14} className="text-blue-600 shrink-0 mt-0.5" />
                            <span className="font-body text-xs text-blue-800">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!analysisResult && !isAnalyzing && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                  <div className="flex items-start gap-3">
                    <Icon name="LightBulbIcon" size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-caption text-sm font-medium text-foreground mb-1">
                        Why Analyze Your Scripture?
                      </p>
                      <ul className="space-y-1 font-body text-xs text-muted-foreground">
                        <li>• AI breaks down your text into optimal cinematic scenes</li>
                        <li>• Generates Pika Labs prompts with cinematography details</li>
                        <li>• Includes lighting, camera angles, and visual style specifications</li>
                        <li>• Ensures narrative flow and visual consistency</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Generation Section */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-caption text-lg font-semibold text-foreground mb-1">
                    Cinematic Audio Narration
                  </h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Generate professional narration with ElevenLabs emotive prosody
                  </p>
                </div>
                <button
                  onClick={handleGenerateAudio}
                  disabled={!scriptText.trim() || scriptText.trim().length < 50 || isGeneratingAudio}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md font-caption text-sm font-medium
                    transition-all duration-250
                    ${scriptText.trim().length >= 50 && !isGeneratingAudio
                      ? 'bg-primary text-primary-foreground hover:shadow-glow-strong'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }
                  `}
                >
                  {isGeneratingAudio ? (
                    <>
                      <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="SpeakerWaveIcon" size={16} />
                      <span>Generate Audio</span>
                    </>
                  )}
                </button>
              </div>

              {audioGenerationResult && (
                <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-start gap-3 mb-3">
                    <Icon name="CheckCircleIcon" size={20} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-caption text-sm font-semibold text-foreground mb-1">
                        Audio Generated Successfully
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Duration: {audioGenerationResult.audioDuration}s • Voice: {selectedVoice}
                      </p>
                    </div>
                  </div>

                  {audioGenerationResult.audioUrl && (
                    <div className="mt-3">
                      <audio
                        controls
                        src={audioGenerationResult.audioUrl}
                        className="w-full"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              )}

              {!audioGenerationResult && !isGeneratingAudio && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                  <div className="flex items-start gap-3">
                    <Icon name="InformationCircleIcon" size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-caption text-sm font-medium text-foreground mb-1">
                        Why ElevenLabs?
                      </p>
                      <ul className="space-y-1 font-body text-xs text-muted-foreground">
                        <li>• Cinematic voice quality with emotional depth</li>
                        <li>• Emotive prosody for dramatic scripture delivery</li>
                        <li>• Voice cloning capability for custom narrators</li>
                        <li>• Precise duration matching for video synchronization</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VoiceSelectionCard
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
              />
              <DurationSettings
                duration={videoDuration}
                onDurationChange={setVideoDuration}
              />
            </div>

            <VideoStyleSelector
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
            />

            <ScriptAnalysisPreview
              scriptText={scriptText}
              videoDuration={videoDuration}
            />

            <AdvancedSettings
              settings={advancedSettings}
              onSettingsChange={setAdvancedSettings}
            />
          </div>

          {/* Right Column - Cost & Actions */}
          <div className="space-y-6">
            <GenerationCostCard
              scriptLength={scriptText.length}
              videoDuration={videoDuration}
              sceneCount={calculateSceneCount()}
            />

            {/* Action Buttons */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft sticky top-24">
              <button
                onClick={handleGenerateVideo}
                disabled={!isFormValid || isGenerating || !user || !selectedTemplateId}
                className={`
                  w-full flex items-center justify-center gap-3 px-6 py-4 rounded-md
                  font-caption text-base font-semibold transition-all duration-250
                  ${isFormValid && !isGenerating && user && selectedTemplateId
                    ? 'bg-primary text-primary-foreground hover:shadow-glow-strong focus-ring'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                {isGenerating ? (
                  <>
                    <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                    <span>AI Director Working...</span>
                  </>
                ) : (
                  <>
                    <Icon name="SparklesIcon" size={20} />
                    <span>Generate Video</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveProject}
                disabled={!isFormValid || isSaving || !user}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md mt-3 bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring font-caption text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Icon name="ArrowPathIcon" size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Icon name="BookmarkIcon" size={18} />
                    <span>Save as Draft</span>
                  </>
                )}
              </button>

              {!user && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-warning shrink-0 mt-0.5" />
                    <p className="font-caption text-xs text-warning">
                      Please sign in to save or generate videos
                    </p>
                  </div>
                </div>
              )}

              {user && !isFormValid && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-warning shrink-0 mt-0.5" />
                    <p className="font-caption text-xs text-warning">
                      {!title.trim() && 'Please enter a project title. '}
                      {!scriptText.trim() && 'Please enter scripture text. '}
                      {scriptText.trim() && scriptText.trim().length < 50 && 'Scripture text must be at least 50 characters. '}
                      {!selectedStyle.trim() && 'Please select a video style.'}
                    </p>
                  </div>
                </div>
              )}

              {!selectedTemplateId && isFormValid && user && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <Icon name="ExclamationTriangleIcon" size={16} className="text-warning shrink-0 mt-0.5" />
                    <p className="font-caption text-xs text-warning">
                      Please select a template to continue. Templates provide optimized AI settings for best results.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-caption text-sm font-semibold text-foreground mb-3">
                  What happens next?
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircleIcon" size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="font-caption text-xs text-muted-foreground">
                      OpenAI analyzes script and plans scenes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircleIcon" size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="font-caption text-xs text-muted-foreground">
                      ElevenLabs generates cinematic narration
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircleIcon" size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="font-caption text-xs text-muted-foreground">
                      Pika Labs creates scene visuals in parallel
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="CheckCircleIcon" size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="font-caption text-xs text-muted-foreground">
                      FFmpeg stitches final video automatically
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusNotification
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />
    </div>
  );
}

export default VideoCreationInteractive;