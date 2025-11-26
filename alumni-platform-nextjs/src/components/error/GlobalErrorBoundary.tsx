'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

/**
 * 全域 Error Boundary 包裝器
 * 用於 layout.tsx 中包裹整個應用程式
 */
export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // 在生產環境中，可以將錯誤發送到錯誤追蹤服務
    console.error('[GlobalErrorBoundary] Uncaught error:', error);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <ErrorFallback
          title="系統發生錯誤"
          message="很抱歉，系統發生了一些問題。我們已記錄此錯誤，請嘗試重新整理頁面。"
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

