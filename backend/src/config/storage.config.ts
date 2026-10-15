import dotenv from 'dotenv';

export interface StorageConfig {
  supabaseUrl: string | null;
  supabaseSecretKey: string | null;
  avatarsBucket: string;
  coversBucket: string;
  isConfigured: boolean;
}

export function getStorageConfig(): StorageConfig {
  dotenv.config();
  const supabaseUrl = process.env.SUPABASE_URL || null;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  const avatarsBucket = process.env.SUPABASE_AVATARS_BUCKET || 'avatars';
  const coversBucket = process.env.SUPABASE_COVERS_BUCKET || 'post-covers';

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseSecretKey &&
    supabaseUrl.startsWith('http') &&
    supabaseSecretKey.length > 10
  );

  return {
    supabaseUrl,
    supabaseSecretKey,
    avatarsBucket,
    coversBucket,
    isConfigured,
  };
}
