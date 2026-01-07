-- =====================================================
-- MIGRATION: Universalize Video Templates
-- Description: Replace scripture-specific templates with universal promotional video archetypes
-- Date: 2026-01-07
-- =====================================================

-- Step 1: Convert category column to TEXT (remove dependency on enum)
ALTER TABLE video_templates 
  ALTER COLUMN category TYPE TEXT;

-- Step 2: Delete old scripture-specific templates WHILE category is TEXT
DELETE FROM video_templates 
WHERE is_system_template = true 
  AND category IN ('devotional', 'testimony', 'prayer', 'worship', 'teaching', 'evangelism');

-- Step 3: Drop the old template_category enum type with CASCADE
DROP TYPE IF EXISTS template_category CASCADE;

-- Step 4: Create new universal template_category enum
CREATE TYPE template_category AS ENUM (
  'cinematic_story',
  'high_energy_promo', 
  'modern_minimalist'
);

-- Step 5: Convert category column back to the new enum type
-- This will only work if all remaining rows have valid new enum values
ALTER TABLE video_templates 
  ALTER COLUMN category TYPE template_category 
  USING category::template_category;

-- Step 6: Insert universal template archetypes
INSERT INTO video_templates (
  name,
  category,
  description,
  duration_seconds,
  style_preset,
  is_system_template
) VALUES 
(
  'Cinematic Story',
  'cinematic_story',
  'Slow pacing, orchestral music, and serif fonts create an emotional, narrative-driven experience perfect for storytelling and testimonials.',
  60,
  'Photorealistic Cinematic',
  true
),
(
  'High Energy Promo',
  'high_energy_promo',
  'Fast cuts, upbeat electronic music, and bold sans-serif fonts deliver an energetic, attention-grabbing promotional video.',
  30,
  'Photorealistic Cinematic',
  true
),
(
  'Modern Minimalist',
  'modern_minimalist',
  'Clean lines, ambient audio, and neutral fonts provide a sleek, professional aesthetic ideal for product demos and corporate content.',
  45,
  'Photorealistic Cinematic',
  true
);

-- Step 7: Add comment to track migration purpose
COMMENT ON TABLE video_templates IS 'Universal video template system supporting any industry (Real Estate, Tech, Personal, etc.)';