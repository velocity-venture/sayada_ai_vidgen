-- Location: supabase/migrations/20260106235900_social_media_export.sql
-- Schema Analysis: Extending existing schema with social media export functionality
-- Integration Type: Addition
-- Dependencies: projects, user_profiles

-- 1. Types
CREATE TYPE public.social_platform AS ENUM ('youtube', 'instagram', 'facebook', 'twitter');
CREATE TYPE public.export_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled');

-- 2. Core Tables
CREATE TABLE public.scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    platform public.social_platform NOT NULL,
    caption TEXT NOT NULL,
    hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
    scheduled_time TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC'::TEXT,
    status public.export_status DEFAULT 'draft'::public.export_status,
    thumbnail_url TEXT,
    youtube_category TEXT,
    instagram_feed_type TEXT,
    facebook_page_id TEXT,
    twitter_is_thread BOOLEAN DEFAULT false,
    recurring_pattern TEXT,
    optimal_posting_time BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_post_id UUID NOT NULL REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    platform public.social_platform NOT NULL,
    status public.export_status NOT NULL,
    published_at TIMESTAMPTZ,
    post_url TEXT,
    error_message TEXT,
    engagement_metrics JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX idx_scheduled_posts_project_id ON public.scheduled_posts(project_id);
CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON public.scheduled_posts(scheduled_time);
CREATE INDEX idx_scheduled_posts_platform ON public.scheduled_posts(platform);
CREATE INDEX idx_export_history_scheduled_post_id ON public.export_history(scheduled_post_id);
CREATE INDEX idx_export_history_project_id ON public.export_history(project_id);
CREATE INDEX idx_export_history_user_id ON public.export_history(user_id);
CREATE INDEX idx_export_history_platform ON public.export_history(platform);

-- 4. Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "users_manage_own_scheduled_posts"
ON public.scheduled_posts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_export_history"
ON public.export_history
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Triggers
CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON public.scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Mock Data
DO $$
DECLARE
    existing_project_id UUID;
    existing_user_id UUID;
    scheduled_post1_id UUID := gen_random_uuid();
    scheduled_post2_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO existing_project_id FROM public.projects WHERE status = 'completed'::public.project_status LIMIT 1;
    SELECT user_id INTO existing_user_id FROM public.projects WHERE id = existing_project_id LIMIT 1;
    
    IF existing_project_id IS NOT NULL AND existing_user_id IS NOT NULL THEN
        INSERT INTO public.scheduled_posts (
            id, project_id, user_id, platform, caption, hashtags, 
            scheduled_time, status, thumbnail_url
        ) VALUES
            (
                scheduled_post1_id,
                existing_project_id,
                existing_user_id,
                'youtube'::public.social_platform,
                'Discover the profound truth of John 3:16 in this beautifully crafted video scripture message. Perfect for daily inspiration and spiritual growth.',
                ARRAY['scripture', 'faith', 'inspiration', 'John316', 'BibleVerse'],
                NOW() + INTERVAL '2 days',
                'scheduled'::public.export_status,
                'https://example.com/thumbnails/john316.jpg'
            ),
            (
                scheduled_post2_id,
                existing_project_id,
                existing_user_id,
                'instagram'::public.social_platform,
                'For God so loved the world... ✨ Share this powerful message with someone who needs hope today.',
                ARRAY['faith', 'hope', 'scripture', 'dailyverse', 'inspiration'],
                NOW() + INTERVAL '1 day',
                'scheduled'::public.export_status,
                'https://example.com/thumbnails/john316-instagram.jpg'
            );

        INSERT INTO public.export_history (
            scheduled_post_id, project_id, user_id, platform, status, 
            published_at, post_url, engagement_metrics
        ) VALUES
            (
                scheduled_post1_id,
                existing_project_id,
                existing_user_id,
                'youtube'::public.social_platform,
                'published'::public.export_status,
                NOW() - INTERVAL '3 days',
                'https://youtube.com/watch?v=example123',
                '{"views": 1500, "likes": 230, "comments": 45, "shares": 67}'::JSONB
            );
    END IF;
END $$;