import sharp from 'sharp';

export class InvalidImageError extends Error {
  constructor(message = 'Invalid or unsupported image file.') {
    super(message);
    this.name = 'InvalidImageError';
  }
}

export class ImageTooLargeError extends Error {
  constructor(message = 'Image dimensions or pixel count exceed safety limits.') {
    super(message);
    this.name = 'ImageTooLargeError';
  }
}

export interface ProcessedImageResult {
  buffer: Buffer;
  contentType: 'image/webp';
  width: number;
  height: number;
  format: 'webp';
}

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif']);
const MAX_PIXELS = 40_000_000; // 40 Megapixels

export class ImageProcessorService {
  /**
   * Validates that the buffer contains a legitimate raster image
   * supported by our security policy (JPEG, PNG, WebP, AVIF).
   * Rejects SVG, HTML, executables, corrupted files, and decompression bombs.
   */
  static async validateImage(buffer: Buffer): Promise<sharp.Metadata> {
    if (!buffer || buffer.length === 0) {
      throw new InvalidImageError('Uploaded file buffer is empty.');
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(buffer, { failOn: 'error' }).metadata();
    } catch {
      throw new InvalidImageError(
        'The uploaded file is not a valid or readable image. Only JPEG, PNG, and WebP are allowed.'
      );
    }

    if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
      throw new InvalidImageError(
        `Unsupported image format "${metadata.format || 'unknown'}". Allowed formats: JPEG, PNG, and WebP.`
      );
    }

    // Check for decompression bomb risk (excessive pixel count)
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const pixels = width * height;

    if (pixels > MAX_PIXELS) {
      throw new ImageTooLargeError(
        `Image dimensions (${width}x${height} = ${pixels} pixels) exceed safety limit of 40 Megapixels.`
      );
    }

    return metadata;
  }

  /**
   * Processes, crops, and normalizes a user avatar into a square WebP image (max 512x512).
   * EXIF and metadata are stripped to eliminate privacy risks.
   */
  static async processAvatar(buffer: Buffer): Promise<ProcessedImageResult> {
    await this.validateImage(buffer);

    try {
      const processed = await sharp(buffer)
        .rotate() // auto-orient based on EXIF before stripping
        .resize({
          width: 512,
          height: 512,
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: processed.data,
        contentType: 'image/webp',
        width: processed.info.width,
        height: processed.info.height,
        format: 'webp',
      };
    } catch (err: any) {
      if (err instanceof InvalidImageError || err instanceof ImageTooLargeError) {
        throw err;
      }
      throw new InvalidImageError('Failed to process avatar image.');
    }
  }

  /**
   * Processes and normalizes an article cover into an editorial WebP image (max 2400x1600).
   * Preserves aspect ratio without artificial upscaling. Metadata stripped.
   */
  static async processCover(buffer: Buffer): Promise<ProcessedImageResult> {
    await this.validateImage(buffer);

    try {
      const processed = await sharp(buffer)
        .rotate() // auto-orient based on EXIF before stripping
        .resize({
          width: 2400,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: processed.data,
        contentType: 'image/webp',
        width: processed.info.width,
        height: processed.info.height,
        format: 'webp',
      };
    } catch (err: any) {
      if (err instanceof InvalidImageError || err instanceof ImageTooLargeError) {
        throw err;
      }
      throw new InvalidImageError('Failed to process cover image.');
    }
  }
}
