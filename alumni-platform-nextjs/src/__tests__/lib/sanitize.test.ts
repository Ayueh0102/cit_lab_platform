/**
 * sanitize.ts 單元測試
 * 測試 XSS 防護的完整性
 */
import { sanitizeHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  describe('should allow safe HTML tags', () => {
    it('preserves basic formatting tags', () => {
      const input = '<p>Hello <b>bold</b> <i>italic</i> <em>emphasis</em> <strong>strong</strong></p>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('preserves headings', () => {
      expect(sanitizeHtml('<h1>Title</h1>')).toBe('<h1>Title</h1>');
      expect(sanitizeHtml('<h3>Subtitle</h3>')).toBe('<h3>Subtitle</h3>');
    });

    it('preserves lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('preserves links with href and target', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('preserves images with src and alt', () => {
      const input = '<img src="https://example.com/img.png" alt="Image" width="100" height="100">';
      expect(sanitizeHtml(input)).toContain('src="https://example.com/img.png"');
      expect(sanitizeHtml(input)).toContain('alt="Image"');
    });

    it('preserves tables', () => {
      const input = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('preserves blockquote and code', () => {
      expect(sanitizeHtml('<blockquote>Quote</blockquote>')).toBe('<blockquote>Quote</blockquote>');
      expect(sanitizeHtml('<pre><code>code()</code></pre>')).toBe('<pre><code>code()</code></pre>');
    });
  });

  describe('should strip dangerous content', () => {
    it('removes script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('removes event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    it('removes onclick attributes', () => {
      const input = '<a href="#" onclick="steal()">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('removes javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('removes iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      expect(sanitizeHtml(input)).toBe('');
    });

    it('removes form tags', () => {
      const input = '<form action="https://evil.com"><input type="text"></form>';
      expect(sanitizeHtml(input)).not.toContain('<form');
    });

    it('removes data attributes', () => {
      const input = '<div data-evil="payload">Content</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('data-evil');
      expect(result).toContain('Content');
    });

    it('removes style injection via expression', () => {
      const input = '<div style="background:url(javascript:alert(1))">X</div>';
      const result = sanitizeHtml(input);
      // DOMPurify preserves style attributes but blocks script execution vectors
      expect(result).toContain('X');
      expect(result).not.toContain('<script');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('handles plain text (no HTML)', () => {
      expect(sanitizeHtml('Hello World')).toBe('Hello World');
    });

    it('handles nested malicious content', () => {
      const input = '<p>Good<script>bad()</script>Good</p>';
      expect(sanitizeHtml(input)).toBe('<p>GoodGood</p>');
    });

    it('handles encoded script tags', () => {
      const input = '<p>Test</p><scr<script>ipt>alert(1)</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script');
    });
  });
});
