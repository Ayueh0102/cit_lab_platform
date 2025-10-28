'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Avatar,
  Loader,
  Center,
  TextInput,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';

interface Conversation {
  user_id: number;
  user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }
      const response = await api.messages.getConversations(token);
      setConversations(response.conversations || response);
    } catch (error: any) {
      notifications.show({
        title: '載入失敗',
        message: error.message || '無法載入對話列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
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
              訊息中心
            </Title>
            <Text c="dimmed">與其他校友保持聯繫</Text>
          </div>

          {conversations.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Text c="dimmed">尚無對話記錄</Text>
                <Text size="sm" c="dimmed">
                  在職缺或活動頁面與其他校友開始對話
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="md">
              {conversations.map((conv) => (
                <Card
                  key={conv.user_id}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/messages/${conv.user_id}`)}
                >
                  <Group gap="md">
                    <Avatar radius="xl" size="lg" color="blue">
                      {conv.user_name.charAt(0)}
                    </Avatar>

                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group justify="space-between">
                        <Text fw={500}>{conv.user_name}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(conv.last_message_time).toLocaleString('zh-TW', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed" lineClamp={1} style={{ flex: 1 }}>
                          {conv.last_message}
                        </Text>
                        {conv.unread_count > 0 && (
                          <Avatar size="sm" radius="xl" color="blue">
                            {conv.unread_count}
                          </Avatar>
                        )}
                      </Group>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
}

