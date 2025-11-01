/**
 * 性能監控工具
 * 用於追蹤和優化應用性能
 */

// 性能計時器
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number>;

  constructor() {
    this.startTime = performance.now();
    this.marks = new Map();
  }

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark 
      ? this.marks.get(startMark) || this.startTime
      : this.startTime;
    
    const duration = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ [Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  getTotal(): number {
    return performance.now() - this.startTime;
  }
}

// API 請求性能追蹤
export function trackApiPerformance(url: string, startTime: number) {
  const duration = performance.now() - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    const color = duration < 200 ? '🟢' : duration < 500 ? '🟡' : '🔴';
    console.log(`${color} [API] ${url}: ${duration.toFixed(2)}ms`);
  }
  
  // 可以在這裡發送到分析服務
  return duration;
}

// 組件渲染性能追蹤
export function useRenderPerformance(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      console.log(`🎨 [Render] ${componentName}: ${duration.toFixed(2)}ms`);
    };
  }
  
  return () => {};
}

// 頁面加載性能追蹤
export function trackPageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      const metrics = {
        DNS: perfData.domainLookupEnd - perfData.domainLookupStart,
        TCP: perfData.connectEnd - perfData.connectStart,
        Request: perfData.responseStart - perfData.requestStart,
        Response: perfData.responseEnd - perfData.responseStart,
        DOM: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        Load: perfData.loadEventEnd - perfData.loadEventStart,
        Total: perfData.loadEventEnd - perfData.fetchStart,
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.table(metrics);
      }
    }
  });
}

// 內存使用監控
export function checkMemoryUsage() {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;
  const used = (memory.usedJSHeapSize / 1048576).toFixed(2);
  const total = (memory.totalJSHeapSize / 1048576).toFixed(2);
  const limit = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

  if (process.env.NODE_ENV === 'development') {
    console.log(`💾 [Memory] Used: ${used}MB / Total: ${total}MB / Limit: ${limit}MB`);
  }

  return { used, total, limit };
}

// 圖片懶加載優化
export function optimizeImage(src: string, width?: number): string {
  // 可以整合圖片 CDN 或優化服務
  if (width) {
    return `${src}?w=${width}&q=80`;
  }
  return src;
}

// 節流函數
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 防抖函數
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}


