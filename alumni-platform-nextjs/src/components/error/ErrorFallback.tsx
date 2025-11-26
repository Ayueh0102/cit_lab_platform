'use client';

import { Container, Title, Text, Button, Stack, Paper, Group, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

/**
 * ErrorFallback 屬性
 * 符合 react-error-boundary FallbackProps 標準
 */
interface ErrorFallbackProps {
  /** 錯誤物件 */
  error?: Error;
  /** 重置錯誤邊界的函數（符合 react-error-boundary API） */
  resetErrorBoundary?: () => void;
  /** 舊版 API 相容 */
  resetError?: () => void;
  /** 自訂標題 */
  title?: string;
  /** 自訂訊息 */
  message?: string;
}

/**
 * 可重用的錯誤顯示 UI 元件
 * 
 * 符合 react-error-boundary FallbackComponent 標準 API
 * 可作為 ErrorBoundary 的 FallbackComponent 使用
 * 
 * @example
 * <ErrorBoundary FallbackComponent={ErrorFallback}>
 *   <App />
 * </ErrorBoundary>
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  resetError,
  title = '發生錯誤',
  message = '很抱歉，頁面發生了一些問題。請嘗試重新整理頁面或返回首頁。'
}: ErrorFallbackProps) {
  // 支援兩種 API：resetErrorBoundary (標準) 和 resetError (舊版)
  const handleReset = resetErrorBoundary || resetError;
  
  const handleRefresh = () => {
    if (handleReset) {
      handleReset();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Container size="sm" py="xl">
      <Paper 
        shadow="md" 
        p="xl" 
        radius="md" 
        withBorder
        role="alert"
        aria-live="assertive"
      >
        <Stack align="center" gap="lg">
          <ThemeIcon size={80} radius="xl" color="red" variant="light">
            <IconAlertTriangle size={48} aria-hidden="true" />
          </ThemeIcon>

          <Title order={2} ta="center">
            {title}
          </Title>

          <Text c="dimmed" ta="center" maw={400}>
            {message}
          </Text>

          {error && process.env.NODE_ENV === 'development' && (
            <Paper p="md" bg="gray.1" radius="sm" w="100%">
              <Text size="xs" c="red" ff="monospace" style={{ wordBreak: 'break-all' }}>
                {error.message}
              </Text>
              {error.stack && (
                <details>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'gray' }}>
                    錯誤堆疊
                  </summary>
                  <Text size="xs" c="dimmed" ff="monospace" mt="xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {error.stack.split('\n').slice(0, 8).join('\n')}
                  </Text>
                </details>
              )}
            </Paper>
          )}

          <Group>
            <Button
              leftSection={<IconRefresh size={18} />}
              onClick={handleRefresh}
              variant="filled"
            >
              重新整理
            </Button>
            <Button
              leftSection={<IconHome size={18} />}
              onClick={handleGoHome}
              variant="outline"
            >
              返回首頁
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

