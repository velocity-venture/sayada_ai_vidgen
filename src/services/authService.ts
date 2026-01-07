import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types/models';

interface AuthResponse {
  user: any | null;
  session: any | null;
  error: Error | null;
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error: error || null,
    };
  },

  /**
   * Sign up with email and password
   */
  async signUp(signUpData: SignUpData): Promise<AuthResponse> {
    const { email, password, fullName } = signUpData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    return {
      user: data?.user || null,
      session: data?.session || null,
      error: error || null,
    };
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error || null };
  },

  /**
   * Get the current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data?.session || null,
      error: error || null,
    };
  },

  /**
   * Get the current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    return {
      user: data?.user || null,
      error: error || null,
    };
  },

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || undefined,
      avatarUrl: data.avatar_url || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};