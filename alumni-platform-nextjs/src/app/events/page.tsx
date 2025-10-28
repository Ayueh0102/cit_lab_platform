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
  TextInput,
  Grid,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
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
  status?: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.events.getAll(token || undefined);
      setEvents(response.events || response);
    } catch (error: any) {
      notifications.show({
        title: '載入失敗',
        message: error.message || '無法載入活動列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventStatus = (event: Event) => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    
    if (eventDate < now) {
      return { label: '已結束', color: 'gray' };
    }
    
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (deadline < now) {
        return { label: '報名截止', color: 'red' };
      }
    }
    
    if (event.max_participants && event.current_participants) {
      if (event.current_participants >= event.max_participants) {
        return { label: '額滿', color: 'orange' };
      }
    }
    
    return { label: '報名中', color: 'green' };
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
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} mb="xs">
                活動管理
              </Title>
              <Text c="dimmed">參與校友活動，拓展人脈網絡</Text>
            </div>
            {isAuthenticated() && (
              <Button onClick={() => router.push('/events/create')}>
                建立活動
              </Button>
            )}
          </Group>

          <TextInput
            placeholder="搜尋活動名稱或地點..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            size="md"
          />

          {filteredEvents.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">目前沒有活動</Text>
            </Center>
          ) : (
            <Grid>
              {filteredEvents.map((event) => {
                const status = getEventStatus(event);
                return (
                  <Grid.Col key={event.id} span={{ base: 12, md: 6 }}>
                    <Card
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{ cursor: 'pointer', height: '100%' }}
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Text fw={500} size="lg" lineClamp={1}>
                            {event.title}
                          </Text>
                          <Badge color={status.color}>{status.label}</Badge>
                        </Group>

                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">
                            📅 {new Date(event.event_date).toLocaleString('zh-TW')}
                          </Text>
                          <Text size="sm" c="dimmed">
                            📍 {event.location}
                          </Text>
                          {event.max_participants && (
                            <Text size="sm" c="dimmed">
                              👥 {event.current_participants || 0} / {event.max_participants} 人
                            </Text>
                          )}
                        </Stack>

                        <Text size="sm" lineClamp={2}>
                          {event.description}
                        </Text>

                        {event.organizer_name && (
                          <Text size="xs" c="dimmed">
                            主辦人: {event.organizer_name}
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
}

