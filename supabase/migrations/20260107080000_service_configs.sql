-- =====================================================
-- Service Provider Configuration Module Migration
-- Purpose: Secure storage for external AI provider API keys
-- =====================================================

-- Extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Service provider config status enum
CREATE TYPE service_provider_status AS ENUM ('active', 'inactive', 'error');

-- Service configs table for external provider API keys
CREATE TABLE public.service_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Provider identification
  provider_name TEXT NOT NULL CHECK (provider_name IN ('openai', 'elevenlabs', 'pikalabs')),
  
  -- Encrypted API keys (never store plaintext)
  api_key_encrypted TEXT NOT NULL,
  
  -- Configuration metadata
  status service_provider_status NOT NULL DEFAULT 'active',
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  requests_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one config per user per provider
  UNIQUE(user_id, provider_name)
);

-- Indexes for performance
CREATE INDEX idx_service_configs_user_id ON service_configs(user_id);
CREATE INDEX idx_service_configs_provider ON service_configs(provider_name);
CREATE INDEX idx_service_configs_status ON service_configs(status);

-- Enable RLS
ALTER TABLE service_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage their own service configs
CREATE POLICY users_manage_own_service_configs
  ON service_configs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Updated timestamp trigger
CREATE TRIGGER update_service_configs_updated_at
  BEFORE UPDATE ON service_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Encryption/Decryption Functions
-- =====================================================

-- Function to encrypt API key with user-specific salt
CREATE OR REPLACE FUNCTION encrypt_api_key(
  p_user_id UUID,
  p_api_key TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Generate encryption key from user ID and a secret
  v_encryption_key := encode(
    digest(
      p_user_id::TEXT || current_setting('app.settings.encryption_secret', TRUE),
      'sha256'
    ),
    'hex'
  );
  
  -- Encrypt the API key
  RETURN encode(
    encrypt(
      p_api_key::bytea,
      v_encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;

-- Function to decrypt API key
CREATE OR REPLACE FUNCTION decrypt_api_key(
  p_user_id UUID,
  p_encrypted_key TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Generate decryption key from user ID and a secret
  v_encryption_key := encode(
    digest(
      p_user_id::TEXT || current_setting('app.settings.encryption_secret', TRUE),
      'sha256'
    ),
    'hex'
  );
  
  -- Decrypt the API key
  RETURN convert_from(
    decrypt(
      decode(p_encrypted_key, 'base64'),
      v_encryption_key::bytea,
      'aes'
    ),
    'utf8'
  );
END;
$$;

-- =====================================================
-- Service Config Management Functions
-- =====================================================

-- Function to upsert service config with automatic encryption
CREATE OR REPLACE FUNCTION upsert_service_config(
  p_user_id UUID,
  p_provider_name TEXT,
  p_api_key TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config_id UUID;
  v_encrypted_key TEXT;
BEGIN
  -- Validate provider name
  IF p_provider_name NOT IN ('openai', 'elevenlabs', 'pikalabs') THEN
    RAISE EXCEPTION 'Invalid provider name: %', p_provider_name;
  END IF;
  
  -- Validate API key is not empty
  IF p_api_key IS NULL OR trim(p_api_key) = '' THEN
    RAISE EXCEPTION 'API key cannot be empty';
  END IF;
  
  -- Encrypt the API key
  v_encrypted_key := encrypt_api_key(p_user_id, p_api_key);
  
  -- Upsert the config
  INSERT INTO service_configs (
    user_id,
    provider_name,
    api_key_encrypted,
    status,
    last_validated_at
  )
  VALUES (
    p_user_id,
    p_provider_name,
    v_encrypted_key,
    'active',
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id, provider_name)
  DO UPDATE SET
    api_key_encrypted = v_encrypted_key,
    status = 'active',
    validation_error = NULL,
    last_validated_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_config_id;
  
  RETURN v_config_id;
END;
$$;

-- Function to get decrypted API key for a provider
CREATE OR REPLACE FUNCTION get_provider_api_key(
  p_user_id UUID,
  p_provider_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_encrypted_key TEXT;
  v_decrypted_key TEXT;
BEGIN
  -- Get encrypted key
  SELECT api_key_encrypted INTO v_encrypted_key
  FROM service_configs
  WHERE user_id = p_user_id
    AND provider_name = p_provider_name
    AND status = 'active';
  
  -- Return NULL if not found
  IF v_encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt and return
  v_decrypted_key := decrypt_api_key(p_user_id, v_encrypted_key);
  
  -- Update last_used_at and increment requests_count
  UPDATE service_configs
  SET 
    last_used_at = CURRENT_TIMESTAMP,
    requests_count = requests_count + 1
  WHERE user_id = p_user_id
    AND provider_name = p_provider_name;
  
  RETURN v_decrypted_key;
END;
$$;

-- Function to mark service config as error
CREATE OR REPLACE FUNCTION mark_service_config_error(
  p_user_id UUID,
  p_provider_name TEXT,
  p_error_message TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE service_configs
  SET 
    status = 'error',
    validation_error = p_error_message,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
    AND provider_name = p_provider_name;
END;
$$;

-- =====================================================
-- Mock Data for Testing (Optional - Remove in Production)
-- =====================================================

-- Insert sample service configs for existing test user
DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Get test user ID
  SELECT id INTO v_test_user_id
  FROM user_profiles
  WHERE email LIKE '%test%'
  LIMIT 1;
  
  IF v_test_user_id IS NOT NULL THEN
    -- Insert mock service configs using the upsert function
    PERFORM upsert_service_config(
      v_test_user_id,
      'openai',
      'sk-test-openai-key-' || substring(md5(random()::text) from 1 for 12)
    );
    
    PERFORM upsert_service_config(
      v_test_user_id,
      'elevenlabs',
      'test-elevenlabs-key-' || substring(md5(random()::text) from 1 for 12)
    );
    
    PERFORM upsert_service_config(
      v_test_user_id,
      'pikalabs',
      'test-pika-key-' || substring(md5(random()::text) from 1 for 12)
    );
  END IF;
END $$;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE service_configs IS 'Secure storage for external AI provider API keys with encryption';
COMMENT ON COLUMN service_configs.api_key_encrypted IS 'Encrypted API key using user-specific encryption';
COMMENT ON FUNCTION encrypt_api_key IS 'Encrypts API key with user-specific salt for secure storage';
COMMENT ON FUNCTION decrypt_api_key IS 'Decrypts API key for use in API calls';
COMMENT ON FUNCTION upsert_service_config IS 'Securely stores or updates provider API key with automatic encryption';
COMMENT ON FUNCTION get_provider_api_key IS 'Retrieves decrypted API key for authenticated API calls';