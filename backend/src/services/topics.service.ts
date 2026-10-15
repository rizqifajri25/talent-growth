import { prisma } from '../config/prisma';

export interface TopicItem {
  name: string;
  postCount: number;
}

export class TopicsService {
  /**
   * Retrieves all non-empty categories used by published articles with aggregated post counts.
   * Excludes null, empty, or whitespace-only categories.
   * Merges case-insensitive duplicates and orders deterministically by name alphabetically.
   */
  static async getTopics(): Promise<TopicItem[]> {
    const groups = await prisma.post.groupBy({
      by: ['category'],
      where: {
        category: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    });

    const topicMap = new Map<string, TopicItem>();

    for (const group of groups) {
      if (!group.category) continue;
      const trimmed = group.category.trim();
      if (!trimmed) continue;

      const key = trimmed.toLowerCase();
      const existing = topicMap.get(key);
      const count = group._count._all || 0;

      if (existing) {
        existing.postCount += count;
      } else {
        topicMap.set(key, {
          name: trimmed,
          postCount: count,
        });
      }
    }

    return Array.from(topicMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }
}
