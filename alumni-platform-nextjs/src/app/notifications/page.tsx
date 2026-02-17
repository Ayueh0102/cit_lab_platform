'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Button,
  Tabs,
  Skeleton,
} from '@mantine/core';
import { notifications as mantineNotifications } from '@mantine/notifications';
import {
  IconBell,
  IconBriefcase,
  IconCalendarEvent,
  IconUsers,
  IconCheck,
  IconTrash,
  IconSettings,
  IconUserPlus,
  IconUserCheck,
  IconUserX,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  notification_type: 'job' | 'event' | 'bulletin' | 'message' | 'system' | 'user_registration_request' | 'user_registration_approved' | 'user_registration_rejected' | 'job_request' | 'job_request_approved' | 'job_request_rejected' | 'contact_request' | 'contact_accepted' | 'contact_rejected';
  title: string;
  content: string;
  message?: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
  read_at?: string;
  link_url?: string;
  action_url?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'job':
    case 'job_request':
    case 'job_request_approved':
    case 'job_request_rejected':
      return <IconBriefcase size={20} color="blue" />;
    case 'event':
      return <IconCalendarEvent size={20} color="green" />;
    case 'bulletin':
      return <IconBell size={20} color="orange" />;
    case 'message':
      return <IconUsers size={20} color="purple" />;
    case 'user_registration_request':
      return <IconUserPlus size={20} color="teal" />;
    case 'user_registration_approved':
      return <IconUserCheck size={20} color="green" />;
    case 'user_registration_rejected':
      return <IconUserX size={20} color="red" />;
    case 'contact_request':
      return <IconUserPlus size={20} color="indigo" />;
    case 'contact_accepted':
      return <IconUserCheck size={20} color="green" />;
    case 'contact_rejected':
      return <IconUserX size={20} color="red" />;
    default:
      return <IconSettings size={20} color="gray" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'job':
    case 'job_request':
    case 'job_request_approved':
    case 'job_request_rejected':
      return 'blue';
    case 'event':
      return 'green';
    case 'bulletin':
      return 'orange';
    case 'message':
      return 'purple';
    case 'user_registration_request':
      return 'teal';
    case 'user_registration_approved':
      return 'green';
    case 'user_registration_rejected':
      return 'red';
    case 'contact_request':
      return 'indigo';
    case 'contact_accepted':
      return 'green';
    case 'contact_rejected':
      return 'red';
    default:
      return 'gray';
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let status: 'unread' | 'read' | 'archived' | undefined;
      if (activeTab === 'unread') {
        status = 'unread';
      } else if (activeTab === 'read') {
        status = 'read';
      } else if (activeTab === 'archived') {
        status = 'archived';
      }

      const response = await api.notifications.getAll(token, {
        status,
        page: 1,
        per_page: 50,
      });

      setNotifications(response.notifications || []);
    } catch (error) {
      mantineNotifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入通知',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.notifications.getUnreadCount(token);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      // 靜默失敗
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.notifications.markAsRead(id, token);
      
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      );
      loadUnreadCount();
      
      mantineNotifications.show({
        title: '已標記為已讀',
        message: '通知已標記為已讀',
        color: 'green',
      });
    } catch (error) {
      mantineNotifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法標記通知',
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.notifications.delete(id, token);
      
      setNotifications(notifications.filter((n) => n.id !== id));
      loadUnreadCount();
      
      mantineNotifications.show({
        title: '已刪除',
        message: '通知已刪除',
        color: 'green',
      });
    } catch (error) {
      mantineNotifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除通知',
        color: 'red',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getToken();
      if (!token) return;

      await api.notifications.markAllAsRead(token);
      
      setNotifications(
        notifications.map((n) => ({ ...n, status: 'read' as const }))
      );
      setUnreadCount(0);
      
      mantineNotifications.show({
        title: '全部已讀',
        message: '所有通知已標記為已讀',
        color: 'green',
      });
    } catch (error) {
      mantineNotifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法標記通知',
        color: 'red',
      });
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.status === 'unread';
    if (activeTab === 'read') return notification.status === 'read';
    if (activeTab === 'archived') return notification.status === 'archived';
    if (activeTab === 'contact_request') {
      return ['contact_request', 'contact_accepted', 'contact_rejected'].includes(notification.notification_type);
    }
    return notification.notification_type === activeTab;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Container size="lg" py="xl">
            <Stack gap="xl">
              {/* 標題骨架 */}
              <Group justify="space-between">
                <div>
                  <Skeleton height={32} width={180} radius="md" mb="xs" />
                  <Skeleton height={18} width={240} radius="md" />
                </div>
                <Skeleton height={40} width={160} radius="xl" />
              </Group>

              {/* Tabs 骨架 */}
              <Group gap="md">
                <Skeleton height={36} width={80} radius="md" />
                <Skeleton height={36} width={60} radius="md" />
                <Skeleton height={36} width={60} radius="md" />
                <Skeleton height={36} width={60} radius="md" />
                <Skeleton height={36} width={60} radius="md" />
              </Group>

              {/* 通知條目骨架 */}
              <Stack gap="md">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} shadow="sm" padding="lg" radius="md" className="glass-card-soft">
                    <Group justify="space-between" wrap="nowrap">
                      <Group wrap="nowrap" style={{ flex: 1 }}>
                        <Skeleton height={40} width={40} circle />
                        <div style={{ flex: 1 }}>
                          <Group gap="xs" mb="xs">
                            <Skeleton height={16} width="50%" radius="md" />
                            <Skeleton height={18} width={40} radius="xl" />
                          </Group>
                          <Skeleton height={14} width="70%" radius="md" mb={6} />
                          <Skeleton height={12} width={120} radius="md" />
                        </div>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        <Skeleton height={28} width={28} radius="md" />
                        <Skeleton height={28} width={28} radius="md" />
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Container>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <Group justify="space-between">
              <div>
                <Title order={1} mb="xs">
                  通知中心
                </Title>
                <Text c="dimmed">
                  {unreadCount > 0 ? `您有 ${unreadCount} 則未讀通知` : '沒有未讀通知'}
                </Text>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="light"
                  leftSection={<IconCheck size={16} />}
                  onClick={handleMarkAllAsRead}
                >
                  全部標示為已讀
                </Button>
              )}
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all" leftSection={<IconBell size={16} />}>
                  全部
                  {notifications.length > 0 && (
                    <Badge ml="xs" size="sm" variant="filled">
                      {notifications.length}
                    </Badge>
                  )}
                </Tabs.Tab>
                <Tabs.Tab value="unread">
                  未讀
                  {unreadCount > 0 && (
                    <Badge ml="xs" size="sm" variant="filled" color="red">
                      {unreadCount}
                    </Badge>
                  )}
                </Tabs.Tab>
                <Tabs.Tab value="job" leftSection={<IconBriefcase size={16} />}>
                  職缺
                </Tabs.Tab>
                <Tabs.Tab value="event" leftSection={<IconCalendarEvent size={16} />}>
                  活動
                </Tabs.Tab>
                <Tabs.Tab value="bulletin" leftSection={<IconBell size={16} />}>
                  公告
                </Tabs.Tab>
                <Tabs.Tab value="contact_request" leftSection={<IconUserPlus size={16} />}>
                  聯絡
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Stack gap="md">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <Card
                    key={notification.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    className="glass-card-soft animate-list-item"
                    onClick={() => {
                      const url = notification.action_url || notification.link_url;
                      if (url) {
                        if (notification.status === 'unread') {
                          handleMarkAsRead(notification.id);
                        }
                        router.push(url);
                      }
                    }}
                    style={{
                      backgroundColor: notification.status === 'unread' ? 'rgba(66, 153, 225, 0.08)' : undefined,
                      cursor: (notification.action_url || notification.link_url) ? 'pointer' : undefined,
                      animationDelay: `${Math.min(index, 9) * 0.05}s`,
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group wrap="nowrap" style={{ flex: 1 }}>
                        {getNotificationIcon(notification.notification_type)}
                        <div style={{ flex: 1 }}>
                          <Group gap="xs" mb="xs">
                            <Text fw={500}>{notification.title}</Text>
                            {notification.status === 'unread' && (
                              <Badge size="sm" color="blue" variant="filled">
                                新
                              </Badge>
                            )}
                            <Badge
                              size="sm"
                              color={getNotificationColor(notification.notification_type)}
                              variant="light"
                            >
                              {notification.notification_type === 'job' && '職缺'}
                              {notification.notification_type === 'job_request' && '職缺交流'}
                              {notification.notification_type === 'job_request_approved' && '職缺交流通過'}
                              {notification.notification_type === 'job_request_rejected' && '職缺交流拒絕'}
                              {notification.notification_type === 'event' && '活動'}
                              {notification.notification_type === 'bulletin' && '公告'}
                              {notification.notification_type === 'message' && '訊息'}
                              {notification.notification_type === 'system' && '系統'}
                              {notification.notification_type === 'user_registration_request' && '會員申請'}
                              {notification.notification_type === 'user_registration_approved' && '申請通過'}
                              {notification.notification_type === 'user_registration_rejected' && '申請拒絕'}
                              {notification.notification_type === 'contact_request' && '聯絡申請'}
                              {notification.notification_type === 'contact_accepted' && '聯絡已接受'}
                              {notification.notification_type === 'contact_rejected' && '聯絡已拒絕'}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed" mb="xs">
                            {notification.message || notification.content}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(notification.created_at).toLocaleString('zh-TW')}
                          </Text>
                        </div>
                      </Group>
                      <Group gap="xs" wrap="nowrap">
                        {notification.status === 'unread' && (
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        )}
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))
              ) : (
                <Card shadow="sm" padding="xl" radius="md" withBorder>
                  <Stack align="center" gap="md">
                    <IconBell size={48} color="gray" />
                    <Text size="lg" c="dimmed" ta="center">
                      沒有通知
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      {activeTab === 'unread'
                        ? '您已閱讀所有通知'
                        : '目前沒有任何通知'}
                    </Text>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}



