import { Router } from 'express';
import { AuthorsController } from '../controllers/authors.controller';

const router = Router();

// Public endpoints
router.get('/', AuthorsController.getAllAuthors);
router.get('/:id', AuthorsController.getAuthorById);

export default router;
