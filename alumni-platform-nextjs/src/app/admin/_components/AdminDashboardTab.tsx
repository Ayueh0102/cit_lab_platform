'use client';

import {
  Text,
  Paper,
  Grid,
  Card,
  Group,
  Button,
  Title,
  Progress,
  ThemeIcon,
} from '@mantine/core';
import {
  IconUsers,
  IconBriefcase,
  IconCalendarEvent,
  IconBell,
  IconUserCheck,
} from '@tabler/icons-react';
import { Statistics } from './types';

interface AdminDashboardTabProps {
  stats: Statistics;
  onTabChange: (tab: string) => void;
}

export function AdminDashboardTab({ stats, onTabChange }: AdminDashboardTabProps) {
  return (
    <>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card className="glass-card-soft" padding="lg" radius="lg">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed" fw={500}>
                總用戶數
              </Text>
              <ThemeIcon variant="light" color="blue" size="md" radius="xl">
                <IconUsers size={18} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              {stats.total_users}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              活躍用戶: {stats.active_users} ({stats.active_users_30d || 0} 近30天)
            </Text>
            <Progress
              value={stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0}
              mt="xs"
              size="sm"
              radius="xl"
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card className="glass-card-soft" padding="lg" radius="lg">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed" fw={500}>
                職缺總數
              </Text>
              <ThemeIcon variant="light" color="green" size="md" radius="xl">
                <IconBriefcase size={18} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              {stats.total_jobs}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              待審核: {stats.pending_jobs} | 本月新增: {stats.jobs_this_month || 0}
            </Text>
            <Progress
              value={stats.total_jobs > 0 ? ((stats.total_jobs - stats.pending_jobs) / stats.total_jobs) * 100 : 0}
              mt="xs"
              size="sm"
              color="green"
              radius="xl"
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card className="glass-card-soft" padding="lg" radius="lg">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed" fw={500}>
                活動總數
              </Text>
              <ThemeIcon variant="light" color="orange" size="md" radius="xl">
                <IconCalendarEvent size={18} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              {stats.total_events}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              即將到來: {stats.upcoming_events || 0} | 本月新增: {stats.events_this_month || 0}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card className="glass-card-soft" padding="lg" radius="lg">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed" fw={500}>
                公告總數
              </Text>
              <ThemeIcon variant="light" color="grape" size="md" radius="xl">
                <IconBell size={18} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              {stats.total_bulletins}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              已發布: {stats.published_bulletins || 0} | 本週新增: {stats.bulletins_this_week || 0}
            </Text>
          </Card>
        </Grid.Col>

        {/* 待審核用戶卡片 */}
        {stats.pending_users > 0 && (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Card
              className="glass-card-soft"
              padding="lg"
              radius="lg"
              style={{ borderColor: 'var(--mantine-color-orange-5)', cursor: 'pointer' }}
              onClick={() => onTabChange('pending')}
            >
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="orange" fw={500}>
                  待審核會員
                </Text>
                <ThemeIcon variant="light" color="orange" size="md" radius="xl">
                  <IconUserCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700} c="orange">
                {stats.pending_users}
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                點擊前往審核
              </Text>
            </Card>
          </Grid.Col>
        )}
      </Grid>

      <Paper className="glass-card-soft" p="xl" radius="lg" mt="xl">
        <Title order={3} size="h4" mb="md">
          快速操作
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconUsers size={16} />}
              radius="xl"
              onClick={() => onTabChange('users')}
            >
              管理用戶
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconBriefcase size={16} />}
              radius="xl"
              onClick={() => onTabChange('jobs')}
            >
              管理職缺
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconCalendarEvent size={16} />}
              radius="xl"
              onClick={() => onTabChange('events')}
            >
              管理活動
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconBell size={16} />}
              radius="xl"
              onClick={() => onTabChange('bulletins')}
            >
              管理公告
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>
    </>
  );
}
