import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getStorageConfig } from '../config/storage.config';

export class StorageNotConfiguredError extends Error {
  constructor(message = 'Media storage service is not configured on this server.') {
    super(message);
    this.name = 'StorageNotConfiguredError';
  }
}

export class StorageOperationError extends Error {
  constructor(message = 'An error occurred during media storage operation.') {
    super(message);
    this.name = 'StorageOperationError';
  }
}

export interface IMediaStorageService {
  isConfigured(): boolean;
  upload(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(bucket: string, path: string): Promise<boolean>;
  extractPathFromUrl(url: string, bucket: string): string | null;
}

export class SupabaseStorageService implements IMediaStorageService {
  private client: SupabaseClient | null = null;
  private config = getStorageConfig();

  constructor() {
    this.initClient();
  }

  private initClient() {
    this.config = getStorageConfig();
    if (this.config.isConfigured && this.config.supabaseUrl && this.config.supabaseSecretKey) {
      try {
        this.client = createClient(this.config.supabaseUrl, this.config.supabaseSecretKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
      } catch (err) {
        console.error('[MediaStorageService] Failed to initialize Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    this.config = getStorageConfig();
    if (!this.client && this.config.isConfigured) {
      this.initClient();
    }
    return Boolean(this.config.isConfigured && this.client);
  }

  /**
   * Uploads processed binary buffer to the specified Supabase storage bucket.
   * Returns the canonical public URL.
   */
  async upload(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.client && this.config.isConfigured) {
      this.initClient();
    }
    if (!this.isConfigured() || !this.client) {
      throw new StorageNotConfiguredError();
    }

    // Sanitize path against directory traversal
    const cleanPath = path.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');

    const { error } = await this.client.storage.from(bucket).upload(cleanPath, buffer, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error(`[MediaStorageService] Upload failed for ${bucket}/${cleanPath}:`, error.message);
      throw new StorageOperationError(`Failed to upload media to storage: ${error.message}`);
    }

    const { data } = this.client.storage.from(bucket).getPublicUrl(cleanPath);
    return data.publicUrl;
  }

  /**
   * Deletes an object from the storage bucket if the path is valid.
   */
  async delete(bucket: string, path: string): Promise<boolean> {
    if (!this.isConfigured() || !this.client) {
      return false;
    }

    const cleanPath = path.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');
    if (!cleanPath) return false;

    const { error } = await this.client.storage.from(bucket).remove([cleanPath]);
    if (error) {
      console.warn(`[MediaStorageService] Best-effort delete failed for ${bucket}/${cleanPath}:`, error.message);
      return false;
    }

    return true;
  }

  /**
   * Extracts the internal object path from a public Supabase Storage URL.
   * Only matches URLs that originate from the configured Supabase instance and bucket.
   */
  extractPathFromUrl(url: string, bucket: string): string | null {
    if (!url || typeof url !== 'string') return null;

    // Pattern 1: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const expectedSegment = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(expectedSegment);
    if (index !== -1) {
      const extracted = url.substring(index + expectedSegment.length).split('?')[0];
      return extracted.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '') || null;
    }

    // Pattern 2: custom domain / URL ending with /<bucket>/<path>
    const bucketPrefix = `/${bucket}/`;
    const bucketIndex = url.indexOf(bucketPrefix);
    if (bucketIndex !== -1) {
      const extracted = url.substring(bucketIndex + bucketPrefix.length).split('?')[0];
      return extracted.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '') || null;
    }

    return null;
  }
}

// Singleton storage provider with mock injection support for automated testing
let activeStorageProvider: IMediaStorageService = new SupabaseStorageService();

export const mediaStorageService = {
  isConfigured: () => activeStorageProvider.isConfigured(),
  upload: (bucket: string, path: string, buffer: Buffer, contentType: string) =>
    activeStorageProvider.upload(bucket, path, buffer, contentType),
  delete: (bucket: string, path: string) => activeStorageProvider.delete(bucket, path),
  extractPathFromUrl: (url: string, bucket: string) =>
    activeStorageProvider.extractPathFromUrl(url, bucket),
  setProvider: (provider: IMediaStorageService) => {
    activeStorageProvider = provider;
  },
  resetProvider: () => {
    activeStorageProvider = new SupabaseStorageService();
  },
};
