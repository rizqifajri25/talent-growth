import { Router } from 'express';
import { TopicsController } from '../controllers/topics.controller';

const router = Router();

router.get('/', TopicsController.getTopics);

export default router;
