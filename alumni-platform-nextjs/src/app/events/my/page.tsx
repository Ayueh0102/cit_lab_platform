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
  ActionIcon,
  Loader,
  Center,
  Tabs,
  Modal,
  TextInput,
  Textarea,
  Grid,
  Menu,
  Select,
  NumberInput,
  Checkbox,
  Switch,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconX,
  IconCalendar,
  IconMapPin,
  IconUsers,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Event {
  id: number;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  location_detail?: string;
  is_online?: boolean;
  online_url?: string;
  max_participants?: number;
  current_participants?: number;
  status?: string;
  event_type?: string;
  category_id?: number;
  category_name?: string;
  registration_start?: string;
  registration_end?: string;
  fee?: number;
  is_free?: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  views_count?: number;
  published_at?: string;
  created_at?: string;
}

interface EventCategory {
  id: number;
  name: string;
}

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      start_time: new Date(),
      end_time: new Date(),
      location: '',
      location_detail: '',
      is_online: false,
      online_url: '',
      max_participants: 0,
      category_id: 0,
      event_type: 'other',
      registration_start: null as Date | null,
      registration_end: null as Date | null,
      fee: 0,
      is_free: true,
      contact_name: '',
      contact_email: '',
      contact_phone: '',
    },
    validate: {
      title: (value) => (value.length > 0 ? null : '活動標題不能為空'),
      description: (value) => (value.length > 0 ? null : '活動描述不能為空'),
      start_time: (value) => (value ? null : '開始時間不能為空'),
      end_time: (value, values) => {
        if (!value) return '結束時間不能為空';
        if (value <= values.start_time) return '結束時間必須晚於開始時間';
        return null;
      },
    },
  });

  useEffect(() => {
    loadCategories();
    loadMyEvents();
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const token = getToken();
      const data = await api.events.getCategories(token || undefined);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let status: string | undefined;
      if (activeTab === 'upcoming') {
        status = 'UPCOMING';
      } else if (activeTab === 'completed') {
        status = 'COMPLETED';
      } else if (activeTab === 'cancelled') {
        status = 'CANCELLED';
      }

      const data = await api.events.getMyEvents(token, status);
      setEvents(data.events || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入活動列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (event: Event) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const fullEvent = await api.events.getById(event.id, token);
      const eventData = fullEvent.event || fullEvent;

      setSelectedEvent(eventData);
      form.setValues({
        title: eventData.title || '',
        description: eventData.description || '',
        start_time: eventData.start_time ? new Date(eventData.start_time) : new Date(),
        end_time: eventData.end_time ? new Date(eventData.end_time) : new Date(),
        location: eventData.location || '',
        location_detail: eventData.location_detail || '',
        is_online: eventData.is_online || false,
        online_url: eventData.online_url || '',
        max_participants: eventData.max_participants || 0,
        category_id: eventData.category_id || 0,
        event_type: eventData.event_type || 'other',
        registration_start: eventData.registration_start ? new Date(eventData.registration_start) : null,
        registration_end: eventData.registration_end ? new Date(eventData.registration_end) : null,
        fee: eventData.fee || 0,
        is_free: eventData.is_free ?? true,
        contact_name: eventData.contact_name || '',
        contact_email: eventData.contact_email || '',
        contact_phone: eventData.contact_phone || '',
      });
      openEditModal();
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入活動詳情',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedEvent) return;

    try {
      setEditing(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const updateData: any = {
        title: values.title,
        description: values.description,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        location: values.location || undefined,
        location_detail: values.location_detail || undefined,
        is_online: values.is_online,
        online_url: values.online_url || undefined,
        max_participants: values.max_participants || undefined,
        category_id: values.category_id || undefined,
        event_type: values.event_type,
        registration_start: values.registration_start?.toISOString() || undefined,
        registration_end: values.registration_end?.toISOString() || undefined,
        fee: values.is_free ? 0 : values.fee,
        is_free: values.is_free,
        contact_name: values.contact_name || undefined,
        contact_email: values.contact_email || undefined,
        contact_phone: values.contact_phone || undefined,
      };

      await api.events.update(selectedEvent.id, updateData, token);

      notifications.show({
        title: '更新成功',
        message: '活動已成功更新',
        color: 'green',
      });

      closeEditModal();
      loadMyEvents();
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;

    try {
      setDeleting(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.events.delete(selectedEvent.id, token);

      notifications.show({
        title: '刪除成功',
        message: '活動已成功刪除',
        color: 'green',
      });

      closeDeleteModal();
      loadMyEvents();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async (event: Event) => {
    try {
      const token = getToken();
      if (!token) return;

      const reason = prompt('請輸入取消原因:');
      if (!reason) return;

      await api.events.cancel(event.id, reason, token);

      notifications.show({
        title: '取消成功',
        message: '活動已成功取消',
        color: 'green',
      });

      loadMyEvents();
    } catch (error) {
      notifications.show({
        title: '取消失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const eventTypes = [
    { value: 'seminar', label: '講座／研討會' },
    { value: 'networking', label: '系友交流' },
    { value: 'workshop', label: '工作坊' },
    { value: 'career', label: '職涯活動' },
    { value: 'social', label: '社交活動' },
    { value: 'academic', label: '學術活動' },
    { value: 'other', label: '其他活動' },
  ];

  const statusMap: { [key: string]: string } = {
    UPCOMING: '即將舉行',
    ONGOING: '進行中',
    COMPLETED: '已結束',
    CANCELLED: '已取消',
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
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} mb="xs">
                  我的活動
                </Title>
                <Text c="dimmed">管理您主辦的活動</Text>
              </div>
              <Button onClick={() => router.push('/events/create')}>
                建立新活動
              </Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all">所有活動</Tabs.Tab>
                <Tabs.Tab value="upcoming">即將舉行</Tabs.Tab>
                <Tabs.Tab value="completed">已結束</Tabs.Tab>
                <Tabs.Tab value="cancelled">已取消</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value={activeTab || 'all'} pt="xl">
                {events.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有活動</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {events.map((event) => {
                      const eventTypeLabel = eventTypes.find(t => t.value === event.event_type)?.label || event.event_type;

                      return (
                        <Card
                          key={event.id}
                          shadow="sm"
                          padding="lg"
                          radius="md"
                          withBorder
                          className="hover-translate-y"
                        >
                          <Group justify="space-between" mb="xs">
                            <Text fw={500} size="lg">
                              {event.title}
                            </Text>
                            <Group gap="xs">
                              {event.category_name && (
                                <Badge variant="light" color="blue">
                                  {event.category_name}
                                </Badge>
                              )}
                              {eventTypeLabel && (
                                <Badge variant="light" color="teal">
                                  {eventTypeLabel}
                                </Badge>
                              )}
                              <Badge color={
                                event.status === 'UPCOMING' ? 'green' :
                                event.status === 'ONGOING' ? 'blue' :
                                event.status === 'COMPLETED' ? 'gray' : 'red'
                              }>
                                {statusMap[event.status || ''] || event.status}
                              </Badge>
                            </Group>
                          </Group>

                          <Group gap="xs" mb="sm">
                            {event.start_time && (
                              <>
                                <IconCalendar size={14} />
                                <Text size="sm" c="dimmed">
                                  {new Date(event.start_time).toLocaleString('zh-TW')}
                                </Text>
                              </>
                            )}
                          </Group>

                          <Group gap="xs" mb="sm">
                            {event.location && (
                              <>
                                <IconMapPin size={14} />
                                <Text size="sm" c="dimmed">
                                  {event.is_online ? '線上活動' : event.location}
                                </Text>
                              </>
                            )}
                          </Group>

                          {event.max_participants && (
                            <Group gap="xs" mb="sm">
                              <IconUsers size={14} />
                              <Text size="sm" c="dimmed">
                                {event.current_participants || 0} / {event.max_participants} 人
                              </Text>
                            </Group>
                          )}

                          <Text size="sm" lineClamp={2} c="dimmed" mb="sm">
                            {event.description}
                          </Text>

                          <Group justify="space-between" mt="md">
                            <Group gap="xs">
                              {event.published_at && (
                                <Text size="xs" c="dimmed">
                                  發布於 {new Date(event.published_at).toLocaleDateString('zh-TW')}
                                </Text>
                              )}
                              {event.views_count !== undefined && (
                                <>
                                  <Text size="xs" c="dimmed">•</Text>
                                  <IconEye size={14} />
                                  <Text size="xs" c="dimmed">
                                    {event.views_count} 次瀏覽
                                  </Text>
                                </>
                              )}
                            </Group>
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon variant="subtle">
                                  <IconEdit size={18} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => router.push(`/events/${event.id}`)}
                                >
                                  查看詳情
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleEdit(event)}
                                >
                                  編輯
                                </Menu.Item>
                                {(event.status === 'UPCOMING' || event.status === 'ONGOING') && (
                                  <Menu.Item
                                    leftSection={<IconX size={14} />}
                                    color="orange"
                                    onClick={() => handleCancel(event)}
                                  >
                                    取消活動
                                  </Menu.Item>
                                )}
                                <Menu.Divider />
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDelete(event)}
                                >
                                  刪除
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 編輯活動 Modal */}
        <Modal
          opened={editModalOpened}
          onClose={closeEditModal}
          title="編輯活動"
          size="lg"
          centered
        >
          <form onSubmit={form.onSubmit(handleUpdate)}>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="活動標題"
                    placeholder="例如：校友年會 2024"
                    required
                    {...form.getInputProps('title')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="活動描述"
                    placeholder="詳細描述活動內容..."
                    minRows={4}
                    required
                    {...form.getInputProps('description')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="活動類型"
                    placeholder="選擇活動類型"
                    data={eventTypes}
                    {...form.getInputProps('event_type')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="活動分類"
                    placeholder="選擇分類"
                    data={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                    {...form.getInputProps('category_id')}
                    onChange={(value) => form.setFieldValue('category_id', value ? parseInt(value) : 0)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DateTimePicker
                    label="開始時間"
                    placeholder="選擇開始時間"
                    required
                    {...form.getInputProps('start_time')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DateTimePicker
                    label="結束時間"
                    placeholder="選擇結束時間"
                    required
                    {...form.getInputProps('end_time')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Switch
                    label="線上活動"
                    {...form.getInputProps('is_online', { type: 'checkbox' })}
                  />
                </Grid.Col>
                {form.values.is_online ? (
                  <Grid.Col span={12}>
                    <TextInput
                      label="線上會議連結"
                      placeholder="https://meet.google.com/xxx"
                      {...form.getInputProps('online_url')}
                    />
                  </Grid.Col>
                ) : (
                  <>
                    <Grid.Col span={12}>
                      <TextInput
                        label="活動地點"
                        placeholder="例如：台北市大安區..."
                        {...form.getInputProps('location')}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="地點詳細資訊"
                        placeholder="交通方式、停車資訊等..."
                        minRows={2}
                        {...form.getInputProps('location_detail')}
                      />
                    </Grid.Col>
                  </>
                )}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    label="人數上限"
                    placeholder="0 表示無限制"
                    min={0}
                    {...form.getInputProps('max_participants')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <DateTimePicker
                    label="報名截止時間"
                    placeholder="選擇報名截止時間"
                    {...form.getInputProps('registration_end')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Checkbox
                    label="免費活動"
                    {...form.getInputProps('is_free', { type: 'checkbox' })}
                  />
                </Grid.Col>
                {!form.values.is_free && (
                  <Grid.Col span={12}>
                    <NumberInput
                      label="報名費用 (TWD)"
                      placeholder="0"
                      min={0}
                      {...form.getInputProps('fee')}
                    />
                  </Grid.Col>
                )}
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="聯絡人姓名"
                    placeholder="張三"
                    {...form.getInputProps('contact_name')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="聯絡 Email"
                    placeholder="contact@example.com"
                    type="email"
                    {...form.getInputProps('contact_email')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="聯絡電話"
                    placeholder="0912345678"
                    {...form.getInputProps('contact_phone')}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeEditModal}>
                  取消
                </Button>
                <Button type="submit" loading={editing}>
                  儲存變更
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* 刪除確認 Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="確認刪除"
          centered
        >
          <Stack gap="md">
            <Text>確定要刪除此活動嗎?此操作無法復原。</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={closeDeleteModal}>
                取消
              </Button>
              <Button color="red" onClick={confirmDelete} loading={deleting}>
                刪除
              </Button>
            </Group>
          </Stack>
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

