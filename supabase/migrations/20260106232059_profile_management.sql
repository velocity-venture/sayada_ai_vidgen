-- Location: supabase/migrations/20260106232059_profile_management.sql
-- Schema Analysis: Extending existing user_profiles table with profile management features
-- Integration Type: Extension
-- Dependencies: user_profiles (existing)

-- 1. Create ENUMs for profile management
CREATE TYPE public.subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE public.notification_frequency AS ENUM ('instant', 'daily', 'weekly', 'never');

-- 2. Add new columns to existing user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ministry_affiliation TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Create email preferences table
CREATE TABLE public.user_email_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    video_completion_alerts BOOLEAN DEFAULT true,
    platform_updates BOOLEAN DEFAULT true,
    scripture_recommendations BOOLEAN DEFAULT true,
    marketing_communications BOOLEAN DEFAULT false,
    notification_frequency public.notification_frequency DEFAULT 'instant'::public.notification_frequency,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tier public.subscription_tier DEFAULT 'free'::public.subscription_tier,
    videos_generated_this_month INTEGER DEFAULT 0,
    monthly_video_limit INTEGER DEFAULT 5,
    storage_used_mb INTEGER DEFAULT 0,
    storage_limit_mb INTEGER DEFAULT 500,
    subscription_start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    subscription_end_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create security settings table
CREATE TABLE public.user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    last_password_change TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create active sessions table
CREATE TABLE public.user_active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    browser TEXT,
    ip_address TEXT,
    last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create indexes
CREATE INDEX idx_user_email_preferences_user_id ON public.user_email_preferences(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_security_settings_user_id ON public.user_security_settings(user_id);
CREATE INDEX idx_user_active_sessions_user_id ON public.user_active_sessions(user_id);

-- 8. Enable RLS
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (Pattern 2: Simple User Ownership)
CREATE POLICY "users_manage_own_email_preferences"
ON public.user_email_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_subscriptions"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_security_settings"
ON public.user_security_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_active_sessions"
ON public.user_active_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. Create triggers for updated_at
CREATE TRIGGER update_user_email_preferences_updated_at
BEFORE UPDATE ON public.user_email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at
BEFORE UPDATE ON public.user_security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Create function to initialize profile data for existing users
CREATE OR REPLACE FUNCTION public.initialize_user_profile_data()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create email preferences
    INSERT INTO public.user_email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
    
    -- Create subscription
    INSERT INTO public.user_subscriptions (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
    
    -- Create security settings
    INSERT INTO public.user_security_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- 12. Create trigger to initialize profile data for new users
CREATE TRIGGER initialize_user_profile_data_trigger
AFTER INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_profile_data();

-- 13. Initialize profile data for existing users
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    FOR existing_user_id IN 
        SELECT id FROM public.user_profiles
    LOOP
        -- Create email preferences if not exists
        INSERT INTO public.user_email_preferences (user_id)
        VALUES (existing_user_id)
        ON CONFLICT DO NOTHING;
        
        -- Create subscription if not exists
        INSERT INTO public.user_subscriptions (user_id)
        VALUES (existing_user_id)
        ON CONFLICT DO NOTHING;
        
        -- Create security settings if not exists
        INSERT INTO public.user_security_settings (user_id)
        VALUES (existing_user_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;