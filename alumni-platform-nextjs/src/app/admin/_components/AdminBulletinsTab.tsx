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
  IconPinned,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface AdminBulletinsTabProps {
  onDataChanged: () => void;
}

export function AdminBulletinsTab({ onDataChanged }: AdminBulletinsTabProps) {
  const router = useRouter();
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [bulletinsLoading, setBulletinsLoading] = useState(false);
  const [bulletinsSearch, setBulletinsSearch] = useState('');
  const [bulletinsStatusFilter, setBulletinsStatusFilter] = useState<string | null>(null);
  const [bulletinsPage, setBulletinsPage] = useState(1);
  const [bulletinsTotal, setBulletinsTotal] = useState(0);

  useEffect(() => {
    loadBulletins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulletinsPage, bulletinsStatusFilter]);

  // 搜尋防抖處理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bulletinsPage === 1) {
        loadBulletins();
      } else {
        setBulletinsPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulletinsSearch]);

  const loadBulletins = async () => {
    try {
      setBulletinsLoading(true);
      const token = getToken();
      if (!token) return;

      const params: any = {
        page: bulletinsPage,
        per_page: 20,
      };

      if (bulletinsSearch.trim()) {
        params.search = bulletinsSearch.trim();
      }
      if (bulletinsStatusFilter) {
        params.status = bulletinsStatusFilter;
      }

      const data = await api.bulletins.getAll(token, params);
      setBulletins(data.bulletins || []);
      setBulletinsTotal(data.total || 0);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入公告列表',
        color: 'red',
      });
    } finally {
      setBulletinsLoading(false);
    }
  };

  const handleApproveBulletin = async (bulletinId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveBulletin(bulletinId, token);
      await loadBulletins();
      onDataChanged();

      notifications.show({
        title: '審核成功',
        message: '公告已通過審核',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核公告',
        color: 'red',
      });
    }
  };

  const handleDeleteBulletin = async (bulletinId: number) => {
    if (!confirm('確定要刪除此公告嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.bulletins.delete(bulletinId, token);
      await loadBulletins();
      onDataChanged();

      notifications.show({
        title: '刪除成功',
        message: '公告已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除公告',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="搜尋公告..."
          leftSection={<IconSearch size={16} />}
          value={bulletinsSearch}
          onChange={(e) => setBulletinsSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="狀態篩選"
          data={[
            { value: 'PUBLISHED', label: '已發布' },
            { value: 'DRAFT', label: '草稿' },
            { value: 'ARCHIVED', label: '已封存' },
          ]}
          value={bulletinsStatusFilter}
          onChange={setBulletinsStatusFilter}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      {bulletinsLoading ? (
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
                  <Table.Th>類型</Table.Th>
                  <Table.Th>分類</Table.Th>
                  <Table.Th>狀態</Table.Th>
                  <Table.Th>釘選</Table.Th>
                  <Table.Th>作者</Table.Th>
                  <Table.Th>瀏覽次數</Table.Th>
                  <Table.Th>發布日期</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bulletins.map((bulletin) => (
                  <Table.Tr key={bulletin.id}>
                    <Table.Td>{bulletin.id}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {bulletin.is_pinned && <IconPinned size={14} color="orange" />}
                        <Button
                          variant="subtle"
                          size="xs"
                          onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                        >
                          {bulletin.title}
                        </Button>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {bulletin.bulletin_type === 'announcement' ? '公告' :
                         bulletin.bulletin_type === 'news' ? '新聞' :
                         bulletin.bulletin_type === 'event' ? '活動' : bulletin.bulletin_type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{bulletin.category_name || '未分類'}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          bulletin.status === 'published' ? 'green' :
                          bulletin.status === 'draft' ? 'gray' : 'orange'
                        }
                        variant="light"
                      >
                        {bulletin.status === 'published' ? '已發布' :
                         bulletin.status === 'draft' ? '草稿' : '已封存'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {bulletin.is_pinned ? (
                        <Badge size="sm" color="orange" variant="light">已釘選</Badge>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>{bulletin.author_name || '未知'}</Table.Td>
                    <Table.Td>{bulletin.views_count || 0}</Table.Td>
                    <Table.Td>
                      {bulletin.published_at || bulletin.created_at
                        ? new Date(bulletin.published_at || bulletin.created_at).toLocaleDateString('zh-TW')
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {bulletin.status === 'draft' && (
                          <Tooltip label="審核通過">
                            <ActionIcon
                              variant="light"
                              color="green"
                              onClick={() => handleApproveBulletin(bulletin.id)}
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="查看詳情">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="刪除">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteBulletin(bulletin.id)}
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
          {bulletinsTotal > 20 && (
            <Group justify="center">
              <Pagination
                value={bulletinsPage}
                onChange={setBulletinsPage}
                total={Math.ceil(bulletinsTotal / 20)}
              />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
