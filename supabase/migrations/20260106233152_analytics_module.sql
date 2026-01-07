-- Location: supabase/migrations/20260106233152_analytics_module.sql
-- Schema Analysis: Extends existing projects table with analytics tracking
-- Integration Type: Addition - New analytics module
-- Dependencies: projects, user_profiles tables

-- 1. Create ENUM types for analytics
CREATE TYPE public.engagement_event_type AS ENUM ('view', 'like', 'share', 'download', 'comment');

-- 2. Create video_analytics table for aggregated metrics
CREATE TABLE public.video_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    average_watch_time_seconds INTEGER DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_analytics UNIQUE(project_id)
);

-- 3. Create video_engagement_events for detailed tracking
CREATE TABLE public.video_engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    event_type public.engagement_event_type NOT NULL,
    event_metadata JSONB,
    watch_duration_seconds INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance
CREATE INDEX idx_video_analytics_project_id ON public.video_analytics(project_id);
CREATE INDEX idx_video_analytics_performance_score ON public.video_analytics(performance_score DESC);
CREATE INDEX idx_video_analytics_engagement_rate ON public.video_analytics(engagement_rate DESC);

CREATE INDEX idx_video_engagement_events_project_id ON public.video_engagement_events(project_id);
CREATE INDEX idx_video_engagement_events_user_id ON public.video_engagement_events(user_id);
CREATE INDEX idx_video_engagement_events_type ON public.video_engagement_events(event_type);
CREATE INDEX idx_video_engagement_events_created_at ON public.video_engagement_events(created_at DESC);

-- 5. Function to calculate performance score
CREATE OR REPLACE FUNCTION public.calculate_performance_score(
    views INTEGER,
    likes INTEGER,
    shares INTEGER,
    downloads INTEGER,
    engagement_rate DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    score DECIMAL;
BEGIN
    -- Performance score calculation: weighted average of metrics
    score := (
        (views * 0.2) +
        (likes * 0.3) +
        (shares * 0.25) +
        (downloads * 0.15) +
        (engagement_rate * 0.1)
    );
    
    -- Normalize to 0-100 range
    score := LEAST(100, score / 10);
    
    RETURN ROUND(score, 2);
END;
$$;

-- 6. Function to update analytics from events
CREATE OR REPLACE FUNCTION public.update_video_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_views INTEGER;
    v_total_likes INTEGER;
    v_total_shares INTEGER;
    v_total_downloads INTEGER;
    v_total_comments INTEGER;
    v_engagement_rate DECIMAL;
    v_performance_score DECIMAL;
BEGIN
    -- Count events by type
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'view'),
        COUNT(*) FILTER (WHERE event_type = 'like'),
        COUNT(*) FILTER (WHERE event_type = 'share'),
        COUNT(*) FILTER (WHERE event_type = 'download'),
        COUNT(*) FILTER (WHERE event_type = 'comment')
    INTO 
        v_total_views,
        v_total_likes,
        v_total_shares,
        v_total_downloads,
        v_total_comments
    FROM public.video_engagement_events
    WHERE project_id = NEW.project_id;
    
    -- Calculate engagement rate (interactions / views * 100)
    IF v_total_views > 0 THEN
        v_engagement_rate := ((v_total_likes + v_total_shares + v_total_downloads + v_total_comments)::DECIMAL / v_total_views) * 100;
    ELSE
        v_engagement_rate := 0;
    END IF;
    
    -- Calculate performance score
    v_performance_score := public.calculate_performance_score(
        v_total_views,
        v_total_likes,
        v_total_shares,
        v_total_downloads,
        v_engagement_rate
    );
    
    -- Insert or update analytics
    INSERT INTO public.video_analytics (
        project_id,
        total_views,
        total_likes,
        total_shares,
        total_downloads,
        total_comments,
        engagement_rate,
        performance_score,
        last_updated
    )
    VALUES (
        NEW.project_id,
        v_total_views,
        v_total_likes,
        v_total_shares,
        v_total_downloads,
        v_total_comments,
        v_engagement_rate,
        v_performance_score,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (project_id)
    DO UPDATE SET
        total_views = v_total_views,
        total_likes = v_total_likes,
        total_shares = v_total_shares,
        total_downloads = v_total_downloads,
        total_comments = v_total_comments,
        engagement_rate = v_engagement_rate,
        performance_score = v_performance_score,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$;

-- 7. Create trigger for automatic analytics updates
CREATE TRIGGER trigger_update_video_analytics
    AFTER INSERT ON public.video_engagement_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_video_analytics();

-- 8. Enable RLS
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_engagement_events ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies - Users can view analytics for their own projects
CREATE POLICY "users_view_own_project_analytics"
ON public.video_analytics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = video_analytics.project_id
        AND p.user_id = auth.uid()
    )
);

-- 10. RLS Policies - Users can view events for their own projects
CREATE POLICY "users_view_own_project_events"
ON public.video_engagement_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = video_engagement_events.project_id
        AND p.user_id = auth.uid()
    )
);

-- 11. RLS Policies - Anyone can insert engagement events (for tracking)
CREATE POLICY "anyone_can_track_engagement"
ON public.video_engagement_events
FOR INSERT
TO public
WITH CHECK (true);

-- 12. Mock data for analytics
DO $$
DECLARE
    existing_project_id UUID;
    existing_user_id UUID;
    event_types public.engagement_event_type[] := ARRAY['view', 'like', 'share', 'download']::public.engagement_event_type[];
    i INTEGER;
BEGIN
    -- Get existing project and user
    SELECT id INTO existing_project_id FROM public.projects WHERE status = 'completed'::public.project_status LIMIT 1;
    SELECT user_id INTO existing_user_id FROM public.projects WHERE id = existing_project_id;
    
    IF existing_project_id IS NOT NULL THEN
        -- Create engagement events
        FOR i IN 1..50 LOOP
            INSERT INTO public.video_engagement_events (
                project_id,
                user_id,
                event_type,
                event_metadata,
                watch_duration_seconds,
                created_at
            )
            VALUES (
                existing_project_id,
                CASE WHEN random() < 0.7 THEN existing_user_id ELSE NULL END,
                event_types[floor(random() * array_length(event_types, 1) + 1)],
                jsonb_build_object(
                    'platform', CASE floor(random() * 3)
                        WHEN 0 THEN 'web'
                        WHEN 1 THEN 'mobile'
                        ELSE 'tablet'
                    END,
                    'location', CASE floor(random() * 5)
                        WHEN 0 THEN 'US'
                        WHEN 1 THEN 'UK'
                        WHEN 2 THEN 'CA'
                        WHEN 3 THEN 'AU'
                        ELSE 'DE'
                    END
                ),
                floor(random() * 45 + 15)::INTEGER,
                CURRENT_TIMESTAMP - (random() * interval '30 days')
            );
        END LOOP;
    END IF;
END $$;

-- 13. Create view for dashboard summary
CREATE OR REPLACE VIEW public.analytics_dashboard_summary AS
SELECT 
    p.id as project_id,
    p.title,
    p.created_at as project_created_at,
    p.status,
    COALESCE(va.total_views, 0) as total_views,
    COALESCE(va.total_likes, 0) as total_likes,
    COALESCE(va.total_shares, 0) as total_shares,
    COALESCE(va.total_downloads, 0) as total_downloads,
    COALESCE(va.engagement_rate, 0) as engagement_rate,
    COALESCE(va.performance_score, 0) as performance_score,
    va.last_updated as analytics_updated_at
FROM public.projects p
LEFT JOIN public.video_analytics va ON p.id = va.project_id
WHERE p.user_id = auth.uid()
ORDER BY va.performance_score DESC NULLS LAST, p.created_at DESC;