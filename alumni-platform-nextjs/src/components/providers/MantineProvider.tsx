'use client';

import { MantineProvider as BaseMantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@/theme';

// 樣式已在 layout.tsx 中導入，這裡不需要重複導入
// import '@mantine/core/styles.css';
// import '@mantine/notifications/styles.css';
// import '@mantine/dates/styles.css';

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider theme={theme}>
      <Notifications position="top-right" />
      {children}
    </BaseMantineProvider>
  );
}

