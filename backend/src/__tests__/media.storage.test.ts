import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import app from '../app';
import { prisma } from '../config/prisma';
import {
  ImageProcessorService,
  InvalidImageError,
  ImageTooLargeError,
} from '../services/image-processor.service';
import {
  mediaStorageService,
  IMediaStorageService,
} from '../services/media-storage.service';

// Mock storage provider for deterministic local testing
class MockStorageService implements IMediaStorageService {
  public uploadedFiles = new Map<string, Buffer>();
  public deletedFiles: string[] = [];
  public configured = true;

  isConfigured(): boolean {
    return this.configured;
  }

  async upload(bucket: string, path: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.configured) {
      throw new Error('Media storage service is not configured on this server.');
    }
    const cleanPath = path.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');
    const key = `${bucket}/${cleanPath}`;
    this.uploadedFiles.set(key, buffer);
    return `https://mock-supabase.test/storage/v1/object/public/${bucket}/${cleanPath}`;
  }

  async delete(bucket: string, path: string): Promise<boolean> {
    const cleanPath = path.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');
    const key = `${bucket}/${cleanPath}`;
    this.uploadedFiles.delete(key);
    this.deletedFiles.push(key);
    return true;
  }

  extractPathFromUrl(url: string, bucket: string): string | null {
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(prefix);
    if (index !== -1) {
      return url.substring(index + prefix.length).split('?')[0];
    }
    return null;
  }
}

describe('Phase 9: Media Processing, Avatar & Cover Uploads', () => {
  let mockStorage: MockStorageService;
  let validJpegBuffer: Buffer;
  let validPngBuffer: Buffer;
  let validWebpBuffer: Buffer;

  // Test users & tokens
  let userA: { id: string; email: string; token: string };
  let userB: { id: string; email: string; token: string };
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];

  beforeAll(async () => {
    // 1. Generate real small test images using sharp
    validJpegBuffer = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 255, g: 100, b: 50 } },
    })
      .jpeg()
      .toBuffer();

    validPngBuffer = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 50, g: 150, b: 255, alpha: 1 } },
    })
      .png()
      .toBuffer();

    validWebpBuffer = await sharp({
      create: { width: 50, height: 50, channels: 3, background: { r: 100, g: 255, b: 100 } },
    })
      .webp()
      .toBuffer();

    // 2. Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Media Author A',
      email: `author-a-${Date.now()}@example.com`,
      password: 'StrongPassword123!',
    });
    expect(resA.status).toBe(201);
    userA = {
      id: resA.body.data.user.id,
      email: resA.body.data.user.email,
      token: resA.body.data.accessToken,
    };
    createdUserIds.push(userA.id);

    // 3. Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Media Author B',
      email: `author-b-${Date.now()}@example.com`,
      password: 'StrongPassword123!',
    });
    expect(resB.status).toBe(201);
    userB = {
      id: resB.body.data.user.id,
      email: resB.body.data.user.email,
      token: resB.body.data.accessToken,
    };
    createdUserIds.push(userB.id);
  });

  beforeEach(() => {
    mockStorage = new MockStorageService();
    mediaStorageService.setProvider(mockStorage);
  });

  afterAll(async () => {
    mediaStorageService.resetProvider();

    if (createdPostIds.length > 0) {
      await prisma.post.deleteMany({
        where: { id: { in: createdPostIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. Secure Image Processing & Validation Tests
  // =========================================================================
  describe('ImageProcessorService Validation', () => {
    it('validates and processes JPEG image into WebP format', async () => {
      const result = await ImageProcessorService.processAvatar(validJpegBuffer);
      expect(result.contentType).toBe('image/webp');
      expect(result.format).toBe('webp');
      expect(result.width).toBeLessThanOrEqual(512);
      expect(result.height).toBeLessThanOrEqual(512);
    });

    it('validates and processes PNG image into WebP format', async () => {
      const result = await ImageProcessorService.processCover(validPngBuffer);
      expect(result.contentType).toBe('image/webp');
      expect(result.format).toBe('webp');
      expect(result.width).toBeLessThanOrEqual(2400);
      expect(result.height).toBeLessThanOrEqual(1600);
    });

    it('validates and processes WebP image successfully', async () => {
      const result = await ImageProcessorService.processAvatar(validWebpBuffer);
      expect(result.contentType).toBe('image/webp');
      expect(result.format).toBe('webp');
    });

    it('rejects plain text disguised as an image file', async () => {
      const fakeBuffer = Buffer.from('This is not an image, it is plain text content.');
      await expect(ImageProcessorService.validateImage(fakeBuffer)).rejects.toThrow(
        InvalidImageError
      );
    });

    it('rejects SVG images to prevent XSS payloads in raster storage', async () => {
      const svgBuffer = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><circle cx="50" cy="50" r="50"/></svg>'
      );
      await expect(ImageProcessorService.validateImage(svgBuffer)).rejects.toThrow(
        InvalidImageError
      );
    });

    it('rejects empty buffer with clear validation error', async () => {
      await expect(ImageProcessorService.validateImage(Buffer.alloc(0))).rejects.toThrow(
        InvalidImageError
      );
    });

    it('rejects corrupted image buffer with invalid bytes', async () => {
      const corruptedBuffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x12, 0x34]);
      await expect(ImageProcessorService.validateImage(corruptedBuffer)).rejects.toThrow(
        InvalidImageError
      );
    });
  });

  // =========================================================================
  // 2. User Avatar API (POST & DELETE /api/v1/auth/me/avatar)
  // =========================================================================
  describe('User Avatar API', () => {
    it('requires authentication to upload an avatar (HTTP 401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/me/avatar')
        .attach('avatar', validJpegBuffer, 'avatar.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('uploads an avatar successfully for authenticated user (HTTP 200)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('avatar', validJpegBuffer, 'profile.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Avatar uploaded successfully');
      expect(res.body.data.user.avatarUrl).toContain('mock-supabase.test');
      expect(res.body.data.user.avatarUrl).toContain(userA.id);

      // Verify database updated
      const dbUser = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(dbUser?.avatarUrl).toBe(res.body.data.user.avatarUrl);
    });

    it('replaces existing avatar and cleans up previous file (HTTP 200)', async () => {
      // First avatar
      const res1 = await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('avatar', validPngBuffer, 'first.png');
      expect(res1.status).toBe(200);
      const firstUrl = res1.body.data.user.avatarUrl;

      // Replace avatar
      const res2 = await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('avatar', validWebpBuffer, 'second.webp');
      expect(res2.status).toBe(200);
      const secondUrl = res2.body.data.user.avatarUrl;

      expect(firstUrl).not.toBe(secondUrl);
      // Verify old avatar path was targeted for deletion in mock storage
      const oldPath = mockStorage.extractPathFromUrl(firstUrl, 'avatars');
      expect(mockStorage.deletedFiles).toContain(`avatars/${oldPath}`);
    });

    it('rejects avatar upload without file attachment (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-image file attachment (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('avatar', Buffer.from('console.log("hello world");'), 'script.js');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns HTTP 503 when media storage is not configured', async () => {
      mockStorage.configured = false;

      const res = await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('avatar', validJpegBuffer, 'avatar.jpg');

      expect(res.status).toBe(503);
      expect(res.body.message).toContain('not configured');
    });

    it('removes avatar and resets to null fallback (HTTP 200)', async () => {
      // Upload avatar first
      await request(app)
        .post('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('avatar', validJpegBuffer, 'temp.jpg');

      // Delete avatar
      const res = await request(app)
        .delete('/api/v1/auth/me/avatar')
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.avatarUrl).toBeNull();

      // Verify database
      const dbUser = await prisma.user.findUnique({ where: { id: userA.id } });
      expect(dbUser?.avatarUrl).toBeNull();
    });
  });

  // =========================================================================
  // 3. Post Cover API (POST & DELETE /api/v1/posts/:id/cover)
  // =========================================================================
  describe('Post Cover Image API', () => {
    let postAId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Essay with Cover Management',
          content: '## Architectural Story\n\nContent exploring cover images.',
          category: 'Architecture',
        });
      expect(res.status).toBe(201);
      postAId = res.body.data.post.id;
      createdPostIds.push(postAId);
    });

    it('requires authentication to upload post cover (HTTP 401)', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postAId}/cover`)
        .attach('cover', validJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects cover upload if authenticated user is NOT the post author (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postAId}/cover`)
        .set('Authorization', `Bearer ${userB.token}`)
        .attach('cover', validJpegBuffer, 'stolen-cover.jpg');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');
    });

    it('returns HTTP 404 if post does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/posts/00000000-0000-0000-0000-000000000000/cover')
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('cover', validJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('uploads cover image and alt text successfully by post author (HTTP 200)', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postAId}/cover`)
        .set('Authorization', `Bearer ${userA.token}`)
        .field('altText', 'Minimalist architectural façade')
        .attach('cover', validPngBuffer, 'facade.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.coverImageUrl).toContain('mock-supabase.test');
      expect(res.body.data.post.coverImageUrl).toContain(userA.id);
      expect(res.body.data.post.coverImageUrl).toContain(postAId);
      expect(res.body.data.post.coverImageAlt).toBe('Minimalist architectural façade');

      // Verify in database
      const dbPost = await prisma.post.findUnique({ where: { id: postAId } });
      expect(dbPost?.coverImageUrl).toBe(res.body.data.post.coverImageUrl);
      expect(dbPost?.coverImageAlt).toBe('Minimalist architectural façade');
    });

    it('rejects alt text exceeding 160 characters (HTTP 400)', async () => {
      const longAlt = 'A'.repeat(161);
      const res = await request(app)
        .post(`/api/v1/posts/${postAId}/cover`)
        .set('Authorization', `Bearer ${userA.token}`)
        .field('altText', longAlt)
        .attach('cover', validJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('replaces post cover image and cleans up old object (HTTP 200)', async () => {
      // Current cover
      const oldCoverUrl = (await prisma.post.findUnique({ where: { id: postAId } }))?.coverImageUrl;

      // Replace with new WebP image
      const res = await request(app)
        .post(`/api/v1/posts/${postAId}/cover`)
        .set('Authorization', `Bearer ${userA.token}`)
        .field('altText', 'Updated architectural view')
        .attach('cover', validWebpBuffer, 'new-cover.webp');

      expect(res.status).toBe(200);
      expect(res.body.data.post.coverImageAlt).toBe('Updated architectural view');
      expect(res.body.data.post.coverImageUrl).not.toBe(oldCoverUrl);

      // Verify old cover was cleaned up
      if (oldCoverUrl) {
        const oldPath = mockStorage.extractPathFromUrl(oldCoverUrl, 'post-covers');
        expect(mockStorage.deletedFiles).toContain(`post-covers/${oldPath}`);
      }
    });

    it('rejects cover deletion if not post author (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${postAId}/cover`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('deletes cover image successfully by post author (HTTP 200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${postAId}/cover`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.coverImageUrl).toBeNull();
      expect(res.body.data.post.coverImageAlt).toBeNull();

      // Verify in DB
      const dbPost = await prisma.post.findUnique({ where: { id: postAId } });
      expect(dbPost?.coverImageUrl).toBeNull();
      expect(dbPost?.coverImageAlt).toBeNull();
    });

    it('cleans up cover from storage when post is deleted (HTTP 200)', async () => {
      // 1. Create a temporary post with cover
      const tempPostRes = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          title: 'Post to be deleted with cover',
          content: 'Story content.',
          category: 'Engineering',
        });
      const tempId = tempPostRes.body.data.post.id;

      // 2. Upload cover
      const uploadRes = await request(app)
        .post(`/api/v1/posts/${tempId}/cover`)
        .set('Authorization', `Bearer ${userA.token}`)
        .attach('cover', validJpegBuffer, 'will-be-deleted.jpg');
      expect(uploadRes.status).toBe(200);
      const coverUrl = uploadRes.body.data.post.coverImageUrl;

      // 3. Delete the post
      const deleteRes = await request(app)
        .delete(`/api/v1/posts/${tempId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      expect(deleteRes.status).toBe(200);

      // 4. Verify storage cleanup was called for the deleted post's cover
      const coverPath = mockStorage.extractPathFromUrl(coverUrl, 'post-covers');
      expect(mockStorage.deletedFiles).toContain(`post-covers/${coverPath}`);
    });
  });
});
