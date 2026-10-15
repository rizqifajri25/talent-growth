import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';
import { uploadAvatarMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Public endpoints
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected endpoints
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);
router.patch('/me', requireAuth, AuthController.updateMe);

// Avatar endpoints (Phase 9)
router.post('/me/avatar', requireAuth, uploadAvatarMiddleware, AuthController.uploadAvatar);
router.delete('/me/avatar', requireAuth, AuthController.deleteAvatar);

export default router;

