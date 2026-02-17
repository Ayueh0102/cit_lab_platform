import DOMPurify from 'isomorphic-dompurify';

/**
 * 淨化 HTML 內容，防止 XSS 攻擊。
 * 允許基本格式標籤（粗體、斜體、連結等），移除所有 script 和事件處理器。
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'hr', 'sub', 'sup',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'class', 'style', 'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
  });
}
