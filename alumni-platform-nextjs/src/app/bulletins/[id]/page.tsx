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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import {
  IconCalendar,
  IconEye,
  IconUser,
  IconPinned,
  IconStar,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
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
      setBulletin(response.bulletin || response);
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
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

