import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';

describe('MarkdownRenderer: Security & Safe Content Rendering', () => {
  it('renders standard Markdown elements (headings, bold, italic, lists, blockquotes)', () => {
    const markdown = `
# Editorial Heading 1
## Section Heading 2
### Subsection Heading 3

This is a paragraph with **bold text** and *italic perspective*.

- First bullet item
- Second bullet item

1. First ordered item
2. Second ordered item

> This is a thoughtful architectural quote.
`;

    const html = renderToString(<MarkdownRenderer content={markdown} />);

    expect(html).toContain('<h1>Editorial Heading 1</h1>');
    expect(html).toContain('<h2>Section Heading 2</h2>');
    expect(html).toContain('<h3>Subsection Heading 3</h3>');
    expect(html).toContain('<strong>bold text</strong>');
    expect(html).toContain('<em>italic perspective</em>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>First bullet item</li>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('This is a thoughtful architectural quote.');
  });

  it('renders fenced code blocks and inline code securely', () => {
    const markdown = 'Here is inline `const x = 42;` and a block:\n\n```typescript\nfunction greet() {\n  return "hello";\n}\n```';
    const html = renderToString(<MarkdownRenderer content={markdown} />);

    expect(html).toContain('<code class="markdown-inline-code">const x = 42;</code>');
    expect(html).toContain('<pre class="markdown-code-block">');
    expect(html).toContain('function greet()');
  });

  it('renders GFM tables cleanly', () => {
    const markdown = `
| Pattern | Advantage |
| :--- | :--- |
| Aurora | Anti-slop minimalism |
| Offset | Deterministic ordering |
`;
    const html = renderToString(<MarkdownRenderer content={markdown} />);

    expect(html).toContain('<table class="markdown-table">');
    expect(html).toContain('Pattern</th>');
    expect(html).toContain('Advantage</th>');
    expect(html).toContain('Anti-slop minimalism</td>');
  });

  it('renders plain text legacy content gracefully without breaking', () => {
    const legacyPlain = 'This is an essay written before Phase 8 that contains zero markdown symbols.';
    const html = renderToString(<MarkdownRenderer content={legacyPlain} />);

    expect(html).toContain('This is an essay written before Phase 8');
    expect(html).toContain('<p>');
  });

  // =========================================================================
  // Strict Security & Anti-XSS Verification
  // =========================================================================
  it('neutralizes <script> payloads completely with NO active script tag', () => {
    const dangerousScript = 'Safe intro text <script>alert("critical-xss-attack")</script> safe outro text';
    const html = renderToString(<MarkdownRenderer content={dangerousScript} />);

    // Must NOT contain an opening <script> tag
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toContain('alert("critical-xss-attack")');
  });

  it('strips dangerous event handlers (onerror, onload, onclick, onmouseover)', () => {
    const dangerousMarkup = '<img src="x" onerror="alert(\'xss\')" /> <b onclick="doBadThing()">Click me</b>';
    const html = renderToString(<MarkdownRenderer content={dangerousMarkup} />);

    expect(html).not.toContain('onerror');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('doBadThing');
  });

  it('disallows dangerous javascript: URLs in hyperlinks', () => {
    const dangerousLink = '[Exploit](javascript:alert("hacked"))';
    const html = renderToString(<MarkdownRenderer content={dangerousLink} />);

    // The href attribute must NOT contain javascript:
    expect(html).not.toMatch(/href="javascript:/i);
  });

  it('adds target="_blank" and rel="noopener noreferrer" to external links for tab-nabbing protection', () => {
    const externalLink = '[Read Architectural Post](https://editorial.example.com/craft)';
    const html = renderToString(<MarkdownRenderer content={externalLink} />);

    expect(html).toContain('href="https://editorial.example.com/craft"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('prevents arbitrary remote image loading to protect user privacy', () => {
    const remoteImage = '![Architecture Comp](https://untrusted-tracker.com/pixel.png)';
    const html = renderToString(<MarkdownRenderer content={remoteImage} />);

    // Must NOT render an <img> tag pointing to the remote server
    expect(html).not.toContain('<img');
    expect(html).toContain('markdown-image-badge');
    expect(html).toContain('Architecture Comp');
  });

  it('handles empty or whitespace-only markdown gracefully', () => {
    const emptyHtml = renderToString(<MarkdownRenderer content="" />);
    expect(emptyHtml).toContain('aurora-markdown-body empty');

    const whitespaceHtml = renderToString(<MarkdownRenderer content="     " />);
    expect(whitespaceHtml).toContain('aurora-markdown-body empty');
  });
});
