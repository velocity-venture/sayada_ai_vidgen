-- Migration: Add Aspect Ratio Support
-- Description: Adds aspect_ratio field to projects table for multi-format video support

-- Add aspect_ratio column to projects table
ALTER TABLE projects
ADD COLUMN aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1'));

-- Add index for aspect ratio queries
CREATE INDEX idx_projects_aspect_ratio ON projects(aspect_ratio);

-- Update existing projects to have default aspect ratio
UPDATE projects SET aspect_ratio = '16:9' WHERE aspect_ratio IS NULL;

-- Add comment
COMMENT ON COLUMN projects.aspect_ratio IS 'Video aspect ratio format: 16:9 (landscape/YouTube), 9:16 (vertical/TikTok), 1:1 (square/Instagram)';