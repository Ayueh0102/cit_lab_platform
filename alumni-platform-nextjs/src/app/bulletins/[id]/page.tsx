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
  Divider,
  Loader,
  Center,
  Image,
  Textarea,
  Avatar,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  IconCalendar,
  IconEye,
  IconUser,
  IconPinned,
  IconStar,
  IconMessage,
  IconTrash,
  IconSend,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
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
  updated_at?: string;
  cover_image_url?: string;
  allow_comments?: boolean;
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at?: string;
  parent_id?: number;
}

const bulletinTypes: Record<string, string> = {
  ANNOUNCEMENT: '一般公告',
  NEWS: '新聞',
  ACADEMIC: '學術公告',
  RECRUITMENT: '徵才訊息',
  EVENT_NOTICE: '活動通知',
  OTHER: '其他',
};

export default function BulletinDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bulletinId = Number(params.id);

  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const commentForm = useForm({
    initialValues: {
      content: '',
    },
    validate: {
      content: (value) => (value.trim().length > 0 ? null : '留言內容不能為空'),
    },
  });

  useEffect(() => {
    if (Number.isNaN(bulletinId)) {
      router.push('/bulletins');
      return;
    }

    loadBulletinDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulletinId]);

  const loadBulletinDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.bulletins.getById(bulletinId, token || undefined);
      const bulletinData = response.bulletin || response;
      setBulletin(bulletinData);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入公告詳情',
        color: 'red',
      });
      router.push('/bulletins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (values: { content: string }) => {
    if (!bulletin || !bulletin.allow_comments) {
      notifications.show({
        title: '無法留言',
        message: '此公告不允許留言',
        color: 'orange',
      });
      return;
    }

    try {
      setSubmittingComment(true);
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能留言',
          color: 'orange',
        });
        router.push('/auth/login');
        return;
      }

      await api.bulletins.createComment(bulletinId, values.content, token);
      
      commentForm.reset();
      notifications.show({
        title: '留言成功',
        message: '您的留言已提交，等待審核',
        color: 'green',
      });
      
      // 重新載入公告以獲取最新留言
      await loadBulletinDetail();
    } catch (error) {
      notifications.show({
        title: '留言失敗',
        message: error instanceof Error ? error.message : '無法提交留言',
        color: 'red',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能刪除留言',
          color: 'orange',
        });
        return;
      }

      await api.bulletins.deleteComment(commentId, token);
      
      notifications.show({
        title: '刪除成功',
        message: '留言已刪除',
        color: 'green',
      });
      
      // 重新載入公告
      await loadBulletinDetail();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除留言',
        color: 'red',
      });
    }
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

  if (!bulletin) {
    return null;
  }

  const typeLabel = bulletinTypes[bulletin.bulletin_type || ''] || bulletin.bulletin_type || '一般公告';

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="md" py="xl">
          <Stack gap="xl">
            <Button variant="subtle" onClick={() => router.back()}>
              ← 返回公告列表
            </Button>

            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Stack gap="lg">
                {/* 標題與徽章 */}
                <div>
                  <Group justify="space-between" align="flex-start" mb="sm">
                    <Stack gap={8} style={{ flex: 1 }}>
                      <Group gap={8}>
                        {bulletin.is_pinned && (
                          <IconPinned size={20} color="red" />
                        )}
                        {bulletin.is_featured && (
                          <IconStar size={20} color="gold" />
                        )}
                      </Group>
                      <Title order={1}>{bulletin.title}</Title>
                    </Stack>
                    <Group gap="xs">
                      <Badge size="lg" variant="light" color="blue">
                        {typeLabel}
                      </Badge>
                      {bulletin.category_name && (
                        <Badge size="lg" variant="light" color="teal">
                          {bulletin.category_name}
                        </Badge>
                      )}
                    </Group>
                  </Group>
                </div>

                {/* 封面圖片 */}
                {bulletin.cover_image_url && (
                  <Image
                    src={bulletin.cover_image_url}
                    alt={bulletin.title}
                    radius="md"
                    fit="cover"
                    style={{ maxHeight: 400 }}
                  />
                )}

                {/* 元數據 */}
                <Group gap="md" c="dimmed">
                  {bulletin.author_name && (
                    <Group gap={4}>
                      <IconUser size={16} />
                      <Text size="sm">{bulletin.author_name}</Text>
                    </Group>
                  )}
                  {bulletin.published_at && (
                    <Group gap={4}>
                      <IconCalendar size={16} />
                      <Text size="sm">
                        {new Date(bulletin.published_at).toLocaleString('zh-TW')}
                      </Text>
                    </Group>
                  )}
                  {bulletin.views_count !== undefined && (
                    <Group gap={4}>
                      <IconEye size={16} />
                      <Text size="sm">{bulletin.views_count} 次瀏覽</Text>
                    </Group>
                  )}
                </Group>

                <Divider />

                {/* 公告內容 */}
                <div>
                  <Text
                    style={{
                      whiteSpace: 'pre-line',
                      lineHeight: 1.8,
                      fontSize: '16px',
                    }}
                  >
                    {bulletin.content}
                  </Text>
                </div>

                <Divider />

                {/* 底部資訊 */}
                <Group justify="space-between" align="center">
                  <div>
                    {bulletin.updated_at && bulletin.updated_at !== bulletin.created_at && (
                      <Text size="xs" c="dimmed">
                        最後更新: {new Date(bulletin.updated_at).toLocaleString('zh-TW')}
                      </Text>
                    )}
                  </div>
                  <Button variant="light" onClick={() => router.push('/bulletins')}>
                    查看更多公告
                  </Button>
                </Group>
              </Stack>
            </Card>

            {/* 留言區 */}
            {bulletin.allow_comments && (
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Stack gap="lg">
                  <Group gap={8}>
                    <IconMessage size={20} />
                    <Title order={3}>留言 ({bulletin.comments_count || 0})</Title>
                  </Group>

                  {/* 留言表單 */}
                  <form onSubmit={commentForm.onSubmit(handleSubmitComment)}>
                    <Stack gap="md">
                      <Textarea
                        placeholder="寫下您的留言..."
                        minRows={3}
                        maxRows={6}
                        {...commentForm.getInputProps('content')}
                      />
                      <Group justify="flex-end">
                        <Button
                          type="submit"
                          leftSection={<IconSend size={16} />}
                          loading={submittingComment}
                        >
                          發布留言
                        </Button>
                      </Group>
                    </Stack>
                  </form>

                  <Divider />

                  {/* 留言列表 */}
                  {bulletin.comments && bulletin.comments.length > 0 ? (
                    <Stack gap="md">
                      {bulletin.comments.map((comment) => {
                        const currentUser = getUser();
                        const canDelete = currentUser && (
                          currentUser.id === comment.user_id || currentUser.role === 'admin'
                        );
                        const userInitials = (comment.user_name || comment.user_email || 'U')
                          .charAt(0)
                          .toUpperCase();

                        return (
                          <Card key={comment.id} padding="md" withBorder radius="md">
                            <Group align="flex-start" gap="md">
                              <Avatar size={40} radius="md" color="blue">
                                {userInitials}
                              </Avatar>
                              <Stack gap={4} style={{ flex: 1 }}>
                                <Group justify="space-between" align="center">
                                  <Group gap={4}>
                                    <Text fw={500} size="sm">
                                      {comment.user_name || comment.user_email || '匿名用戶'}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {new Date(comment.created_at).toLocaleString('zh-TW')}
                                    </Text>
                                  </Group>
                                  {canDelete && (
                                    <ActionIcon
                                      variant="subtle"
                                      color="red"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm('確定要刪除此留言嗎？')) {
                                          handleDeleteComment(comment.id);
                                        }
                                      }}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  )}
                                </Group>
                                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                                  {comment.content}
                                </Text>
                              </Stack>
                            </Group>
                          </Card>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Center py="xl">
                      <Text c="dimmed" size="sm">
                        尚無留言，成為第一個留言的人吧！
                      </Text>
                    </Center>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

