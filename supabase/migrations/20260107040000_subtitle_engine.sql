-- Add subtitle configuration columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS subtitles_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS subtitle_style text DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS subtitle_url text,
ADD COLUMN IF NOT EXISTS subtitle_segments jsonb;

-- Create index for subtitle queries
CREATE INDEX IF NOT EXISTS idx_projects_subtitles_enabled 
ON public.projects(subtitles_enabled) 
WHERE subtitles_enabled = true;

-- Add comments
COMMENT ON COLUMN public.projects.subtitles_enabled IS 'Whether subtitles are enabled for this project';
COMMENT ON COLUMN public.projects.subtitle_style IS 'Subtitle style: auto, cinematic, impact, or minimal';
COMMENT ON COLUMN public.projects.subtitle_url IS 'URL to the generated subtitle file (SRT/ASS)';
COMMENT ON COLUMN public.projects.subtitle_segments IS 'JSON array of subtitle segments with timestamps and text';