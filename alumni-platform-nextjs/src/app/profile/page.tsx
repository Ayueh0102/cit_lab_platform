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
  Avatar,
  Badge,
  TextInput,
  Textarea,
  Select,
  Grid,
  Card,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconBriefcase,
  IconSchool,
  IconMapPin,
  IconPhone,
  IconMail,
  IconBrandLinkedin,
  IconBrandGithub,
  IconWorld,
  IconEdit,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUser, getToken, setAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface UserProfile {
  full_name: string;
  display_name: string;
  email: string;
  phone?: string;
  graduation_year?: number;
  current_company?: string;
  current_position?: string;
  bio?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  personal_website?: string;
  skills?: string[];
}

interface User {
  id: number;
  email: string;
  role: string;
  profile?: UserProfile;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<UserProfile>({
    initialValues: {
      full_name: '',
      display_name: '',
      email: '',
      phone: '',
      graduation_year: undefined,
      current_company: '',
      current_position: '',
      bio: '',
      location: '',
      linkedin_url: '',
      github_url: '',
      personal_website: '',
      skills: [],
    },
  });

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = () => {
    try {
      const userData = getUser();
      setUser(userData);
      
      if (userData?.profile) {
        form.setValues({
          full_name: userData.profile.full_name || '',
          display_name: userData.profile.display_name || '',
          email: userData.email || '',
          phone: userData.profile.phone || '',
          graduation_year: userData.profile.graduation_year,
          current_company: userData.profile.current_company || '',
          current_position: userData.profile.current_position || '',
          bio: userData.profile.bio || '',
          location: userData.profile.location || '',
          linkedin_url: userData.profile.linkedin_url || '',
          github_url: userData.profile.github_url || '',
          personal_website: userData.profile.personal_website || '',
          skills: userData.profile.skills || [],
        });
      }
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入個人資料',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: UserProfile) => {
    try {
      setSaving(true);
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能更新個人資料',
          color: 'orange',
        });
        return;
      }

      const updateData: any = {
        full_name: values.full_name?.trim(),
        display_name: values.display_name?.trim(),
        phone: values.phone?.trim() || undefined,
        graduation_year: values.graduation_year || undefined,
        current_company: values.current_company?.trim() || undefined,
        current_position: values.current_position?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
        location: values.location?.trim() || undefined,
        linkedin_url: values.linkedin_url?.trim() || undefined,
        github_url: values.github_url?.trim() || undefined,
        personal_website: values.personal_website?.trim() || undefined,
      };

      await api.profile.update(updateData, token);

      // 更新本地用戶資料
      const userData = getUser();
      if (userData) {
        const updatedUser = {
          ...userData,
          profile: {
            ...userData.profile,
            ...updateData,
          },
        };
        setAuth(token, updatedUser);
        setUser(updatedUser);
      }

      notifications.show({
        title: '儲存成功',
        message: '您的個人資料已更新',
        color: 'green',
      });
      
      setEditing(false);
    } catch (error) {
      notifications.show({
        title: '儲存失敗',
        message: error instanceof Error ? error.message : '無法更新個人資料',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfile();
    setEditing(false);
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

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <Group justify="space-between">
              <div>
                <Title order={1} mb="xs">
                  個人資料
                </Title>
                <Text c="dimmed">
                  管理您的個人資訊和職涯資料
                </Text>
              </div>
              {!editing ? (
                <Button
                  leftSection={<IconEdit size={16} />}
                  onClick={() => setEditing(true)}
                >
                  編輯資料
                </Button>
              ) : (
                <Group>
                  <Button
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    取消
                  </Button>
                  <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={() => form.onSubmit(handleSave)()}
                    loading={saving}
                  >
                    儲存
                  </Button>
                </Group>
              )}
            </Group>

            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="xl">
                <Group>
                  <Avatar size={100} radius="xl" color="blue">
                    {form.values.display_name?.charAt(0) || form.values.full_name?.charAt(0) || 'U'}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Title order={2}>
                        {form.values.display_name || form.values.full_name || '未設定'}
                      </Title>
                      <Badge color={user?.role === 'admin' ? 'red' : 'blue'}>
                        {user?.role === 'admin' ? '管理員' : '系友'}
                      </Badge>
                    </Group>
                    {form.values.current_position && (
                      <Text size="lg" c="dimmed">
                        {form.values.current_position}
                        {form.values.current_company && ` @ ${form.values.current_company}`}
                      </Text>
                    )}
                  </div>
                </Group>

                <Divider />

                <form onSubmit={form.onSubmit(handleSave)}>
                  <Stack gap="md">
                    <Title order={3} size="h4">
                      基本資訊
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="全名"
                          placeholder="您的全名"
                          disabled={!editing}
                          {...form.getInputProps('full_name')}
                          key={form.key('full_name')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="顯示名稱"
                          placeholder="您想要顯示的名稱"
                          disabled={!editing}
                          {...form.getInputProps('display_name')}
                          key={form.key('display_name')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="電子郵件"
                          placeholder="your@email.com"
                          disabled
                          leftSection={<IconMail size={16} />}
                          {...form.getInputProps('email')}
                          key={form.key('email')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="電話"
                          placeholder="+886 912 345 678"
                          disabled={!editing}
                          leftSection={<IconPhone size={16} />}
                          {...form.getInputProps('phone')}
                          key={form.key('phone')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="畢業年份"
                          placeholder="選擇畢業年份"
                          data={graduationYears}
                          disabled={!editing}
                          leftSection={<IconSchool size={16} />}
                          {...form.getInputProps('graduation_year')}
                          key={form.key('graduation_year')}
                          value={form.values.graduation_year?.toString()}
                          onChange={(value) => form.setFieldValue('graduation_year', value ? parseInt(value) : undefined)}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="所在地"
                          placeholder="台北市"
                          disabled={!editing}
                          leftSection={<IconMapPin size={16} />}
                          {...form.getInputProps('location')}
                          key={form.key('location')}
                        />
                      </Grid.Col>
                    </Grid>

                    <Divider mt="md" />

                    <Title order={3} size="h4">
                      職涯資訊
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="目前公司"
                          placeholder="公司名稱"
                          disabled={!editing}
                          leftSection={<IconBriefcase size={16} />}
                          {...form.getInputProps('current_company')}
                          key={form.key('current_company')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="目前職位"
                          placeholder="職位名稱"
                          disabled={!editing}
                          leftSection={<IconBriefcase size={16} />}
                          {...form.getInputProps('current_position')}
                          key={form.key('current_position')}
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Textarea
                          label="個人簡介"
                          placeholder="簡單介紹一下您自己..."
                          minRows={4}
                          disabled={!editing}
                          {...form.getInputProps('bio')}
                          key={form.key('bio')}
                        />
                      </Grid.Col>
                    </Grid>

                    <Divider mt="md" />

                    <Title order={3} size="h4">
                      社交連結
                    </Title>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <TextInput
                          label="LinkedIn"
                          placeholder="https://linkedin.com/in/..."
                          disabled={!editing}
                          leftSection={<IconBrandLinkedin size={16} />}
                          {...form.getInputProps('linkedin_url')}
                          key={form.key('linkedin_url')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <TextInput
                          label="GitHub"
                          placeholder="https://github.com/..."
                          disabled={!editing}
                          leftSection={<IconBrandGithub size={16} />}
                          {...form.getInputProps('github_url')}
                          key={form.key('github_url')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <TextInput
                          label="個人網站"
                          placeholder="https://..."
                          disabled={!editing}
                          leftSection={<IconWorld size={16} />}
                          {...form.getInputProps('personal_website')}
                          key={form.key('personal_website')}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </form>
              </Stack>
            </Paper>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={3} size="h4">
                  統計資訊
                </Title>
                <Grid>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Stack gap={4} align="center">
                      <Text size="xl" fw={700}>
                        0
                      </Text>
                      <Text size="sm" c="dimmed">
                        發布職缺
                      </Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Stack gap={4} align="center">
                      <Text size="xl" fw={700}>
                        0
                      </Text>
                      <Text size="sm" c="dimmed">
                        參加活動
                      </Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Stack gap={4} align="center">
                      <Text size="xl" fw={700}>
                        0
                      </Text>
                      <Text size="sm" c="dimmed">
                        職缺申請
                      </Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, md: 3 }}>
                    <Stack gap={4} align="center">
                      <Text size="xl" fw={700}>
                        0
                      </Text>
                      <Text size="sm" c="dimmed">
                        發布公告
                      </Text>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}


