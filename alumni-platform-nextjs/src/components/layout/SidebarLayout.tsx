'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Box,
  Avatar,
  Menu,
  UnstyledButton,
  rem,
  ThemeIcon,
  ScrollArea,
  ActionIcon,
  Indicator,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHome,
  IconBriefcase,
  IconCalendarEvent,
  IconBell,
  IconMessage,
  IconSettings,
  IconLogout,
  IconUser,
  IconUsers,
  IconSchool,
  IconShieldLock,
  IconChevronRight,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth, getUser, getToken } from '@/lib/auth';
import { notifications } from '@mantine/notifications';
import { api } from '@/lib/api';
import Image from 'next/image';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);
  const prevCountRef = useRef(0);

  // 載入未讀通知計數
  const loadUnreadNotificationCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.notifications.getUnreadCount(token);
      setUnreadNotificationCount(response.unread_count || 0);
    } catch (error) {
      // 靜默失敗
    }
  };

  // 載入未讀訊息計數
  const loadUnreadMessageCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.messages.getUnreadCount(token);
      setUnreadMessageCount(response.unread_count || 0);
    } catch (error) {
      // 靜默失敗
    }
  };

  // 載入用戶資料的函數
  const loadUserData = () => {
    const userData = getUser();
    setUser(userData);
  };

  useEffect(() => {
    setMounted(true);
    // 初始載入用戶資訊
    loadUserData();
    // 載入未讀通知計數
    loadUnreadNotificationCount();
    // 載入未讀訊息計數
    loadUnreadMessageCount();

    // 監聯用戶資料更新事件
    const handleUserUpdated = () => {
      loadUserData();
    };

    window.addEventListener('user-updated', handleUserUpdated);

    // 定期刷新通知計數（每30秒）
    const notificationInterval = setInterval(loadUnreadNotificationCount, 30000);
    // 定期刷新訊息計數（每30秒）
    const messageInterval = setInterval(loadUnreadMessageCount, 30000);

    // 清理監聽器
    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
      clearInterval(notificationInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    notifications.show({
      title: '已登出',
      message: '您已成功登出系統',
      color: 'blue',
    });
    router.push('/auth/login');
  };

  // 鈴鐺搖晃動畫 — 當未讀數增加時觸發
  useEffect(() => {
    if (unreadNotificationCount > 0 && unreadNotificationCount > prevCountRef.current) {
      const icon = bellRef.current?.querySelector('svg');
      if (icon) {
        icon.classList.remove('bell-notify');
        void (icon as unknown as HTMLElement).offsetWidth; // force reflow
        icon.classList.add('bell-notify');
        const tid = setTimeout(() => icon.classList.remove('bell-notify'), 600);
        return () => clearTimeout(tid);
      }
    }
    prevCountRef.current = unreadNotificationCount;
  }, [unreadNotificationCount]);

  // 行動版底部導航項目
  const bottomNavItems = [
    { label: '首頁', icon: IconHome, link: '/' },
    { label: '職缺', icon: IconBriefcase, link: '/jobs' },
    { label: '訊息', icon: IconMessage, link: '/messages', badge: unreadMessageCount },
    { label: '通知', icon: IconBell, link: '/notifications', badge: unreadNotificationCount },
  ];

  // 導航項目配置 - 分組結構
  const navGroups = [
    {
      groupLabel: '總覽',
      items: [
        { label: '首頁總覽', icon: IconHome, link: '/', color: 'blue' },
      ],
    },
    {
      groupLabel: '探索',
      items: [
        { label: '系友通訊錄', icon: IconUsers, link: '/directory', color: 'indigo' },
        { label: '職缺機會', icon: IconBriefcase, link: '/jobs', color: 'teal' },
        { label: '活動聚會', icon: IconCalendarEvent, link: '/events', color: 'orange' },
        { label: '校園公告', icon: IconBell, link: '/bulletins', color: 'grape' },
      ],
    },
    {
      groupLabel: '社交',
      items: [
        { label: '系友動態', icon: IconSchool, link: '/cms', color: 'pink' },
        { label: '訊息中心', icon: IconMessage, link: '/messages', color: 'cyan' },
      ],
    },
  ];

  // 管理員專屬群組
  if (user?.role === 'admin') {
    navGroups.push({
      groupLabel: '管理',
      items: [
        { label: '管理後台', icon: IconShieldLock, link: '/admin', color: 'red' },
      ],
    });
  }

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        root: {
          backgroundColor: 'transparent',
        },
        main: {
          backgroundColor: 'transparent', // 讓背景圖透出來
        },
      }}
    >
      {/* Header: 實色背景 */}
      <AppShell.Header 
        style={{ 
          borderBottom: 'none', 
          zIndex: 101,
          backgroundColor: 'var(--mantine-color-body)',
          backdropFilter: 'none',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="sm" align="center" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              {/* 系友會 Logo */}
              <Box style={{ width: 56, height: 56, position: 'relative' }}>
                <Image
                  src="/logo-cit.png"
                  alt="NTUST-CIT Alumni Association"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Box>
              <Box visibleFrom="sm">
                <Text 
                  size="lg" 
                  fw={800} 
                  style={{ 
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #0052D4 0%, #4facfe 50%, #00c6ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  色彩與照明科技研究所系友會
                </Text>
                <Text size="xs" c="dimmed" fw={500} mt={-4}>NTUST-CIT Alumni Association</Text>
              </Box>
            </Group>
          </Group>

          <Group gap="md">
            {/* 通知鈴鐺按鈕 */}
            <Tooltip label="通知中心" position="bottom">
              <Indicator 
                color="red" 
                size={18} 
                label={unreadNotificationCount > 99 ? '99+' : unreadNotificationCount} 
                disabled={unreadNotificationCount === 0}
                offset={4}
              >
                <ActionIcon
                  ref={bellRef}
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="xl"
                  onClick={() => router.push('/notifications')}
                >
                  <IconBell size={22} />
                </ActionIcon>
              </Indicator>
            </Tooltip>

            <Menu shadow="md" width={200} transitionProps={{ transition: 'pop-top-right' }} radius="md">
              <Menu.Target>
                <UnstyledButton className="sidebar-nav-item" p={4} px={8} style={{ borderRadius: '30px' }}>
                  <Group gap={8}>
                    {mounted ? (
                      <>
                        <Avatar 
                          src={user?.profile?.avatar_url || user?.avatar_url} 
                          radius="xl" 
                          size="md" 
                          color="blue"
                          className="shadow-sm"
                        >
                          {user?.profile?.display_name?.[0] || user?.profile?.full_name?.[0] || user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box visibleFrom="xs" mr={4}>
                          <Text size="sm" fw={600} lineClamp={1}>
                            {user?.profile?.display_name || user?.profile?.full_name || user?.full_name || '使用者'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {user?.role === 'admin' ? '系統管理員' : '系友會員'}
                          </Text>
                        </Box>
                      </>
                    ) : (
                      <Group gap={8}>
                         <Avatar radius="xl" size="md" color="gray" />
                         <Box visibleFrom="xs" mr={4} style={{ width: 80, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
                      </Group>
                    )}
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown style={{ border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <Menu.Label>帳號設定</Menu.Label>
                <Menu.Item 
                  leftSection={<IconUser size={16} />} 
                  onClick={() => router.push('/profile')}
                >
                  個人資料
                </Menu.Item>
                <Menu.Item 
                  leftSection={<IconSettings size={16} />} 
                  onClick={() => router.push('/settings')}
                >
                  系統設定
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  color="red" 
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                >
                  登出
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Navbar: 懸浮感側邊欄 */}
      <AppShell.Navbar 
        p="md" 
        className="glass-panel"
        style={{ 
          borderRight: 'none',
          margin: '16px 0 16px 16px', // 懸浮效果
          height: 'calc(100vh - 102px)', // 調整高度
          borderRadius: '16px',
          display: opened ? 'block' : undefined
        }}
      >
        <ScrollArea h="100%">
          <Box mb="md">
            {navGroups.map((group, groupIndex) => (
              <Box key={group.groupLabel} mt={groupIndex > 0 ? 'md' : 0}>
                <Text
                  size="xs"
                  fw={700}
                  c="dimmed"
                  mb={6}
                  px="xs"
                  tt="uppercase"
                  style={{ letterSpacing: '1px', fontSize: '0.65rem' }}
                >
                  {group.groupLabel}
                </Text>
                {group.items.map((item) => {
                  const isActive = pathname === item.link || (item.link !== '/' && pathname?.startsWith(`${item.link}/`));
                  return (
                    <NavLink
                      key={item.label}
                      label={
                        <Text size="sm" fw={isActive ? 700 : 500} c={isActive ? 'dark' : 'dimmed'}>
                          {item.label}
                        </Text>
                      }
                      leftSection={
                        <ThemeIcon
                          variant={isActive ? 'gradient' : 'light'}
                          gradient={isActive ? { from: item.color, to: 'cyan', deg: 135 } : undefined}
                          color={item.color}
                          size="md"
                          radius="md"
                        >
                          <item.icon size={18} stroke={2} />
                        </ThemeIcon>
                      }
                      rightSection={
                        isActive && <IconChevronRight size={14} style={{ opacity: 0.5 }} />
                      }
                      onClick={() => {
                        router.push(item.link);
                        toggle();
                      }}
                      active={isActive}
                      className="sidebar-nav-item"
                      mb={4}
                      py={10}
                    />
                  );
                })}
              </Box>
            ))}
          </Box>

          <Box mt="xl">
            <Text size="xs" fw={700} c="dimmed" mb="xs" px="xs" tt="uppercase" style={{ letterSpacing: '1px' }}>
              Quick Access
            </Text>
            <NavLink
              label="發布新職缺"
              leftSection={<IconBriefcase size={16} />}
              onClick={() => router.push('/jobs/create')}
              className="sidebar-nav-item"
              mb={4}
              style={{ opacity: 0.8 }}
            />
            <NavLink
              label="發布文章"
              leftSection={<IconSchool size={16} />}
              onClick={() => router.push('/cms/create')}
              className="sidebar-nav-item"
              mb={4}
              style={{ opacity: 0.8 }}
            />
          </Box>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main className="dashboard-main">
        <Box
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 100px)',
            position: 'relative'
          }}
          pb={{ base: 70, sm: 0 }}
        >
          {children}
        </Box>
      </AppShell.Main>

      {/* 行動版底部導航列 */}
      <Box
        hiddenFrom="sm"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.link || (item.link !== '/' && pathname?.startsWith(`${item.link}/`));
          return (
            <UnstyledButton
              key={item.link}
              onClick={() => router.push(item.link)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                flex: 1,
                height: '100%',
                position: 'relative',
                transition: 'color 0.2s ease',
              }}
            >
              <Box style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.badge && item.badge > 0 ? (
                  <Indicator
                    color="red"
                    size={16}
                    label={item.badge > 99 ? '99+' : item.badge}
                    offset={2}
                  >
                    <item.icon
                      size={24}
                      stroke={isActive ? 2.5 : 1.8}
                      color={isActive ? 'var(--mantine-color-indigo-6)' : 'var(--mantine-color-gray-5)'}
                      fill={isActive ? 'var(--mantine-color-indigo-1)' : 'none'}
                    />
                  </Indicator>
                ) : (
                  <item.icon
                    size={24}
                    stroke={isActive ? 2.5 : 1.8}
                    color={isActive ? 'var(--mantine-color-indigo-6)' : 'var(--mantine-color-gray-5)'}
                    fill={isActive ? 'var(--mantine-color-indigo-1)' : 'none'}
                  />
                )}
              </Box>
              <Text
                size="xs"
                fw={isActive ? 700 : 500}
                c={isActive ? 'indigo.6' : 'gray.5'}
                style={{ fontSize: '0.65rem', lineHeight: 1 }}
              >
                {item.label}
              </Text>
              {isActive && (
                <Box
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, var(--mantine-color-indigo-5), var(--mantine-color-cyan-5))',
                  }}
                />
              )}
            </UnstyledButton>
          );
        })}
      </Box>
    </AppShell>
  );
}
