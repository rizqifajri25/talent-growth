import { Router } from 'express';
import { CommentsController } from '../controllers/comments.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Post-level comment endpoints
router.get('/posts/:id/comments', CommentsController.getComments);
router.post('/posts/:id/comments', requireAuth, CommentsController.createComment);

// Direct comment item mutations (ownership enforced)
router.put('/comments/:id', requireAuth, CommentsController.updateComment);
router.delete('/comments/:id', requireAuth, CommentsController.deleteComment);

export default router;
