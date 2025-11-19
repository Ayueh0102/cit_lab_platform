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
  Drawer,
  Burger,
  Header,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
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
  IconMenu2,
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
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
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

  // 使用 WebSocket 即時更新通知數量（連接失敗不影響功能）
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

  const handleNavClick = (path: string) => {
    router.push(path);
    if (isMobile || isTablet) {
      closeDrawer();
    }
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
    { icon: <IconFileText size={20} />, label: '系友動態', path: '/cms' },
  ];

  // 過濾掉僅管理員可見的項目
  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  // 導航內容組件（可重用於側邊欄和 Drawer）
  const NavContent = ({ showLogo = true }: { showLogo?: boolean }) => (
    <Stack gap="md" h="100%" p="md">
      {/* Logo 區域 - 僅在桌面端側邊欄顯示 */}
      {showLogo && !isMobile && !isTablet && (
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
                色彩所系友會
                </Text>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                CIT
                </Text>
              </div>
            </Group>
        </Box>
      )}

            {/* 用戶資訊卡片 */}
            <Box
        p={isMobile ? "sm" : "md"}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Group gap="sm">
          <Avatar color="white" size={isMobile ? "sm" : "md"} radius="xl">
                  {userName.charAt(0)}
                </Avatar>
                <div style={{ flex: 1 }}>
            <Text size={isMobile ? "xs" : "sm"} fw={600} c="white" lineClamp={1}>
                    {userName}
                  </Text>
                  <Badge size="xs" color="rgba(255, 255, 255, 0.3)" variant="filled">
                    {user?.role === 'admin' ? '管理員' : '系友'}
                  </Badge>
                </div>
              </Group>
          </Box>

          {/* 導航菜單 */}
          <Stack gap={4} style={{ flex: 1 }}>
            {filteredNavItems.map((item) => (
              <UnstyledButton
                key={item.path}
            onClick={() => handleNavClick(item.path)}
            p={isMobile ? "xs" : "sm"}
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
              <Text size={isMobile ? "xs" : "sm"} fw={pathname === item.path ? 600 : 400} c="white" style={{ flex: 1 }}>
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
        p={isMobile ? "xs" : "sm"}
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
          <IconLogout size={isMobile ? 18 : 20} color="white" />
          <Text size={isMobile ? "xs" : "sm"} c="white">
                登出
              </Text>
            </Group>
          </UnstyledButton>
        </Stack>
  );

  // 避免 hydration 錯誤 - 等待客戶端掛載
  if (!mounted) {
    return (
      <AppShell
        padding={isMobile ? "xs" : "md"}
        navbar={!isMobile && !isTablet ? {
          width: 280,
          breakpoint: 'sm',
        } : undefined}
        header={isMobile || isTablet ? {
          height: 60,
        } : undefined}
        styles={{
          navbar: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          header: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          main: {
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
          },
        }}
      >
        {isMobile || isTablet ? (
          <AppShell.Header p="md">
            <Group justify="space-between" h="100%">
              <Group gap="sm">
                <Avatar size={32} radius="xl">🎓</Avatar>
                <Text size="sm" fw={700} c="white">色彩所系友會</Text>
              </Group>
              <Loader color="white" size="sm" />
            </Group>
          </AppShell.Header>
        ) : (
          <AppShell.Navbar p="md">
            <Center h="100%">
              <Loader color="white" />
            </Center>
          </AppShell.Navbar>
        )}
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        padding={isMobile ? "xs" : "md"}
        navbar={!isMobile && !isTablet ? {
          width: 280,
          breakpoint: 'sm',
        } : undefined}
        header={isMobile || isTablet ? {
          height: 60,
        } : undefined}
        styles={{
          navbar: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          header: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: 'none',
          },
          main: {
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
          },
        }}
      >
        {/* 移動端/平板端 Header */}
        {(isMobile || isTablet) && (
          <AppShell.Header p="md">
            <Group justify="space-between" h="100%">
              <Group gap="sm">
                <Avatar 
                  size={32} 
                  radius="xl"
                  styles={{
                    root: {
                      background: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  🎓
                </Avatar>
                <div>
                  <Text size="sm" fw={700} c="white">
                    色彩所系友會
                  </Text>
                  <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                    CIT
                  </Text>
                </div>
              </Group>
              <Group gap="xs">
                {unreadCount > 0 && (
                  <Badge size="sm" color="red" variant="filled" circle>
                    {unreadCount}
                  </Badge>
                )}
                <Burger
                  opened={drawerOpened}
                  onClick={toggleDrawer}
                  color="white"
                  size="sm"
                />
              </Group>
            </Group>
          </AppShell.Header>
        )}

        {/* 桌面端側邊欄 */}
        {!isMobile && !isTablet && (
          <AppShell.Navbar p="md">
            <NavContent showLogo={true} />
      </AppShell.Navbar>
        )}

      {/* 主要內容區域 */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>

      {/* 移動端/平板端 Drawer */}
      {(isMobile || isTablet) && (
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          position="right"
          size={isMobile ? "280px" : "300px"}
          padding="md"
          title={
            <Group gap="sm">
              <Avatar
                size={32}
                radius="xl"
                styles={{
                  root: {
                    background: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                🎓
              </Avatar>
              <div>
                <Text size="sm" fw={700} c="white">
                  色彩所系友會
                </Text>
                <Text size="xs" c="white" style={{ opacity: 0.9 }}>
                  CIT
                </Text>
              </div>
            </Group>
          }
          styles={{
            header: {
              background: 'transparent',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              marginBottom: '0.5rem',
            },
            title: {
              color: 'white',
            },
            closeButton: {
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            },
            body: {
              padding: '0.5rem 0',
            },
            content: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            },
          }}
        >
          <NavContent showLogo={false} />
        </Drawer>
      )}
    </>
  );
}

