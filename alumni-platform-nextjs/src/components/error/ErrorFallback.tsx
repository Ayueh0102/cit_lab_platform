'use client';

import { Container, Title, Text, Button, Stack, Paper, Group, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

/**
 * 可重用的錯誤顯示 UI 元件
 * 用於 Error Boundary 捕獲錯誤時顯示友善訊息
 */
export function ErrorFallback({
  error,
  resetError,
  title = '發生錯誤',
  message = '很抱歉，頁面發生了一些問題。請嘗試重新整理頁面或返回首頁。'
}: ErrorFallbackProps) {
  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Container size="sm" py="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Stack align="center" gap="lg">
          <ThemeIcon size={80} radius="xl" color="red" variant="light">
            <IconAlertTriangle size={48} />
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
                <Text size="xs" c="dimmed" ff="monospace" mt="xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </Text>
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

