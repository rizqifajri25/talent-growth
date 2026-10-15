import React, { useState, useRef, useCallback } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  ariaDescribedBy?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  id = 'post-content',
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = 'Write your perspective here in Markdown. Formatting, headers, code, and lists are supported...',
  maxLength = 50000,
  rows = 14,
  ariaDescribedBy,
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Inserts markdown formatting syntax around selected text or at current cursor position.
   */
  const insertSyntax = useCallback(
    (prefix: string, suffix = '', placeholderText = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const textToWrap = selected || placeholderText;

      const replacement = `${prefix}${textToWrap}${suffix}`;
      const newValue = value.substring(0, start) + replacement + value.substring(end);

      onChange(newValue);

      // Restore focus and position cursor precisely
      requestAnimationFrame(() => {
        textarea.focus();
        if (selected) {
          textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        } else {
          textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholderText.length);
        }
      });
    },
    [value, onChange]
  );

  return (
    <div className="aurora-markdown-editor">
      {/* Editor Header: Write/Preview Tabs + Quick Syntax Help */}
      <div className="editor-tab-bar">
        <div className="editor-mode-tabs" role="tablist" aria-label="Editor display modes">
          <button
            type="button"
            className={`editor-tab-btn ${mode === 'write' ? 'active' : ''}`}
            onClick={() => setMode('write')}
            role="tab"
            aria-selected={mode === 'write'}
            aria-controls={`${id}-write-panel`}
            id={`${id}-write-tab`}
          >
            <span aria-hidden="true">✍️</span>
            <span>Write</span>
          </button>
          <button
            type="button"
            className={`editor-tab-btn ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => setMode('preview')}
            role="tab"
            aria-selected={mode === 'preview'}
            aria-controls={`${id}-preview-panel`}
            id={`${id}-preview-tab`}
          >
            <span aria-hidden="true">👁️</span>
            <span>Preview</span>
          </button>
        </div>

        <span className="markdown-supported-badge" title="Markdown & GitHub Flavored Markdown Supported">
          Markdown Supported
        </span>
      </div>

      {/* Write Mode */}
      {mode === 'write' && (
        <div id={`${id}-write-panel`} role="tabpanel" aria-labelledby={`${id}-write-tab`}>
          {/* Lightweight Editorial Toolbar */}
          <div className="markdown-toolbar" role="toolbar" aria-label="Markdown formatting tools">
            <button
              type="button"
              className="toolbar-btn"
              title="Heading 2 (##)"
              aria-label="Insert Heading 2"
              onClick={() => insertSyntax('## ', '', 'Section Heading')}
              disabled={disabled}
            >
              H2
            </button>
            <button
              type="button"
              className="toolbar-btn"
              title="Heading 3 (###)"
              aria-label="Insert Heading 3"
              onClick={() => insertSyntax('### ', '', 'Subsection')}
              disabled={disabled}
            >
              H3
            </button>
            <span className="toolbar-separator" aria-hidden="true" />
            <button
              type="button"
              className="toolbar-btn bold-btn"
              title="Bold (**text**)"
              aria-label="Insert Bold text"
              onClick={() => insertSyntax('**', '**', 'bold text')}
              disabled={disabled}
            >
              B
            </button>
            <button
              type="button"
              className="toolbar-btn italic-btn"
              title="Italic (*text*)"
              aria-label="Insert Italic text"
              onClick={() => insertSyntax('*', '*', 'italic text')}
              disabled={disabled}
            >
              I
            </button>
            <span className="toolbar-separator" aria-hidden="true" />
            <button
              type="button"
              className="toolbar-btn"
              title="Link ([title](url))"
              aria-label="Insert Link"
              onClick={() => insertSyntax('[', '](https://example.com)', 'link title')}
              disabled={disabled}
            >
              🔗 Link
            </button>
            <button
              type="button"
              className="toolbar-btn"
              title="Blockquote (> quote)"
              aria-label="Insert Blockquote"
              onClick={() => insertSyntax('> ', '', 'Quotation or key takeaway')}
              disabled={disabled}
            >
              &ldquo;&rdquo; Quote
            </button>
            <button
              type="button"
              className="toolbar-btn"
              title="Bullet List (- item)"
              aria-label="Insert Bullet List"
              onClick={() => insertSyntax('- ', '', 'List item')}
              disabled={disabled}
            >
              • List
            </button>
            <button
              type="button"
              className="toolbar-btn"
              title="Numbered List (1. item)"
              aria-label="Insert Numbered List"
              onClick={() => insertSyntax('1. ', '', 'First item')}
              disabled={disabled}
            >
              1. List
            </button>
            <span className="toolbar-separator" aria-hidden="true" />
            <button
              type="button"
              className="toolbar-btn code-btn"
              title="Inline Code (`code`)"
              aria-label="Insert Inline Code"
              onClick={() => insertSyntax('`', '`', 'code')}
              disabled={disabled}
            >
              &lt;/&gt;
            </button>
            <button
              type="button"
              className="toolbar-btn code-btn"
              title="Code Block (```)"
              aria-label="Insert Code Block"
              onClick={() => insertSyntax('```typescript\n', '\n```', '// Your code here')}
              disabled={disabled}
            >
              Block
            </button>
          </div>

          <textarea
            ref={textareaRef}
            id={id}
            className={`porcelain-textarea ${hasError ? 'input-error' : ''}`}
            placeholder={placeholder}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
          />
        </div>
      )}

      {/* Preview Mode */}
      {mode === 'preview' && (
        <div
          id={`${id}-preview-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-preview-tab`}
          className="markdown-preview-pane"
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <div className="preview-empty-hint">
              <span className="preview-empty-icon" aria-hidden="true">📄</span>
              <p className="preview-empty-text">
                Nothing to preview yet. Switch back to <strong>Write</strong> mode to draft
                your essay content in Markdown.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
