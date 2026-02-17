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
  Button,
  Loader,
  Center,
  Skeleton,
} from '@mantine/core';
import { IconMessage, IconUsers } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Conversation {
  id: number;
  user_id: number;
  user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  avatar_url?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setConversations(response.conversations || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入對話列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute><SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            {/* 標題骨架 */}
            <div>
              <Skeleton height={32} width={180} radius="md" mb="xs" />
              <Skeleton height={18} width={240} radius="md" />
            </div>

            {/* 對話列表骨架 */}
            <Stack gap="md">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} shadow="sm" padding="lg" radius="md" className="glass-card-soft">
                  <Group gap="md">
                    <Skeleton height={50} width={50} circle />
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group justify="space-between">
                        <Skeleton height={16} width={100} radius="md" />
                        <Skeleton height={12} width={80} radius="md" />
                      </Group>
                      <Group justify="space-between">
                        <Skeleton height={14} width="60%" radius="md" />
                        <Skeleton height={24} width={24} circle />
                      </Group>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Container>
      </SidebarLayout></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute><SidebarLayout>
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1} mb="xs">
              訊息中心
            </Title>
            <Text c="dimmed">與其他校友保持聯繫</Text>
          </div>

          {conversations.length === 0 ? (
            <Card shadow="sm" padding="xl" radius="md" className="glass-card-soft" style={{ border: 'none' }}>
              <Stack align="center" gap="md" py="xl">
                <IconMessage size={56} color="var(--mantine-color-cyan-3)" stroke={1.5} />
                <Text size="lg" fw={600} c="dimmed">尚無對話記錄</Text>
                <Text size="sm" c="dimmed" ta="center" maw={360}>
                  前往系友通訊錄，與校友們開始聊天交流
                </Text>
                <Button
                  variant="light"
                  color="cyan"
                  radius="xl"
                  leftSection={<IconUsers size={16} />}
                  onClick={() => router.push('/directory')}
                  mt="xs"
                >
                  瀏覽系友通訊錄
                </Button>
              </Stack>
            </Card>
          ) : (
            <Stack gap="md">
              {conversations.map((conv, index) => (
                <Card
                  key={conv.id}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  className="hover-translate-y glass-card-soft animate-list-item"
                  style={{
                    cursor: 'pointer',
                    animationDelay: `${Math.min(index, 9) * 0.05}s`,
                  }}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(`/messages/${conv.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/messages/${conv.id}`); } }}
                >
                  <Group gap="md">
                    <Avatar
                      src={conv.avatar_url}
                      radius="xl"
                      size="lg"
                      color="blue"
                    >
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
    </SidebarLayout></ProtectedRoute>
  );
}

