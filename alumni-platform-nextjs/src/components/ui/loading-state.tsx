/**
 * 優化的 Loading 狀態組件
 */

'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingStateProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  minHeight?: string | number;
}

export function LoadingState({ 
  message = '載入中...', 
  size = 'xl',
  minHeight = '60vh',
}: LoadingStateProps) {
  return (
    <Center style={{ minHeight }}>
      <Stack align="center" gap="md">
        <Loader size={size} />
        {message && (
          <Text c="dimmed" size="sm">
            {message}
          </Text>
        )}
      </Stack>
    </Center>
  );
}

// 骨架屏加載狀態
export function SkeletonCard() {
  return (
    <div
      style={{
        height: '200px',
        borderRadius: '8px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// 添加 shimmer 動畫到全局樣式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}


