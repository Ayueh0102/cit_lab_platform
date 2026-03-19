'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Tabs,
  ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconUsers,
  IconBriefcase,
  IconCalendarEvent,
  IconBell,
  IconUpload,
  IconChartBar,
  IconShieldCheck,
  IconUserCheck,
  IconSettings,
  IconMessageCircle,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUser, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  AdminDashboardTab,
  AdminPendingUsersTab,
  AdminUsersTab,
  AdminJobsTab,
  AdminEventsTab,
  AdminBulletinsTab,
  AdminSettingsTab,
  AdminCommentsTab,
  AdminImportModal,
  AdminExportMenu,
  AdminLoadingSkeleton,
} from './_components';
import type { Statistics, User } from './_components';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('dashboard');
  const [stats, setStats] = useState<Statistics>({
    total_users: 0,
    total_jobs: 0,
    total_events: 0,
    total_bulletins: 0,
    active_users: 0,
    pending_users: 0,
    pending_jobs: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);

  const currentUser = getUser();

  const loadDashboardData = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const statsData = await api.admin.getStatistics(token);
      const stats_info = statsData.statistics;

      setStats({
        total_users: stats_info.users.total,
        total_jobs: stats_info.jobs.total,
        total_events: stats_info.events.total,
        total_bulletins: stats_info.bulletins.total,
        active_users: stats_info.users.active,
        pending_users: stats_info.users.pending || 0,
        pending_jobs: stats_info.jobs.pending,
        active_users_30d: stats_info.users.active_30d,
        active_jobs: stats_info.jobs.active,
        upcoming_events: stats_info.events.upcoming,
        published_bulletins: stats_info.bulletins.published,
        jobs_this_month: stats_info.jobs.new_this_month,
        events_this_month: stats_info.events.new_this_month,
        bulletins_this_month: stats_info.bulletins.new_this_month,
        bulletins_this_week: stats_info.bulletins.new_this_week,
      });

      const usersData = await api.admin.getUsers(token, { page: 1, per_page: 50 });
      setUsers(usersData.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.display_name || u.email.split('@')[0],
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
      })));
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入管理數據',
        color: 'red',
      });
    }
  }, [router]);

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      notifications.show({
        title: '權限不足',
        message: '您沒有權限訪問管理後台',
        color: 'red',
      });
      window.location.href = '/';
      return;
    }

    const init = async () => {
      setLoading(true);
      await loadDashboardData();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <AdminLoadingSkeleton />;
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            <Group justify="space-between">
              <div>
                <Group gap="xs" mb="xs">
                  <ThemeIcon
                    size={40}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
                  >
                    <IconShieldCheck size={22} />
                  </ThemeIcon>
                  <Title order={1} className="text-gradient-magic">管理後台</Title>
                </Group>
                <Text c="dimmed">系統管理與數據分析</Text>
              </div>
              <Group>
                <AdminExportMenu />
                <Button
                  variant="light"
                  color="grape"
                  leftSection={<IconUpload size={16} />}
                  onClick={openImport}
                  radius="xl"
                >
                  匯入資料
                </Button>
              </Group>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="dashboard" leftSection={<IconChartBar size={16} />}>
                  儀表板
                </Tabs.Tab>
                <Tabs.Tab
                  value="pending"
                  leftSection={<IconUserCheck size={16} />}
                  rightSection={stats.pending_users > 0 ? (
                    <Badge size="sm" variant="filled" color="red">{stats.pending_users}</Badge>
                  ) : null}
                >
                  待審核用戶
                </Tabs.Tab>
                <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
                  用戶管理
                </Tabs.Tab>
                <Tabs.Tab value="jobs" leftSection={<IconBriefcase size={16} />}>
                  職缺管理
                </Tabs.Tab>
                <Tabs.Tab value="events" leftSection={<IconCalendarEvent size={16} />}>
                  活動管理
                </Tabs.Tab>
                <Tabs.Tab value="bulletins" leftSection={<IconBell size={16} />}>
                  公告管理
                </Tabs.Tab>
                <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                  系統設定
                </Tabs.Tab>
                <Tabs.Tab value="comments" leftSection={<IconMessageCircle size={16} />}>
                  評論審核
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="dashboard" pt="xl">
                <AdminDashboardTab stats={stats} onTabChange={(tab) => setActiveTab(tab)} />
              </Tabs.Panel>

              <Tabs.Panel value="pending" pt="xl">
                <AdminPendingUsersTab onDataChanged={loadDashboardData} />
              </Tabs.Panel>

              <Tabs.Panel value="users" pt="xl">
                <AdminUsersTab users={users} onUsersChanged={setUsers} onDataChanged={loadDashboardData} />
              </Tabs.Panel>

              <Tabs.Panel value="jobs" pt="xl">
                <AdminJobsTab onDataChanged={loadDashboardData} />
              </Tabs.Panel>

              <Tabs.Panel value="events" pt="xl">
                <AdminEventsTab onDataChanged={loadDashboardData} />
              </Tabs.Panel>

              <Tabs.Panel value="bulletins" pt="xl">
                <AdminBulletinsTab onDataChanged={loadDashboardData} />
              </Tabs.Panel>

              <Tabs.Panel value="settings" pt="xl">
                <AdminSettingsTab />
              </Tabs.Panel>

              <Tabs.Panel value="comments" pt="xl">
                <AdminCommentsTab />
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        <AdminImportModal opened={importOpened} onClose={closeImport} onImportSuccess={loadDashboardData} />
      </SidebarLayout>
    </ProtectedRoute>
  );
}
