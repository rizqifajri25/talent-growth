import { Router } from 'express';
import { PostsController } from '../controllers/posts.controller';
import { requireAuth } from '../middleware/requireAuth';
import { uploadCoverMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Public endpoints
router.get('/', PostsController.getAll);
router.get('/:id', PostsController.getById);

// Protected endpoints (require authentication)
router.post('/', requireAuth, PostsController.create);
router.put('/:id', requireAuth, PostsController.update);
router.delete('/:id', requireAuth, PostsController.delete);

// Cover image endpoints (Phase 9)
router.post('/:id/cover', requireAuth, uploadCoverMiddleware, PostsController.uploadCover);
router.delete('/:id/cover', requireAuth, PostsController.deleteCover);

export default router;

