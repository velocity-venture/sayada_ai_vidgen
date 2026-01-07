-- Location: supabase/migrations/20260106222845_add_audio_fields.sql
-- Schema Analysis: Extending existing projects table with audio generation fields
-- Integration Type: Extension (adding audio functionality)
-- Dependencies: projects table

-- Add audio-related columns to existing projects table
ALTER TABLE public.projects
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_duration_seconds INTEGER,
ADD COLUMN voice_id TEXT,
ADD COLUMN audio_generated_at TIMESTAMPTZ;

-- Add index for audio queries
CREATE INDEX idx_projects_audio_generated ON public.projects(audio_generated_at) WHERE audio_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.audio_url IS 'Supabase Storage URL for generated narration audio';
COMMENT ON COLUMN public.projects.audio_duration_seconds IS 'Actual duration of generated audio in seconds';
COMMENT ON COLUMN public.projects.voice_id IS 'ElevenLabs voice ID used for narration';
COMMENT ON COLUMN public.projects.audio_generated_at IS 'Timestamp when audio was generated';