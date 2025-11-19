'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Stack,
  Group,
  Button,
  Select,
  Modal,
  Text,
  Textarea,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconUpload,
  IconEye,
  IconPhoto,
  IconX,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

export default function CMSCreatePage() {
  const router = useRouter();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number; name: string; is_active?: boolean}>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      subtitle: '',
      content: '',
      summary: '',
      category_id: undefined as number | undefined,
      status: 'pending' as 'published' | 'draft' | 'pending' | 'archived',
      tags: '',
      cover_image_url: '',
    },
    validate: {
      content: (value) => (value.trim().length < 10 ? '內容至少需要 10 個字符' : null),
    },
  });

  useEffect(() => {
    loadCategories();
    
    // 從 localStorage 載入草稿
    const savedDraft = localStorage.getItem('cms_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.setValues(draft);
        if (draft.cover_image_url) {
          setCoverImageUrl(draft.cover_image_url);
        }
        notifications.show({
          title: '已載入草稿',
          message: '已自動載入上次編輯的內容',
          color: 'blue',
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // 自動保存草稿（每 30 秒）
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (form.values.content && form.values.content.trim().length > 0) {
        setAutoSaving(true);
        localStorage.setItem('cms_draft', JSON.stringify({
          ...form.values,
          cover_image_url: coverImageUrl,
        }));
        setLastSaved(new Date());
        setTimeout(() => setAutoSaving(false), 1000);
      }
    }, 30000); // 每 30 秒自動保存

    return () => clearInterval(autoSaveInterval);
  }, [form.values, coverImageUrl]);

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

  const handleCoverUpload = async (file: File) => {
    try {
      setUploadingCover(true);
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能上傳圖片',
          color: 'orange',
        });
        return;
      }

      const response = await api.files.upload(file, 'article_cover', undefined, token);
      
      if (response.url) {
        setCoverImageUrl(response.url);
        form.setFieldValue('cover_image_url', response.url);
        notifications.show({
          title: '上傳成功',
          message: '封面圖片已上傳',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: '上傳失敗',
        message: error instanceof Error ? error.message : '無法上傳圖片',
        color: 'red',
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // 強制檢查：非管理員用戶不能設置為 published
      let finalStatus = values.status;
      if (!isAdmin && finalStatus === 'published') {
        notifications.show({
          title: '權限不足',
          message: '只有管理員可以立即發布文章，已自動改為「提交審核」',
          color: 'orange',
        });
        finalStatus = 'pending';
      }

      // 從內容中提取標題（第一個 H1 標題）
      const contentHtml = values.content || '';
      const titleMatch = contentHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      // 如果沒有手動輸入摘要，自動從內容擷取前 150 字
      let autoSummary = values.summary;
      if (!autoSummary && contentHtml) {
        const textContent = contentHtml.replace(/<[^>]+>/g, '').trim();
        autoSummary = textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
      }
      
      await api.cms.create({
        title: extractedTitle || values.title || '無標題',
        subtitle: values.subtitle || undefined,
        content: values.content,
        summary: autoSummary || undefined,
        category_id: values.category_id || undefined,
        status: finalStatus,
        tags: values.tags || undefined,
        cover_image_url: coverImageUrl || undefined,
      }, token);

      notifications.show({
        title: '發布成功',
        message: '文章已成功創建',
        color: 'green',
      });

      // 清除草稿
      localStorage.removeItem('cms_draft');

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


  // 移除這個檢查，允許所有用戶創建文章（但只有管理員可以立即發布）

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            {/* 標題 */}
            <Group justify="space-between">
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
                </div>
              </Group>
              
              {/* 自動保存狀態 */}
              {lastSaved && (
                <Text size="sm" c="dimmed">
                  {autoSaving ? '正在保存...' : `上次保存: ${lastSaved.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`}
                </Text>
              )}
            </Group>

            {/* 表單 */}
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* 封面圖片與摘要 */}
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Title order={3}>封面與摘要</Title>
                    
                    {/* 封面圖片上傳 */}
                    <div>
                      <Text size="sm" fw={500} mb="xs">封面圖片（選填）</Text>
                      {coverImageUrl ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={coverImageUrl}
                            alt="封面預覽"
                            style={{
                              width: '100%',
                              maxHeight: '300px',
                              objectFit: 'cover',
                              borderRadius: 'var(--mantine-radius-md)',
                            }}
                          />
                          <ActionIcon
                            color="red"
                            variant="filled"
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                            }}
                            onClick={() => {
                              setCoverImageUrl('');
                              form.setFieldValue('cover_image_url', '');
                            }}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </div>
                      ) : (
                        <Button
                          leftSection={<IconPhoto size={16} />}
                          variant="light"
                          loading={uploadingCover}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleCoverUpload(file);
                            };
                            input.click();
                          }}
                        >
                          上傳封面圖片
                        </Button>
                      )}
                      <Text size="xs" c="dimmed" mt="xs">
                        建議尺寸：1200x600px，用於文章列表與詳情頁
                      </Text>
                    </div>

                    {/* 文章摘要 */}
                    <Textarea
                      label="文章摘要（選填）"
                      placeholder="輸入文章摘要，或留空自動從內容擷取前 150 字..."
                      minRows={3}
                      {...form.getInputProps('summary')}
                    />

                    {/* 標籤 */}
                    <TextInput
                      label="標籤（選填）"
                      placeholder="用逗號分隔，例如：活動紀錄, 系友聚會, 2025"
                      {...form.getInputProps('tags')}
                    />
                  </Stack>
                </Paper>

                {/* 內容編輯 - 完整版編輯器 */}
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Title order={3}>文章內容</Title>
                      <Group gap="xs">
                        <Select
                          placeholder="分類（選填）"
                          data={categories
                            .filter(cat => cat.is_active !== false)
                            .map(cat => ({
                              value: cat.id.toString(),
                              label: cat.name,
                            }))}
                          value={form.values.category_id?.toString()}
                          onChange={(value) => form.setFieldValue('category_id', value ? parseInt(value) : undefined)}
                          clearable
                          size="sm"
                          style={{ width: 150 }}
                        />
                        <Select
                          placeholder="狀態"
                          data={[
                            { value: 'draft', label: '草稿（僅自己可見）' },
                            { value: 'pending', label: '提交審核（等待管理員審核）' },
                            ...(isAdmin ? [{ value: 'published', label: '立即發布（僅管理員）' }] : []),
                          ]}
                          value={form.values.status}
                          onChange={(value) => {
                            const newStatus = value as typeof form.values.status;
                            // 額外保護：如果非管理員嘗試選擇 published，強制改為 pending
                            if (!isAdmin && newStatus === 'published') {
                              form.setFieldValue('status', 'pending');
                              notifications.show({
                                title: '權限不足',
                                message: '只有管理員可以立即發布文章',
                                color: 'orange',
                              });
                            } else {
                              form.setFieldValue('status', newStatus);
                            }
                          }}
                          size="sm"
                          style={{ width: 200 }}
                        />
                      </Group>
                    </Group>
                    
                    <RichTextEditor
                      content={form.values.content}
                      onChange={(content) => form.setFieldValue('content', content)}
                      placeholder="開始撰寫文章內容..."
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
                    {form.values.status === 'published' 
                      ? '發布文章' 
                      : form.values.status === 'pending' 
                      ? '提交審核' 
                      : '保存草稿'}
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
              <div
                style={{
                  fontSize: 'var(--mantine-font-size-md)',
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: form.values.content || '<p>（無內容）</p>' }}
              />
            </Modal>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
