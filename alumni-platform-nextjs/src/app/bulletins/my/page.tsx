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
  Checkbox,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCalendar,
  IconPinned,
  IconStar,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

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
  published_at?: string;
  created_at?: string;
  cover_image_url?: string;
  allow_comments?: boolean;
}

interface BulletinCategory {
  id: number;
  name: string;
}

export default function MyBulletinsPage() {
  const router = useRouter();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      content: '',
      bulletin_type: 'ANNOUNCEMENT',
      category_id: 0,
      cover_image_url: '',
      is_pinned: false,
      is_featured: false,
      allow_comments: true,
    },
    validate: {
      title: (value) => (value.length > 0 ? null : '公告標題不能為空'),
      content: (value) => (value.length > 0 ? null : '公告內容不能為空'),
    },
  });

  useEffect(() => {
    loadCategories();
    loadMyBulletins();
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const token = getToken();
      const data = await api.bulletins.getCategories(token || undefined);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadMyBulletins = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let status: string | undefined;
      if (activeTab === 'published') {
        status = 'published';
      } else if (activeTab === 'draft') {
        status = 'draft';
      } else if (activeTab === 'archived') {
        status = 'archived';
      }

      const data = await api.bulletins.getMyBulletins(token, status);
      setBulletins(data.bulletins || []);
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

  const handleEdit = async (bulletin: Bulletin) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const fullBulletin = await api.bulletins.getById(bulletin.id, token);
      const bulletinData = fullBulletin.bulletin || fullBulletin;

      setSelectedBulletin(bulletinData);
      form.setValues({
        title: bulletinData.title || '',
        content: bulletinData.content || '',
        bulletin_type: bulletinData.bulletin_type || 'ANNOUNCEMENT',
        category_id: bulletinData.category_id || 0,
        cover_image_url: bulletinData.cover_image_url || '',
        is_pinned: bulletinData.is_pinned || false,
        is_featured: bulletinData.is_featured || false,
        allow_comments: bulletinData.allow_comments ?? true,
      });
      openEditModal();
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入公告詳情',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedBulletin) return;

    try {
      setEditing(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const updateData: any = {
        title: values.title,
        content: values.content,
        bulletin_type: values.bulletin_type,
        category_id: values.category_id || undefined,
        cover_image_url: values.cover_image_url || undefined,
        is_pinned: values.is_pinned,
        is_featured: values.is_featured,
        allow_comments: values.allow_comments,
      };

      await api.bulletins.update(selectedBulletin.id, updateData, token);

      notifications.show({
        title: '更新成功',
        message: '公告已成功更新',
        color: 'green',
      });

      closeEditModal();
      loadMyBulletins();
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

  const handleDelete = (bulletin: Bulletin) => {
    setSelectedBulletin(bulletin);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!selectedBulletin) return;

    try {
      setDeleting(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.bulletins.delete(selectedBulletin.id, token);

      notifications.show({
        title: '刪除成功',
        message: '公告已成功刪除',
        color: 'green',
      });

      closeDeleteModal();
      loadMyBulletins();
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

  const bulletinTypes = [
    { value: 'ANNOUNCEMENT', label: '一般公告' },
    { value: 'NEWS', label: '新聞' },
    { value: 'ACADEMIC', label: '學術公告' },
    { value: 'RECRUITMENT', label: '徵才訊息' },
    { value: 'EVENT_NOTICE', label: '活動通知' },
    { value: 'OTHER', label: '其他' },
  ];

  const statusMap: { [key: string]: string } = {
    PUBLISHED: '已發布',
    DRAFT: '草稿',
    ARCHIVED: '已封存',
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
                  我的公告
                </Title>
                <Text c="dimmed">管理您發布的公告</Text>
              </div>
              <Button onClick={() => router.push('/bulletins/create')}>
                發布新公告
              </Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all">所有公告</Tabs.Tab>
                <Tabs.Tab value="published">已發布</Tabs.Tab>
                <Tabs.Tab value="draft">草稿</Tabs.Tab>
                <Tabs.Tab value="archived">已封存</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value={activeTab || 'all'} pt="xl">
                {bulletins.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有公告</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {bulletins.map((bulletin) => {
                      const typeLabel = bulletinTypes.find(t => t.value === bulletin.bulletin_type)?.label || bulletin.bulletin_type;

                      return (
                        <Card
                          key={bulletin.id}
                          shadow="sm"
                          padding="lg"
                          radius="md"
                          withBorder
                          className="hover-translate-y"
                        >
                          <Group justify="space-between" mb="xs">
                            <Group gap="xs">
                              {bulletin.is_pinned && <IconPinned size={18} color="red" />}
                              {bulletin.is_featured && <IconStar size={18} color="gold" />}
                              <Text fw={500} size="lg">
                                {bulletin.title}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              {typeLabel && (
                                <Badge variant="light" color="blue">
                                  {typeLabel}
                                </Badge>
                              )}
                              {bulletin.category_name && (
                                <Badge variant="light" color="teal">
                                  {bulletin.category_name}
                                </Badge>
                              )}
                              <Badge color={
                                bulletin.status === 'published' ? 'green' :
                                bulletin.status === 'draft' ? 'yellow' : 'gray'
                              }>
                                {statusMap[bulletin.status || ''] || bulletin.status}
                              </Badge>
                            </Group>
                          </Group>

                          <Text size="sm" lineClamp={2} c="dimmed" mb="sm">
                            {bulletin.content}
                          </Text>

                          <Group justify="space-between" mt="md">
                            <Group gap="xs">
                              {bulletin.published_at && (
                                <>
                                  <IconCalendar size={14} />
                                  <Text size="xs" c="dimmed">
                                    {new Date(bulletin.published_at).toLocaleDateString('zh-TW')}
                                  </Text>
                                </>
                              )}
                              {bulletin.views_count !== undefined && (
                                <>
                                  <Text size="xs" c="dimmed">•</Text>
                                  <IconEye size={14} />
                                  <Text size="xs" c="dimmed">
                                    {bulletin.views_count} 次瀏覽
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
                                  onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                                >
                                  查看詳情
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleEdit(bulletin)}
                                >
                                  編輯
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDelete(bulletin)}
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

        {/* 編輯公告 Modal */}
        <Modal
          opened={editModalOpened}
          onClose={closeEditModal}
          title="編輯公告"
          size="lg"
          centered
        >
          <form onSubmit={form.onSubmit(handleUpdate)}>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="公告標題"
                    placeholder="公告標題"
                    required
                    {...form.getInputProps('title')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="公告類型"
                    placeholder="選擇公告類型"
                    data={bulletinTypes}
                    {...form.getInputProps('bulletin_type')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="公告分類"
                    placeholder="選擇分類"
                    data={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                    {...form.getInputProps('category_id')}
                    onChange={(value) => form.setFieldValue('category_id', value ? parseInt(value) : 0)}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="公告內容"
                    placeholder="公告內容..."
                    minRows={6}
                    required
                    {...form.getInputProps('content')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="封面圖片 URL"
                    placeholder="https://..."
                    {...form.getInputProps('cover_image_url')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Checkbox
                    label="置頂公告"
                    {...form.getInputProps('is_pinned', { type: 'checkbox' })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Checkbox
                    label="精選公告"
                    {...form.getInputProps('is_featured', { type: 'checkbox' })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Checkbox
                    label="允許留言"
                    {...form.getInputProps('allow_comments', { type: 'checkbox' })}
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
            <Text>確定要刪除此公告嗎?此操作無法復原。</Text>
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

