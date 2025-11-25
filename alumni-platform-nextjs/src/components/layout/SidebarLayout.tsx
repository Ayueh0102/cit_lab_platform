'use client';

import { useState, useEffect } from 'react';
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
import { clearAuth, getUser } from '@/lib/auth';
import { notifications } from '@mantine/notifications';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 僅在客戶端獲取用戶資訊
    const userData = getUser();
    setUser(userData);
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

  // 導航項目配置 - 增加顏色標識
  const navItems = [
    { label: '首頁總覽', icon: IconHome, link: '/', color: 'blue' },
    { label: '系友通訊錄', icon: IconUsers, link: '/directory', color: 'indigo' },
    { label: '職缺機會', icon: IconBriefcase, link: '/jobs', color: 'teal' },
    { label: '活動聚會', icon: IconCalendarEvent, link: '/events', color: 'orange' },
    { label: '校園公告', icon: IconBell, link: '/bulletins', color: 'grape' },
    { label: '系友動態', icon: IconSchool, link: '/cms', color: 'pink' },
    { label: '訊息中心', icon: IconMessage, link: '/messages', color: 'cyan' },
  ];

  // 管理員專屬項目
  if (user?.role === 'admin') {
    navItems.push({ label: '管理後台', icon: IconShieldLock, link: '/admin', color: 'red' });
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
            <Group gap="xs" align="center" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
              <ThemeIcon 
                size="lg" 
                radius="md" 
                className="gradient-light"
                style={{ border: 'none' }}
              >
                <IconSchool size={22} color="white" />
              </ThemeIcon>
              <Box visibleFrom="xs">
                <Text 
                  size="lg" 
                  fw={800} 
                  className="text-gradient-light"
                  style={{ letterSpacing: '-0.5px' }}
                >
                  台科色彩所系友會平台
                </Text>
                <Text size="xs" c="dimmed" fw={500} mt={-4}>校友互動平台</Text>
              </Box>
            </Group>
          </Group>

          <Group>
            <Menu shadow="md" width={200} transitionProps={{ transition: 'pop-top-right' }} radius="md">
              <Menu.Target>
                <UnstyledButton className="sidebar-nav-item" p={4} px={8} style={{ borderRadius: '30px' }}>
                  <Group gap={8}>
                    {mounted ? (
                      <>
                        <Avatar 
                          src={user?.avatar_url} 
                          radius="xl" 
                          size="md" 
                          color="blue"
                          className="shadow-sm"
                        >
                          {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box visibleFrom="xs" mr={4}>
                          <Text size="sm" fw={600} lineClamp={1}>
                            {user?.full_name || '使用者'}
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
            <Text size="xs" fw={700} c="dimmed" mb="xs" px="xs" tt="uppercase" style={{ letterSpacing: '1px' }}>
              Main Menu
            </Text>
            {navItems.map((item) => {
              const isActive = pathname === item.link || pathname?.startsWith(`${item.link}/`);
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
        >
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
