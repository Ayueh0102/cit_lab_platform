'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppShell,
  Group,
  Text,
  UnstyledButton,
  Avatar,
  Badge,
  Menu,
  Stack,
  Box,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconHome,
  IconBriefcase,
  IconCalendarEvent,
  IconUsers,
  IconBell as IconBellOutline,
  IconUser,
  IconBell,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconUserCircle,
  IconFileText,
} from '@tabler/icons-react';
import { getUser, clearAuth, isAuthenticated, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/use-websocket';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  adminOnly?: boolean;
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userName = user?.profile?.display_name || user?.profile?.full_name || user?.email || 'User';

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      setUser(getUser());
      loadUnreadCount();
    }
  }, []);

  const loadUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.notifications.getUnreadCount(token);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      // 靜默失敗
    }
  };

  // 使用 WebSocket 即時更新通知數量
  useWebSocket({
    onNotificationCountUpdate: (count) => {
      setUnreadCount(count);
    },
    onNotification: () => {
      // 有新通知時更新數量
      loadUnreadCount();
    },
  });

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
    router.refresh();
  };

  const navItems: NavItem[] = [
    { icon: <IconHome size={20} />, label: '首頁', path: '/' },
    { icon: <IconBriefcase size={20} />, label: '職缺分享', path: '/jobs' },
    { icon: <IconCalendarEvent size={20} />, label: '活動列表', path: '/events' },
    { icon: <IconUsers size={20} />, label: '系友名錄', path: '/directory' },
    { icon: <IconBellOutline size={20} />, label: '公佈欄', path: '/bulletins' },
    { icon: <IconUser size={20} />, label: '個人檔案', path: '/profile' },
    { icon: <IconUserCircle size={20} />, label: '職涯管理', path: '/career' },
    { icon: <IconBell size={20} />, label: '通知', path: '/notifications', badge: unreadCount },
    { icon: <IconSettings size={20} />, label: '管理後台', path: '/admin', adminOnly: true },
    { icon: <IconFileText size={20} />, label: '內容管理', path: '/cms', adminOnly: true },
  ];

  // 過濾掉僅管理員可見的項目
  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  // 避免 hydration 錯誤 - 等待客戶端掛載
  if (!mounted) {
    return (
      <AppShell
        padding="md"
        navbar={{
          width: 280,
          breakpoint: 'sm',
        }}
        styles={{
          navbar: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          main: {
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
          },
        }}
      >
        <AppShell.Navbar p="md">
          <Center h="100%">
            <Loader color="white" />
          </Center>
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 280,
        breakpoint: 'sm',
      }}
      styles={{
        navbar: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        main: {
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh',
        },
      }}
    >
      {/* 左側導航欄 */}
      <AppShell.Navbar p="md">
        <Stack gap="md" h="100%">
          {/* Logo 區域 */}
          <Box>
            <Group gap="sm" mb="lg">
              <Avatar
                size={50}
                radius="xl"
                styles={{
                  root: {
                    background: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                🎓
              </Avatar>
              <div>
                <Text size="lg" fw={700} c="white">
                  光電系友會
                </Text>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                  Alumni Platform
                </Text>
              </div>
            </Group>

            {/* 用戶資訊卡片 */}
            <Box
              p="md"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Group gap="sm">
                <Avatar color="white" size="md" radius="xl">
                  {userName.charAt(0)}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={600} c="white" lineClamp={1}>
                    {userName}
                  </Text>
                  <Badge size="xs" color="rgba(255, 255, 255, 0.3)" variant="filled">
                    {user?.role === 'admin' ? '管理員' : '系友'}
                  </Badge>
                </div>
              </Group>
            </Box>
          </Box>

          {/* 導航菜單 */}
          <Stack gap={4} style={{ flex: 1 }}>
            {filteredNavItems.map((item) => (
              <UnstyledButton
                key={item.path}
                onClick={() => router.push(item.path)}
                p="sm"
                style={{
                  borderRadius: '8px',
                  background: pathname === item.path 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : 'transparent',
                  transition: 'all 0.2s',
                  border: pathname === item.path 
                    ? '2px solid rgba(255, 255, 255, 0.4)'
                    : '2px solid transparent',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.15)',
                    },
                  },
                }}
              >
                <Group gap="sm">
                  <Box c="white">{item.icon}</Box>
                  <Text size="sm" fw={pathname === item.path ? 600 : 400} c="white" style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge size="sm" color="red" variant="filled" circle>
                      {item.badge}
                    </Badge>
                  )}
                </Group>
              </UnstyledButton>
            ))}
          </Stack>

          {/* 登出按鈕 */}
          <UnstyledButton
            onClick={handleLogout}
            p="sm"
            style={{
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            styles={{
              root: {
                '&:hover': {
                  background: 'rgba(255, 100, 100, 0.3)',
                },
              },
            }}
          >
            <Group gap="sm">
              <IconLogout size={20} color="white" />
              <Text size="sm" c="white">
                登出
              </Text>
            </Group>
          </UnstyledButton>
        </Stack>
      </AppShell.Navbar>

      {/* 主要內容區域 */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

