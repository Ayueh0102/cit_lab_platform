'use client';

import { useEffect, useState } from 'react';
import {
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Table,
  ActionIcon,
  Select,
  TextInput,
  Button,
  Loader,
  Center,
  Tooltip,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconCheck,
  IconEye,
  IconTrash,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface AdminEventsTabProps {
  onDataChanged: () => void;
}

export function AdminEventsTab({ onDataChanged }: AdminEventsTabProps) {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsSearch, setEventsSearch] = useState('');
  const [eventsStatusFilter, setEventsStatusFilter] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(0);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsPage, eventsStatusFilter]);

  // 搜尋防抖處理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (eventsPage === 1) {
        loadEvents();
      } else {
        setEventsPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsSearch]);

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const token = getToken();
      if (!token) return;

      const params: any = {
        page: eventsPage,
        per_page: 20,
      };

      if (eventsSearch.trim()) {
        params.search = eventsSearch.trim();
      }
      if (eventsStatusFilter) {
        params.status = eventsStatusFilter;
      }

      const data = await api.events.getAll(token, params);
      setEvents(data.events || []);
      setEventsTotal(data.total || 0);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入活動列表',
        color: 'red',
      });
    } finally {
      setEventsLoading(false);
    }
  };

  const handleApproveEvent = async (eventId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveEvent(eventId, token);
      await loadEvents();
      onDataChanged();

      notifications.show({
        title: '審核成功',
        message: '活動已通過審核',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核活動',
        color: 'red',
      });
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('確定要刪除此活動嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.events.delete(eventId, token);
      await loadEvents();
      onDataChanged();

      notifications.show({
        title: '刪除成功',
        message: '活動已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除活動',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="搜尋活動..."
          leftSection={<IconSearch size={16} />}
          value={eventsSearch}
          onChange={(e) => setEventsSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="狀態篩選"
          data={[
            { value: 'PUBLISHED', label: '已發布' },
            { value: 'DRAFT', label: '草稿' },
            { value: 'CANCELLED', label: '已取消' },
          ]}
          value={eventsStatusFilter}
          onChange={setEventsStatusFilter}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      {eventsLoading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : (
        <>
          <Paper className="glass-card-soft" p="md" radius="lg">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>標題</Table.Th>
                  <Table.Th>時間</Table.Th>
                  <Table.Th>地點</Table.Th>
                  <Table.Th>參與人數</Table.Th>
                  <Table.Th>狀態</Table.Th>
                  <Table.Th>主辦人</Table.Th>
                  <Table.Th>發布日期</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {events.map((event) => (
                  <Table.Tr key={event.id}>
                    <Table.Td>{event.id}</Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        {event.title}
                      </Button>
                    </Table.Td>
                    <Table.Td>
                      {event.start_time
                        ? new Date(event.start_time).toLocaleDateString('zh-TW')
                        : '未提供'}
                    </Table.Td>
                    <Table.Td>
                      {event.is_online ? (
                        <Badge size="sm" color="blue" variant="light">線上</Badge>
                      ) : (
                        event.location || '未提供'
                      )}
                    </Table.Td>
                    <Table.Td>
                      {event.current_participants || 0} / {event.max_participants || '\u221E'}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          event.status === 'published' ? 'green' :
                          event.status === 'draft' ? 'gray' : 'red'
                        }
                        variant="light"
                      >
                        {event.status === 'published' ? '已發布' :
                         event.status === 'draft' ? '草稿' : '已取消'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {event.organizer_name || '未知'}
                    </Table.Td>
                    <Table.Td>
                      {event.created_at ? new Date(event.created_at).toLocaleDateString('zh-TW') : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {event.status === 'draft' && (
                          <Tooltip label="審核通過">
                            <ActionIcon
                              variant="light"
                              color="green"
                              onClick={() => handleApproveEvent(event.id)}
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="查看詳情">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => router.push(`/events/${event.id}`)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="刪除">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          {eventsTotal > 20 && (
            <Group justify="center">
              <Pagination
                value={eventsPage}
                onChange={setEventsPage}
                total={Math.ceil(eventsTotal / 20)}
              />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
