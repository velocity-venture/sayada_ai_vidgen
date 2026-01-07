-- Location: supabase/migrations/20260107013549_api_integration_webhooks.sql
-- Schema Analysis: Existing video generation system with projects, user_profiles, templates
-- Integration Type: NEW_MODULE - API Integration & Webhooks for external access
-- Dependencies: user_profiles, projects

-- 1. TYPES - API Key Status & Webhook Status
CREATE TYPE public.api_key_status AS ENUM ('active', 'inactive', 'revoked');
CREATE TYPE public.webhook_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

-- 2. CORE TABLES - API Keys
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    status public.api_key_status DEFAULT 'active'::public.api_key_status,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rate_limit_per_minute INTEGER DEFAULT 10,
    requests_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Configurations
CREATE TABLE public.webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    secret_key TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Delivery Logs
CREATE TABLE public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_config_id UUID REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    status public.webhook_status DEFAULT 'pending'::public.webhook_status,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- API Request Logs (for analytics)
CREATE TABLE public.api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_body JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_api_key ON public.api_keys(api_key);
CREATE INDEX idx_api_keys_status ON public.api_keys(status);
CREATE INDEX idx_webhook_configs_user_id ON public.webhook_configs(user_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_project_id ON public.webhook_deliveries(project_id);
CREATE INDEX idx_webhook_deliveries_next_retry ON public.webhook_deliveries(next_retry_at) WHERE status = 'failed'::public.webhook_status;
CREATE INDEX idx_api_request_logs_api_key_id ON public.api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_created_at ON public.api_request_logs(created_at);

-- 4. FUNCTIONS - API Key Generation & Validation
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    key_prefix TEXT := 'sk_live_';
    random_part TEXT;
BEGIN
    random_part := encode(gen_random_bytes(32), 'base64');
    random_part := replace(random_part, '/', '');
    random_part := replace(random_part, '+', '');
    random_part := replace(random_part, '=', '');
    RETURN key_prefix || random_part;
END;
$func$;

-- Function to validate and track API key usage
CREATE OR REPLACE FUNCTION public.validate_api_key(key_to_validate TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    user_uuid UUID,
    rate_limit INTEGER,
    requests_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    key_record RECORD;
BEGIN
    SELECT 
        ak.id,
        ak.user_id,
        ak.status,
        ak.expires_at,
        ak.rate_limit_per_minute,
        ak.requests_count,
        ak.last_used_at
    INTO key_record
    FROM public.api_keys ak
    WHERE ak.api_key = key_to_validate;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 0, 0;
        RETURN;
    END IF;
    
    IF key_record.status != 'active'::public.api_key_status THEN
        RETURN QUERY SELECT false, NULL::UUID, 0, 0;
        RETURN;
    END IF;
    
    IF key_record.expires_at IS NOT NULL AND key_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, 0, 0;
        RETURN;
    END IF;
    
    UPDATE public.api_keys
    SET 
        last_used_at = NOW(),
        requests_count = requests_count + 1,
        updated_at = NOW()
    WHERE id = key_record.id;
    
    RETURN QUERY SELECT 
        true,
        key_record.user_id,
        key_record.rate_limit_per_minute,
        key_record.requests_count + 1;
END;
$func$;

-- Function to process webhook delivery
CREATE OR REPLACE FUNCTION public.schedule_webhook_delivery(
    webhook_url_param TEXT,
    project_uuid UUID,
    payload_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    delivery_id UUID;
    config_id UUID;
BEGIN
    SELECT wc.id INTO config_id
    FROM public.webhook_configs wc
    WHERE wc.webhook_url = webhook_url_param
    AND wc.is_active = true
    LIMIT 1;
    
    IF config_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO public.webhook_deliveries (
        webhook_config_id,
        project_id,
        payload,
        status
    )
    VALUES (
        config_id,
        project_uuid,
        payload_data,
        'pending'::public.webhook_status
    )
    RETURNING id INTO delivery_id;
    
    RETURN delivery_id;
END;
$func$;

-- 5. RLS SETUP
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES - Pattern 2: Simple User Ownership
CREATE POLICY "users_manage_own_api_keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_webhook_configs"
ON public.webhook_configs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Webhook deliveries - users can view their own deliveries
CREATE POLICY "users_view_own_webhook_deliveries"
ON public.webhook_deliveries
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.webhook_configs wc
        WHERE wc.id = webhook_deliveries.webhook_config_id
        AND wc.user_id = auth.uid()
    )
);

-- API request logs - users can view their own logs
CREATE POLICY "users_view_own_api_logs"
ON public.api_request_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.api_keys ak
        WHERE ak.id = api_request_logs.api_key_id
        AND ak.user_id = auth.uid()
    )
);

-- 7. TRIGGERS - Auto-update timestamps
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at
    BEFORE UPDATE ON public.webhook_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. MOCK DATA - Reference existing users
DO $$
DECLARE
    existing_user_id UUID;
    api_key_1 TEXT;
    api_key_2 TEXT;
    webhook_config_id UUID;
BEGIN
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        api_key_1 := public.generate_api_key();
        api_key_2 := public.generate_api_key();
        
        INSERT INTO public.api_keys (user_id, key_name, api_key, status)
        VALUES
            (existing_user_id, 'Production API Key', api_key_1, 'active'::public.api_key_status),
            (existing_user_id, 'Development API Key', api_key_2, 'active'::public.api_key_status);
        
        INSERT INTO public.webhook_configs (user_id, webhook_url, is_active)
        VALUES
            (existing_user_id, 'https://example.com/webhooks/video-complete', true)
        RETURNING id INTO webhook_config_id;
        
        RAISE NOTICE 'API Integration setup complete for user: %', existing_user_id;
        RAISE NOTICE 'API Key 1: %', api_key_1;
        RAISE NOTICE 'API Key 2: %', api_key_2;
    ELSE
        RAISE NOTICE 'No existing users found. Create users first.';
    END IF;
END $$;