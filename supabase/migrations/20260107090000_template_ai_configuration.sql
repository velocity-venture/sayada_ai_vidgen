-- Location: supabase/migrations/20260107090000_template_ai_configuration.sql
-- Schema Analysis: video_templates table exists with basic configuration
-- Integration Type: Extension (adding AI provider-specific configuration)
-- Dependencies: video_templates table, user_profiles table

-- Add AI configuration columns to existing video_templates table
ALTER TABLE public.video_templates
ADD COLUMN elevenlabs_voice_id TEXT DEFAULT NULL,
ADD COLUMN pika_style_prompt TEXT DEFAULT NULL,
ADD COLUMN pika_negative_prompt TEXT DEFAULT NULL,
ADD COLUMN motion_strength INTEGER DEFAULT 2 CHECK (motion_strength >= 1 AND motion_strength <= 4);

-- Add indexes for new columns
CREATE INDEX idx_video_templates_elevenlabs_voice_id ON public.video_templates(elevenlabs_voice_id) WHERE elevenlabs_voice_id IS NOT NULL;
CREATE INDEX idx_video_templates_motion_strength ON public.video_templates(motion_strength);

-- Add comments for documentation
COMMENT ON COLUMN public.video_templates.elevenlabs_voice_id IS 'Specific ElevenLabs Voice ID for this template';
COMMENT ON COLUMN public.video_templates.pika_style_prompt IS 'Base visual style prompt for Pika Labs generation';
COMMENT ON COLUMN public.video_templates.pika_negative_prompt IS 'What to avoid in Pika Labs generation';
COMMENT ON COLUMN public.video_templates.motion_strength IS 'Pika Labs motion parameter (1=Low, 2=Medium, 3=High, 4=Very High)';

-- Update existing system templates with AI configuration
DO $$
BEGIN
    -- Cinematic Story template
    UPDATE public.video_templates
    SET 
        elevenlabs_voice_id = 'deep_male_narrator',
        pika_style_prompt = 'Cinematic lighting, 8k resolution, photorealistic, slow camera movement, golden hour, highly detailed, shallow depth of field',
        pika_negative_prompt = 'cartoon, anime, blurry, distorted, low quality, pixelated, fast motion',
        motion_strength = 1
    WHERE category = 'cinematic_story'::public.template_category
    AND is_system_template = true;

    -- High Energy Promo template
    UPDATE public.video_templates
    SET 
        elevenlabs_voice_id = 'energetic_female_announcer',
        pika_style_prompt = 'Fast motion, dynamic camera angles, bright lighting, vibrant colors, high energy, professional cinematography',
        pika_negative_prompt = 'slow motion, dark, dull colors, static camera, low energy',
        motion_strength = 4
    WHERE category = 'high_energy_promo'::public.template_category
    AND is_system_template = true;

    -- Modern Minimalist template (if exists)
    UPDATE public.video_templates
    SET 
        elevenlabs_voice_id = 'professional_neutral',
        pika_style_prompt = 'Clean composition, minimal distractions, soft lighting, modern aesthetic, steady camera, professional grade',
        pika_negative_prompt = 'cluttered, chaotic, harsh lighting, amateur',
        motion_strength = 2
    WHERE category = 'modern_minimalist'::public.template_category
    AND is_system_template = true;

END $$;