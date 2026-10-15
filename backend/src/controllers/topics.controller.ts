import type { Request, Response } from 'express';
import { TopicsService } from '../services/topics.service';

export class TopicsController {
  /**
   * GET /api/v1/topics
   * Public endpoint that returns all active categories and their article counts.
   */
  static async getTopics(_req: Request, res: Response): Promise<void> {
    try {
      const topics = await TopicsService.getTopics();

      res.status(200).json({
        success: true,
        message: 'Topics retrieved successfully',
        data: {
          topics,
        },
      });
    } catch (error: any) {
      console.error('[TopicsController] Failed to retrieve topics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve topics.',
      });
    }
  }
}
