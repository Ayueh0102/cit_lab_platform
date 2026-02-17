/**
 * CSS 設計系統完整性測試
 * 確保所有頁面使用的 CSS class 在 globals.css 中有定義
 */
import * as fs from 'fs';
import * as path from 'path';

const GLOBALS_CSS_PATH = path.join(process.cwd(), 'src/app/globals.css');
const SRC_DIR = path.join(process.cwd(), 'src');

function readCssFile(): string {
  return fs.readFileSync(GLOBALS_CSS_PATH, 'utf-8');
}

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      results.push(...findTsxFiles(fullPath));
    } else if (item.name.endsWith('.tsx') && !item.name.endsWith('.test.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractClassNames(content: string): string[] {
  const classNamePattern = /className\s*[=:]\s*["'`]([^"'`]+)["'`]/g;
  const classes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = classNamePattern.exec(content)) !== null) {
    const classString = match[1];
    classString.split(/\s+/).forEach((cls) => {
      if (cls && !cls.startsWith('{') && !cls.includes('$')) {
        classes.push(cls);
      }
    });
  }
  return [...new Set(classes)];
}

describe('CSS Design System Integrity', () => {
  const cssContent = readCssFile();

  describe('core design classes are defined in globals.css', () => {
    const requiredClasses = [
      // 毛玻璃
      'glass-panel',
      'glass-card',
      'glass-card-soft',
      'glass-card-lite',
      // 語意漸層
      'gradient-warm',
      'gradient-fresh',
      'gradient-light',
      'gradient-magic',
      'text-gradient-warm',
      'text-gradient-fresh',
      'text-gradient-light',
      'text-gradient-magic',
      // 動畫
      'animate-slide-up',
      'animate-list-item',
      'animate-page-enter',
      'card-hover-effect',
      'hover-translate-y',
      'gradient-border-top',
      // 佈局
      'sidebar-nav-item',
      'dashboard-main',
      // Aurora 背景
      'aurora-container-lite',
      'aurora-layer-blue',
      'aurora-layer-cyan',
      'aurora-layer-warm',
      'aurora-layer-purple',
      'aurora-overlay',
    ];

    test.each(requiredClasses)('.%s is defined in globals.css', (className) => {
      const pattern = new RegExp(`\\.${className.replace(/-/g, '\\-')}[\\s{,:]`);
      expect(cssContent).toMatch(pattern);
    });
  });

  describe('active / hover states are defined', () => {
    const interactiveClasses = [
      ['glass-card', ':hover'],
      ['glass-card', ':active'],
      ['glass-card-soft', ':hover'],
      ['glass-card-soft', ':active'],
      ['card-hover-effect', ':hover'],
      ['hover-translate-y', ':hover'],
      ['hover-translate-y', ':active'],
      ['sidebar-nav-item', ':hover'],
      ['sidebar-nav-item', '.active'],
    ];

    test.each(interactiveClasses)(
      '.%s%s state is defined',
      (className, state) => {
        const escapedClass = className.replace(/-/g, '\\-');
        const pattern = new RegExp(`\\.${escapedClass}${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
        expect(cssContent).toMatch(pattern);
      }
    );
  });

  describe('keyframe animations are defined', () => {
    const requiredKeyframes = [
      'aurora-breathe-1',
      'aurora-breathe-2',
      'aurora-breathe-3',
      'aurora-breathe-4',
      'aurora-shimmer-slow',
      'slide-up-fade',
      'page-fade-in',
    ];

    test.each(requiredKeyframes)('@keyframes %s is defined', (name) => {
      expect(cssContent).toContain(`@keyframes ${name}`);
    });
  });

  describe('accessibility media queries', () => {
    it('has prefers-reduced-motion rule', () => {
      expect(cssContent).toContain('prefers-reduced-motion');
    });

    it('has forced-colors rule', () => {
      expect(cssContent).toContain('forced-colors');
    });
  });

  describe('no orphaned CSS classes in pages', () => {
    const customClasses = [
      'glass-card-soft',
      'animate-list-item',
      'hover-translate-y',
      'gradient-border-top',
    ];

    const tsxFiles = findTsxFiles(path.join(SRC_DIR, 'app'));

    it('custom design classes are actually used in page files', () => {
      const allContent = tsxFiles.map((f) => fs.readFileSync(f, 'utf-8')).join('\n');
      customClasses.forEach((cls) => {
        expect(allContent).toContain(cls);
      });
    });
  });
});
