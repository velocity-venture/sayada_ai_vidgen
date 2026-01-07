import { createClient } from '@/lib/supabase/client';

/**
 * Service Configuration Management Service
 * 
 * Manages secure storage and retrieval of external provider API keys
 * (OpenAI, ElevenLabs, Pika Labs) with encryption at the database level
 */

export type ServiceProvider = 'openai' | 'elevenlabs' | 'pikalabs';

export interface ServiceConfig {
  id: string;
  user_id: string;
  provider_name: ServiceProvider;
  status: 'active' | 'inactive' | 'error';
  last_validated_at: string | null;
  validation_error: string | null;
  last_used_at: string | null;
  requests_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderCredentials {
  openai_api_key?: string;
  elevenlabs_api_key?: string;
  pikalabs_api_key?: string;
}

/**
 * Get all service configurations for the current user
 */
export async function getUserServiceConfigs(): Promise<ServiceConfig[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('service_configs')
    .select('*')
    .order('provider_name');

  if (error) {
    console.error('Error fetching service configs:', error);
    throw new Error(`Failed to fetch service configurations: ${error.message}`);
  }

  return data || [];
}

/**
 * Upsert a service configuration (create or update)
 * The API key is automatically encrypted by the database function
 */
export async function saveServiceConfig(
  providerName: ServiceProvider,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Call the database function to securely store the API key
    const { data, error } = await supabase.rpc('upsert_service_config', {
      p_user_id: user.id,
      p_provider_name: providerName,
      p_api_key: apiKey
    });

    if (error) {
      console.error('Error saving service config:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error saving service config:', error);
    return { success: false, error: error.message || 'Failed to save configuration' };
  }
}

/**
 * Delete a service configuration
 */
export async function deleteServiceConfig(
  providerName: ServiceProvider
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('service_configs')
      .delete()
      .eq('user_id', user.id)
      .eq('provider_name', providerName);

    if (error) {
      console.error('Error deleting service config:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error deleting service config:', error);
    return { success: false, error: error.message || 'Failed to delete configuration' };
  }
}

/**
 * Test a provider API key by making a validation call
 */
export async function validateProviderKey(
  providerName: ServiceProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Call a lightweight validation endpoint for each provider
    switch (providerName) {
      case 'openai':
        return await validateOpenAIKey(apiKey);
      case 'elevenlabs':
        return await validateElevenLabsKey(apiKey);
      case 'pikalabs':
        return await validatePikaLabsKey(apiKey);
      default:
        return { valid: false, error: 'Unknown provider' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Validation failed' };
  }
}

/**
 * Validate OpenAI API key
 */
async function validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else {
      const errorData = await response.json();
      return { valid: false, error: errorData.error?.message || 'Invalid API key' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Connection failed' };
  }
}

/**
 * Validate ElevenLabs API key
 */
async function validateElevenLabsKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else {
      const errorData = await response.json();
      return { valid: false, error: errorData.detail || 'Invalid API key' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Connection failed' };
  }
}

/**
 * Validate Pika Labs API key
 */
async function validatePikaLabsKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Pika Labs validation endpoint (placeholder - adjust based on actual API)
    const response = await fetch('https://api.pika.art/v1/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Invalid API key' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Connection failed' };
  }
}

/**
 * Get provider API keys for authenticated backend calls
 * Only use this in server-side code or API routes
 */
export async function getProviderCredentials(userId: string): Promise<ProviderCredentials> {
  const supabase = createClient();
  
  const credentials: ProviderCredentials = {};

  try {
    // Get OpenAI key
    const { data: openaiKey } = await supabase.rpc('get_provider_api_key', {
      p_user_id: userId,
      p_provider_name: 'openai'
    });
    if (openaiKey) credentials.openai_api_key = openaiKey;

    // Get ElevenLabs key
    const { data: elevenLabsKey } = await supabase.rpc('get_provider_api_key', {
      p_user_id: userId,
      p_provider_name: 'elevenlabs'
    });
    if (elevenLabsKey) credentials.elevenlabs_api_key = elevenLabsKey;

    // Get Pika Labs key
    const { data: pikaKey } = await supabase.rpc('get_provider_api_key', {
      p_user_id: userId,
      p_provider_name: 'pikalabs'
    });
    if (pikaKey) credentials.pikalabs_api_key = pikaKey;

    return credentials;
  } catch (error) {
    console.error('Error fetching provider credentials:', error);
    return credentials;
  }
}