-- =============================================
-- Migration: Advanced Template Configuration (AI Mapping)
-- Description: Add ElevenLabs Voice IDs and Pika Parameters to video_templates
-- Author: AI Director Team
-- Date: 2026-01-07
-- =============================================

-- Add AI configuration columns to video_templates
ALTER TABLE public.video_templates
ADD COLUMN IF NOT EXISTS elevenlabs_voice_id TEXT,
ADD COLUMN IF NOT EXISTS pika_style_prompt TEXT,
ADD COLUMN IF NOT EXISTS pika_negative_prompt TEXT,
ADD COLUMN IF NOT EXISTS motion_strength INTEGER CHECK (motion_strength BETWEEN 1 AND 4);

-- Add comments for documentation
COMMENT ON COLUMN public.video_templates.elevenlabs_voice_id IS 'Specific ElevenLabs Voice ID for this template';
COMMENT ON COLUMN public.video_templates.pika_style_prompt IS 'Base visual style prompt for Pika Labs (e.g., "Cinematic lighting, 8k, photorealistic")';
COMMENT ON COLUMN public.video_templates.pika_negative_prompt IS 'What to avoid in Pika generation (e.g., "cartoon, blurry, distorted")';
COMMENT ON COLUMN public.video_templates.motion_strength IS 'Pika Labs motion strength: 1=Low, 2=Medium, 3=High, 4=Very High';

-- Update existing system templates with default AI configuration
UPDATE public.video_templates
SET 
  elevenlabs_voice_id = 'rachel',
  pika_style_prompt = 'Cinematic lighting, 8k resolution, photorealistic, slow motion, golden hour',
  pika_negative_prompt = 'cartoon, anime, blurry, distorted, low quality',
  motion_strength = 2
WHERE category = 'cinematic_story' AND is_system_template = true;

UPDATE public.video_templates
SET 
  elevenlabs_voice_id = 'bella',
  pika_style_prompt = 'Fast motion, dynamic camera angles, bright lighting, vibrant colors, high energy',
  pika_negative_prompt = 'slow, static, dull, low energy, boring',
  motion_strength = 4
WHERE category = 'high_energy_promo' AND is_system_template = true;

UPDATE public.video_templates
SET 
  elevenlabs_voice_id = 'adam',
  pika_style_prompt = 'Clean composition, minimal distractions, soft lighting, modern aesthetic, professional grade',
  pika_negative_prompt = 'cluttered, chaotic, messy, unprofessional',
  motion_strength = 1
WHERE category = 'modern_minimalist' AND is_system_template = true;

-- Create index for voice ID lookups
CREATE INDEX IF NOT EXISTS idx_video_templates_voice_id 
ON public.video_templates(elevenlabs_voice_id);