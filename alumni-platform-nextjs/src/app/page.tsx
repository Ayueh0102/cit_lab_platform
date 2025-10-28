'use client';

import { Container, Title, Text, Button, Stack, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center" style={{ minHeight: '80vh', justifyContent: 'center' }}>
        <Stack gap="md" align="center">
          <Title order={1} size="3rem" fw={700} ta="center">
            🎓 校友平台
          </Title>
          <Text size="xl" c="dimmed" ta="center" maw={600}>
            現代化的校友互動平台，基於 Next.js 15 和 Mantine 7 打造
          </Text>
        </Stack>

        <Group gap="md">
          <Button
            onClick={() => router.push('/auth/login')}
            size="lg"
            radius="md"
            variant="filled"
          >
            登入
          </Button>
          <Button
            onClick={() => router.push('/auth/register')}
            size="lg"
            radius="md"
            variant="light"
          >
            註冊
          </Button>
        </Group>

        <Stack gap="sm" mt="xl">
          <Text size="sm" c="dimmed" ta="center">
            ✨ React 19 + Next.js 15 + Mantine 7
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            🚀 現代化架構 | 優秀的效能 | 美觀的 UI
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
