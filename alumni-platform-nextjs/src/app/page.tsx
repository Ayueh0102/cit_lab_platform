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
      const [jobsRes, eventsRes, bulletinsRes] = await Promise.all([
        api.jobs.getAll(token || undefined),
        api.events.getAll(token || undefined),
        api.bulletins.getAll(token || undefined),
      ]);

      const jobs = jobsRes.jobs || [];
      const events = eventsRes.events || [];
      const bulletins = bulletinsRes.bulletins || [];

      // 設定統計數據
      setStats({
        totalJobs: jobs.length,
        totalEvents: events.length,
        totalAlumni: 150, // 這個可以從 API 獲取
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
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Container size="xl" py="xl">
        {/* 歡迎標題 */}
        <Stack gap="lg" mb="xl">
          <div>
            <Title
              order={1}
              size="h1"
              fw={700}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              歡迎回到系友大家庭！🎓
            </Title>
            <Text size="lg" c="dimmed" mt="sm">
              歡迎各位系友使用全新的系友會社群平台，一起建立更緊密的連結
            </Text>
          </div>
        </Stack>

        {/* 統計卡片 */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
          <Paper
            p="lg"
            radius="md"
            withBorder
            onClick={() => router.push('/jobs')}
            className="card-hover animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              cursor: 'pointer',
              animationDelay: '0.1s',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            }}
          >
            <Group justify="apart">
              <div>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                  本週新職缺
                </Text>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {stats.totalJobs}
                </Text>
              </div>
              <ThemeIcon size={50} radius="md" variant="light" color="white">
                <IconBriefcase size={28} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper
            p="lg"
            radius="md"
            withBorder
            onClick={() => router.push('/events')}
            className="card-hover animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              cursor: 'pointer',
              animationDelay: '0.2s',
              boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)',
            }}
          >
            <Group justify="apart">
              <div>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                  即將到來的活動
                </Text>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {stats.totalEvents}
                </Text>
              </div>
              <ThemeIcon size={50} radius="md" variant="light" color="white">
                <IconCalendar size={28} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper
            p="lg"
            radius="md"
            withBorder
            onClick={() => router.push('/directory')}
            className="card-hover animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              cursor: 'pointer',
              animationDelay: '0.3s',
              boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)',
            }}
          >
            <Group justify="apart">
              <div>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                  活躍系友
                </Text>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {stats.totalAlumni}
                </Text>
              </div>
              <ThemeIcon size={50} radius="md" variant="light" color="white">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
          </Paper>

          <Paper
            p="lg"
            radius="md"
            withBorder
            onClick={() => router.push('/bulletins')}
            className="card-hover animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none',
              cursor: 'pointer',
              animationDelay: '0.4s',
              boxShadow: '0 10px 30px rgba(250, 112, 154, 0.3)',
            }}
          >
            <Group justify="apart">
              <div>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                  本週新增
                </Text>
                <Text size="2xl" fw={700} c="white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {stats.newThisWeek}
                </Text>
              </div>
              <ThemeIcon size={50} radius="md" variant="light" color="white">
                <IconTrendingUp size={28} />
              </ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* 主要內容區域 */}
        <Grid gutter="lg">
          {/* 最新公告 */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder className="animate-slide-in glass-effect" style={{ animationDelay: '0.5s' }}>
              <Group justify="apart" mb="md">
                <Group gap="xs">
                  <IconBell size={24} color="#667eea" />
                  <Text size="lg" fw={600}>
                    📢 最新公告
                  </Text>
                </Group>
                <Button
                  variant="subtle"
                  size="xs"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => router.push('/bulletins')}
                >
                  查看全部
                </Button>
              </Group>

              <Stack gap="md">
                {recentBulletins.length === 0 ? (
                  <Text c="dimmed" ta="center" py="md">
                    目前沒有公告
                  </Text>
                ) : (
                  recentBulletins.map((bulletin) => (
                    <Paper
                      key={bulletin.id}
                      p="md"
                      radius="sm"
                      withBorder
                      className="hover-translate-x smooth-transition"
                      style={{ 
                        cursor: 'pointer',
                        borderLeft: bulletin.is_pinned ? '4px solid #ff6b6b' : '4px solid #667eea',
                        background: bulletin.is_pinned ? 'linear-gradient(135deg, #fff5f5, #ffe8e8)' : 'linear-gradient(135deg, #f8f9ff, #e8f4fd)',
                      }}
                      onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                    >
                      <Group justify="apart" mb="xs">
                        <Text fw={600} size="sm">
                          {bulletin.title}
                          {bulletin.is_pinned && (
                            <Badge size="xs" color="red" ml="xs">
                              置頂
                            </Badge>
                          )}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {bulletin.content}
                      </Text>
                      <Group justify="apart" mt="xs">
                        <Text size="xs" c="dimmed">
                          {bulletin.author_name || '系統管理員'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(bulletin.created_at).toLocaleDateString('zh-TW')}
                        </Text>
                      </Group>
                    </Paper>
                  ))
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* 近期活動 */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder className="animate-slide-in glass-effect" style={{ animationDelay: '0.6s' }}>
              <Group justify="apart" mb="md">
                <Group gap="xs">
                  <IconCalendar size={24} color="#f5576c" />
                  <Text size="lg" fw={600}>
                    🎉 近期活動
                  </Text>
                </Group>
                <Button
                  variant="subtle"
                  size="xs"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => router.push('/events')}
                >
                  查看全部
                </Button>
              </Group>

              <Stack gap="md">
                {recentEvents.length === 0 ? (
                  <Text c="dimmed" ta="center" py="md">
                    目前沒有活動
                  </Text>
                ) : (
                  recentEvents.map((event) => (
                    <Paper
                      key={event.id}
                      p="md"
                      radius="sm"
                      withBorder
                      className="hover-translate-x smooth-transition"
                      style={{ 
                        cursor: 'pointer',
                        borderLeft: '4px solid #48dbfb',
                        background: 'linear-gradient(135deg, #f0fcff, #e0f8ff)',
                      }}
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <Text fw={600} size="sm" mb="xs">
                        📅 {event.title}
                      </Text>
                      <Group gap="xs" mb="xs">
                        <Group gap={4}>
                          <IconClock size={14} />
                          <Text size="xs" c="dimmed">
                            {new Date(event.start_time).toLocaleDateString('zh-TW')}
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconMapPin size={14} />
                          <Text size="xs" c="dimmed">
                            {event.location}
                          </Text>
                        </Group>
                      </Group>
                      <Progress
                        value={(event.current_participants / event.max_participants) * 100}
                        size="sm"
                        radius="xl"
                        color="pink"
                      />
                      <Text size="xs" c="dimmed" mt={4}>
                        {event.current_participants || 0}/{event.max_participants} 已報名
                      </Text>
                    </Paper>
                  ))
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* 熱門職缺 */}
          <Grid.Col span={12}>
            <Card shadow="sm" padding="lg" radius="md" withBorder className="animate-slide-in glass-effect" style={{ animationDelay: '0.7s' }}>
              <Group justify="apart" mb="md">
                <Group gap="xs">
                  <IconBriefcase size={24} color="#764ba2" />
                  <Text size="lg" fw={600}>
                    💼 熱門職缺
                  </Text>
                </Group>
                <Button
                  variant="subtle"
                  size="xs"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => router.push('/jobs')}
                >
                  查看全部
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {recentJobs.length === 0 ? (
                  <Text c="dimmed" ta="center" py="md">
                    目前沒有職缺
                  </Text>
                ) : (
                  recentJobs.map((job) => (
                    <Paper
                      key={job.id}
                      p="md"
                      radius="sm"
                      withBorder
                      className="hover-translate-y smooth-transition shadow-soft"
                      style={{ 
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    ><div className="gradient-border-top" />
                      <Group gap="sm" mb="xs">
                        <Avatar color="violet" radius="sm" size="md">
                          {job.company_name?.charAt(0) || job.company?.charAt(0) || 'C'}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text fw={600} size="sm" lineClamp={1}>
                            {job.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {job.company_name || job.company || '未提供公司'}
                          </Text>
                        </div>
                      </Group>
                      <Group gap={4} mt="xs">
                        <IconMapPin size={14} />
                        <Text size="xs" c="dimmed">
                          {job.location}
                        </Text>
                      </Group>
                      <Badge size="xs" color="violet" mt="xs">
                        {new Date(job.created_at).toLocaleDateString('zh-TW')}
                      </Badge>
                    </Paper>
                  ))
                )}
              </SimpleGrid>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </SidebarLayout>
  );
}
