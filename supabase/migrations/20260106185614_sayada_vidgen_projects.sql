-- Location: supabase/migrations/20260106185614_sayada_vidgen_projects.sql
-- Schema Analysis: FRESH_PROJECT - No existing tables
-- Integration Type: Complete new schema for Sayada VidGen
-- Module: Video Project Management with Authentication

-- 1. Types - Define ENUMs for project statuses
CREATE TYPE public.project_status AS ENUM ('draft', 'processing', 'completed', 'failed');

-- 2. Core Tables - User profiles (PostgREST compatibility)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Business Tables - Projects table for VidGen
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    script_content TEXT NOT NULL,
    status public.project_status DEFAULT 'draft'::public.project_status NOT NULL,
    video_url TEXT,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 30 AND duration_seconds <= 60),
    style_preset TEXT DEFAULT 'Photorealistic Cinematic' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes for performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- 5. Functions - Automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$;

-- 6. Functions - Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $func$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$func$;

-- 7. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies - Pattern 1: Core user table (user_profiles)
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 8. RLS Policies - Pattern 2: Simple user ownership (projects)
CREATE POLICY "users_manage_own_projects"
ON public.projects
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. Triggers - Update timestamps
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Triggers - Auto-create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 11. Mock Data - Create sample auth users and projects
DO $$
DECLARE
    user1_id UUID := gen_random_uuid();
    user2_id UUID := gen_random_uuid();
    project1_id UUID := gen_random_uuid();
    project2_id UUID := gen_random_uuid();
    project3_id UUID := gen_random_uuid();
BEGIN
    -- Create auth users with all required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'john@example.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "John Smith"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sarah@example.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Sarah Johnson"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create sample projects (trigger will auto-create user_profiles)
    INSERT INTO public.projects (id, user_id, title, script_content, status, video_url, duration_seconds, style_preset, created_at)
    VALUES
        (project1_id, user1_id, 'John 3:16 - Love of God', 
         'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
         'completed'::public.project_status, 
         'https://example.com/john316.mp4',
         45,
         'Photorealistic Cinematic',
         '2026-01-15T10:00:00Z'),
        
        (project2_id, user1_id, 'Psalm 23 - The Lord is My Shepherd',
         'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
         'processing'::public.project_status,
         null,
         60,
         'Photorealistic Cinematic',
         '2026-01-14T14:30:00Z'),
        
        (project3_id, user2_id, 'Genesis 1:1 - In the Beginning',
         'In the beginning God created the heavens and the earth. Now the earth was formless and empty, darkness was over the surface of the deep.',
         'draft'::public.project_status,
         null,
         30,
         'Photorealistic Cinematic',
         '2026-01-13T09:15:00Z');
END $$;

-- 12. Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'User profile data synchronized with auth.users';
COMMENT ON TABLE public.projects IS 'Video generation projects for Sayada VidGen';
COMMENT ON COLUMN public.projects.duration_seconds IS 'Video duration constrained to 30-60 seconds';
COMMENT ON COLUMN public.projects.style_preset IS 'Default: Photorealistic Cinematic 8k lighting';