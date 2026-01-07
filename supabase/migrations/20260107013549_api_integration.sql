-- Location: supabase/migrations/20260107013549_api_integration.sql
-- Schema Analysis: Existing video generation system with projects, user_profiles, video_templates
-- Integration Type: NEW_MODULE - External API Integration for video generation
-- Dependencies: projects, user_profiles

-- 1. Create ENUM types for API integration
CREATE TYPE public.api_key_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE public.webhook_status AS ENUM ('pending', 'success', 'failed', 'retrying');

-- 2. Create api_keys table for external authentication
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    name TEXT NOT NULL,
    status public.api_key_status DEFAULT 'active'::public.api_key_status NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rate_limit_per_minute INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create webhook_logs table to track webhook deliveries
CREATE TABLE public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    status public.webhook_status DEFAULT 'pending'::public.webhook_status NOT NULL,
    request_payload JSONB NOT NULL,
    response_payload JSONB,
    response_status_code INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON public.api_keys(status);
CREATE INDEX idx_webhook_logs_project_id ON public.webhook_logs(project_id);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_next_retry ON public.webhook_logs(next_retry_at) WHERE status = 'retrying'::public.webhook_status;

-- 5. Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create helper function for API key validation
CREATE OR REPLACE FUNCTION public.validate_api_key(key_hash_param TEXT)
RETURNS TABLE(
    key_id UUID,
    user_id UUID,
    is_valid BOOLEAN,
    rate_limit INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT
    ak.id,
    ak.user_id,
    (
        ak.status = 'active'::public.api_key_status AND
        (ak.expires_at IS NULL OR ak.expires_at > CURRENT_TIMESTAMP)
    )::BOOLEAN,
    ak.rate_limit_per_minute
FROM public.api_keys ak
WHERE ak.key_hash = key_hash_param
LIMIT 1;
$$;

-- 7. Create function to update API key last_used_at
CREATE OR REPLACE FUNCTION public.update_api_key_usage(key_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.api_keys
    SET last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = key_id_param;
END;
$$;

-- 8. Create RLS policies for api_keys (Pattern 2: Simple User Ownership)
CREATE POLICY "users_manage_own_api_keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. Create RLS policies for webhook_logs (Pattern 7: Complex Relationships)
CREATE OR REPLACE FUNCTION public.can_access_webhook_logs(webhook_log_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.webhook_logs wl
    JOIN public.projects p ON wl.project_id = p.id
    WHERE wl.id = webhook_log_id
    AND p.user_id = auth.uid()
)
$$;

CREATE POLICY "users_view_own_webhook_logs"
ON public.webhook_logs
FOR SELECT
TO authenticated
USING (public.can_access_webhook_logs(id));

-- 10. Create triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_logs_updated_at
    BEFORE UPDATE ON public.webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Mock data for testing
DO $$
DECLARE
    existing_user_id UUID;
    test_api_key_id UUID := gen_random_uuid();
    test_project_id UUID;
BEGIN
    -- Get existing user
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Create test API key
        INSERT INTO public.api_keys (
            id, user_id, key_hash, key_prefix, name, status, rate_limit_per_minute
        ) VALUES (
            test_api_key_id,
            existing_user_id,
            encode(digest('test_api_key_secret_12345', 'sha256'), 'hex'),
            'sk_test',
            'Development API Key',
            'active'::public.api_key_status,
            10
        );
        
        -- Get existing project for webhook logs
        SELECT id INTO test_project_id FROM public.projects WHERE user_id = existing_user_id LIMIT 1;
        
        IF test_project_id IS NOT NULL THEN
            -- Create sample webhook log using jsonb_build_object for proper JSON formatting
            INSERT INTO public.webhook_logs (
                project_id, webhook_url, status, request_payload, response_status_code
            ) VALUES (
                test_project_id,
                'https://example.com/webhook',
                'success'::public.webhook_status,
                jsonb_build_object(
                    'event', 'video.completed',
                    'project_id', test_project_id::text
                ),
                200
            );
        END IF;
    END IF;
END $$;

COMMENT ON TABLE public.api_keys IS 'API keys for external integrations with video generation system';
COMMENT ON TABLE public.webhook_logs IS 'Webhook delivery logs for external system notifications';