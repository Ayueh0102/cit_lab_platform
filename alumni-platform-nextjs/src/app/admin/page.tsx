'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Grid,
  Card,
  Badge,
  Table,
  ActionIcon,
  Tabs,
  Modal,
  TextInput,
  Select,
  Loader,
  Center,
  FileInput,
  Progress,
  Tooltip,
  Pagination,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconUsers,
  IconBriefcase,
  IconCalendarEvent,
  IconBell,
  IconTrash,
  IconEdit,
  IconDownload,
  IconUpload,
  IconChartBar,
  IconShieldCheck,
  IconSearch,
  IconCheck,
  IconX,
  IconEye,
  IconPinned,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUser, getToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface Statistics {
  total_users: number;
  total_jobs: number;
  total_events: number;
  total_bulletins: number;
  active_users: number;
  pending_jobs: number;
  active_users_30d?: number;
  active_jobs?: number;
  upcoming_events?: number;
  published_bulletins?: number;
  jobs_this_month?: number;
  events_this_month?: number;
  bulletins_this_month?: number;
  bulletins_this_week?: number;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

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
    pending_jobs: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [editUserModalOpened, setEditUserModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserRole, setEditUserRole] = useState<string>('');
  const [editUserStatus, setEditUserStatus] = useState<string>('');
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [importType, setImportType] = useState<string>('users');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // 職缺管理狀態
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatusFilter, setJobsStatusFilter] = useState<string | null>(null);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotal, setJobsTotal] = useState(0);
  
  // 活動管理狀態
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsSearch, setEventsSearch] = useState('');
  const [eventsStatusFilter, setEventsStatusFilter] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(0);
  
  // 公告管理狀態
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [bulletinsLoading, setBulletinsLoading] = useState(false);
  const [bulletinsSearch, setBulletinsSearch] = useState('');
  const [bulletinsStatusFilter, setBulletinsStatusFilter] = useState<string | null>(null);
  const [bulletinsPage, setBulletinsPage] = useState(1);
  const [bulletinsTotal, setBulletinsTotal] = useState(0);

  const currentUser = getUser();

  useEffect(() => {
    // 檢查是否為管理員
    if (currentUser?.role !== 'admin') {
      notifications.show({
        title: '權限不足',
        message: '您沒有權限訪問管理後台',
        color: 'red',
      });
      window.location.href = '/';
      return;
    }

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 當切換到對應的 tab 時載入數據
  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs();
    } else if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'bulletins') {
      loadBulletins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, jobsPage, jobsStatusFilter, eventsPage, eventsStatusFilter, bulletinsPage, bulletinsStatusFilter]);

  // 搜尋防抖處理
  useEffect(() => {
    if (activeTab !== 'jobs') return;
    const timer = setTimeout(() => {
      if (jobsPage === 1) {
        loadJobs();
      } else {
        setJobsPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsSearch]);

  useEffect(() => {
    if (activeTab !== 'events') return;
    const timer = setTimeout(() => {
      if (eventsPage === 1) {
        loadEvents();
      } else {
        setEventsPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsSearch]);

  useEffect(() => {
    if (activeTab !== 'bulletins') return;
    const timer = setTimeout(() => {
      if (bulletinsPage === 1) {
        loadBulletins();
      } else {
        setBulletinsPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulletinsSearch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      // 載入統計數據
      const statsData = await api.admin.getStatistics(token);
      const stats_info = statsData.statistics;
      
      setStats({
        total_users: stats_info.users.total,
        total_jobs: stats_info.jobs.total,
        total_events: stats_info.events.total,
        total_bulletins: stats_info.bulletins.total,
        active_users: stats_info.users.active,
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

      // 載入用戶列表
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
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (type: string) => {
    try {
      const token = getToken();
      if (!token) return;

      let blob: Blob;
      switch (type) {
        case 'users':
          blob = await api.csv.exportUsers(token);
          break;
        case 'jobs':
          blob = await api.csv.exportJobs(token);
          break;
        case 'events':
          blob = await api.csv.exportEvents(token);
          break;
        case 'bulletins':
          blob = await api.csv.exportBulletins(token);
          break;
        default:
          throw new Error('不支援的匯出類型');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: '匯出成功',
        message: `${type} 資料已匯出`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '匯出失敗',
        message: error instanceof Error ? error.message : '無法匯出資料',
        color: 'red',
      });
    }

    closeExport();
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      notifications.show({
        title: '請選擇檔案',
        message: '請選擇要匯入的 CSV 檔案',
        color: 'orange',
      });
      return;
    }

    try {
      setUploading(true);
      const token = getToken();
      if (!token) return;

      let result: any;
      switch (importType) {
        case 'users':
          result = await api.csv.importUsers(importFile, token);
          break;
        case 'jobs':
          result = await api.csv.importJobs(importFile, token);
          break;
        case 'events':
          result = await api.csv.importEvents(importFile, token);
          break;
        case 'bulletins':
          result = await api.csv.importBulletins(importFile, token);
          break;
        default:
          throw new Error('不支援的匯入類型');
      }

      notifications.show({
        title: '匯入成功',
        message: `成功匯入 ${result.imported || result.count || 0} 筆資料`,
        color: 'green',
      });
      
      closeImport();
      setImportFile(null);
      loadDashboardData();
    } catch (error) {
      notifications.show({
        title: '匯入失敗',
        message: error instanceof Error ? error.message : '無法匯入資料',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserRole(user.role);
    setEditUserStatus(user.is_active ? 'active' : 'inactive');
    setEditUserModalOpened(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const currentUser = getUser();
    
    // 檢查是否在修改自己的權限
    if (editingUser.id === currentUser?.id) {
      // 如果將自己從管理員改為普通用戶，需要確認
      if (currentUser.role === 'admin' && editUserRole === 'user') {
        if (!confirm('警告：您即將移除自己的管理員權限，這將導致您無法再訪問管理後台。確定要繼續嗎？')) {
          return;
        }
      }
      
      // 如果將自己設為停用，需要確認
      if (editUserStatus === 'inactive' || editUserStatus === 'suspended') {
        if (!confirm('警告：您即將停用自己的帳號，這將導致您無法登入。確定要繼續嗎？')) {
          return;
        }
      }
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.admin.updateUser(editingUser.id, {
        role: editUserRole,
        status: editUserStatus,
      }, token);

      notifications.show({
        title: '更新成功',
        message: '用戶權限已成功更新',
        color: 'green',
      });

      // 如果修改的是自己的權限，需要重新登入
      if (editingUser.id === currentUser?.id) {
        if (editUserRole === 'user' || editUserStatus !== 'active') {
          notifications.show({
            title: '權限已變更',
            message: '您的權限已變更，請重新登入',
            color: 'orange',
          });
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
          return;
        }
      }

      // 重新載入用戶列表
      const usersData = await api.admin.getUsers(token, { page: 1, per_page: 50 });
      setUsers(usersData.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.display_name || u.email.split('@')[0],
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
      })));

      // 重新載入統計數據
      const statsData = await api.admin.getStatistics(token);
      const stats_info = statsData.statistics;
      setStats({
        total_users: stats_info.users.total,
        total_jobs: stats_info.jobs.total,
        total_events: stats_info.events.total,
        total_bulletins: stats_info.bulletins.total,
        active_users: stats_info.users.active,
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

      setEditUserModalOpened(false);
      setEditingUser(null);
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '無法更新用戶權限',
        color: 'red',
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('確定要刪除此用戶嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.admin.deleteUser(userId, token);
      setUsers(users.filter((u) => u.id !== userId));
      
      // 重新載入統計數據
      const statsData = await api.admin.getStatistics(token);
      const stats_info = statsData.statistics;
      setStats({
        total_users: stats_info.users.total,
        total_jobs: stats_info.jobs.total,
        total_events: stats_info.events.total,
        total_bulletins: stats_info.bulletins.total,
        active_users: stats_info.users.active,
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
      
      notifications.show({
        title: '刪除成功',
        message: '用戶已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除用戶',
        color: 'red',
      });
    }
  };

  // 職缺管理功能
  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const token = getToken();
      if (!token) return;

      const params: any = {
        page: jobsPage,
        per_page: 20,
      };

      if (jobsSearch.trim()) {
        params.search = jobsSearch.trim();
      }
      if (jobsStatusFilter) {
        params.status = jobsStatusFilter;
      }

      const data = await api.jobs.getAll(token, params);
      setJobs(data.jobs || []);
      setJobsTotal(data.total || 0);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入職缺列表',
        color: 'red',
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const handleApproveJob = async (jobId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveJob(jobId, token);
      await loadJobs();
      await loadDashboardData(); // 更新統計數據
      
      notifications.show({
        title: '審核成功',
        message: '職缺已通過審核',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核職缺',
        color: 'red',
      });
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('確定要刪除此職缺嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.jobs.delete(jobId, token);
      await loadJobs();
      await loadDashboardData();
      
      notifications.show({
        title: '刪除成功',
        message: '職缺已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除職缺',
        color: 'red',
      });
    }
  };

  // 活動管理功能
  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const token = getToken();
      if (!token) return;

      const params: any = {
        page: eventsPage,
        per_page: 20,
      };

      if (eventsSearch.trim()) {
        params.search = eventsSearch.trim();
      }
      if (eventsStatusFilter) {
        params.status = eventsStatusFilter;
      }

      const data = await api.events.getAll(token, params);
      setEvents(data.events || []);
      setEventsTotal(data.total || 0);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入活動列表',
        color: 'red',
      });
    } finally {
      setEventsLoading(false);
    }
  };

  const handleApproveEvent = async (eventId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveEvent(eventId, token);
      await loadEvents();
      await loadDashboardData();
      
      notifications.show({
        title: '審核成功',
        message: '活動已通過審核',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核活動',
        color: 'red',
      });
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('確定要刪除此活動嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.events.delete(eventId, token);
      await loadEvents();
      await loadDashboardData();
      
      notifications.show({
        title: '刪除成功',
        message: '活動已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除活動',
        color: 'red',
      });
    }
  };

  // 公告管理功能
  const loadBulletins = async () => {
    try {
      setBulletinsLoading(true);
      const token = getToken();
      if (!token) return;

      const params: any = {
        page: bulletinsPage,
        per_page: 20,
      };

      if (bulletinsSearch.trim()) {
        params.search = bulletinsSearch.trim();
      }
      if (bulletinsStatusFilter) {
        params.status = bulletinsStatusFilter;
      }

      const data = await api.bulletins.getAll(token, params);
      setBulletins(data.bulletins || []);
      setBulletinsTotal(data.total || 0);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入公告列表',
        color: 'red',
      });
    } finally {
      setBulletinsLoading(false);
    }
  };

  const handleApproveBulletin = async (bulletinId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveBulletin(bulletinId, token);
      await loadBulletins();
      await loadDashboardData();
      
      notifications.show({
        title: '審核成功',
        message: '公告已通過審核',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核公告',
        color: 'red',
      });
    }
  };

  const handleDeleteBulletin = async (bulletinId: number) => {
    if (!confirm('確定要刪除此公告嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.bulletins.delete(bulletinId, token);
      await loadBulletins();
      await loadDashboardData();
      
      notifications.show({
        title: '刪除成功',
        message: '公告已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除公告',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Center h={400}>
            <Loader size="xl" />
          </Center>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            <Group justify="space-between">
              <div>
                <Group gap="xs" mb="xs">
                  <IconShieldCheck size={32} />
                  <Title order={1}>管理後台</Title>
                </Group>
                <Text c="dimmed">系統管理與數據分析</Text>
              </div>
              <Group>
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={openExport}
                >
                  匯出資料
                </Button>
                <Button
                  leftSection={<IconUpload size={16} />}
                  onClick={openImport}
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
              </Tabs.List>

              <Tabs.Panel value="dashboard" pt="xl">
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed" fw={500}>
                          總用戶數
                        </Text>
                        <IconUsers size={20} color="blue" />
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
                      />
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed" fw={500}>
                          職缺總數
                        </Text>
                        <IconBriefcase size={20} color="green" />
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
                      />
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed" fw={500}>
                          活動總數
                        </Text>
                        <IconCalendarEvent size={20} color="orange" />
                      </Group>
                      <Text size="xl" fw={700}>
                        {stats.total_events}
                      </Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        本月新增: {stats.events_this_month || 0}
                      </Text>
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed" fw={500}>
                          公告總數
                        </Text>
                        <IconBell size={20} color="purple" />
                      </Group>
                      <Text size="xl" fw={700}>
                        {stats.total_bulletins}
                      </Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        本週新增: {stats.bulletins_this_week || 0}
                      </Text>
                    </Card>
                  </Grid.Col>
                </Grid>

                <Paper shadow="sm" p="xl" radius="md" withBorder mt="xl">
                  <Title order={3} size="h4" mb="md">
                    快速操作
                  </Title>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Button fullWidth variant="light" leftSection={<IconUsers size={16} />}>
                        新增用戶
                      </Button>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Button fullWidth variant="light" leftSection={<IconBriefcase size={16} />}>
                        發布職缺
                      </Button>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Button fullWidth variant="light" leftSection={<IconCalendarEvent size={16} />}>
                        建立活動
                      </Button>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Button fullWidth variant="light" leftSection={<IconBell size={16} />}>
                        發布公告
                      </Button>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="users" pt="xl">
                <Paper shadow="sm" p="md" radius="md" withBorder>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>電子郵件</Table.Th>
                        <Table.Th>姓名</Table.Th>
                        <Table.Th>角色</Table.Th>
                        <Table.Th>狀態</Table.Th>
                        <Table.Th>註冊日期</Table.Th>
                        <Table.Th>操作</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {users.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>{user.id}</Table.Td>
                          <Table.Td>{user.email}</Table.Td>
                          <Table.Td>{user.full_name}</Table.Td>
                          <Table.Td>
                            <Badge color={user.role === 'admin' ? 'red' : 'blue'}>
                              {user.role === 'admin' ? '管理員' : '系友'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={user.is_active ? 'green' : 'gray'}>
                              {user.is_active ? '活躍' : '停用'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {new Date(user.created_at).toLocaleDateString('zh-TW')}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon 
                                variant="light" 
                                color="blue"
                                onClick={() => handleEditUser(user)}
                                title="編輯權限"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="jobs" pt="xl">
                <Stack gap="md">
                  <Group>
                    <TextInput
                      placeholder="搜尋職缺..."
                      leftSection={<IconSearch size={16} />}
                      value={jobsSearch}
                      onChange={(e) => setJobsSearch(e.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      placeholder="狀態篩選"
                      data={[
                        { value: 'ACTIVE', label: '已發布' },
                        { value: 'PENDING', label: '待審核' },
                        { value: 'CLOSED', label: '已關閉' },
                      ]}
                      value={jobsStatusFilter}
                      onChange={setJobsStatusFilter}
                      clearable
                      style={{ width: 150 }}
                    />
                  </Group>

                  {jobsLoading ? (
                    <Center h={200}>
                      <Loader size="lg" />
                    </Center>
                  ) : (
                    <>
                      <Paper shadow="sm" p="md" radius="md" withBorder>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>ID</Table.Th>
                              <Table.Th>標題</Table.Th>
                              <Table.Th>公司</Table.Th>
                              <Table.Th>地點</Table.Th>
                              <Table.Th>類型</Table.Th>
                              <Table.Th>狀態</Table.Th>
                              <Table.Th>發布者</Table.Th>
                              <Table.Th>發布日期</Table.Th>
                              <Table.Th>操作</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {jobs.map((job) => (
                              <Table.Tr key={job.id}>
                                <Table.Td>{job.id}</Table.Td>
                                <Table.Td>
                                  <Button
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => router.push(`/jobs/${job.id}`)}
                                  >
                                    {job.title}
                                  </Button>
                                </Table.Td>
                                <Table.Td>{job.company || job.company_name || '未提供'}</Table.Td>
                                <Table.Td>{job.location || '未提供'}</Table.Td>
                                <Table.Td>
                                  <Badge size="sm" variant="light">
                                    {job.job_type === 'full_time' ? '全職' : 
                                     job.job_type === 'part_time' ? '兼職' :
                                     job.job_type === 'internship' ? '實習' : job.job_type}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    color={
                                      job.status === 'ACTIVE' ? 'green' :
                                      job.status === 'PENDING' ? 'orange' : 'gray'
                                    }
                                  >
                                    {job.status === 'ACTIVE' ? '已發布' :
                                     job.status === 'PENDING' ? '待審核' : '已關閉'}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  {job.user?.profile?.display_name || 
                                   job.user?.profile?.full_name || 
                                   job.poster_name || '未知'}
                                </Table.Td>
                                <Table.Td>
                                  {job.created_at ? new Date(job.created_at).toLocaleDateString('zh-TW') : '-'}
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    {job.status === 'PENDING' && (
                                      <Tooltip label="審核通過">
                                        <ActionIcon
                                          variant="light"
                                          color="green"
                                          onClick={() => handleApproveJob(job.id)}
                                        >
                                          <IconCheck size={16} />
                                        </ActionIcon>
                                      </Tooltip>
                                    )}
                                    <Tooltip label="查看詳情">
                                      <ActionIcon
                                        variant="light"
                                        color="blue"
                                        onClick={() => router.push(`/jobs/${job.id}`)}
                                      >
                                        <IconEye size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="刪除">
                                      <ActionIcon
                                        variant="light"
                                        color="red"
                                        onClick={() => handleDeleteJob(job.id)}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Paper>
                      {jobsTotal > 20 && (
                        <Group justify="center">
                          <Pagination
                            value={jobsPage}
                            onChange={setJobsPage}
                            total={Math.ceil(jobsTotal / 20)}
                          />
                        </Group>
                      )}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="events" pt="xl">
                <Stack gap="md">
                  <Group>
                    <TextInput
                      placeholder="搜尋活動..."
                      leftSection={<IconSearch size={16} />}
                      value={eventsSearch}
                      onChange={(e) => setEventsSearch(e.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      placeholder="狀態篩選"
                      data={[
                        { value: 'PUBLISHED', label: '已發布' },
                        { value: 'DRAFT', label: '草稿' },
                        { value: 'CANCELLED', label: '已取消' },
                      ]}
                      value={eventsStatusFilter}
                      onChange={setEventsStatusFilter}
                      clearable
                      style={{ width: 150 }}
                    />
                  </Group>

                  {eventsLoading ? (
                    <Center h={200}>
                      <Loader size="lg" />
                    </Center>
                  ) : (
                    <>
                      <Paper shadow="sm" p="md" radius="md" withBorder>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>ID</Table.Th>
                              <Table.Th>標題</Table.Th>
                              <Table.Th>時間</Table.Th>
                              <Table.Th>地點</Table.Th>
                              <Table.Th>參與人數</Table.Th>
                              <Table.Th>狀態</Table.Th>
                              <Table.Th>主辦人</Table.Th>
                              <Table.Th>發布日期</Table.Th>
                              <Table.Th>操作</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {events.map((event) => (
                              <Table.Tr key={event.id}>
                                <Table.Td>{event.id}</Table.Td>
                                <Table.Td>
                                  <Button
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => router.push(`/events/${event.id}`)}
                                  >
                                    {event.title}
                                  </Button>
                                </Table.Td>
                                <Table.Td>
                                  {event.start_time
                                    ? new Date(event.start_time).toLocaleDateString('zh-TW')
                                    : '未提供'}
                                </Table.Td>
                                <Table.Td>
                                  {event.is_online ? (
                                    <Badge size="sm" color="blue">線上</Badge>
                                  ) : (
                                    event.location || '未提供'
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  {event.current_participants || 0} / {event.max_participants || '∞'}
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    color={
                                      event.status === 'PUBLISHED' ? 'green' :
                                      event.status === 'DRAFT' ? 'gray' : 'red'
                                    }
                                  >
                                    {event.status === 'PUBLISHED' ? '已發布' :
                                     event.status === 'DRAFT' ? '草稿' : '已取消'}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  {event.organizer_name || '未知'}
                                </Table.Td>
                                <Table.Td>
                                  {event.created_at ? new Date(event.created_at).toLocaleDateString('zh-TW') : '-'}
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    {event.status === 'DRAFT' && (
                                      <Tooltip label="審核通過">
                                        <ActionIcon
                                          variant="light"
                                          color="green"
                                          onClick={() => handleApproveEvent(event.id)}
                                        >
                                          <IconCheck size={16} />
                                        </ActionIcon>
                                      </Tooltip>
                                    )}
                                    <Tooltip label="查看詳情">
                                      <ActionIcon
                                        variant="light"
                                        color="blue"
                                        onClick={() => router.push(`/events/${event.id}`)}
                                      >
                                        <IconEye size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="刪除">
                                      <ActionIcon
                                        variant="light"
                                        color="red"
                                        onClick={() => handleDeleteEvent(event.id)}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Paper>
                      {eventsTotal > 20 && (
                        <Group justify="center">
                          <Pagination
                            value={eventsPage}
                            onChange={setEventsPage}
                            total={Math.ceil(eventsTotal / 20)}
                          />
                        </Group>
                      )}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="bulletins" pt="xl">
                <Stack gap="md">
                  <Group>
                    <TextInput
                      placeholder="搜尋公告..."
                      leftSection={<IconSearch size={16} />}
                      value={bulletinsSearch}
                      onChange={(e) => setBulletinsSearch(e.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      placeholder="狀態篩選"
                      data={[
                        { value: 'PUBLISHED', label: '已發布' },
                        { value: 'DRAFT', label: '草稿' },
                        { value: 'ARCHIVED', label: '已封存' },
                      ]}
                      value={bulletinsStatusFilter}
                      onChange={setBulletinsStatusFilter}
                      clearable
                      style={{ width: 150 }}
                    />
                  </Group>

                  {bulletinsLoading ? (
                    <Center h={200}>
                      <Loader size="lg" />
                    </Center>
                  ) : (
                    <>
                      <Paper shadow="sm" p="md" radius="md" withBorder>
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>ID</Table.Th>
                              <Table.Th>標題</Table.Th>
                              <Table.Th>類型</Table.Th>
                              <Table.Th>分類</Table.Th>
                              <Table.Th>狀態</Table.Th>
                              <Table.Th>釘選</Table.Th>
                              <Table.Th>作者</Table.Th>
                              <Table.Th>瀏覽次數</Table.Th>
                              <Table.Th>發布日期</Table.Th>
                              <Table.Th>操作</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {bulletins.map((bulletin) => (
                              <Table.Tr key={bulletin.id}>
                                <Table.Td>{bulletin.id}</Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    {bulletin.is_pinned && <IconPinned size={14} color="orange" />}
                                    <Button
                                      variant="subtle"
                                      size="xs"
                                      onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                                    >
                                      {bulletin.title}
                                    </Button>
                                  </Group>
                                </Table.Td>
                                <Table.Td>
                                  <Badge size="sm" variant="light">
                                    {bulletin.bulletin_type === 'announcement' ? '公告' :
                                     bulletin.bulletin_type === 'news' ? '新聞' :
                                     bulletin.bulletin_type === 'event' ? '活動' : bulletin.bulletin_type}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>{bulletin.category_name || '未分類'}</Table.Td>
                                <Table.Td>
                                  <Badge
                                    color={
                                      bulletin.status === 'PUBLISHED' ? 'green' :
                                      bulletin.status === 'DRAFT' ? 'gray' : 'orange'
                                    }
                                  >
                                    {bulletin.status === 'PUBLISHED' ? '已發布' :
                                     bulletin.status === 'DRAFT' ? '草稿' : '已封存'}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  {bulletin.is_pinned ? (
                                    <Badge size="sm" color="orange">已釘選</Badge>
                                  ) : (
                                    <Text size="sm" c="dimmed">-</Text>
                                  )}
                                </Table.Td>
                                <Table.Td>{bulletin.author_name || '未知'}</Table.Td>
                                <Table.Td>{bulletin.views_count || 0}</Table.Td>
                                <Table.Td>
                                  {bulletin.published_at || bulletin.created_at
                                    ? new Date(bulletin.published_at || bulletin.created_at).toLocaleDateString('zh-TW')
                                    : '-'}
                                </Table.Td>
                                <Table.Td>
                                  <Group gap="xs">
                                    {bulletin.status === 'DRAFT' && (
                                      <Tooltip label="審核通過">
                                        <ActionIcon
                                          variant="light"
                                          color="green"
                                          onClick={() => handleApproveBulletin(bulletin.id)}
                                        >
                                          <IconCheck size={16} />
                                        </ActionIcon>
                                      </Tooltip>
                                    )}
                                    <Tooltip label="查看詳情">
                                      <ActionIcon
                                        variant="light"
                                        color="blue"
                                        onClick={() => router.push(`/bulletins/${bulletin.id}`)}
                                      >
                                        <IconEye size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="刪除">
                                      <ActionIcon
                                        variant="light"
                                        color="red"
                                        onClick={() => handleDeleteBulletin(bulletin.id)}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Paper>
                      {bulletinsTotal > 20 && (
                        <Group justify="center">
                          <Pagination
                            value={bulletinsPage}
                            onChange={setBulletinsPage}
                            total={Math.ceil(bulletinsTotal / 20)}
                          />
                        </Group>
                      )}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 匯出模態框 */}
        <Modal opened={exportOpened} onClose={closeExport} title="匯出資料" centered>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              選擇要匯出的資料類型
            </Text>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconUsers size={16} />}
              onClick={() => handleExportCSV('users')}
            >
              匯出用戶資料
            </Button>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconBriefcase size={16} />}
              onClick={() => handleExportCSV('jobs')}
            >
              匯出職缺資料
            </Button>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconCalendarEvent size={16} />}
              onClick={() => handleExportCSV('events')}
            >
              匯出活動資料
            </Button>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconBell size={16} />}
              onClick={() => handleExportCSV('bulletins')}
            >
              匯出公告資料
            </Button>
          </Stack>
        </Modal>

        {/* 匯入模態框 */}
        <Modal opened={importOpened} onClose={closeImport} title="匯入資料" centered>
          <Stack gap="md">
            <Select
              label="資料類型"
              placeholder="選擇要匯入的資料類型"
              data={[
                { value: 'users', label: '用戶資料' },
                { value: 'jobs', label: '職缺資料' },
                { value: 'events', label: '活動資料' },
                { value: 'bulletins', label: '公告資料' },
              ]}
              value={importType}
              onChange={(value) => setImportType(value || 'users')}
            />
            <FileInput
              label="選擇 CSV 檔案"
              placeholder="點擊選擇檔案"
              accept=".csv"
              value={importFile}
              onChange={setImportFile}
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={closeImport}>
                取消
              </Button>
              <Button onClick={handleImportCSV} loading={uploading} disabled={!importFile}>
                開始匯入
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* 編輯用戶權限 Modal */}
        <Modal
          opened={editUserModalOpened}
          onClose={() => {
            setEditUserModalOpened(false);
            setEditingUser(null);
          }}
          title="編輯用戶權限"
          centered
        >
          {editingUser && (
            <Stack gap="md">
              <div>
                <Text size="sm" c="dimmed">用戶</Text>
                <Text fw={500}>{editingUser.full_name} ({editingUser.email})</Text>
              </div>

              <Select
                label="角色"
                data={[
                  { value: 'user', label: '系友' },
                  { value: 'admin', label: '管理員' },
                ]}
                value={editUserRole}
                onChange={(value) => value && setEditUserRole(value)}
              />

              <Select
                label="狀態"
                data={[
                  { value: 'active', label: '活躍' },
                  { value: 'inactive', label: '停用' },
                  { value: 'suspended', label: '暫停' },
                ]}
                value={editUserStatus}
                onChange={(value) => value && setEditUserStatus(value)}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setEditUserModalOpened(false);
                    setEditingUser(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleUpdateUser}>
                  儲存
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}


