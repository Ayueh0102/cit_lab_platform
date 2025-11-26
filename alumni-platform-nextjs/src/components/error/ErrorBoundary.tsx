'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary 元件
 * 捕獲子元件的 JavaScript 錯誤，防止整個頁面崩潰
 * 
 * 注意：Error Boundary 必須使用 class component
 * 因為 React hooks 不支援 componentDidCatch 和 getDerivedStateFromError
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染顯示錯誤 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 記錄錯誤到 console（開發環境）
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 呼叫自訂錯誤處理函數（如果有提供）
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 這裡可以將錯誤發送到錯誤追蹤服務（如 Sentry）
    // logErrorToService(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果有自訂 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否則使用預設的 ErrorFallback
      return (
        <ErrorFallback
          error={this.state.error || undefined}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

