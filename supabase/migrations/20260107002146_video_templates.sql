-- Location: supabase/migrations/20260107002146_video_templates.sql
-- Schema Analysis: Existing tables - projects, user_profiles, clips
-- Integration Type: NEW_MODULE - Adding reusable video template system
-- Dependencies: projects, user_profiles

-- 1. Create ENUM type for template categories
CREATE TYPE public.template_category AS ENUM (
    'devotional',
    'testimony',
    'prayer',
    'worship',
    'teaching',
    'evangelism'
);

-- 2. Create video_templates table
CREATE TABLE public.video_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category public.template_category NOT NULL,
    
    -- Pre-configured settings
    style_preset TEXT NOT NULL DEFAULT 'Photorealistic Cinematic',
    duration_seconds INTEGER NOT NULL,
    voice_id TEXT,
    
    -- Template metadata
    thumbnail_url TEXT,
    is_system_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX idx_video_templates_category ON public.video_templates(category);
CREATE INDEX idx_video_templates_created_by ON public.video_templates(created_by);
CREATE INDEX idx_video_templates_is_system ON public.video_templates(is_system_template);

-- 4. Enable RLS
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Allow everyone to view system templates
CREATE POLICY "anyone_can_view_system_templates"
ON public.video_templates
FOR SELECT
USING (is_system_template = true);

-- Users can view their own custom templates
CREATE POLICY "users_view_own_templates"
ON public.video_templates
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Users can create their own templates
CREATE POLICY "users_create_own_templates"
ON public.video_templates
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Users can update their own templates
CREATE POLICY "users_update_own_templates"
ON public.video_templates
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Users can delete their own templates
CREATE POLICY "users_delete_own_templates"
ON public.video_templates
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 6. Create trigger for updated_at
CREATE TRIGGER update_video_templates_updated_at
    BEFORE UPDATE ON public.video_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Add mock data - System templates for common scripture types
DO $$
BEGIN
    INSERT INTO public.video_templates (
        name, 
        description, 
        category, 
        style_preset, 
        duration_seconds, 
        voice_id, 
        is_system_template
    ) VALUES
        (
            'Daily Devotional',
            'Perfect for short, inspirational daily devotionals with uplifting visuals',
            'devotional'::public.template_category,
            'Photorealistic Cinematic',
            45,
            NULL,
            true
        ),
        (
            'Extended Teaching',
            'Longer format for in-depth Bible teaching and exposition',
            'teaching'::public.template_category,
            'Photorealistic Cinematic',
            180,
            NULL,
            true
        ),
        (
            'Personal Testimony',
            'Share powerful personal testimonies with emotional visual storytelling',
            'testimony'::public.template_category,
            'Photorealistic Cinematic',
            90,
            NULL,
            true
        ),
        (
            'Prayer Guide',
            'Peaceful prayer sessions with calming visuals',
            'prayer'::public.template_category,
            'Photorealistic Cinematic',
            60,
            NULL,
            true
        ),
        (
            'Worship Lyrics',
            'Display worship song lyrics with beautiful backgrounds',
            'worship'::public.template_category,
            'Photorealistic Cinematic',
            120,
            NULL,
            true
        ),
        (
            'Evangelism Message',
            'Clear gospel presentation with compelling visuals',
            'evangelism'::public.template_category,
            'Photorealistic Cinematic',
            75,
            NULL,
            true
        );
END $$;