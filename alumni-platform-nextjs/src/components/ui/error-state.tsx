/**
 * 優化的錯誤狀態組件
 */

'use client';

import { Center, Stack, Text, Button, ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  minHeight?: string | number;
}

export function ErrorState({
  title = '載入失敗',
  message = '無法載入數據,請稍後再試',
  onRetry,
  minHeight = '60vh',
}: ErrorStateProps) {
  return (
    <Center style={{ minHeight }}>
      <Stack align="center" gap="md">
        <ThemeIcon size={80} radius="xl" color="red" variant="light">
          <IconAlertCircle size={48} />
        </ThemeIcon>
        <Stack align="center" gap="xs">
          <Text size="lg" fw={600}>
            {title}
          </Text>
          <Text c="dimmed" size="sm" ta="center">
            {message}
          </Text>
        </Stack>
        {onRetry && (
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={onRetry}
            variant="light"
          >
            重試
          </Button>
        )}
      </Stack>
    </Center>
  );
}

// 空狀態組件
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  minHeight?: string | number;
}

export function EmptyState({
  title = '暫無數據',
  message,
  action,
  icon,
  minHeight = '40vh',
}: EmptyStateProps) {
  return (
    <Center style={{ minHeight }}>
      <Stack align="center" gap="md">
        {icon && (
          <ThemeIcon size={80} radius="xl" color="gray" variant="light">
            {icon}
          </ThemeIcon>
        )}
        <Stack align="center" gap="xs">
          <Text size="lg" fw={500} c="dimmed">
            {title}
          </Text>
          {message && (
            <Text c="dimmed" size="sm" ta="center">
              {message}
            </Text>
          )}
        </Stack>
        {action && (
          <Button onClick={action.onClick} variant="light">
            {action.label}
          </Button>
        )}
      </Stack>
    </Center>
  );
}


