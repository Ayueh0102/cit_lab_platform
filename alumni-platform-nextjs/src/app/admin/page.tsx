'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Textarea,
  Select,
  Loader,
  Center,
  FileInput,
  Progress,
  Tooltip,
  Pagination,
  Menu,
  Skeleton,
  Alert,
  Divider,
  ThemeIcon,
  List,
  Code,
  NumberInput,
  Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconUsers,
  IconUser,
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
  IconUserCheck,
  IconSchool,
  IconMail,
  IconPhone,
  IconChevronDown,
  IconFileTypeCsv,
  IconInfoCircle,
  IconAlertCircle,
  IconFileDownload,
  IconSettings,
  IconMessageCircle,
  IconPlus,
  IconDeviceFloppy,
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
  pending_users: number;
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

interface PendingUser {
  id: number;
  email: string;
  status: string;
  created_at: string;
  profile: {
    full_name?: string;
    display_name?: string;
    phone?: string;
    graduation_year?: number;
    class_year?: number;
    degree?: string;
    major?: string;
    student_id?: string;
    thesis_title?: string;
    advisor_1?: string;
    advisor_2?: string;
  };
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ImportResult {
  imported?: number;
  created?: number;
  updated?: number;
  failed?: number;
  errors?: string[];
  count?: number;
  total?: number;
}

interface SystemSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  name: string;
  description: string;
  is_public: boolean;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

// CSV 欄位說明
const CSV_FIELD_DESCRIPTIONS: Record<string, { fields: string[]; required: string[]; description: string }> = {
  users: {
    fields: ['email', 'name', 'display_name', 'phone', 'graduation_year', 'class_year', 'degree', 'major', 'student_id', 'advisor_1', 'advisor_2', 'thesis_title'],
    required: ['email', 'name'],
    description: '匯入使用者資料。email 必須唯一，已存在的 email 將更新資料。',
  },
  jobs: {
    fields: ['title', 'company', 'location', 'description', 'requirements', 'salary_range', 'job_type', 'contact_email'],
    required: ['title', 'company'],
    description: '匯入職缺資料。job_type 可選值：full_time, part_time, internship, contract。',
  },
  events: {
    fields: ['title', 'description', 'start_time', 'end_time', 'location', 'max_participants', 'is_online', 'event_type'],
    required: ['title', 'start_time'],
    description: '匯入活動資料。時間格式為 YYYY-MM-DD HH:mm。is_online 填 true 或 false。',
  },
  bulletins: {
    fields: ['title', 'content', 'bulletin_type', 'category', 'is_pinned'],
    required: ['title', 'content'],
    description: '匯入公告資料。bulletin_type 可選值：announcement, news, event。',
  },
};

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

  // 待審核用戶狀態
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingUsersLoading, setPendingUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [userDetailModalOpened, setUserDetailModalOpened] = useState(false);
  const [rejectModalOpened, setRejectModalOpened] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [editUserModalOpened, setEditUserModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserRole, setEditUserRole] = useState<string>('');
  const [editUserStatus, setEditUserStatus] = useState<string>('');
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [importType, setImportType] = useState<string>('users');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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

  // 匯出中的狀態
  const [exportingType, setExportingType] = useState<string | null>(null);

  // 系統設定狀態
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Map<string, string>>(new Map());
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);
  const [newSettingModalOpened, setNewSettingModalOpened] = useState(false);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'string',
    category: '',
    name: '',
    description: '',
    is_public: false,
  });

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
    } else if (activeTab === 'pending') {
      loadPendingUsers();
    } else if (activeTab === 'settings') {
      loadSettings();
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
      setExportingType(type);
      const token = getToken();
      if (!token) return;

      let blob: Blob;
      let typeName: string;
      switch (type) {
        case 'users':
          blob = await api.csv.exportUsers(token);
          typeName = '使用者';
          break;
        case 'jobs':
          blob = await api.csv.exportJobs(token);
          typeName = '職缺';
          break;
        case 'events':
          blob = await api.csv.exportEvents(token);
          typeName = '活動';
          break;
        case 'bulletins':
          blob = await api.csv.exportBulletins(token);
          typeName = '公告';
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
        message: `${typeName}資料已成功匯出為 CSV 檔案`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: '匯出失敗',
        message: error instanceof Error ? error.message : '無法匯出資料',
        color: 'red',
      });
    } finally {
      setExportingType(null);
    }
  };

  const handleDownloadTemplate = (type: string) => {
    const fieldInfo = CSV_FIELD_DESCRIPTIONS[type];
    if (!fieldInfo) return;

    // 產生 CSV 範本（只有標題行 + 一行範例）
    const header = fieldInfo.fields.join(',');
    let exampleRow = '';
    switch (type) {
      case 'users':
        exampleRow = 'alumni@example.com,王小明,小明,0912345678,2020,108,master,資訊工程,,,,';
        break;
      case 'jobs':
        exampleRow = '軟體工程師,台積電,新竹市,負責系統開發,3年以上經驗,80K-120K,full_time,hr@example.com';
        break;
      case 'events':
        exampleRow = '校友聚餐,年度校友聚餐活動,2026-06-15 18:00,2026-06-15 21:00,台北市信義區,50,false,reunion';
        break;
      case 'bulletins':
        exampleRow = '系統公告,這是一則系統公告的內容,announcement,一般,false';
        break;
    }

    const csvContent = `\uFEFF${header}\n${exampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: '範本已下載',
      message: '請依照範本格式填寫資料後匯入',
      color: 'blue',
    });
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

    // 驗證檔案類型
    if (!importFile.name.toLowerCase().endsWith('.csv')) {
      notifications.show({
        title: '檔案格式錯誤',
        message: '請選擇 .csv 格式的檔案',
        color: 'red',
      });
      return;
    }

    try {
      setUploading(true);
      setImportResult(null);
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

      // 解析匯入結果
      const importResultData: ImportResult = {
        imported: result.imported || result.count || result.total || 0,
        created: result.created || 0,
        updated: result.updated || 0,
        failed: result.failed || result.errors?.length || 0,
        errors: result.errors || [],
      };

      setImportResult(importResultData);

      const totalSuccess = importResultData.imported || (importResultData.created || 0) + (importResultData.updated || 0);

      if (importResultData.failed && importResultData.failed > 0) {
        notifications.show({
          title: '匯入完成（部分失敗）',
          message: `成功 ${totalSuccess} 筆，失敗 ${importResultData.failed} 筆`,
          color: 'orange',
          icon: <IconAlertCircle size={16} />,
        });
      } else {
        notifications.show({
          title: '匯入成功',
          message: `成功匯入 ${totalSuccess} 筆資料`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

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

  const handleCloseImport = useCallback(() => {
    closeImport();
    setImportFile(null);
    setImportResult(null);
  }, [closeImport]);

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

  // 系統設定功能
  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const token = getToken();
      if (!token) return;

      const data = await api.systemSettings.getAll(token);
      setSettings(data.settings || data.data || []);
      setEditingSettings(new Map());
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入系統設定',
        color: 'red',
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string) => {
    const newValue = editingSettings.get(key);
    if (newValue === undefined) return;

    try {
      setSavingSettingKey(key);
      const token = getToken();
      if (!token) return;

      await api.systemSettings.update(key, { setting_value: newValue }, token);

      notifications.show({
        title: '更新成功',
        message: `設定「${key}」已成功更新`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // 更新本地狀態
      setSettings((prev) =>
        prev.map((s) =>
          s.setting_key === key ? { ...s, setting_value: newValue } : s
        )
      );
      setEditingSettings((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '無法更新設定',
        color: 'red',
      });
    } finally {
      setSavingSettingKey(null);
    }
  };

  const handleCreateSetting = async () => {
    if (!newSetting.setting_key.trim() || !newSetting.name.trim()) {
      notifications.show({
        title: '欄位不完整',
        message: '請填寫設定鍵值和名稱',
        color: 'orange',
      });
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.systemSettings.create({
        setting_key: newSetting.setting_key,
        setting_value: newSetting.setting_value,
        setting_type: newSetting.setting_type,
        category: newSetting.category,
        name: newSetting.name,
        description: newSetting.description,
        is_public: newSetting.is_public,
      }, token);

      notifications.show({
        title: '新增成功',
        message: `設定「${newSetting.name}」已成功建立`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      setNewSettingModalOpened(false);
      setNewSetting({
        setting_key: '',
        setting_value: '',
        setting_type: 'string',
        category: '',
        name: '',
        description: '',
        is_public: false,
      });
      await loadSettings();
    } catch (error) {
      notifications.show({
        title: '新增失敗',
        message: error instanceof Error ? error.message : '無法新增設定',
        color: 'red',
      });
    }
  };

  // 待審核用戶功能
  const loadPendingUsers = async () => {
    try {
      setPendingUsersLoading(true);
      const token = getToken();
      if (!token) return;

      const data = await api.admin.getPendingUsers(token, { page: 1, per_page: 50 });
      setPendingUsers(data.users || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入待審核用戶列表',
        color: 'red',
      });
    } finally {
      setPendingUsersLoading(false);
    }
  };

  const handleViewUserDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setUserDetailModalOpened(true);
  };

  const handleApproveUser = async (userId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveUser(userId, token);

      notifications.show({
        title: '審核成功',
        message: '用戶已通過審核，系統已發送通知郵件',
        color: 'green',
      });

      setUserDetailModalOpened(false);
      setSelectedUser(null);
      await loadPendingUsers();
      await loadDashboardData();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核用戶',
        color: 'red',
      });
    }
  };

  const handleOpenRejectModal = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectReason('');
    setRejectModalOpened(true);
  };

  const handleRejectUser = async () => {
    if (!selectedUser) return;

    try {
      const token = getToken();
      if (!token) return;

      await api.admin.rejectUser(selectedUser.id, rejectReason, token);

      notifications.show({
        title: '已拒絕',
        message: '用戶申請已拒絕，系統已發送通知郵件',
        color: 'orange',
      });

      setRejectModalOpened(false);
      setUserDetailModalOpened(false);
      setSelectedUser(null);
      setRejectReason('');
      await loadPendingUsers();
      await loadDashboardData();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法拒絕用戶',
        color: 'red',
      });
    }
  };

  // 過濾用戶列表
  const filteredUsers = usersSearch.trim()
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(usersSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(usersSearch.toLowerCase())
      )
    : users;

  // Dashboard 骨架屏
  const DashboardSkeleton = () => (
    <>
      <Grid>
        {[1, 2, 3, 4].map((i) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
            <Card className="glass-card-soft" padding="lg" radius="lg">
              <Group justify="space-between" mb="xs">
                <Skeleton height={16} width="40%" radius="xl" />
                <Skeleton height={20} width={20} circle />
              </Group>
              <Skeleton height={32} width="30%" radius="xl" mt="sm" />
              <Skeleton height={12} width="70%" radius="xl" mt="md" />
              <Skeleton height={6} radius="xl" mt="sm" />
            </Card>
          </Grid.Col>
        ))}
      </Grid>
      <Paper className="glass-card-soft" p="xl" radius="lg" mt="xl">
        <Skeleton height={24} width="20%" radius="xl" mb="md" />
        <Grid>
          {[1, 2, 3, 4].map((i) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton height={36} radius="xl" />
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Container size="xl" py="xl">
            <Stack gap="xl">
              <Group justify="space-between">
                <div>
                  <Group gap="xs" mb="xs">
                    <Skeleton height={32} width={32} circle />
                    <Skeleton height={32} width={200} radius="xl" />
                  </Group>
                  <Skeleton height={16} width={160} radius="xl" />
                </div>
                <Group>
                  <Skeleton height={36} width={120} radius="xl" />
                  <Skeleton height={36} width={120} radius="xl" />
                </Group>
              </Group>
              <Skeleton height={42} radius="md" />
              <DashboardSkeleton />
            </Stack>
          </Container>
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
                {/* 匯出下拉選單 */}
                <Menu shadow="md" width={220} position="bottom-end">
                  <Menu.Target>
                    <Button
                      variant="gradient"
                      gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
                      leftSection={<IconDownload size={16} />}
                      rightSection={<IconChevronDown size={14} />}
                      radius="xl"
                      loading={exportingType !== null}
                    >
                      匯出資料
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>選擇匯出類型</Menu.Label>
                    <Menu.Item
                      leftSection={<IconUsers size={16} />}
                      onClick={() => handleExportCSV('users')}
                      disabled={exportingType !== null}
                    >
                      匯出使用者
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBriefcase size={16} />}
                      onClick={() => handleExportCSV('jobs')}
                      disabled={exportingType !== null}
                    >
                      匯出職缺
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconCalendarEvent size={16} />}
                      onClick={() => handleExportCSV('events')}
                      disabled={exportingType !== null}
                    >
                      匯出活動
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBell size={16} />}
                      onClick={() => handleExportCSV('bulletins')}
                      disabled={exportingType !== null}
                    >
                      匯出公告
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

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
                        onClick={() => setActiveTab('pending')}
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
                        onClick={() => setActiveTab('users')}
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
                        onClick={() => setActiveTab('jobs')}
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
                        onClick={() => setActiveTab('events')}
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
                        onClick={() => setActiveTab('bulletins')}
                      >
                        管理公告
                      </Button>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Tabs.Panel>

              {/* 待審核用戶 */}
              <Tabs.Panel value="pending" pt="xl">
                <Paper className="glass-card-soft" p="xl" radius="lg">
                  <Group justify="space-between" mb="lg">
                    <Title order={3} size="h4">
                      <Group gap="xs">
                        <IconUserCheck size={24} />
                        待審核會員申請
                      </Group>
                    </Title>
                    {pendingUsers.length > 0 && (
                      <Badge size="lg" variant="light" color="orange">
                        {pendingUsers.length} 筆待審核
                      </Badge>
                    )}
                  </Group>

                  {pendingUsersLoading ? (
                    <Stack gap="sm">
                      {[1, 2, 3].map((i) => (
                        <Group key={i} gap="md" p="sm">
                          <Skeleton height={16} width="15%" radius="xl" />
                          <Skeleton height={16} width="25%" radius="xl" />
                          <Skeleton height={16} width="10%" radius="xl" />
                          <Skeleton height={16} width="10%" radius="xl" />
                          <Skeleton height={16} width="15%" radius="xl" />
                          <Skeleton height={16} width="12%" radius="xl" />
                          <Skeleton height={24} width={80} radius="xl" />
                        </Group>
                      ))}
                    </Stack>
                  ) : pendingUsers.length === 0 ? (
                    <Center h={200}>
                      <Stack align="center" gap="xs">
                        <IconCheck size={48} color="gray" />
                        <Text c="dimmed">目前沒有待審核的會員申請</Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>姓名</Table.Th>
                          <Table.Th>電子郵件</Table.Th>
                          <Table.Th>畢業年份</Table.Th>
                          <Table.Th>學位</Table.Th>
                          <Table.Th>指導教授</Table.Th>
                          <Table.Th>申請時間</Table.Th>
                          <Table.Th>操作</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {pendingUsers.map((user) => (
                          <Table.Tr key={user.id}>
                            <Table.Td>
                              <Text fw={500}>{user.profile?.full_name || '-'}</Text>
                            </Table.Td>
                            <Table.Td>{user.email}</Table.Td>
                            <Table.Td>{user.profile?.graduation_year || '-'}</Table.Td>
                            <Table.Td>
                              {user.profile?.degree === 'master' ? '碩士' :
                               user.profile?.degree === 'phd' ? '博士' : '-'}
                            </Table.Td>
                            <Table.Td>{user.profile?.advisor_1 || '-'}</Table.Td>
                            <Table.Td>
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-TW') : '-'}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="查看詳情">
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    onClick={() => handleViewUserDetails(user)}
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="通過">
                                  <ActionIcon
                                    variant="light"
                                    color="green"
                                    onClick={() => handleApproveUser(user.id)}
                                  >
                                    <IconCheck size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="拒絕">
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    onClick={() => handleOpenRejectModal(user)}
                                  >
                                    <IconX size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="users" pt="xl">
                <Stack gap="md">
                  <Group>
                    <TextInput
                      placeholder="搜尋用戶（姓名或 Email）..."
                      leftSection={<IconSearch size={16} />}
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.currentTarget.value)}
                      style={{ flex: 1 }}
                    />
                    <Text size="sm" c="dimmed">
                      共 {filteredUsers.length} 筆
                    </Text>
                  </Group>
                  <Paper className="glass-card-soft" p="md" radius="lg">
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>ID</Table.Th>
                          <Table.Th>姓名</Table.Th>
                          <Table.Th>電子郵件</Table.Th>
                          <Table.Th>角色</Table.Th>
                          <Table.Th>狀態</Table.Th>
                          <Table.Th>註冊日期</Table.Th>
                          <Table.Th>操作</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filteredUsers.map((user) => (
                          <Table.Tr key={user.id}>
                            <Table.Td>{user.id}</Table.Td>
                            <Table.Td>
                              <Text fw={500}>{user.full_name}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{user.email}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={user.role === 'admin' ? 'grape' : 'blue'}
                                variant="light"
                              >
                                {user.role === 'admin' ? '管理員' : '系友'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={user.is_active ? 'green' : 'gray'}
                                variant="light"
                              >
                                {user.is_active ? '活躍' : '停用'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              {new Date(user.created_at).toLocaleDateString('zh-TW')}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="編輯權限">
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="刪除用戶">
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <Table.Tr>
                            <Table.Td colSpan={7}>
                              <Center py="xl">
                                <Text c="dimmed">
                                  {usersSearch.trim() ? '找不到符合條件的用戶' : '尚無用戶資料'}
                                </Text>
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Stack>
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
                      <Paper className="glass-card-soft" p="md" radius="lg">
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
                                    variant="light"
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
                      <Paper className="glass-card-soft" p="md" radius="lg">
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
                                    <Badge size="sm" color="blue" variant="light">線上</Badge>
                                  ) : (
                                    event.location || '未提供'
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  {event.current_participants || 0} / {event.max_participants || '\u221E'}
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    color={
                                      event.status === 'published' ? 'green' :
                                      event.status === 'draft' ? 'gray' : 'red'
                                    }
                                    variant="light"
                                  >
                                    {event.status === 'published' ? '已發布' :
                                     event.status === 'draft' ? '草稿' : '已取消'}
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
                                    {event.status === 'draft' && (
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
                      <Paper className="glass-card-soft" p="md" radius="lg">
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
                                      bulletin.status === 'published' ? 'green' :
                                      bulletin.status === 'draft' ? 'gray' : 'orange'
                                    }
                                    variant="light"
                                  >
                                    {bulletin.status === 'published' ? '已發布' :
                                     bulletin.status === 'draft' ? '草稿' : '已封存'}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  {bulletin.is_pinned ? (
                                    <Badge size="sm" color="orange" variant="light">已釘選</Badge>
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
                                    {bulletin.status === 'draft' && (
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

              {/* 系統設定 */}
              <Tabs.Panel value="settings" pt="xl">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={3} size="h4">
                      <Group gap="xs">
                        <IconSettings size={24} />
                        系統設定管理
                      </Group>
                    </Title>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      variant="gradient"
                      gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
                      radius="xl"
                      onClick={() => setNewSettingModalOpened(true)}
                    >
                      新增設定
                    </Button>
                  </Group>

                  {settingsLoading ? (
                    <Center h={200}>
                      <Loader size="lg" />
                    </Center>
                  ) : settings.length === 0 ? (
                    <Center h={200}>
                      <Stack align="center" gap="xs">
                        <IconSettings size={48} color="gray" />
                        <Text c="dimmed">尚無系統設定</Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Paper className="glass-card-soft" p="md" radius="lg">
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>設定名稱</Table.Th>
                            <Table.Th>分類</Table.Th>
                            <Table.Th>值</Table.Th>
                            <Table.Th>類型</Table.Th>
                            <Table.Th>操作</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {settings.map((setting) => (
                            <Table.Tr
                              key={setting.setting_key}
                              style={!setting.is_editable ? { opacity: 0.6 } : undefined}
                            >
                              <Table.Td>
                                <Stack gap={2}>
                                  <Text fw={500} size="sm">{setting.name || setting.setting_key}</Text>
                                  {setting.description && (
                                    <Text size="xs" c="dimmed">{setting.description}</Text>
                                  )}
                                  <Group gap={4}>
                                    <Code>{setting.setting_key}</Code>
                                    {setting.is_public && (
                                      <Badge size="xs" variant="light" color="blue">公開</Badge>
                                    )}
                                    {!setting.is_editable && (
                                      <Badge size="xs" variant="light" color="gray">唯讀</Badge>
                                    )}
                                  </Group>
                                </Stack>
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="light" size="sm">
                                  {setting.category || '未分類'}
                                </Badge>
                              </Table.Td>
                              <Table.Td style={{ minWidth: 200 }}>
                                {!setting.is_editable ? (
                                  <Text size="sm" c="dimmed">{setting.setting_value}</Text>
                                ) : setting.setting_type === 'bool' ? (
                                  <Switch
                                    checked={
                                      editingSettings.has(setting.setting_key)
                                        ? editingSettings.get(setting.setting_key) === 'true'
                                        : setting.setting_value === 'true'
                                    }
                                    onChange={(e) => {
                                      const val = e.currentTarget.checked ? 'true' : 'false';
                                      setEditingSettings((prev) => {
                                        const next = new Map(prev);
                                        next.set(setting.setting_key, val);
                                        return next;
                                      });
                                    }}
                                    size="sm"
                                  />
                                ) : setting.setting_type === 'int' ? (
                                  <NumberInput
                                    size="xs"
                                    value={
                                      editingSettings.has(setting.setting_key)
                                        ? Number(editingSettings.get(setting.setting_key))
                                        : Number(setting.setting_value) || 0
                                    }
                                    onChange={(val) => {
                                      setEditingSettings((prev) => {
                                        const next = new Map(prev);
                                        next.set(setting.setting_key, String(val));
                                        return next;
                                      });
                                    }}
                                    style={{ maxWidth: 150 }}
                                  />
                                ) : setting.setting_type === 'json' ? (
                                  <Textarea
                                    size="xs"
                                    value={
                                      editingSettings.has(setting.setting_key)
                                        ? editingSettings.get(setting.setting_key)
                                        : setting.setting_value
                                    }
                                    onChange={(e) => {
                                      setEditingSettings((prev) => {
                                        const next = new Map(prev);
                                        next.set(setting.setting_key, e.currentTarget.value);
                                        return next;
                                      });
                                    }}
                                    minRows={2}
                                    autosize
                                    maxRows={4}
                                    style={{ maxWidth: 300 }}
                                  />
                                ) : (
                                  <TextInput
                                    size="xs"
                                    value={
                                      editingSettings.has(setting.setting_key)
                                        ? editingSettings.get(setting.setting_key)
                                        : setting.setting_value
                                    }
                                    onChange={(e) => {
                                      setEditingSettings((prev) => {
                                        const next = new Map(prev);
                                        next.set(setting.setting_key, e.currentTarget.value);
                                        return next;
                                      });
                                    }}
                                  />
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  size="sm"
                                  variant="outline"
                                  color={
                                    setting.setting_type === 'bool' ? 'teal' :
                                    setting.setting_type === 'int' ? 'blue' :
                                    setting.setting_type === 'json' ? 'grape' : 'gray'
                                  }
                                >
                                  {setting.setting_type}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                {setting.is_editable && editingSettings.has(setting.setting_key) && (
                                  <Tooltip label="儲存變更">
                                    <ActionIcon
                                      variant="light"
                                      color="green"
                                      onClick={() => handleUpdateSetting(setting.setting_key)}
                                      loading={savingSettingKey === setting.setting_key}
                                    >
                                      <IconDeviceFloppy size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  )}
                </Stack>
              </Tabs.Panel>

              {/* 評論審核 */}
              <Tabs.Panel value="comments" pt="xl">
                <Paper className="glass-card-soft" p="xl" radius="lg">
                  <Stack gap="lg">
                    <Group justify="space-between">
                      <Title order={3} size="h4">
                        <Group gap="xs">
                          <IconMessageCircle size={24} />
                          評論審核
                        </Group>
                      </Title>
                    </Group>

                    <Alert
                      variant="light"
                      color="blue"
                      title="評論審核說明"
                      icon={<IconInfoCircle size={16} />}
                      radius="md"
                    >
                      <Text size="sm">
                        目前評論審核功能整合在各文章詳情頁中。管理員可在文章頁面直接審核、回覆或刪除評論。
                        請前往 CMS 文章管理頁面查看文章列表，點擊文章即可進入詳情頁審核評論。
                      </Text>
                    </Alert>

                    <Center>
                      <Button
                        variant="gradient"
                        gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
                        size="lg"
                        radius="xl"
                        leftSection={<IconMessageCircle size={20} />}
                        onClick={() => router.push('/cms')}
                      >
                        前往 CMS 文章管理
                      </Button>
                    </Center>
                  </Stack>
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 匯入模態框 - 增強版 */}
        <Modal
          opened={importOpened}
          onClose={handleCloseImport}
          title={
            <Group gap="xs">
              <IconUpload size={20} />
              <Text fw={600}>匯入資料</Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">
            <Select
              label="資料類型"
              placeholder="選擇要匯入的資料類型"
              data={[
                { value: 'users', label: '使用者資料' },
                { value: 'jobs', label: '職缺資料' },
                { value: 'events', label: '活動資料' },
                { value: 'bulletins', label: '公告資料' },
              ]}
              value={importType}
              onChange={(value) => {
                setImportType(value || 'users');
                setImportResult(null);
              }}
            />

            {/* CSV 欄位說明 */}
            <Alert
              variant="light"
              color="blue"
              title="CSV 格式說明"
              icon={<IconInfoCircle size={16} />}
              radius="md"
            >
              <Text size="sm" mb="xs">
                {CSV_FIELD_DESCRIPTIONS[importType]?.description}
              </Text>
              <Divider my="xs" />
              <Text size="xs" fw={600} mb={4}>欄位清單：</Text>
              <Group gap={4} wrap="wrap">
                {CSV_FIELD_DESCRIPTIONS[importType]?.fields.map((field) => (
                  <Code
                    key={field}
                    color={CSV_FIELD_DESCRIPTIONS[importType]?.required.includes(field) ? 'red' : undefined}
                  >
                    {field}{CSV_FIELD_DESCRIPTIONS[importType]?.required.includes(field) ? '*' : ''}
                  </Code>
                ))}
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                標示 * 的為必填欄位
              </Text>
            </Alert>

            {/* 下載範本按鈕 */}
            <Button
              variant="subtle"
              color="blue"
              leftSection={<IconFileDownload size={16} />}
              onClick={() => handleDownloadTemplate(importType)}
              size="sm"
            >
              下載 CSV 範本（{importType === 'users' ? '使用者' : importType === 'jobs' ? '職缺' : importType === 'events' ? '活動' : '公告'}）
            </Button>

            <FileInput
              label="選擇 CSV 檔案"
              placeholder="點擊選擇 .csv 檔案"
              accept=".csv"
              value={importFile}
              onChange={(file) => {
                setImportFile(file);
                setImportResult(null);
              }}
              leftSection={<IconFileTypeCsv size={16} />}
              description="僅支援 .csv 格式，建議使用 UTF-8 編碼"
            />

            {/* 匯入結果摘要 */}
            {importResult && (
              <Alert
                variant="light"
                color={importResult.failed && importResult.failed > 0 ? 'orange' : 'green'}
                title="匯入結果"
                icon={importResult.failed && importResult.failed > 0 ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
                radius="md"
              >
                <Stack gap="xs">
                  <Group gap="xl">
                    {(importResult.created !== undefined && importResult.created > 0) && (
                      <div>
                        <Text size="xs" c="dimmed">新增</Text>
                        <Text fw={700} c="green">{importResult.created} 筆</Text>
                      </div>
                    )}
                    {(importResult.updated !== undefined && importResult.updated > 0) && (
                      <div>
                        <Text size="xs" c="dimmed">更新</Text>
                        <Text fw={700} c="blue">{importResult.updated} 筆</Text>
                      </div>
                    )}
                    {importResult.imported !== undefined && importResult.imported > 0 && !importResult.created && !importResult.updated && (
                      <div>
                        <Text size="xs" c="dimmed">成功匯入</Text>
                        <Text fw={700} c="green">{importResult.imported} 筆</Text>
                      </div>
                    )}
                    {(importResult.failed !== undefined && importResult.failed > 0) && (
                      <div>
                        <Text size="xs" c="dimmed">失敗</Text>
                        <Text fw={700} c="red">{importResult.failed} 筆</Text>
                      </div>
                    )}
                  </Group>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <>
                      <Divider />
                      <Text size="xs" fw={600} c="red">錯誤詳情：</Text>
                      <List size="xs" spacing={2}>
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <List.Item key={idx}>
                            <Text size="xs" c="red">{err}</Text>
                          </List.Item>
                        ))}
                        {importResult.errors.length > 5 && (
                          <List.Item>
                            <Text size="xs" c="dimmed">
                              ... 還有 {importResult.errors.length - 5} 項錯誤
                            </Text>
                          </List.Item>
                        )}
                      </List>
                    </>
                  )}
                </Stack>
              </Alert>
            )}

            <Divider />

            <Group justify="flex-end">
              <Button variant="light" onClick={handleCloseImport}>
                {importResult ? '關閉' : '取消'}
              </Button>
              {!importResult && (
                <Button
                  onClick={handleImportCSV}
                  loading={uploading}
                  disabled={!importFile}
                  leftSection={<IconUpload size={16} />}
                  variant="gradient"
                  gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
                  radius="xl"
                >
                  開始匯入
                </Button>
              )}
            </Group>
          </Stack>
        </Modal>

        {/* 用戶詳情審核 Modal */}
        <Modal
          opened={userDetailModalOpened}
          onClose={() => {
            setUserDetailModalOpened(false);
            setSelectedUser(null);
          }}
          title="會員申請詳情"
          size="lg"
          centered
        >
          {selectedUser && (
            <Stack gap="md">
              <Paper p="md" withBorder radius="md">
                <Group gap="xs" mb="sm">
                  <IconMail size={18} color="gray" />
                  <Text size="sm" c="dimmed">電子郵件</Text>
                </Group>
                <Text fw={500}>{selectedUser.email}</Text>
              </Paper>

              <Grid>
                <Grid.Col span={6}>
                  <Paper p="md" withBorder radius="md">
                    <Group gap="xs" mb="sm">
                      <IconUser size={18} color="gray" />
                      <Text size="sm" c="dimmed">姓名</Text>
                    </Group>
                    <Text fw={500}>{selectedUser.profile?.full_name || '-'}</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Paper p="md" withBorder radius="md">
                    <Group gap="xs" mb="sm">
                      <IconPhone size={18} color="gray" />
                      <Text size="sm" c="dimmed">聯絡電話</Text>
                    </Group>
                    <Text fw={500}>{selectedUser.profile?.phone || '-'}</Text>
                  </Paper>
                </Grid.Col>
              </Grid>

              <Paper p="md" withBorder bg="blue.0" radius="md">
                <Group gap="xs" mb="sm">
                  <IconSchool size={18} color="blue" />
                  <Text size="sm" fw={600} c="blue">學籍資料</Text>
                </Group>
                <Grid>
                  <Grid.Col span={4}>
                    <Text size="xs" c="dimmed">畢業年份</Text>
                    <Text fw={500}>{selectedUser.profile?.graduation_year || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="xs" c="dimmed">屆數</Text>
                    <Text fw={500}>{selectedUser.profile?.class_year ? `第 ${selectedUser.profile.class_year} 屆` : '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="xs" c="dimmed">學位</Text>
                    <Text fw={500}>
                      {selectedUser.profile?.degree === 'master' ? '碩士' :
                       selectedUser.profile?.degree === 'phd' ? '博士' : '-'}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">學號</Text>
                    <Text fw={500}>{selectedUser.profile?.student_id || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">主修</Text>
                    <Text fw={500}>{selectedUser.profile?.major || '-'}</Text>
                  </Grid.Col>
                </Grid>
              </Paper>

              <Paper p="md" withBorder radius="md">
                <Text size="sm" c="dimmed" mb="xs">指導教授</Text>
                <Text fw={500}>
                  {selectedUser.profile?.advisor_1 || '-'}
                  {selectedUser.profile?.advisor_2 && ` / ${selectedUser.profile.advisor_2}`}
                </Text>
              </Paper>

              {selectedUser.profile?.thesis_title && (
                <Paper p="md" withBorder radius="md">
                  <Text size="sm" c="dimmed" mb="xs">論文題目</Text>
                  <Text fw={500}>{selectedUser.profile.thesis_title}</Text>
                </Paper>
              )}

              <Paper p="md" withBorder bg="gray.0" radius="md">
                <Text size="sm" c="dimmed" mb="xs">申請時間</Text>
                <Text fw={500}>
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('zh-TW') : '-'}
                </Text>
              </Paper>

              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={() => handleOpenRejectModal(selectedUser)}
                  radius="xl"
                >
                  拒絕申請
                </Button>
                <Button
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => handleApproveUser(selectedUser.id)}
                  radius="xl"
                >
                  通過審核
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* 拒絕原因 Modal */}
        <Modal
          opened={rejectModalOpened}
          onClose={() => {
            setRejectModalOpened(false);
            setRejectReason('');
          }}
          title="拒絕會員申請"
          centered
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              請輸入拒絕原因（將發送給申請人）：
            </Text>
            <Textarea
              placeholder="例如：無法驗證您的系友身份，請提供更多證明..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.currentTarget.value)}
              minRows={3}
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setRejectModalOpened(false)} radius="xl">
                取消
              </Button>
              <Button color="red" onClick={handleRejectUser} radius="xl">
                確認拒絕
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
                  radius="xl"
                >
                  取消
                </Button>
                <Button onClick={handleUpdateUser} radius="xl">
                  儲存
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
        {/* 新增系統設定 Modal */}
        <Modal
          opened={newSettingModalOpened}
          onClose={() => {
            setNewSettingModalOpened(false);
            setNewSetting({
              setting_key: '',
              setting_value: '',
              setting_type: 'string',
              category: '',
              name: '',
              description: '',
              is_public: false,
            });
          }}
          title={
            <Group gap="xs">
              <IconSettings size={20} />
              <Text fw={600}>新增系統設定</Text>
            </Group>
          }
          centered
          size="lg"
        >
          <Stack gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="設定鍵值 (Key)"
                  placeholder="例如：site_name"
                  value={newSetting.setting_key}
                  onChange={(e) => setNewSetting({ ...newSetting, setting_key: e.currentTarget.value })}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="設定名稱"
                  placeholder="例如：網站名稱"
                  value={newSetting.name}
                  onChange={(e) => setNewSetting({ ...newSetting, name: e.currentTarget.value })}
                  required
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="值類型"
                  data={[
                    { value: 'string', label: '字串 (string)' },
                    { value: 'int', label: '整數 (int)' },
                    { value: 'bool', label: '布林 (bool)' },
                    { value: 'json', label: 'JSON' },
                  ]}
                  value={newSetting.setting_type}
                  onChange={(value) => setNewSetting({ ...newSetting, setting_type: value || 'string' })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="分類"
                  placeholder="例如：general, email, notification"
                  value={newSetting.category}
                  onChange={(e) => setNewSetting({ ...newSetting, category: e.currentTarget.value })}
                />
              </Grid.Col>
            </Grid>

            {newSetting.setting_type === 'bool' ? (
              <Switch
                label="設定值"
                checked={newSetting.setting_value === 'true'}
                onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.currentTarget.checked ? 'true' : 'false' })}
              />
            ) : newSetting.setting_type === 'json' ? (
              <Textarea
                label="設定值"
                placeholder='例如：{"key": "value"}'
                value={newSetting.setting_value}
                onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.currentTarget.value })}
                minRows={3}
                autosize
              />
            ) : newSetting.setting_type === 'int' ? (
              <NumberInput
                label="設定值"
                placeholder="請輸入整數值"
                value={newSetting.setting_value ? Number(newSetting.setting_value) : ''}
                onChange={(val) => setNewSetting({ ...newSetting, setting_value: String(val) })}
              />
            ) : (
              <TextInput
                label="設定值"
                placeholder="請輸入設定值"
                value={newSetting.setting_value}
                onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.currentTarget.value })}
              />
            )}

            <Textarea
              label="說明"
              placeholder="描述這個設定的用途..."
              value={newSetting.description}
              onChange={(e) => setNewSetting({ ...newSetting, description: e.currentTarget.value })}
              minRows={2}
            />

            <Switch
              label="是否為公開設定（不需要登入即可讀取）"
              checked={newSetting.is_public}
              onChange={(e) => setNewSetting({ ...newSetting, is_public: e.currentTarget.checked })}
            />

            <Divider />

            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setNewSettingModalOpened(false);
                  setNewSetting({
                    setting_key: '',
                    setting_value: '',
                    setting_type: 'string',
                    category: '',
                    name: '',
                    description: '',
                    is_public: false,
                  });
                }}
                radius="xl"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateSetting}
                leftSection={<IconPlus size={16} />}
                variant="gradient"
                gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
                radius="xl"
              >
                建立設定
              </Button>
            </Group>
          </Stack>
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
