/**
 * Strips Markdown formatting syntax from raw text to produce
 * a clean, human-readable plain text string suitable for cards and excerpts.
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // 1. Remove fenced code blocks completely (including content)
  text = text.replace(/```[\s\S]*?```/g, ' ');

  // 2. Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 3. Remove image syntax but keep alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 4. Remove links but keep anchor text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 5. Remove headers (# Header)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 6. Remove blockquotes (> Quote)
  text = text.replace(/^>\s+/gm, '');

  // 7. Remove list markers (-, *, +, 1.)
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // 8. Remove table separator lines (|---|---|)
  text = text.replace(/^\|?[-:\s|]+\|?$/gm, '');

  // 9. Replace pipe symbols from tables with spaces
  text = text.replace(/\|/g, ' ');

  // 10. Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // 11. Remove bold and italic formatting
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  text = text.replace(/___(.*?)___/g, '$1');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');

  // 12. Remove strikethrough
  text = text.replace(/~~(.*?)~~/g, '$1');

  // 13. Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // 14. Normalize whitespace and newlines to a single space
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Creates a clean plain-text excerpt from raw Markdown content.
 */
export function getExcerpt(content: string, maxLength = 180): string {
  const plainText = stripMarkdown(content);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return `${plainText.substring(0, maxLength).trim()}...`;
}
