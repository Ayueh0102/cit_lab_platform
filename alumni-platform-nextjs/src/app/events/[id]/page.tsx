'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useParams, useRouter } from 'next/navigation';
import {
  IconCalendar,
  IconClock,
  IconInfoCircle,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTicket,
  IconUser,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
  waitlist_count?: number;
  available_seats?: number | null;
  allow_waitlist?: boolean;
  registration_start?: string;
  registration_end?: string;
  registration_open?: boolean;
  status?: string;
  event_type?: string;
  category_id?: number;
  category_name?: string;
  organizer_name?: string;
  organizer_email?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  fee?: number;
  fee_currency?: string;
  is_free?: boolean;
  views_count?: number;
  is_full?: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

const eventTypeLabels: Record<string, string> = {
  seminar: '講座／研討會',
  networking: '系友交流',
  workshop: '工作坊',
  career: '職涯活動',
  social: '社交活動',
  academic: '學術活動',
  other: '其他活動',
};

const statusMap: Record<string, { label: string; color: string }> = {
  upcoming: { label: '即將舉行', color: 'green' },
  ongoing: { label: '進行中', color: 'blue' },
  completed: { label: '已結束', color: 'gray' },
  cancelled: { label: '已取消', color: 'red' },
};

const formatDateTime = (
  value?: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
) => {
  if (!value) return '未提供';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '未提供';
  }
  return date.toLocaleString('zh-TW', options);
};

const formatDate = (value?: string) => formatDateTime(value, { dateStyle: 'medium' });

const formatFee = (eventData: Event) => {
  if (eventData.is_free || !eventData.fee) {
    return '免費';
  }
  return `${eventData.fee} ${eventData.fee_currency || 'TWD'}`;
};

const resolveEventStatus = (eventData: Event) => {
  const statusKey = eventData.status?.toLowerCase();
  if (statusKey && statusMap[statusKey]) {
    return statusMap[statusKey];
  }

  if (eventData.is_full) {
    return { label: '額滿', color: 'orange' };
  }

  return statusMap.upcoming;
};

type RegistrationState = {
  canRegister: boolean;
  waitlist: boolean;
  buttonLabel: string;
  message?: string;
  reason?: string;
};

const getRegistrationState = (eventData: Event): RegistrationState => {
  const statusKey = eventData.status?.toLowerCase();
  const now = new Date();

  if (statusKey === 'cancelled') {
    return {
      canRegister: false,
      waitlist: false,
      buttonLabel: '報名已關閉',
      reason: '活動已取消，無法報名。',
    };
  }

  if (statusKey === 'completed') {
    return {
      canRegister: false,
      waitlist: false,
      buttonLabel: '活動已結束',
      reason: '活動已結束，無法再報名。',
    };
  }

  if (eventData.registration_start) {
    const start = new Date(eventData.registration_start);
    if (start > now) {
      return {
        canRegister: false,
        waitlist: false,
        buttonLabel: '報名尚未開始',
        reason: `報名將於 ${formatDateTime(eventData.registration_start)} 開放。`,
      };
    }
  }

  if (eventData.registration_end) {
    const end = new Date(eventData.registration_end);
    if (end < now) {
      return {
        canRegister: false,
        waitlist: false,
        buttonLabel: '報名已截止',
        reason: '報名已截止，無法再報名。',
      };
    }
  }

  if (eventData.registration_open) {
    if (eventData.is_full) {
      if (eventData.allow_waitlist) {
        return {
          canRegister: true,
          waitlist: true,
          buttonLabel: '加入候補',
          message: '目前名額已滿，您可以加入候補名單。',
        };
      }

      return {
        canRegister: false,
        waitlist: false,
        buttonLabel: '名額已滿',
        reason: '此活動名額已滿，且未提供候補。',
      };
    }

    return {
      canRegister: true,
      waitlist: false,
      buttonLabel: '立即報名',
    };
  }

  if (eventData.is_full && eventData.allow_waitlist) {
    return {
      canRegister: true,
      waitlist: true,
      buttonLabel: '加入候補',
      message: '目前名額已滿，您可以加入候補名單。',
    };
  }

  return {
    canRegister: false,
    waitlist: false,
    buttonLabel: '無法報名',
    reason: '目前暫不開放報名。',
  };
};

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registerModalOpened, setRegisterModalOpened] = useState(false);
  const [registering, setRegistering] = useState(false);

  const form = useForm({
    initialValues: {
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      participantsCount: '1',
      notes: '',
    },
    validate: {
      contactName: (value) => (value.trim().length > 0 ? null : '請輸入聯絡人姓名'),
      contactPhone: (value) =>
        /^0\d{8,9}$|^\+?\d{7,15}$/.test(value.trim()) ? null : '請輸入有效的聯絡電話',
      contactEmail: (value) =>
        !value || value.trim().length === 0 || /\S+@\S+\.\S+/.test(value.trim())
          ? null
          : '請輸入有效的電子郵件',
      participantsCount: (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 1 ? null : '請輸入有效的人數';
      },
    },
  });

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.events.getById(eventId, token || undefined);
      setEvent(response.event || response);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入活動詳情',
        color: 'red',
      });
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isNaN(eventId)) {
      router.push('/events');
      return;
    }

    loadEventDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const registrationState = useMemo<RegistrationState | null>(
    () => (event ? getRegistrationState(event) : null),
    [event],
  );

  const handleRegister = async (values: typeof form.values) => {
    if (!isAuthenticated()) {
      notifications.show({
        title: '請先登入',
        message: '登入後才能報名活動',
        color: 'orange',
      });
      router.push('/auth/login');
      return;
    }

    try {
      setRegistering(true);
      const token = getToken();
      const payload = {
        contact_name: values.contactName.trim(),
        contact_email: values.contactEmail.trim() || undefined,
        contact_phone: values.contactPhone.trim(),
        participants_count: Math.max(1, Number(values.participantsCount) || 1),
        notes: values.notes.trim() || undefined,
      };

      const result = await api.events.register(eventId, payload, token!);
      const state = registrationState ?? (event ? getRegistrationState(event) : undefined);
      const apiMessage = typeof result?.message === 'string' ? result.message : undefined;

      notifications.show({
        title: '報名成功',
        message:
          apiMessage ||
          (state?.waitlist
            ? '您已加入候補名單，我們會在有名額時通知您。'
            : '您已成功報名此活動！'),
        color: state?.waitlist ? 'blue' : 'green',
      });

      setRegisterModalOpened(false);
      form.reset();
      loadEventDetail();
    } catch (error) {
      notifications.show({
        title: '報名失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setRegistering(false);
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

  if (!event) {
    return null;
  }

  const state = registrationState;
  const eventStatus = state?.waitlist
    ? { label: '候補中', color: 'orange' }
    : resolveEventStatus(event);
  const eventTypeLabel = event.event_type
    ? eventTypeLabels[event.event_type] ?? event.event_type
    : undefined;

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="md" py="xl">
          <Stack gap="xl">
            <Button variant="subtle" onClick={() => router.back()}>
              ← 返回活動列表
            </Button>

            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Stack gap="lg">
                <div>
                  <Group justify="space-between" align="flex-start" mb="sm">
                    <Stack gap={8} style={{ flex: 1 }}>
                      <Group gap={8} wrap="wrap">
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
                        {event.is_online && (
                          <Badge variant="light" color="indigo">
                            線上活動
                          </Badge>
                        )}
                        {event.is_free && (
                          <Badge variant="light" color="green">
                            免費
                          </Badge>
                        )}
                      </Group>
                      <Title order={1}>{event.title}</Title>
                    </Stack>
                    <Badge size="lg" color={eventStatus.color} variant="filled">
                      {eventStatus.label}
                    </Badge>
                  </Group>

                  {state?.message && (
                    <Alert mt="sm" icon={<IconInfoCircle size={16} />} color={state.waitlist ? 'orange' : 'blue'}>
                      {state.message}
                    </Alert>
                  )}

                  {state?.reason && (
                    <Alert mt="sm" icon={<IconInfoCircle size={16} />} color="red">
                      {state.reason}
                    </Alert>
                  )}
                </div>

                <Stack gap="sm" c="dimmed">
                  <Group gap={8} wrap="nowrap">
                    <IconCalendar size={18} />
                    <Text size="sm">
                      {formatDateTime(event.start_time)}
                      {event.end_time ? ` - ${formatDateTime(event.end_time)}` : ''}
                    </Text>
                  </Group>
                  <Group gap={8} wrap="nowrap">
                    <IconClock size={18} />
                    <Text size="sm">
                      {event.registration_start || event.registration_end
                        ? `報名期間：${formatDate(event.registration_start)} - ${formatDate(event.registration_end)}`
                        : '報名期間未設定'}
                    </Text>
                  </Group>
                  <Group gap={8} wrap="nowrap">
                    <IconMapPin size={18} />
                    <Text size="sm">
                      {event.is_online ? '線上活動' : event.location || '地點待定'}
                    </Text>
                  </Group>
                  {event.location_detail && (
                    <Text size="sm" ml={28}>
                      {event.location_detail}
                    </Text>
                  )}
                  {event.online_url && (
                    <Group gap={8} wrap="nowrap">
                      <IconWorld size={18} />
                      <Text size="sm">{event.online_url}</Text>
                    </Group>
                  )}
                  <Group gap={8} wrap="nowrap">
                    <IconUsers size={18} />
                    <Text size="sm">
                      {event.max_participants
                        ? `${event.current_participants ?? 0} / ${event.max_participants} 人`
                        : '無人數限制'}
                      {event.available_seats !== null && event.available_seats !== undefined
                        ? `（剩餘 ${event.available_seats} 位）`
                        : ''}
                      {event.allow_waitlist && typeof event.waitlist_count === 'number'
                        ? `（候補 ${event.waitlist_count}）`
                        : ''}
                    </Text>
                  </Group>
                  <Group gap={8} wrap="nowrap">
                    <IconTicket size={18} />
                    <Text size="sm">{formatFee(event)}</Text>
                  </Group>
                  {typeof event.views_count === 'number' && (
                    <Text size="xs" c="dimmed">
                      {event.views_count} 次瀏覽
                    </Text>
                  )}
                </Stack>

                {event.description && (
                  <>
                    <Divider />
                    <div>
                      <Title order={3} mb="sm">
                        活動描述
                      </Title>
                      <Text style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                        {event.description}
                      </Text>
                    </div>
                  </>
                )}

                {(event.contact_name || event.contact_email || event.contact_phone) && (
                  <>
                    <Divider />
                    <div>
                      <Title order={3} mb="sm">
                        聯絡資訊
                      </Title>
                      <Stack gap="xs">
                        {event.contact_name && (
                          <Group gap={8} wrap="nowrap">
                            <IconUser size={16} />
                            <Text size="sm">{event.contact_name}</Text>
                          </Group>
                        )}
                        {event.contact_email && (
                          <Group gap={8} wrap="nowrap">
                            <IconMail size={16} />
                            <Text size="sm">{event.contact_email}</Text>
                          </Group>
                        )}
                        {event.contact_phone && (
                          <Group gap={8} wrap="nowrap">
                            <IconPhone size={16} />
                            <Text size="sm">{event.contact_phone}</Text>
                          </Group>
                        )}
                      </Stack>
                    </div>
                  </>
                )}

                <Divider />

                <Group justify="space-between" align="center">
                  <Stack gap={4}>
                    {event.organizer_name && (
                      <Text size="sm" c="dimmed">
                        主辦人：{event.organizer_name}
                      </Text>
                    )}
                    {event.organizer_email && (
                      <Text size="sm" c="dimmed">
                        主辦人 Email：{event.organizer_email}
                      </Text>
                    )}
                    {event.created_at && (
                      <Text size="xs" c="dimmed">
                        建立時間：{formatDateTime(event.created_at, { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    )}
                  </Stack>

                  {state?.canRegister && (
                    <Button
                      size="lg"
                      color={state.waitlist ? 'orange' : 'blue'}
                      onClick={() => {
                        if (!isAuthenticated()) {
                          notifications.show({
                            title: '請先登入',
                            message: '登入後才能報名活動',
                            color: 'orange',
                          });
                          router.push('/auth/login');
                          return;
                        }
                        setRegisterModalOpened(true);
                      }}
                    >
                      {state.buttonLabel}
                    </Button>
                  )}
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Container>

        <Modal
          opened={registerModalOpened}
          onClose={() => setRegisterModalOpened(false)}
          title={state?.waitlist ? '加入候補' : '活動報名'}
          size="md"
        >
          <form onSubmit={form.onSubmit(handleRegister)}>
            <Stack gap="md">
              <Text size="sm">
                請填寫以下資訊完成{state?.waitlist ? '候補登記' : '報名'}。
              </Text>

              <TextInput
                label="聯絡人姓名"
                placeholder="請輸入姓名"
                required
                {...form.getInputProps('contactName')}
              />

              <TextInput
                label="電子郵件"
                placeholder="name@example.com"
                type="email"
                {...form.getInputProps('contactEmail')}
              />

              <TextInput
                label="聯絡電話"
                placeholder="例如：0912345678"
                required
                {...form.getInputProps('contactPhone')}
              />

              <TextInput
                label="參與人數"
                type="number"
                min={1}
                required
                {...form.getInputProps('participantsCount')}
              />

              <Textarea
                label="備註"
                placeholder="其他需要說明的事項（選填）"
                minRows={3}
                {...form.getInputProps('notes')}
              />

              <Group justify="flex-end" gap="sm">
                <Button variant="default" onClick={() => setRegisterModalOpened(false)}>
                  取消
                </Button>
                <Button type="submit" loading={registering}>
                  {state?.waitlist ? '確認候補' : '確認報名'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

