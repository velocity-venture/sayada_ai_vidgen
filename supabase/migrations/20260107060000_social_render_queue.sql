-- Location: supabase/migrations/20260107060000_social_render_queue.sql
-- Schema Analysis: Existing projects table with aspect_ratio, subtitle fields
-- Integration Type: Addition - Social Publishing Architecture render queue
-- Dependencies: projects, user_profiles

-- 1. Create enum type for render queue status
CREATE TYPE public.render_queue_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- 2. Create social_render_queue table for async video processing
CREATE TABLE public.social_render_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Render configuration
    aspect_ratio TEXT NOT NULL DEFAULT '16:9',
    burn_subtitles BOOLEAN NOT NULL DEFAULT false,
    subtitle_style TEXT,
    
    -- Processing metadata
    status public.render_queue_status NOT NULL DEFAULT 'pending'::public.render_queue_status,
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Result data
    output_url TEXT,
    error_message TEXT,
    processing_time_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ
);

-- 3. Create indexes for efficient querying
CREATE INDEX idx_social_render_queue_project_id ON public.social_render_queue(project_id);
CREATE INDEX idx_social_render_queue_user_id ON public.social_render_queue(user_id);
CREATE INDEX idx_social_render_queue_status ON public.social_render_queue(status);
CREATE INDEX idx_social_render_queue_priority ON public.social_render_queue(priority DESC, created_at ASC);
CREATE INDEX idx_social_render_queue_next_retry ON public.social_render_queue(next_retry_at) WHERE status = 'failed'::public.render_queue_status;

-- 4. Enable RLS for security
ALTER TABLE public.social_render_queue ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies - Pattern 2: Simple User Ownership
CREATE POLICY "users_manage_own_render_jobs"
ON public.social_render_queue
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Helper function to get next pending render job
CREATE OR REPLACE FUNCTION public.get_next_render_job()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_id UUID;
BEGIN
    -- Get the highest priority pending job
    SELECT id INTO job_id
    FROM public.social_render_queue
    WHERE status = 'pending'::public.render_queue_status
       OR (status = 'failed'::public.render_queue_status 
           AND attempts < max_attempts 
           AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    -- Update job status to processing
    IF job_id IS NOT NULL THEN
        UPDATE public.social_render_queue
        SET status = 'processing'::public.render_queue_status,
            started_at = NOW(),
            attempts = attempts + 1
        WHERE id = job_id;
    END IF;
    
    RETURN job_id;
END;
$$;

-- 7. Function to mark render job as completed
CREATE OR REPLACE FUNCTION public.complete_render_job(
    job_uuid UUID,
    output_video_url TEXT,
    processing_seconds INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.social_render_queue
    SET status = 'completed'::public.render_queue_status,
        output_url = output_video_url,
        processing_time_seconds = processing_seconds,
        completed_at = NOW()
    WHERE id = job_uuid;
END;
$$;

-- 8. Function to mark render job as failed
CREATE OR REPLACE FUNCTION public.fail_render_job(
    job_uuid UUID,
    error_msg TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_attempts INTEGER;
    max_retry INTEGER;
BEGIN
    SELECT attempts, max_attempts 
    INTO current_attempts, max_retry
    FROM public.social_render_queue
    WHERE id = job_uuid;
    
    UPDATE public.social_render_queue
    SET status = 'failed'::public.render_queue_status,
        error_message = error_msg,
        next_retry_at = CASE 
            WHEN current_attempts < max_retry 
            THEN NOW() + INTERVAL '5 minutes' * current_attempts
            ELSE NULL
        END
    WHERE id = job_uuid;
END;
$$;

-- 9. Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_render_queue_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'processing'::public.render_queue_status AND OLD.status != 'processing'::public.render_queue_status THEN
        NEW.started_at := NOW();
    END IF;
    
    IF NEW.status = 'completed'::public.render_queue_status AND OLD.status != 'completed'::public.render_queue_status THEN
        NEW.completed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_social_render_queue_timestamp
BEFORE UPDATE ON public.social_render_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_render_queue_timestamp();

-- 10. Sample mock data for testing
DO $$
DECLARE
    existing_project_id UUID;
    existing_user_id UUID;
BEGIN
    -- Get existing project and user IDs
    SELECT id INTO existing_project_id FROM public.projects LIMIT 1;
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    
    IF existing_project_id IS NOT NULL AND existing_user_id IS NOT NULL THEN
        -- Create sample render jobs
        INSERT INTO public.social_render_queue (
            project_id, 
            user_id, 
            aspect_ratio, 
            burn_subtitles, 
            subtitle_style, 
            priority
        )
        VALUES
            (existing_project_id, existing_user_id, '9:16', true, 'impact', 10),
            (existing_project_id, existing_user_id, '1:1', true, 'cinematic', 5),
            (existing_project_id, existing_user_id, '16:9', false, NULL, 1);
    END IF;
END $$;