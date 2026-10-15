import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Strict security schema: Disallow remote images, raw HTML tags, and unsafe URI schemes.
const secureSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ['href', /^https?:\/\//i, /^mailto:/i, /^#/i, /^\//i],
      'title',
      'target',
      'rel',
    ],
  },
  // Ensure script, iframe, object, embed, style, form are completely forbidden
  tagNames: defaultSchema.tagNames?.filter(
    (tag) => !['script', 'iframe', 'object', 'embed', 'style', 'form', 'input'].includes(tag)
  ),
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const trimmed = (content || '').trim();
  const containerClass = `aurora-markdown-body ${className}`.trim();

  if (!trimmed) {
    return <div className={`aurora-markdown-body empty ${className}`.trim()} />;
  }

  return (
    <div className={containerClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, secureSanitizeSchema]]}
        components={{
          // Safe Anchor: enforce noopener noreferrer and open in new tab for external URLs
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          a({ href, children, node, ...props }) {
            const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Safe Image: disable remote third-party image tracking; render clean editorial text badge
          img({ alt }) {
            return (
              <span className="markdown-image-badge" title="External image rendering disabled">
                <span className="markdown-image-icon" aria-hidden="true">🖼️</span>
                <span>[Image: {alt || 'Image omitted for security'}]</span>
              </span>
            );
          },
          // Code & Syntax Styling
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          code({ className: codeClassName, children, node, ...props }) {
            const isInline = !codeClassName && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="markdown-inline-code" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          pre({ children, node, ...props }) {
            return (
              <pre className="markdown-code-block" {...props}>
                {children}
              </pre>
            );
          },
          // Table wrapper for responsive scrolling
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          table({ children, node, ...props }) {
            return (
              <div className="markdown-table-wrapper">
                <table className="markdown-table" {...props}>
                  {children}
                </table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
