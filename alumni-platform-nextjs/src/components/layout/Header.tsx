'use client';

import { useState } from 'react';
import {
  AppShell,
  Group,
  Button,
  Menu,
  Text,
  Avatar,
  Burger,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth, isAuthenticated } from '@/lib/auth';

export function Header() {
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure();
  const user = isAuthenticated() ? getUser() : null;

  const handleLogout = () => {
    clearAuth();
    router.push('/');
    router.refresh();
  };

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Text
            size="xl"
            fw={700}
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/')}
          >
            🎓 校友平台
          </Text>
        </Group>

        <Group>
          {user ? (
            <>
              <Button
                variant="subtle"
                onClick={() => router.push('/jobs')}
              >
                職缺
              </Button>
              <Button
                variant="subtle"
                onClick={() => router.push('/events')}
              >
                活動
              </Button>
              <Button
                variant="subtle"
                onClick={() => router.push('/bulletins')}
              >
                公告
              </Button>
              <Button
                variant="subtle"
                onClick={() => router.push('/messages')}
              >
                訊息
              </Button>

              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Avatar
                    style={{ cursor: 'pointer' }}
                    radius="xl"
                    color="blue"
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>{user.name}</Menu.Label>
                  <Menu.Item onClick={() => router.push('/profile')}>
                    個人資料
                  </Menu.Item>
                  <Menu.Item onClick={() => router.push('/settings')}>
                    設定
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={handleLogout}>
                    登出
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          ) : (
            <>
              <Button
                variant="default"
                onClick={() => router.push('/auth/login')}
              >
                登入
              </Button>
              <Button
                onClick={() => router.push('/auth/register')}
              >
                註冊
              </Button>
            </>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
}

