'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

/**
 * FallbackProps - 傳遞給 FallbackComponent 的屬性
 * 符合 react-error-boundary 套件的標準 API
 */
export interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface Props {
  children: ReactNode;
  /** 簡單的 fallback 元素 */
  fallback?: ReactNode;
  /** 接收 error 和 resetErrorBoundary 的 fallback 元件 */
  FallbackComponent?: React.ComponentType<FallbackProps>;
  /** render prop 形式的 fallback */
  fallbackRender?: (props: FallbackProps) => ReactNode;
  /** 錯誤發生時的回調 */
  onError?: (error: Error, info: { componentStack: string }) => void;
  /** 重置時的回調 */
  onReset?: (details: { reason: 'imperative-api' | 'keys'; args?: unknown[]; prev?: unknown[]; next?: unknown[] }) => void;
  /** 當這些值變更時自動重置 error boundary */
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary 元件
 * 
 * 符合 react-error-boundary 套件的標準 API：
 * - fallback: 簡單的 fallback 元素
 * - FallbackComponent: 接收 error 和 resetErrorBoundary 的元件
 * - fallbackRender: render prop 形式
 * - onError: 錯誤回調
 * - onReset: 重置回調
 * - resetKeys: 自動重置觸發器
 * 
 * @see https://github.com/bvaughn/react-error-boundary
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, { componentStack: errorInfo.componentStack || '' });
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // resetKeys 變更時自動重置
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeysChanged = this.props.resetKeys.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );
      
      if (hasKeysChanged) {
        this.props.onReset?.({
          reason: 'keys',
          prev: prevProps.resetKeys,
          next: this.props.resetKeys,
        });
        this.setState({ hasError: false, error: null });
      }
    }
  }

  resetErrorBoundary = (...args: unknown[]): void => {
    this.props.onReset?.({ reason: 'imperative-api', args });
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, FallbackComponent, fallbackRender } = this.props;

    if (hasError && error) {
      const fallbackProps: FallbackProps = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      };

      // 優先順序：fallbackRender > FallbackComponent > fallback > 預設
      if (fallbackRender) {
        return fallbackRender(fallbackProps);
      }

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      if (fallback) {
        return fallback;
      }

      // 預設使用 ErrorFallback
      return (
        <ErrorFallback
          error={error}
          resetError={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;

