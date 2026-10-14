import { Router } from 'express';
import { PostsController } from '../controllers/posts.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Public endpoints
router.get('/', PostsController.getAll);
router.get('/:id', PostsController.getById);

// Protected endpoints (require authentication)
router.post('/', requireAuth, PostsController.create);
router.put('/:id', requireAuth, PostsController.update);
router.delete('/:id', requireAuth, PostsController.delete);

export default router;
