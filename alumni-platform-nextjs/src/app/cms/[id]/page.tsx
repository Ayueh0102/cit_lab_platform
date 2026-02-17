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
  Avatar,
  Divider,
  Loader,
  Center,
  ActionIcon,
  Textarea,
  Card,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import {
  IconArrowLeft,
  IconEdit,
  IconHeart,
  IconEye,
  IconCalendar,
  IconUser,
  IconTag,
  IconSend,
  IconTrash,
  IconCheck,
  IconX,
  IconMessage,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/sanitize';

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
  author_email?: string;
  published_at?: string;
  created_at: string;
}

interface ArticleComment {
  id: number;
  content: string;
  status: 'approved' | 'pending' | 'rejected';
  user_name: string;
  user_email: string;
  created_at: string;
  likes_count: number;
}

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = parseInt(params.id as string);
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    loadArticle();
    loadComments();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const articleData = await api.cms.getArticle(articleId, token || undefined);
      setArticle(articleData);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入文章',
        color: 'red',
      });
      router.push('/cms');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const token = getToken();
      const data = await api.cms.getComments(articleId, token || undefined);
      setComments(Array.isArray(data) ? data : data?.comments || data?.data || []);
    } catch {
      // 評論載入失敗不阻擋頁面顯示
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    try {
      setLiking(true);
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '需要登入才能按讚',
          color: 'yellow',
        });
        return;
      }

      await api.cms.like(articleId, token);
      
      if (article) {
        setArticle({
          ...article,
          likes_count: article.likes_count + 1,
        });
      }
      
      notifications.show({
        title: '已按讚',
        message: '感謝您的支持！',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法按讚',
        color: 'red',
      });
    } finally {
      setLiking(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;
    const token = getToken();
    if (!token) {
      notifications.show({
        title: '請先登入',
        message: '需要登入才能留言',
        color: 'yellow',
      });
      return;
    }
    try {
      setSubmittingComment(true);
      await api.cms.createComment(articleId, commentContent.trim(), token);
      setCommentContent('');
      notifications.show({
        title: '留言成功',
        message: '您的留言已送出',
        color: 'green',
      });
      await loadComments();
    } catch (error) {
      notifications.show({
        title: '留言失敗',
        message: error instanceof Error ? error.message : '無法送出留言',
        color: 'red',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await api.cms.deleteComment(commentId, token);
      notifications.show({
        title: '已刪除',
        message: '評論已刪除',
        color: 'green',
      });
      await loadComments();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除評論',
        color: 'red',
      });
    }
  };

  const handleApproveComment = async (commentId: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await api.cms.approveComment(commentId, token);
      notifications.show({
        title: '已通過',
        message: '評論已審核通過',
        color: 'green',
      });
      await loadComments();
    } catch (error) {
      notifications.show({
        title: '審核失敗',
        message: error instanceof Error ? error.message : '無法審核評論',
        color: 'red',
      });
    }
  };

  const handleRejectComment = async (commentId: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await api.cms.rejectComment(commentId, token);
      notifications.show({
        title: '已拒絕',
        message: '評論已被拒絕',
        color: 'green',
      });
      await loadComments();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法拒絕評論',
        color: 'red',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未發布';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (!article) {
    return null;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            {/* 返回按鈕 */}
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push('/cms')}
            >
              返回文章列表
            </Button>

            {/* 文章內容 */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="xl">
                {/* 標題區域 */}
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      {article.category_name && (
                        <Badge color={article.category_color || 'blue'}>
                          {article.category_name}
                        </Badge>
                      )}
                      <Badge color={article.status === 'published' ? 'green' : 'gray'}>
                        {article.status === 'published' ? '已發布' : article.status === 'draft' ? '草稿' : '已封存'}
                      </Badge>
                    </Group>
                    {isAdmin && (
                      <Button
                        variant="subtle"
                        leftSection={<IconEdit size={16} />}
                        onClick={() => router.push(`/cms/${articleId}/edit`)}
                      >
                        編輯
                      </Button>
                    )}
                  </Group>

                  <Title order={1}>{article.title}</Title>
                  
                  {article.subtitle && (
                    <Text size="lg" c="dimmed">
                      {article.subtitle}
                    </Text>
                  )}

                  {article.summary && (
                    <Paper p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                      <Text size="sm" c="dimmed">
                        {article.summary}
                      </Text>
                    </Paper>
                  )}

                  {/* 封面圖片 */}
                  {article.cover_image_url && (
                    <div style={{ position: 'relative', width: '100%', height: 400 }}>
                      <Image
                        src={article.cover_image_url}
                        alt={article.title}
                        fill
                        style={{ objectFit: 'cover', borderRadius: 'var(--mantine-radius-md)' }}
                        unoptimized={article.cover_image_url.startsWith('http://localhost')}
                      />
                    </div>
                  )}

                  {/* 作者和日期資訊 */}
                  <Group gap="md">
                    <Group gap="xs">
                      <Avatar size="sm" color="blue">
                        {article.author_name?.charAt(0) || 'A'}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500}>
                          {article.author_name || '未知作者'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(article.published_at)}
                        </Text>
                      </div>
                    </Group>
                    
                    <Group gap="lg" ml="auto">
                      <Group gap="xs">
                        <IconEye size={16} />
                        <Text size="sm" c="dimmed">
                          {article.views_count} 次瀏覽
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <IconHeart size={16} />
                        <Text size="sm" c="dimmed">
                          {article.likes_count} 個讚
                        </Text>
                      </Group>
                    </Group>
                  </Group>

                  {/* 標籤 */}
                  {article.tags && (
                    <Group gap="xs">
                      <IconTag size={16} />
                      {article.tags.split(',').map((tag, index) => (
                        <Badge key={index} variant="light" size="sm">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </Group>
                  )}

                  <Divider />
                </Stack>

                {/* 文章內容 */}
                <div
                  style={{
                    fontSize: 'var(--mantine-font-size-md)',
                    lineHeight: 1.8,
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                />

                {/* 操作按鈕 */}
                <Divider />
                <Group justify="center">
                  <Button
                    variant="light"
                    leftSection={<IconHeart size={16} />}
                    onClick={handleLike}
                    loading={liking}
                  >
                    按讚 ({article.likes_count})
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {/* 評論區 */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="lg">
                <Group gap="xs">
                  <IconMessage size={22} />
                  <Title order={3}>
                    評論 ({comments.filter((c) => c.status === 'approved' || (isAdmin && c.status === 'pending')).length})
                  </Title>
                </Group>

                {/* 留言輸入區 */}
                <Stack gap="sm">
                  <Textarea
                    placeholder="撰寫您的評論..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.currentTarget.value)}
                    minRows={3}
                    autosize
                    maxRows={6}
                  />
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconSend size={16} />}
                      onClick={handleSubmitComment}
                      loading={submittingComment}
                      disabled={!commentContent.trim()}
                      radius="xl"
                    >
                      送出留言
                    </Button>
                  </Group>
                </Stack>

                <Divider />

                {/* 評論列表 */}
                {loadingComments ? (
                  <Center py="md">
                    <Loader size="sm" />
                  </Center>
                ) : comments.length === 0 ? (
                  <Text c="dimmed" ta="center" py="lg">
                    尚無評論，成為第一個留言的人吧！
                  </Text>
                ) : (
                  <Stack gap="md">
                    {comments.map((comment) => {
                      // 非管理員只能看到已通過的評論
                      if (comment.status !== 'approved' && !isAdmin) return null;

                      const isCommentAuthor = currentUser?.email === comment.user_email;
                      const canDelete = isCommentAuthor || isAdmin;

                      return (
                        <Card key={comment.id} withBorder radius="md" p="md">
                          <Stack gap="sm">
                            <Group justify="space-between">
                              <Group gap="sm">
                                <Avatar size="sm" color="indigo" radius="xl">
                                  {comment.user_name?.charAt(0) || '?'}
                                </Avatar>
                                <div>
                                  <Text size="sm" fw={500}>
                                    {comment.user_name}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {formatDate(comment.created_at)}
                                  </Text>
                                </div>
                                {comment.status === 'pending' && (
                                  <Badge variant="light" color="orange" size="sm">
                                    待審核
                                  </Badge>
                                )}
                                {comment.status === 'rejected' && isAdmin && (
                                  <Badge variant="light" color="red" size="sm">
                                    已拒絕
                                  </Badge>
                                )}
                              </Group>

                              <Group gap="xs">
                                {/* 管理員審核按鈕 */}
                                {isAdmin && comment.status === 'pending' && (
                                  <>
                                    <ActionIcon
                                      variant="light"
                                      color="green"
                                      size="sm"
                                      title="審核通過"
                                      onClick={() => handleApproveComment(comment.id)}
                                    >
                                      <IconCheck size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      size="sm"
                                      title="拒絕"
                                      onClick={() => handleRejectComment(comment.id)}
                                    >
                                      <IconX size={14} />
                                    </ActionIcon>
                                  </>
                                )}

                                {/* 刪除按鈕 */}
                                {canDelete && (
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    size="sm"
                                    title="刪除評論"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                )}
                              </Group>
                            </Group>

                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                              {comment.content}
                            </Text>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

