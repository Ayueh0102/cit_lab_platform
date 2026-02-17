'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Badge,
  Card,
  Grid,
  TextInput,
  Select,
  Pagination,
  ActionIcon,
  Menu,
  Modal,
  Avatar,
  Divider,
  Loader,
  Center,
  Skeleton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconFileText,
  IconCalendar,
  IconUser,
  IconSearch,
  IconDots,
  IconCheck,
  IconX,
  IconArchive,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

interface Article {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  status: 'published' | 'draft' | 'archived';
  category_id?: number;
  category_name?: string;
  category_color?: string;
  cover_image_url?: string;
  tags?: string;
  views_count: number;
  likes_count: number;
  author_name?: string;
  published_at?: string;
  created_at: string;
}

export default function CMSManagePage() {
  const router = useRouter();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{id: number; name: string; color?: string}>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
    loadArticles();
  }, [page, statusFilter, categoryFilter, searchQuery]);

  const loadCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.cms.getCategories(token);
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params: any = {
        page,
        per_page: 12,
      };

      // 一般系友只能看到已發布的文章，管理員可以看到所有狀態
      if (isAdmin) {
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
      } else {
        // 非管理員只能看到已發布的文章
        params.status = 'published';
      }

      if (categoryFilter !== 'all') {
        params.category_id = parseInt(categoryFilter);
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await api.cms.getArticles(token, params);
      setArticles(response.articles || []);
      setTotalPages(response.pages || 1);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入文章列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await api.cms.delete(articleToDelete, token);
      
      notifications.show({
        title: '刪除成功',
        message: '文章已成功刪除',
        color: 'green',
      });
      
      setDeleteModalOpened(false);
      setArticleToDelete(null);
      loadArticles();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除文章',
        color: 'red',
      });
    }
  };

  const handlePublish = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.cms.publish(id, token);
      
      notifications.show({
        title: '發布成功',
        message: '文章已成功發布',
        color: 'green',
      });
      
      loadArticles();
    } catch (error) {
      notifications.show({
        title: '發布失敗',
        message: error instanceof Error ? error.message : '無法發布文章',
        color: 'red',
      });
    }
  };

  const handleArchive = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.cms.archive(id, token);
      
      notifications.show({
        title: '封存成功',
        message: '文章已成功封存',
        color: 'green',
      });
      
      loadArticles();
    } catch (error) {
      notifications.show({
        title: '封存失敗',
        message: error instanceof Error ? error.message : '無法封存文章',
        color: 'red',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge color="green">已發布</Badge>;
      case 'draft':
        return <Badge color="gray">草稿</Badge>;
      case 'archived':
        return <Badge color="orange">已封存</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未發布';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            {/* 標題和操作 */}
            <Group justify="space-between">
              <div>
                <Title order={1}>系友動態</Title>
                <Text c="dimmed" mt="xs">
                  分享系友活動、記錄與文章，記錄系友會的美好時光
                </Text>
              </div>
              {isAdmin && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => router.push('/cms/create')}
                >
                  發布新文章
                </Button>
              )}
            </Group>

            {/* 搜尋和篩選 */}
            <Paper shadow="sm" p="md" radius="md" withBorder>
              <Group>
                <TextInput
                  placeholder="搜尋文章標題或內容..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                {isAdmin && (
                  <Select
                    placeholder="狀態篩選"
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value || 'all')}
                    data={[
                      { value: 'all', label: '全部' },
                      { value: 'published', label: '已發布' },
                      { value: 'draft', label: '草稿' },
                      { value: 'archived', label: '已封存' },
                    ]}
                    style={{ width: 150 }}
                  />
                )}
                <Select
                  placeholder="分類篩選"
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value || 'all')}
                  data={[
                    { value: 'all', label: '全部分類' },
                    ...categories.map(cat => ({
                      value: cat.id.toString(),
                      label: cat.name,
                    })),
                  ]}
                  style={{ width: 150 }}
                />
              </Group>
            </Paper>

            {/* 文章列表 */}
            {loading ? (
              <Grid>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" className="glass-card-soft" h="100%">
                      <Stack gap="md" h="100%">
                        {/* 封面圖骨架 */}
                        <Skeleton height={150} radius="md" />
                        {/* Badge + 選單 */}
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Skeleton height={20} width={50} radius="xl" />
                            <Skeleton height={20} width={50} radius="xl" />
                          </Group>
                          <Skeleton height={24} width={24} radius="md" />
                        </Group>
                        {/* 標題 */}
                        <Skeleton height={20} width="80%" radius="md" />
                        {/* 副標題 */}
                        <Skeleton height={14} width="60%" radius="md" />
                        {/* 摘要 */}
                        <Skeleton height={14} width="90%" radius="md" />
                        <Skeleton height={14} width="70%" radius="md" />
                        {/* 底部資訊 */}
                        <div style={{ marginTop: 'auto' }}>
                          <Skeleton height={1} width="100%" radius="md" mb="sm" />
                          <Group justify="space-between">
                            <Skeleton height={12} width={60} radius="md" />
                            <Skeleton height={12} width={80} radius="md" />
                          </Group>
                          <Group gap="md" mt="xs">
                            <Skeleton height={12} width={50} radius="md" />
                            <Skeleton height={12} width={50} radius="md" />
                          </Group>
                        </div>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            ) : articles.length === 0 ? (
              <Card shadow="sm" padding="xl" radius="md" className="glass-card-soft" style={{ border: 'none' }}>
                <Stack align="center" gap="md" py="xl">
                  <IconFileText size={56} color="var(--mantine-color-pink-3)" stroke={1.5} />
                  <Text size="lg" fw={600} c="dimmed">還沒有文章</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={360}>
                    分享您的學術研究或產業經驗，與校友們交流
                  </Text>
                  <Button
                    variant="light"
                    color="pink"
                    radius="xl"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => router.push('/cms/create')}
                    mt="xs"
                  >
                    發布第一篇文章
                  </Button>
                </Stack>
              </Card>
            ) : (
              <>
                <Grid>
                  {articles.map((article) => (
                    <Grid.Col key={article.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                        <Stack gap="md" h="100%">
                          {article.cover_image_url && (
                            <Card.Section>
                              <div style={{ position: 'relative', width: '100%', height: 150 }}>
                                <Image
                                  src={article.cover_image_url}
                                  alt={article.title}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  unoptimized={article.cover_image_url.startsWith('http://localhost')}
                                />
                              </div>
                            </Card.Section>
                          )}
                          
                          <div>
                            <Group justify="space-between" mb="xs">
                              <Group gap="xs">
                                {article.category_name && (
                                  <Badge size="sm" color={article.category_color || 'blue'}>
                                    {article.category_name}
                                  </Badge>
                                )}
                                {getStatusBadge(article.status)}
                              </Group>
                              {isAdmin ? (
                                <Menu shadow="md" width={200}>
                                  <Menu.Target>
                                    <ActionIcon variant="subtle">
                                      <IconDots size={16} />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Item
                                      leftSection={<IconEye size={14} />}
                                      onClick={() => router.push(`/cms/${article.id}`)}
                                    >
                                      查看
                                    </Menu.Item>
                                    <Menu.Item
                                      leftSection={<IconEdit size={14} />}
                                      onClick={() => router.push(`/cms/${article.id}/edit`)}
                                    >
                                      編輯
                                    </Menu.Item>
                                    {article.status === 'draft' && (
                                      <Menu.Item
                                        leftSection={<IconCheck size={14} />}
                                        onClick={() => handlePublish(article.id)}
                                      >
                                        發布
                                      </Menu.Item>
                                    )}
                                    {article.status === 'published' && (
                                      <Menu.Item
                                        leftSection={<IconArchive size={14} />}
                                        onClick={() => handleArchive(article.id)}
                                      >
                                        封存
                                      </Menu.Item>
                                    )}
                                    <Menu.Divider />
                                    <Menu.Item
                                      color="red"
                                      leftSection={<IconTrash size={14} />}
                                      onClick={() => {
                                        setArticleToDelete(article.id);
                                        setDeleteModalOpened(true);
                                      }}
                                    >
                                      刪除
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                              ) : (
                                <ActionIcon variant="subtle" onClick={() => router.push(`/cms/${article.id}`)}>
                                  <IconEye size={16} />
                                </ActionIcon>
                              )}
                            </Group>
                            
                            <Title order={4} mb="xs" lineClamp={2}>
                              {article.title}
                            </Title>
                            
                            {article.subtitle && (
                              <Text size="sm" c="dimmed" mb="xs" lineClamp={1}>
                                {article.subtitle}
                              </Text>
                            )}
                            
                            {article.summary && (
                              <Text size="sm" lineClamp={2} mb="md">
                                {article.summary}
                              </Text>
                            )}
                          </div>
                          
                          <div style={{ marginTop: 'auto' }}>
                            <Divider mb="sm" />
                            <Group justify="space-between" gap="xs">
                              <Group gap="xs">
                                <IconUser size={14} />
                                <Text size="xs" c="dimmed">
                                  {article.author_name || '未知'}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <IconCalendar size={14} />
                                <Text size="xs" c="dimmed">
                                  {formatDate(article.published_at)}
                                </Text>
                              </Group>
                            </Group>
                            <Group gap="md" mt="xs">
                              <Text size="xs" c="dimmed">
                                瀏覽: {article.views_count}
                              </Text>
                              <Text size="xs" c="dimmed">
                                按讚: {article.likes_count}
                              </Text>
                            </Group>
                          </div>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>

                {/* 分頁 */}
                {totalPages > 1 && (
                  <Group justify="center">
                    <Pagination
                      value={page}
                      onChange={setPage}
                      total={totalPages}
                    />
                  </Group>
                )}
              </>
            )}
          </Stack>

          {/* 刪除確認對話框 */}
          <Modal
            opened={deleteModalOpened}
            onClose={() => {
              setDeleteModalOpened(false);
              setArticleToDelete(null);
            }}
            title="確認刪除"
            centered
          >
            <Stack gap="md">
              <Text>您確定要刪除此文章嗎？此操作無法復原。</Text>
              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => {
                  setDeleteModalOpened(false);
                  setArticleToDelete(null);
                }}>
                  取消
                </Button>
                <Button color="red" onClick={handleDelete}>
                  刪除
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

