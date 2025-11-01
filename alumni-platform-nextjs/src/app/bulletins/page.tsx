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
  Loader,
  Center,
  Button,
  TextInput,
  Select,
  Pagination,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { 
  IconSearch, 
  IconPinned, 
  IconEye, 
  IconCalendar,
  IconStar,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Bulletin {
  id: number;
  title: string;
  content: string;
  bulletin_type?: string;
  category_id?: number;
  category_name?: string;
  status?: string;
  is_pinned?: boolean;
  is_featured?: boolean;
  views_count?: number;
  comments_count?: number;
  author_id?: number;
  author_name?: string;
  published_at?: string;
  created_at?: string;
  cover_image_url?: string;
}

interface BulletinCategory {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

export default function BulletinsPage() {
  const router = useRouter();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 防抖處理搜索詞
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 當搜索條件改變時，重新載入數據
  useEffect(() => {
    loadBulletins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filterType, filterCategory, currentPage]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = getToken();
      const data = await api.bulletins.getCategories(token || undefined);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadBulletins = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params: any = {
        status: 'PUBLISHED',
        page: currentPage,
        per_page: 20,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (filterType) {
        params.type = filterType;
      }
      if (filterCategory) {
        params.category_id = parseInt(filterCategory);
      }

      const response = await api.bulletins.getAll(token || undefined, params);
      setBulletins(response.bulletins || []);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 1);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入公告列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulletinTypes = [
    { value: 'ANNOUNCEMENT', label: '一般公告' },
    { value: 'NEWS', label: '新聞' },
    { value: 'ACADEMIC', label: '學術公告' },
    { value: 'RECRUITMENT', label: '徵才訊息' },
    { value: 'EVENT_NOTICE', label: '活動通知' },
    { value: 'OTHER', label: '其他' },
  ];

  const getTypeLabel = (type?: string) => {
    return bulletinTypes.find(t => t.value === type)?.label || type || '一般公告';
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
                  公告中心
                </Title>
                <Text c="dimmed">查看最新的校友會公告與訊息</Text>
              </div>
              {isAuthenticated() && (
                <Button onClick={() => router.push('/bulletins/create')}>
                  發布公告
                </Button>
              )}
            </Group>

            <Group grow>
              <TextInput
                placeholder="搜尋公告標題或內容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                size="md"
                leftSection={<IconSearch size={16} />}
              />
              <Select
                placeholder="公告類型"
                data={bulletinTypes.map(t => ({ value: t.value, label: t.label }))}
                value={filterType}
                onChange={(value) => {
                  setFilterType(value);
                  setCurrentPage(1);
                }}
                clearable
                size="md"
              />
              <Select
                placeholder="公告分類"
                data={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={filterCategory}
                onChange={(value) => {
                  setFilterCategory(value);
                  setCurrentPage(1);
                }}
                clearable
                size="md"
              />
            </Group>

            {bulletins.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">目前沒有公告</Text>
              </Center>
            ) : (
              <Stack gap="md">
                {total > 0 && (
                  <Text size="sm" c="dimmed">
                    找到 {total} 則公告
                  </Text>
                )}
                {bulletins.map((bulletin) => (
                  <Card
                    key={bulletin.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    className="hover-translate-y"
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Group gap="xs">
                          {bulletin.is_pinned && (
                            <IconPinned size={18} color="red" />
                          )}
                          {bulletin.is_featured && (
                            <IconStar size={18} color="gold" />
                          )}
                          <Text fw={500} size="lg">
                            {bulletin.title}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge variant="light" color="blue">
                            {getTypeLabel(bulletin.bulletin_type)}
                          </Badge>
                          {bulletin.category_name && (
                            <Badge variant="light" color="teal">
                              {bulletin.category_name}
                            </Badge>
                          )}
                        </Group>
                      </Group>

                      <Text size="sm" lineClamp={2} c="dimmed">
                        {bulletin.content}
                      </Text>

                      <Group justify="space-between">
                        <Group gap="xs">
                          {bulletin.author_name && (
                            <Text size="xs" c="dimmed">
                              發布者: {bulletin.author_name}
                            </Text>
                          )}
                          {bulletin.published_at && (
                            <>
                              <Text size="xs" c="dimmed">•</Text>
                              <Group gap={4}>
                                <IconCalendar size={12} />
                                <Text size="xs" c="dimmed">
                                  {new Date(bulletin.published_at).toLocaleDateString('zh-TW')}
                                </Text>
                              </Group>
                            </>
                          )}
                        </Group>
                        <Group gap="xs">
                          {bulletin.views_count !== undefined && (
                            <Group gap={4}>
                              <IconEye size={14} />
                              <Text size="xs" c="dimmed">
                                {bulletin.views_count} 次瀏覽
                              </Text>
                            </Group>
                          )}
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                ))}
                {totalPages > 1 && (
                  <Center mt="md">
                    <Pagination
                      total={totalPages}
                      value={currentPage}
                      onChange={setCurrentPage}
                    />
                  </Center>
                )}
              </Stack>
            )}
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
