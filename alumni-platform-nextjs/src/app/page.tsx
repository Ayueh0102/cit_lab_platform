'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Grid,
  Badge,
  Button,
  Paper,
  ThemeIcon,
  SimpleGrid,
  Avatar,
  Progress,
  Loader,
  Center,
  Box,
} from '@mantine/core';
import {
  IconBriefcase,
  IconCalendar,
  IconUsers,
  IconBell,
  IconTrendingUp,
  IconMapPin,
  IconClock,
  IconArrowRight,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import {
  SpectralWaves,
  CIEPlotDecoration,
  PrismDecoration,
  FloatingOrbs,
  ColorCheckerGrid
} from '@/components/ui/decorations';

interface Stats {
  totalJobs: number;
  totalEvents: number;
  totalAlumni: number;
  newThisWeek: number;
}

interface RecentJob {
  id: number;
  title: string;
  company_name: string;
  location: string;
  created_at: string;
}

interface RecentEvent {
  id: number;
  title: string;
  start_time: string;
  location: string;
  max_participants: number;
  current_participants: number;
  cover_image_url?: string;
  image_url?: string;
}

interface RecentBulletin {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_name?: string;
  is_pinned: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    totalEvents: 0,
    totalAlumni: 0,
    newThisWeek: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [recentBulletins, setRecentBulletins] = useState<RecentBulletin[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      // 並行載入所有數據
      const [jobsRes, eventsRes, bulletinsRes, usersRes] = await Promise.all([
        api.jobs.getAll(token || undefined),
        api.events.getAll(token || undefined),
        api.bulletins.getAll(token || undefined),
        api.profile.getUsers(token || undefined, { page: 1, per_page: 1 }), // 只獲取第一頁來取得總數
      ]);

      const jobs = jobsRes.jobs || [];
      const events = eventsRes.events || [];
      const bulletins = bulletinsRes.bulletins || [];
      const totalAlumni = usersRes.total || 0; // 從 API 獲取活躍系友總數

      // 設定統計數據
      setStats({
        totalJobs: jobs.length,
        totalEvents: events.length,
        totalAlumni: totalAlumni,
        newThisWeek: jobs.filter((j: RecentJob) => {
          const created = new Date(j.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
      });

      // 設定最新數據（取前 3 筆）
      setRecentJobs(jobs.slice(0, 3));
      setRecentEvents(events.slice(0, 3));
      setRecentBulletins(bulletins.slice(0, 3));
    } catch (error) {
      console.error('載入儀表板數據失敗:', error);
      // 設定空數據以避免頁面崩潰
      setStats({
        totalJobs: 0,
        totalEvents: 0,
        totalAlumni: 0,
        newThisWeek: 0,
      });
      setRecentJobs([]);
      setRecentEvents([]);
      setRecentBulletins([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <Center h={400}>
          <Loader size="lg" variant="bars" color="indigo" />
        </Center>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Container size="xl" py="xl">
        {/* 歡迎區塊 */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Title order={1} mb="sm" className="text-gradient-light">
            歡迎回到校友平台
          </Title>
          <Text c="dimmed" mb="xl">
            探索系友動態，連結未來機會
          </Text>
        </div>

        {/* Bento Grid 數據儀表板 */}
        <Grid gutter="md" mb={50}>
          {/* 活躍系友卡片 - 大卡片 */}
          <Grid.Col span={{ base: 12, md: 6 }} className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Paper
              radius="lg"
              className="glass-card gradient-light"
              style={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                color: 'white'
              }}
              onClick={() => router.push('/directory')}
            >
              {/* 背景裝飾：光譜波形與浮動光點 */}
              <SpectralWaves style={{ bottom: 0, opacity: 0.3 }} />
              <FloatingOrbs color="#ffffff" size={150} style={{ top: '-20%', right: '-10%', opacity: 0.15 }} />
              <FloatingOrbs color="#4facfe" size={80} style={{ bottom: '10%', left: '10%', opacity: 0.2, animationDelay: '1s' }} />

              <Stack justify="space-between" h="100%" p="xl" style={{ position: 'relative', zIndex: 2 }}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="sm" fw={700} tt="uppercase" style={{ opacity: 0.8 }}>CIT Network</Text>
                    <Title order={2} fz={48} fw={800} mt={4}>{stats.totalAlumni}</Title>
                    <Text size="sm" mt={4} style={{ opacity: 0.9 }}>位活躍系友正在連線</Text>
                  </div>
                  <ThemeIcon size={48} radius="xl" color="white" variant="white" style={{ color: '#4facfe' }}>
                    <IconUsers size={28} />
                  </ThemeIcon>
                </Group>

                <Group mt="auto">
                  <Button
                    variant="white"
                    radius="xl"
                    rightSection={<IconArrowRight size={16} />}
                    style={{ color: '#00f2fe' }}
                  >
                    瀏覽通訊錄
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 職缺機會 - 中卡片 */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }} className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Paper
              p="lg"
              radius="lg"
              className="glass-card card-hover-effect"
              h="100%"
              onClick={() => router.push('/jobs')}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              {/* 裝飾：稜鏡分光 */}
              <PrismDecoration style={{ right: '-20px', top: '-20px', transform: 'rotate(15deg) scale(1.2)' }} />
              <Box className="card-accent card-accent-fresh" style={{ top: '-35%', right: '-20%' }} />

              <Stack h="100%" justify="space-between" style={{ position: 'relative', zIndex: 2 }}>
                <div>
                  <ThemeIcon size="xl" radius="md" className="gradient-fresh" variant="gradient">
                    <IconBriefcase size={24} color="white" />
                  </ThemeIcon>
                  <Text size="sm" fw={600} c="dimmed" mt="md">職缺機會</Text>
                  <Group align="baseline" gap={4}>
                    <Text fz={32} fw={700} className="text-gradient-fresh">{stats.totalJobs}</Text>
                    <Text size="xs" c="dimmed">個職缺</Text>
                  </Group>
                </div>
                <Group gap="xs">
                  <Badge
                    variant="light"
                    color="teal"
                    leftSection={<IconTrendingUp size={12} />}
                  >
                    本週 +{stats.newThisWeek}
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 活動聚會 - 中卡片 */}
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }} className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Paper
              p="lg"
              radius="lg"
              className="glass-card card-hover-effect"
              h="100%"
              onClick={() => router.push('/events')}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              {/* 裝飾：CIE 色度圖 */}
              <CIEPlotDecoration style={{ right: '-10%', bottom: '-10%', opacity: 0.15, color: 'var(--color-warm)' }} />
              <Box className="card-accent card-accent-warm" style={{ bottom: '-30%', left: '-10%' }} />

              <Stack h="100%" justify="space-between" style={{ position: 'relative', zIndex: 2 }}>
                <div>
                  <ThemeIcon size="xl" radius="md" className="gradient-warm" variant="gradient">
                    <IconCalendar size={24} color="white" />
                  </ThemeIcon>
                  <Text size="sm" fw={600} c="dimmed" mt="md">活動聚會</Text>
                  <Group align="baseline" gap={4}>
                    <Text fz={32} fw={700} className="text-gradient-warm">{stats.totalEvents}</Text>
                    <Text size="xs" c="dimmed">場活動</Text>
                  </Group>
                </div>
                <Text size="xs" c="dimmed">即將到來的精彩活動</Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* 內容區塊：分為兩欄 */}
        <Grid gutter="xl">
          {/* 左側：最新動態 */}
          <Grid.Col span={{ base: 12, md: 8 }} className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Stack gap="xl">
              {/* 最新職缺 */}
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">最新職缺</Title>
                  <Button variant="subtle" color="gray" onClick={() => router.push('/jobs')} rightSection={<IconArrowRight size={16} />}>
                    查看全部
                  </Button>
                </Group>
                <Stack gap="md">
                  {recentJobs.map((job) => (
                    <Paper
                      key={job.id}
                      p="md"
                      radius="md"
                      className="glass-card card-hover-effect"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Group wrap="nowrap">
                        <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                          <IconBriefcase size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                          <Text fw={600} lineClamp={1}>{job.title}</Text>
                          <Text size="sm" c="dimmed">{job.company_name} • {job.location}</Text>
                        </div>
                        <Text size="xs" c="dimmed">
                          {new Date(job.created_at).toLocaleDateString('zh-TW')}
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                  {recentJobs.length === 0 && (
                    <Text c="dimmed" ta="center" py="xl">目前沒有最新職缺</Text>
                  )}
                </Stack>
              </Box>

              {/* 最新活動 */}
              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">近期活動</Title>
                  <Button variant="subtle" color="gray" onClick={() => router.push('/events')} rightSection={<IconArrowRight size={16} />}>
                    查看全部
                  </Button>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {recentEvents.map((event) => (
                    <Paper
                      key={event.id}
                      radius="md"
                      className="glass-card card-hover-effect"
                      onClick={() => router.push(`/events/${event.id}`)}
                      style={{ cursor: 'pointer', overflow: 'hidden' }}
                    >
                      <div style={{ height: '120px', background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)', position: 'relative' }}>
                        {event.cover_image_url && (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                        <Badge
                          className="glass-panel"
                          style={{ position: 'absolute', top: 10, right: 10, color: '#333' }}
                        >
                          {new Date(event.start_time).toLocaleDateString('zh-TW')}
                        </Badge>
                      </div>
                      <Stack p="md" gap="xs">
                        <Text fw={600} lineClamp={1}>{event.title}</Text>
                        <Group gap="xs">
                          <IconMapPin size={14} color="gray" />
                          <Text size="xs" c="dimmed" lineClamp={1}>{event.location}</Text>
                        </Group>
                      </Stack>
                    </Paper>
                  ))}
                </SimpleGrid>
                {recentEvents.length === 0 && (
                  <Text c="dimmed" ta="center" py="xl">目前沒有近期活動</Text>
                )}
              </Box>
            </Stack>
          </Grid.Col>

          {/* 右側：公告與資訊 */}
          <Grid.Col span={{ base: 12, md: 4 }} className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <Paper radius="lg" p="xl" className="glass-panel" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* 裝飾：色彩校正網格 */}
              <ColorCheckerGrid style={{ top: '20px', right: '20px', opacity: 0.4 }} />

              <Stack gap="lg" style={{ position: 'relative', zIndex: 2 }}>
                <Group gap="xs">
                  <ThemeIcon variant="light" color="grape" size="md" radius="md">
                    <IconBell size={18} />
                  </ThemeIcon>
                  <Title order={3} size="h4">重要公告</Title>
                </Group>

                <Stack gap="md">
                  {recentBulletins.map((bulletin) => (
                    <Paper
                      key={bulletin.id}
                      p="sm"
                      radius="md"
                      withBorder={false}
                      style={{ background: 'rgba(255,255,255,0.5)' }}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <Text size="sm" fw={600} lineClamp={2} style={{ flex: 1 }}>
                            {bulletin.title}
                          </Text>
                          {bulletin.is_pinned && (
                            <Badge size="xs" variant="dot" color="red">置頂</Badge>
                          )}
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            {new Date(bulletin.created_at).toLocaleDateString('zh-TW')}
                          </Text>
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                          >
                            詳情
                          </Button>
                        </Group>
                      </Stack>
                    </Paper>
                  ))}
                  {recentBulletins.length === 0 && (
                    <Text c="dimmed" ta="center" py="md">目前沒有公告</Text>
                  )}
                </Stack>

                <Button
                  variant="light"
                  color="grape"
                  fullWidth
                  mt="auto"
                  onClick={() => router.push('/bulletins')}
                >
                  查看所有公告
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </SidebarLayout>
  );
}
