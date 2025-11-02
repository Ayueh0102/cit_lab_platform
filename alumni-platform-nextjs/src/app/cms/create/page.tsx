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
  TextInput,
  Textarea,
  Select,
  Switch,
  FileButton,
  Loader,
  Center,
  Modal,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconUpload,
  IconX,
  IconEye,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

export default function CMSCreatePage() {
  const router = useRouter();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      subtitle: '',
      content: '',
      summary: '',
      category_id: undefined as number | undefined,
      status: 'draft' as 'published' | 'draft' | 'archived',
      tags: '',
    },
    validate: {
      title: (value) => (value.trim().length < 3 ? '標題至少需要 3 個字符' : null),
      content: (value) => (value.trim().length < 10 ? '內容至少需要 10 個字符' : null),
    },
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    loadCategories();
  }, []);

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

  const handleSubmit = async (values: typeof form.values) => {
    if (!isAdmin) {
      notifications.show({
        title: '權限不足',
        message: '只有管理員可以發布文章',
        color: 'red',
      });
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.cms.create({
        ...values,
        category_id: values.category_id || undefined,
        cover_image_url: coverImageUrl || undefined,
      }, token);

      notifications.show({
        title: '發布成功',
        message: '文章已成功創建',
        color: 'green',
      });

      router.push('/cms');
    } catch (error) {
      notifications.show({
        title: '發布失敗',
        message: error instanceof Error ? error.message : '無法創建文章',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (url: string) => {
    setCoverImageUrl(url);
  };

  if (!isAdmin) {
    router.push('/');
    return null;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            {/* 標題 */}
            <Group>
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.push('/cms')}
              >
                返回
              </Button>
              <div>
                <Title order={1}>發布新文章</Title>
                <Text c="dimmed" mt="xs">
                  創建並發布新的內容文章
                </Text>
              </div>
            </Group>

            {/* 表單 */}
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* 基本資訊 */}
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Title order={3}>基本資訊</Title>
                    
                    <TextInput
                      label="標題"
                      placeholder="輸入文章標題"
                      required
                      {...form.getInputProps('title')}
                    />

                    <TextInput
                      label="副標題"
                      placeholder="輸入文章副標題（選填）"
                      {...form.getInputProps('subtitle')}
                    />

                    <Textarea
                      label="摘要"
                      placeholder="輸入文章摘要（選填）"
                      rows={3}
                      {...form.getInputProps('summary')}
                    />

                    <Select
                      label="分類"
                      placeholder="選擇文章分類（選填）"
                      data={categories.map(cat => ({
                        value: cat.id.toString(),
                        label: cat.name,
                      }))}
                      value={form.values.category_id?.toString()}
                      onChange={(value) => form.setFieldValue('category_id', value ? parseInt(value) : undefined)}
                      clearable
                    />

                    <Select
                      label="發布狀態"
                      data={[
                        { value: 'draft', label: '草稿' },
                        { value: 'published', label: '立即發布' },
                        { value: 'archived', label: '封存' },
                      ]}
                      {...form.getInputProps('status')}
                    />

                    <TextInput
                      label="標籤"
                      placeholder="輸入標籤，用逗號分隔（選填）"
                      {...form.getInputProps('tags')}
                    />
                  </Stack>
                </Paper>

                {/* 封面圖片 */}
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Title order={3}>封面圖片</Title>
                    
                    {coverImageUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: 200 }}>
                        <Image
                          src={coverImageUrl}
                          alt="封面圖片"
                          fill
                          style={{ objectFit: 'cover', borderRadius: 'var(--mantine-radius-md)' }}
                          unoptimized={coverImageUrl.startsWith('http://localhost')}
                        />
                        <Button
                          color="red"
                          variant="filled"
                          size="xs"
                          style={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={() => setCoverImageUrl('')}
                        >
                          <IconX size={16} />
                        </Button>
                      </div>
                    ) : (
                      <FileUpload
                        label="上傳封面圖片"
                        accept="image/*"
                        onUploadComplete={handleFileUpload}
                        relatedType="article_cover"
                      />
                    )}
                  </Stack>
                </Paper>

                {/* 內容編輯 */}
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Title order={3}>文章內容</Title>
                    
                    <RichTextEditor
                      content={form.values.content}
                      onChange={(content) => form.setFieldValue('content', content)}
                      placeholder="輸入文章內容..."
                    />
                  </Stack>
                </Paper>

                {/* 操作按鈕 */}
                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    leftSection={<IconEye size={16} />}
                    onClick={() => setShowPreview(true)}
                  >
                    預覽
                  </Button>
                  <Button
                    variant="subtle"
                    onClick={() => router.push('/cms')}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    leftSection={<IconUpload size={16} />}
                  >
                    {form.values.status === 'published' ? '發布文章' : '保存草稿'}
                  </Button>
                </Group>
              </Stack>
            </form>

            {/* 預覽對話框 */}
            <Modal
              opened={showPreview}
              onClose={() => setShowPreview(false)}
              title="文章預覽"
              size="xl"
              centered
            >
              <Stack gap="md">
                <div>
                  <Title order={2}>{form.values.title || '（無標題）'}</Title>
                  {form.values.subtitle && (
                    <Text size="lg" c="dimmed" mt="xs">
                      {form.values.subtitle}
                    </Text>
                  )}
                  {form.values.summary && (
                    <Paper p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }} mt="md">
                      <Text size="sm" c="dimmed">
                        {form.values.summary}
                      </Text>
                    </Paper>
                  )}
                </div>
                
                {coverImageUrl && (
                  <div style={{ position: 'relative', width: '100%', height: 300 }}>
                    <Image
                      src={coverImageUrl}
                      alt="封面圖片"
                      fill
                      style={{ objectFit: 'cover', borderRadius: 'var(--mantine-radius-md)' }}
                      unoptimized={coverImageUrl.startsWith('http://localhost')}
                    />
                  </div>
                )}
                
                <Divider />
                
                <div
                  style={{
                    fontSize: 'var(--mantine-font-size-md)',
                    lineHeight: 1.8,
                  }}
                  dangerouslySetInnerHTML={{ __html: form.values.content || '<p>（無內容）</p>' }}
                />
              </Stack>
            </Modal>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
