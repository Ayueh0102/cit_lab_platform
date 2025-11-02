'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Switch,
  Select,
  PasswordInput,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconLock,
  IconBell,
  IconLanguage,
  IconPalette,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) =>
        value.length >= 6 ? null : '密碼至少需要 6 個字符',
      newPassword: (value) =>
        value.length >= 6 ? null : '密碼至少需要 6 個字符',
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : '密碼不一致',
    },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    eventReminders: true,
    messageNotifications: true,
  });

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.settings.getNotificationPreferences(token);
      if (response?.preferences) {
        setNotificationSettings(response.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const handlePasswordChange = async (values: typeof passwordForm.values) => {
    setLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.settings.changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      }, token);
      
      notifications.show({
        title: '密碼已更新',
        message: '您的密碼已成功更新',
        color: 'green',
      });
      
      passwordForm.reset();
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '無法更新密碼',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const updatedSettings = {
        ...notificationSettings,
        [key]: value,
      };
      
      await api.settings.updateNotificationPreferences(updatedSettings, token);
      
      setNotificationSettings(updatedSettings);
      
      notifications.show({
        title: '設定已更新',
        message: '通知設定已成功更新',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '無法更新設定',
        color: 'red',
      });
    }
  };

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="md" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                設定
              </Title>
              <Text c="dimmed">
                管理您的帳號設定和偏好
              </Text>
            </div>

            {/* 密碼設定 */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <IconLock size={20} />
                  <Title order={3} size="h4">
                    變更密碼
                  </Title>
                </Group>
                <Text size="sm" c="dimmed">
                  定期更新您的密碼以保護帳號安全
                </Text>

                <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
                  <Stack gap="md">
                    <PasswordInput
                      label="目前密碼"
                      placeholder="輸入目前密碼"
                      required
                      {...passwordForm.getInputProps('currentPassword')}
                      key={passwordForm.key('currentPassword')}
                    />
                    <PasswordInput
                      label="新密碼"
                      placeholder="輸入新密碼"
                      required
                      {...passwordForm.getInputProps('newPassword')}
                      key={passwordForm.key('newPassword')}
                    />
                    <PasswordInput
                      label="確認新密碼"
                      placeholder="再次輸入新密碼"
                      required
                      {...passwordForm.getInputProps('confirmPassword')}
                      key={passwordForm.key('confirmPassword')}
                    />
                    <Group justify="flex-end">
                      <Button type="submit" loading={loading}>
                        更新密碼
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Stack>
            </Paper>

            {/* 通知設定 */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <IconBell size={20} />
                  <Title order={3} size="h4">
                    通知設定
                  </Title>
                </Group>
                <Text size="sm" c="dimmed">
                  管理您接收通知的方式
                </Text>

                <Stack gap="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>電子郵件通知</Text>
                      <Text size="sm" c="dimmed">
                        接收重要通知的電子郵件
                      </Text>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(event) =>
                        handleNotificationChange(
                          'emailNotifications',
                          event.currentTarget.checked
                        )
                      }
                    />
                  </Group>

                  <Divider />

                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>職缺提醒</Text>
                      <Text size="sm" c="dimmed">
                        當有符合您條件的新職缺時通知您
                      </Text>
                    </div>
                    <Switch
                      checked={notificationSettings.jobAlerts}
                      onChange={(event) =>
                        handleNotificationChange(
                          'jobAlerts',
                          event.currentTarget.checked
                        )
                      }
                    />
                  </Group>

                  <Divider />

                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>活動提醒</Text>
                      <Text size="sm" c="dimmed">
                        在活動開始前提醒您
                      </Text>
                    </div>
                    <Switch
                      checked={notificationSettings.eventReminders}
                      onChange={(event) =>
                        handleNotificationChange(
                          'eventReminders',
                          event.currentTarget.checked
                        )
                      }
                    />
                  </Group>

                  <Divider />

                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>訊息通知</Text>
                      <Text size="sm" c="dimmed">
                        當有新訊息時通知您
                      </Text>
                    </div>
                    <Switch
                      checked={notificationSettings.messageNotifications}
                      onChange={(event) =>
                        handleNotificationChange(
                          'messageNotifications',
                          event.currentTarget.checked
                        )
                      }
                    />
                  </Group>
                </Stack>
              </Stack>
            </Paper>

            {/* 顯示設定 */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <IconPalette size={20} />
                  <Title order={3} size="h4">
                    顯示設定
                  </Title>
                </Group>

                <Select
                  label="主題"
                  placeholder="選擇主題"
                  data={[
                    { value: 'light', label: '淺色模式' },
                    { value: 'dark', label: '深色模式' },
                    { value: 'auto', label: '自動' },
                  ]}
                  defaultValue="light"
                  leftSection={<IconPalette size={16} />}
                />

                <Select
                  label="語言"
                  placeholder="選擇語言"
                  data={[
                    { value: 'zh-TW', label: '繁體中文' },
                    { value: 'zh-CN', label: '簡體中文' },
                    { value: 'en', label: 'English' },
                  ]}
                  defaultValue="zh-TW"
                  leftSection={<IconLanguage size={16} />}
                />
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}



