'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Grid,
  Select,
  Checkbox,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface BulletinCategory {
  id: number;
  name: string;
}

export default function CreateBulletinPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [creating, setCreating] = useState(false);

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
      title: (value) => (value.trim().length > 0 ? null : '公告標題不能為空'),
      content: (value) => (value.trim().length > 0 ? null : '公告內容不能為空'),
      category_id: (value) => (value > 0 ? null : '請選擇公告分類'),
    },
  });

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

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setCreating(true);
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能建立公告',
          color: 'orange',
        });
        router.push('/auth/login');
        return;
      }

      const bulletinData: any = {
        title: values.title.trim(),
        content: values.content.trim(),
        bulletin_type: values.bulletin_type,
        category_id: values.category_id,
        cover_image_url: values.cover_image_url.trim() || undefined,
        is_pinned: values.is_pinned,
        is_featured: values.is_featured,
        allow_comments: values.allow_comments,
      };

      const result = await api.bulletins.create(bulletinData, token);

      notifications.show({
        title: '建立成功',
        message: '公告已成功發布',
        color: 'green',
      });

      const bulletinId = result?.bulletin?.id || result?.id;
      if (bulletinId) {
        router.push(`/bulletins/${bulletinId}`);
      } else {
        router.push('/bulletins');
      }
    } catch (error) {
      notifications.show({
        title: '建立失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setCreating(false);
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

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                發布新公告
              </Title>
              <Text c="dimmed">填寫以下資訊以發布新的公告</Text>
            </div>

            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                  <div>
                    <Title order={3} mb="md">
                      基本資訊
                    </Title>
                    <Grid>
                      <Grid.Col span={12}>
                        <TextInput
                          label="公告標題"
                          placeholder="例如：校友會年度大會通知"
                          required
                          {...form.getInputProps('title')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="公告類型"
                          placeholder="選擇公告類型"
                          data={bulletinTypes}
                          required
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
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Textarea
                          label="公告內容"
                          placeholder="詳細描述公告內容..."
                          minRows={8}
                          required
                          {...form.getInputProps('content')}
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <TextInput
                          label="封面圖片 URL"
                          placeholder="https://example.com/image.jpg（選填）"
                          {...form.getInputProps('cover_image_url')}
                        />
                      </Grid.Col>
                    </Grid>
                  </div>

                  <div>
                    <Title order={3} mb="md">
                      其他設定
                    </Title>
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Checkbox
                          label="置頂公告"
                          description="將此公告置頂於列表最上方"
                          {...form.getInputProps('is_pinned', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Checkbox
                          label="精選公告"
                          description="標記為精選公告"
                          {...form.getInputProps('is_featured', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Checkbox
                          label="允許留言"
                          description="允許系友在此公告下留言"
                          {...form.getInputProps('allow_comments', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                    </Grid>
                  </div>

                  <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={() => router.back()}>
                      取消
                    </Button>
                    <Button type="submit" loading={creating}>
                      發布公告
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Card>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

