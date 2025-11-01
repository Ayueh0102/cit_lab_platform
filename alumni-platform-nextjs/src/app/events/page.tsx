'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Select,
  Grid,
  Loader,
  Center,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { IconCalendar, IconClock, IconMapPin, IconUsers, IconTicket, IconSearch } from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface EventCategory {
  id: number;
  name: string;
  color?: string;
}

interface Event {
  id: number;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  location_detail?: string;
  is_online?: boolean;
  is_free?: boolean;
  fee?: number;
  fee_currency?: string;
  max_participants?: number;
  current_participants?: number;
  waitlist_count?: number;
  available_seats?: number;
  allow_waitlist?: boolean;
  registration_start?: string;
  registration_end?: string;
  registration_open?: boolean;
  event_type?: string;
  status?: string;
  category_id?: number;
  category_name?: string;
  organizer_name?: string;
  views_count?: number;
  is_full?: boolean;
}

const PAGE_SIZE = 6;

const statusMap: Record<string, { label: string; color: string }> = {
  upcoming: { label: '即將舉行', color: 'green' },
  ongoing: { label: '進行中', color: 'blue' },
  completed: { label: '已結束', color: 'gray' },
  cancelled: { label: '已取消', color: 'red' },
};

const timeFilterOptions = [
  { value: 'upcoming', label: '即將舉行' },
  { value: 'ongoing', label: '進行中' },
  { value: 'past', label: '已結束' },
];

const statusOptions = [
  { value: 'upcoming', label: '即將舉行' },
  { value: 'ongoing', label: '進行中' },
  { value: 'completed', label: '已結束' },
  { value: 'cancelled', label: '已取消' },
];

const formatDateTime = (
  value?: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
) => {
  if (!value) return '未提供';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未提供';
  return date.toLocaleString('zh-TW', options);
};

const formatFee = (event: Event) => {
  if (event.is_free || !event.fee) return '免費';
  return `${event.fee} ${event.fee_currency || 'TWD'}`;
};

const resolveEventStatus = (event: Event) => {
  const statusKey = (event.status ?? 'upcoming').toLowerCase();

  if (statusKey === 'cancelled') {
    return statusMap.cancelled;
  }

  if (statusKey === 'completed') {
    return statusMap.completed;
  }

  if (statusKey === 'ongoing') {
    return statusMap.ongoing;
  }

  if (event.is_full) {
    return { label: '額滿', color: 'orange' };
  }

  if (event.registration_open === false) {
    return { label: '報名截止', color: 'red' };
  }

  return statusMap.upcoming;
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTime, setFilterTime] = useState<string | null>('upcoming');
  const [filterLocation, setFilterLocation] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await api.events.getCategories();
        setCategories(data.categories || []);
      } catch (error) {
        notifications.show({
          title: '載入失敗',
          message: error instanceof Error ? error.message : '無法載入活動分類',
          color: 'red',
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id.toString(), label: category.name })),
    [categories]
  );

  const categoryColorMap = useMemo(() => {
    const map = new Map<number, string | undefined>();
    categories.forEach((category) => {
      map.set(category.id, category.color);
    });
    return map;
  }, [categories]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params: {
        search?: string;
        category_id?: number;
        status?: string;
        time_filter?: 'upcoming' | 'ongoing' | 'past';
        location?: string;
        page: number;
        per_page: number;
      } = {
        page: currentPage,
        per_page: PAGE_SIZE,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      if (filterLocation.trim()) {
        params.location = filterLocation.trim();
      }

      if (filterCategory) {
        params.category_id = Number(filterCategory);
      }

      if (filterStatus) {
        params.status = filterStatus;
      }

      if (filterTime) {
        params.time_filter = filterTime as 'upcoming' | 'ongoing' | 'past';
      }

      const response = await api.events.getAll(token || undefined, params);
      setEvents(response.events || []);
      setTotal(response.total ?? (response.events ? response.events.length : 0));
      setTotalPages(response.pages ?? 1);
    } catch (error) {
      setEvents([]);
      setTotal(0);
      setTotalPages(1);
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入活動列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, filterCategory, filterLocation, filterStatus, filterTime]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  const hasEvents = events.length > 0;

  return (
    <ProtectedRoute>
      <SidebarLayout>
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

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  placeholder="搜尋活動名稱或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  size="md"
                  leftSection={<IconSearch size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  placeholder="篩選地點（例如：台北）"
                  value={filterLocation}
                  onChange={(e) => {
                    setFilterLocation(e.currentTarget.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  leftSection={<IconMapPin size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  placeholder={loadingCategories ? '載入分類...' : '活動分類'}
                  data={categoryOptions}
                  value={filterCategory}
                  onChange={(value) => {
                    setFilterCategory(value);
                    setCurrentPage(1);
                  }}
                  clearable
                  size="md"
                  disabled={loadingCategories || categoryOptions.length === 0}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  placeholder="活動狀態"
                  data={statusOptions}
                  value={filterStatus}
                  onChange={(value) => {
                    setFilterStatus(value);
                    setCurrentPage(1);
                  }}
                  clearable
                  size="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  placeholder="時間範圍"
                  data={timeFilterOptions}
                  value={filterTime}
                  onChange={(value) => {
                    setFilterTime(value);
                    setCurrentPage(1);
                  }}
                  clearable
                  size="md"
                />
              </Grid.Col>
            </Grid>

            {hasEvents ? (
              <Stack gap="lg">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    找到 {total} 場活動
                  </Text>
                </Group>

                <Grid>
                  {events.map((event) => {
                    const status = resolveEventStatus(event);
                    const categoryColor = event.category_id ? categoryColorMap.get(event.category_id) : undefined;

                    return (
                      <Grid.Col key={event.id} span={{ base: 12, md: 6 }}>
                        <Card
                          shadow="sm"
                          padding="lg"
                          radius="md"
                          withBorder
                          className="hover-translate-y"
                          style={{ cursor: 'pointer', height: '100%' }}
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          <Stack gap="md">
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={6} style={{ flex: 1 }}>
                                <Group gap={6} wrap="wrap">
                                  {event.category_name && (
                                    <Badge variant="light" color={categoryColor || 'blue'}>
                                      {event.category_name}
                                    </Badge>
                                  )}
                                  {event.is_online && (
                                    <Badge variant="light" color="indigo">
                                      線上活動
                                    </Badge>
                                  )}
                                  {event.is_free && (
                                    <Badge variant="light" color="teal">
                                      免費
                                    </Badge>
                                  )}
                                </Group>
                                <Text fw={600} size="lg" lineClamp={2}>
                                  {event.title}
                                </Text>
                              </Stack>
                              <Badge color={status.color}>{status.label}</Badge>
                            </Group>

                            <Stack gap={6} c="dimmed">
                              <Group gap={6} wrap="nowrap">
                                <IconCalendar size={16} />
                                <Text size="sm">
                                  {formatDateTime(event.start_time)}
                                  {event.end_time ? ` - ${formatDateTime(event.end_time)}` : ''}
                                </Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <IconClock size={16} />
                                <Text size="sm">
                                  {event.registration_end
                                    ? `報名截止：${formatDateTime(event.registration_end, { dateStyle: 'medium' })}`
                                    : '報名時間未設定'}
                                </Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <IconMapPin size={16} />
                                <Text size="sm">
                                  {event.is_online
                                    ? '線上活動'
                                    : event.location || '地點待定'}
                                </Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <IconUsers size={16} />
                                <Text size="sm">
                                  {event.max_participants
                                    ? `${event.current_participants ?? 0} / ${event.max_participants} 人`
                                    : '無人數限制'}
                                  {event.allow_waitlist && event.waitlist_count
                                    ? `（候補 ${event.waitlist_count}）`
                                    : ''}
                                </Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <IconTicket size={16} />
                                <Text size="sm">{formatFee(event)}</Text>
                              </Group>
                            </Stack>

                            {event.description && (
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {event.description}
                              </Text>
                            )}

                            <Group justify="space-between" align="center">
                              <Text size="xs" c="dimmed">
                                主辦人：{event.organizer_name || '未提供'}
                              </Text>
                              {typeof event.views_count === 'number' && (
                                <Text size="xs" c="dimmed">
                                  {event.views_count} 次瀏覽
                                </Text>
                              )}
                            </Group>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    );
                  })}
                </Grid>

                {totalPages > 1 && (
                  <Center>
                    <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} />
                  </Center>
                )}
              </Stack>
            ) : (
              <Center py="xl">
                <Text c="dimmed">目前沒有符合條件的活動</Text>
              </Center>
            )}
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

