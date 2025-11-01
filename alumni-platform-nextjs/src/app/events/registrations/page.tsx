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
  Button,
  Loader,
  Center,
  Tabs,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconTicket,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface EventRegistration {
  id: number;
  event_id: number;
  status: string;
  participants_count?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  registered_at?: string;
  cancelled_at?: string;
  event?: {
    id: number;
    title: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    is_online?: boolean;
    online_url?: string;
    event_type?: string;
    category_name?: string;
    fee?: number;
    is_free?: boolean;
    status?: string;
  };
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待審核', color: 'yellow' },
  APPROVED: { label: '已確認', color: 'green' },
  REJECTED: { label: '已拒絕', color: 'red' },
  CANCELLED: { label: '已取消', color: 'gray' },
  WAITLIST: { label: '候補中', color: 'orange' },
  ATTENDED: { label: '已參加', color: 'blue' },
};

const eventTypeLabels: Record<string, string> = {
  seminar: '講座／研討會',
  networking: '系友交流',
  workshop: '工作坊',
  career: '職涯活動',
  social: '社交活動',
  academic: '學術活動',
  other: '其他活動',
};

export default function MyRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('all');

  useEffect(() => {
    loadRegistrations();
  }, [activeTab]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let status: string | undefined;
      if (activeTab === 'approved') {
        status = 'APPROVED';
      } else if (activeTab === 'pending') {
        status = 'PENDING';
      } else if (activeTab === 'waitlist') {
        status = 'WAITLIST';
      }

      const data = await api.events.getMyRegistrations(token, status);
      setRegistrations(data.registrations || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入報名記錄',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      if (!confirm('確定要取消此活動的報名嗎?')) {
        return;
      }

      await api.events.unregister(eventId, token);

      notifications.show({
        title: '取消成功',
        message: '已取消活動報名',
        color: 'green',
      });

      loadRegistrations();
    } catch (error) {
      notifications.show({
        title: '取消失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Center style={{ minHeight: '60vh' }}>
            <Loader size="xl" />
          </Center>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                我的報名
              </Title>
              <Text c="dimmed">查看您報名的所有活動</Text>
            </div>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all">全部報名</Tabs.Tab>
                <Tabs.Tab value="approved">已確認</Tabs.Tab>
                <Tabs.Tab value="pending">待審核</Tabs.Tab>
                <Tabs.Tab value="waitlist">候補中</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value={activeTab || 'all'} pt="xl">
                {registrations.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有報名記錄</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {registrations.map((registration) => {
                      const event = registration.event;
                      if (!event) return null;

                      const statusInfo = statusMap[registration.status] || { label: registration.status, color: 'gray' };
                      const eventTypeLabel = event.event_type ? eventTypeLabels[event.event_type] ?? event.event_type : undefined;

                      return (
                        <Card
                          key={registration.id}
                          shadow="sm"
                          padding="lg"
                          radius="md"
                          withBorder
                          className="hover-translate-y"
                        >
                          <Stack gap="sm">
                            <Group justify="space-between" align="flex-start">
                              <Text fw={500} size="lg">
                                {event.title}
                              </Text>
                              <Group gap="xs">
                                {eventTypeLabel && (
                                  <Badge variant="light" color="teal">
                                    {eventTypeLabel}
                                  </Badge>
                                )}
                                {event.category_name && (
                                  <Badge variant="light" color="blue">
                                    {event.category_name}
                                  </Badge>
                                )}
                                <Badge color={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                              </Group>
                            </Group>

                            <Group gap="md" c="dimmed">
                              {event.start_time && (
                                <Group gap={4}>
                                  <IconCalendar size={14} />
                                  <Text size="sm">
                                    {new Date(event.start_time).toLocaleString('zh-TW')}
                                  </Text>
                                </Group>
                              )}
                              {event.location && (
                                <Group gap={4}>
                                  <IconMapPin size={14} />
                                  <Text size="sm">
                                    {event.is_online ? '線上活動' : event.location}
                                  </Text>
                                </Group>
                              )}
                              {registration.participants_count && (
                                <Group gap={4}>
                                  <IconUsers size={14} />
                                  <Text size="sm">
                                    {registration.participants_count} 人
                                  </Text>
                                </Group>
                              )}
                              {!event.is_free && event.fee && (
                                <Group gap={4}>
                                  <IconTicket size={14} />
                                  <Text size="sm">
                                    ${event.fee}
                                  </Text>
                                </Group>
                              )}
                            </Group>

                            {registration.notes && (
                              <Text size="sm" c="dimmed">
                                備註: {registration.notes}
                              </Text>
                            )}

                            <Group justify="space-between" mt="sm">
                              <Group gap="xs">
                                {registration.registered_at && (
                                  <Text size="xs" c="dimmed">
                                    報名時間: {new Date(registration.registered_at).toLocaleDateString('zh-TW')}
                                  </Text>
                                )}
                              </Group>
                              <Group gap="sm">
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => router.push(`/events/${event.id}`)}
                                >
                                  查看活動
                                </Button>
                                {registration.status === 'APPROVED' && event.status === 'UPCOMING' && (
                                  <Button
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    onClick={() => handleCancelRegistration(event.id)}
                                  >
                                    取消報名
                                  </Button>
                                )}
                              </Group>
                            </Group>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

