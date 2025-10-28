'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';

interface Bulletin {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: string;
  created_at: string;
  author_name?: string;
}

export default function BulletinsPage() {
  const router = useRouter();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.bulletins.getAll(token || undefined);
      setBulletins(response.bulletins || response);
    } catch (error: any) {
      notifications.show({
        title: '載入失敗',
        message: error.message || '無法載入公告列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '重要':
        return 'red';
      case '緊急':
        return 'orange';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Center style={{ minHeight: '60vh' }}>
          <Loader size="xl" />
        </Center>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1} mb="xs">
              公告中心
            </Title>
            <Text c="dimmed">查看最新的校友會公告</Text>
          </div>

          {bulletins.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">目前沒有公告</Text>
            </Center>
          ) : (
            <Stack gap="md">
              {bulletins.map((bulletin) => (
                <Card
                  key={bulletin.id}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                >
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={500} size="lg">
                        {bulletin.title}
                      </Text>
                      <Group gap="xs">
                        <Badge color={getPriorityColor(bulletin.priority)}>
                          {bulletin.priority}
                        </Badge>
                        <Badge variant="light">{bulletin.category}</Badge>
                      </Group>
                    </Group>

                    <Text size="sm" lineClamp={2} c="dimmed">
                      {bulletin.content}
                    </Text>

                    <Group justify="space-between">
                      {bulletin.author_name && (
                        <Text size="xs" c="dimmed">
                          發布者: {bulletin.author_name}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed">
                        {new Date(bulletin.created_at).toLocaleString('zh-TW')}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
}

