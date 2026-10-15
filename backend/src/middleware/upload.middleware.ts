import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const memoryStorage = multer.memoryStorage();

function createFileFilter() {
  return (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type "${file.mimetype}". Allowed types: image/jpeg, image/png, image/webp.`
        )
      );
    }
  };
}

// Avatar upload multer instance (5MB limit)
const avatarMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MiB
    files: 1,
  },
  fileFilter: createFileFilter(),
});

// Cover upload multer instance (8MB limit)
const coverMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MiB
    files: 1,
  },
  fileFilter: createFileFilter(),
});

/**
 * Middleware wrapper for single avatar upload with graceful error responses.
 */
export function uploadAvatarMiddleware(req: Request, res: Response, next: NextFunction): void {
  avatarMulter.single('avatar')(req, res, (err: any) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'Avatar file size exceeds the 5MB limit.',
          errors: [{ field: 'avatar', message: 'File size exceeds 5MB limit.' }],
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: err.message,
        errors: [{ field: 'avatar', message: err.message }],
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: err.message || 'File upload error.',
      errors: [{ field: 'avatar', message: err.message || 'File upload error.' }],
    });
  });
}

/**
 * Middleware wrapper for single post cover upload with graceful error responses.
 */
export function uploadCoverMiddleware(req: Request, res: Response, next: NextFunction): void {
  coverMulter.single('cover')(req, res, (err: any) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'Cover image file size exceeds the 8MB limit.',
          errors: [{ field: 'cover', message: 'File size exceeds 8MB limit.' }],
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: err.message,
        errors: [{ field: 'cover', message: err.message }],
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: err.message || 'File upload error.',
      errors: [{ field: 'cover', message: err.message || 'File upload error.' }],
    });
  });
}
