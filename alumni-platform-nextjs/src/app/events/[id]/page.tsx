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
  Divider,
  Loader,
  Center,
  Modal,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_participants?: number;
  current_participants?: number;
  registration_deadline?: string;
  created_at: string;
  organizer_name?: string;
  contact_info?: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registerModalOpened, setRegisterModalOpened] = useState(false);
  const [registering, setRegistering] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      phone: '',
      notes: '',
    },
    validate: {
      phone: (value) =>
        /^09\d{8}$/.test(value) ? null : '請輸入有效的手機號碼',
    },
  });

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.events.getById(eventId, token || undefined);
      setEvent(response.event || response);
    } catch (error: any) {
      notifications.show({
        title: '載入失敗',
        message: error.message || '無法載入活動詳情',
        color: 'red',
      });
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: typeof form.values) => {
    if (!isAuthenticated()) {
      notifications.show({
        title: '請先登入',
        message: '您需要登入才能報名活動',
        color: 'orange',
      });
      router.push('/auth/login');
      return;
    }

    try {
      setRegistering(true);
      const token = getToken();
      await api.events.register(eventId, values, token!);

      notifications.show({
        title: '報名成功',
        message: '您已成功報名此活動',
        color: 'green',
      });

      setRegisterModalOpened(false);
      form.reset();
      loadEventDetail(); // 重新載入活動資訊
    } catch (error: any) {
      notifications.show({
        title: '報名失敗',
        message: error.message || '請稍後再試',
        color: 'red',
      });
    } finally {
      setRegistering(false);
    }
  };

  const canRegister = () => {
    if (!event) return false;
    
    const eventDate = new Date(event.event_date);
    const now = new Date();
    
    if (eventDate < now) return false;
    
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (deadline < now) return false;
    }
    
    if (event.max_participants && event.current_participants) {
      if (event.current_participants >= event.max_participants) {
        return false;
      }
    }
    
    return true;
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

  if (!event) {
    return null;
  }

  return (
    <AppLayout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Button variant="subtle" onClick={() => router.back()}>
            ← 返回活動列表
          </Button>

          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="lg">
              <div>
                <Group justify="space-between" mb="sm">
                  <Title order={1}>{event.title}</Title>
                  <Badge size="lg" color="blue">
                    {canRegister() ? '報名中' : '已結束'}
                  </Badge>
                </Group>
              </div>

              <Stack gap="sm">
                <Group gap="xs">
                  <Text size="lg" fw={500}>
                    📅 活動時間:
                  </Text>
                  <Text size="lg">
                    {new Date(event.event_date).toLocaleString('zh-TW')}
                  </Text>
                </Group>

                <Group gap="xs">
                  <Text size="lg" fw={500}>
                    📍 活動地點:
                  </Text>
                  <Text size="lg">{event.location}</Text>
                </Group>

                {event.max_participants && (
                  <Group gap="xs">
                    <Text size="lg" fw={500}>
                      👥 參與人數:
                    </Text>
                    <Text size="lg">
                      {event.current_participants || 0} / {event.max_participants} 人
                    </Text>
                  </Group>
                )}

                {event.registration_deadline && (
                  <Group gap="xs">
                    <Text size="lg" fw={500}>
                      ⏰ 報名截止:
                    </Text>
                    <Text size="lg">
                      {new Date(event.registration_deadline).toLocaleString('zh-TW')}
                    </Text>
                  </Group>
                )}
              </Stack>

              <Divider />

              <div>
                <Title order={3} mb="sm">
                  活動描述
                </Title>
                <Text style={{ whiteSpace: 'pre-line' }}>
                  {event.description}
                </Text>
              </div>

              {event.contact_info && (
                <div>
                  <Title order={3} mb="sm">
                    聯絡方式
                  </Title>
                  <Text>{event.contact_info}</Text>
                </div>
              )}

              <Divider />

              <Group justify="space-between">
                <div>
                  {event.organizer_name && (
                    <Text size="sm" c="dimmed">
                      主辦人: {event.organizer_name}
                    </Text>
                  )}
                  <Text size="sm" c="dimmed">
                    建立時間:{' '}
                    {new Date(event.created_at).toLocaleDateString('zh-TW')}
                  </Text>
                </div>

                {canRegister() && (
                  <Button size="lg" onClick={() => setRegisterModalOpened(true)}>
                    立即報名
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
        title="活動報名"
        size="md"
      >
        <form onSubmit={form.onSubmit(handleRegister)}>
          <Stack gap="md">
            <Text size="sm">
              請填寫以下資訊完成報名
            </Text>

            <TextInput
              label="聯絡電話"
              placeholder="0912345678"
              required
              {...form.getInputProps('phone')}
              key={form.key('phone')}
            />

            <Textarea
              label="備註"
              placeholder="其他需要說明的事項（選填）"
              minRows={3}
              {...form.getInputProps('notes')}
              key={form.key('notes')}
            />

            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => setRegisterModalOpened(false)}
              >
                取消
              </Button>
              <Button type="submit" loading={registering}>
                確認報名
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </AppLayout>
  );
}

