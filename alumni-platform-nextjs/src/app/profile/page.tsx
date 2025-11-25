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
  Tabs,
  ActionIcon,
  Modal,
  NumberInput,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { DateInput } from '@mantine/dates';
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
  IconPlus,
  IconTrash,
  IconUser,
  IconCertificate,
  IconBuilding,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUser, getToken, setAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserProfile {
  full_name: string;
  display_name: string;
  email: string;
  phone?: string;
  graduation_year?: number;
  class_year?: number;
  degree?: string;
  major?: string;
  student_id?: string;
  thesis_title?: string;
  advisor_1?: string;
  advisor_2?: string;
  current_company?: string;
  current_position?: string;
  bio?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  personal_website?: string;
  skills?: string[];
}

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  department?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

interface Education {
  id: number;
  school: string;
  degree: string;
  major?: string;
  start_year: number;
  end_year?: number;
  is_current: boolean;
  description?: string;
  advisor_1?: string;
  advisor_2?: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  profile?: UserProfile;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('basic');
  
  // 工作經歷
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [workModalOpened, { open: openWorkModal, close: closeWorkModal }] = useDisclosure(false);
  const [editingWork, setEditingWork] = useState<WorkExperience | null>(null);
  
  // 教育背景
  const [educations, setEducations] = useState<Education[]>([]);
  const [eduModalOpened, { open: openEduModal, close: closeEduModal }] = useDisclosure(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);

  const form = useForm<UserProfile>({
    initialValues: {
      full_name: '',
      display_name: '',
      email: '',
      phone: '',
      graduation_year: undefined,
      class_year: undefined,
      degree: '',
      major: '',
      student_id: '',
      thesis_title: '',
      advisor_1: '',
      advisor_2: '',
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

  const workForm = useForm({
    initialValues: {
      company: '',
      position: '',
      department: '',
      location: '',
      start_date: null as Date | null,
      end_date: null as Date | null,
      is_current: false,
      description: '',
    },
  });

  const eduForm = useForm({
    initialValues: {
      school: '國立臺灣科技大學',
      degree: 'master',
      major: '色彩與照明科技研究所',
      start_year: new Date().getFullYear() - 2,
      end_year: new Date().getFullYear(),
      is_current: false,
      description: '',
      advisor_1: '',
      advisor_2: '',
    },
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await api.auth.getCurrentUser(token);
      const userData = response.user || response;
      if (userData) {
        setAuth(token, userData);
        setUser(userData);
      
        if (userData?.profile) {
          form.setValues({
            full_name: userData.profile.full_name || '',
            display_name: userData.profile.display_name || '',
            email: userData.email || '',
            phone: userData.profile.phone || '',
            graduation_year: userData.profile.graduation_year,
            class_year: userData.profile.class_year,
            degree: userData.profile.degree || '',
            major: userData.profile.major || '',
            student_id: userData.profile.student_id || '',
            thesis_title: userData.profile.thesis_title || '',
            advisor_1: userData.profile.advisor_1 || '',
            advisor_2: userData.profile.advisor_2 || '',
            current_company: userData.profile.current_company || '',
            current_position: userData.profile.current_position || '',
            bio: userData.profile.bio || '',
            location: userData.profile.location || userData.profile.current_location || '',
            linkedin_url: userData.profile.linkedin_url || '',
            github_url: userData.profile.github_url || '',
            personal_website: userData.profile.personal_website || '',
            skills: userData.profile.skills || [],
          });
        }
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
  }, [router, form]);

  const loadWorkExperiences = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await api.career.getWorkExperiences(token);
      setWorkExperiences(response.work_experiences || []);
    } catch (error) {
      console.error('Failed to load work experiences:', error);
    }
  }, []);

  const loadEducations = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await api.career.getEducations(token);
      setEducations(response.educations || []);
    } catch (error) {
      console.error('Failed to load educations:', error);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadWorkExperiences();
    loadEducations();
  }, [loadProfile, loadWorkExperiences, loadEducations]);

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

      const updateData: Record<string, unknown> = {
        full_name: values.full_name?.trim(),
        display_name: values.display_name?.trim(),
        phone: values.phone?.trim() || undefined,
        graduation_year: values.graduation_year || undefined,
        class_year: values.class_year || undefined,
        degree: values.degree?.trim() || undefined,
        major: values.major?.trim() || undefined,
        student_id: values.student_id?.trim() || undefined,
        thesis_title: values.thesis_title?.trim() || undefined,
        advisor_1: values.advisor_1?.trim() || undefined,
        advisor_2: values.advisor_2?.trim() || undefined,
        current_company: values.current_company?.trim() || undefined,
        current_position: values.current_position?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
        location: values.location?.trim() || undefined,
        linkedin_url: values.linkedin_url?.trim() || undefined,
        github_url: values.github_url?.trim() || undefined,
        personal_website: values.personal_website?.trim() || undefined,
      };

      await api.profile.update(updateData, token);

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
      
      await loadProfile();
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

  // 工作經歷相關
  const handleSaveWork = async (values: typeof workForm.values) => {
    try {
      const token = getToken();
      if (!token) return;

      const data = {
        company: values.company,
        position: values.position,
        department: values.department || undefined,
        location: values.location || undefined,
        start_date: values.start_date ? values.start_date.toISOString().split('T')[0] : undefined,
        end_date: values.end_date ? values.end_date.toISOString().split('T')[0] : undefined,
        is_current: values.is_current,
        description: values.description || undefined,
      };

      if (editingWork) {
        await api.career.updateWorkExperience(editingWork.id, data, token);
        notifications.show({ title: '更新成功', message: '工作經歷已更新', color: 'green' });
      } else {
        await api.career.addWorkExperience(data, token);
        notifications.show({ title: '新增成功', message: '工作經歷已新增', color: 'green' });
      }

      closeWorkModal();
      loadWorkExperiences();
      workForm.reset();
      setEditingWork(null);
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法儲存工作經歷',
        color: 'red',
      });
    }
  };

  const handleDeleteWork = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;
      await api.career.deleteWorkExperience(id, token);
      notifications.show({ title: '刪除成功', message: '工作經歷已刪除', color: 'green' });
      loadWorkExperiences();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除工作經歷',
        color: 'red',
      });
    }
  };

  // 教育背景相關
  const handleSaveEdu = async (values: typeof eduForm.values) => {
    try {
      const token = getToken();
      if (!token) return;

      const data = {
        school: values.school,
        degree: values.degree,
        major: values.major || undefined,
        start_year: values.start_year,
        end_year: values.is_current ? undefined : values.end_year,
        is_current: values.is_current,
        description: values.description || undefined,
        advisor_1: values.advisor_1 || undefined,
        advisor_2: values.advisor_2 || undefined,
      };

      if (editingEdu) {
        await api.career.updateEducation(editingEdu.id, data, token);
        notifications.show({ title: '更新成功', message: '教育背景已更新', color: 'green' });
      } else {
        await api.career.addEducation(data, token);
        notifications.show({ title: '新增成功', message: '教育背景已新增', color: 'green' });
      }

      closeEduModal();
      loadEducations();
      eduForm.reset();
      setEditingEdu(null);
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法儲存教育背景',
        color: 'red',
      });
    }
  };

  const handleDeleteEdu = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;
      await api.career.deleteEducation(id, token);
      notifications.show({ title: '刪除成功', message: '教育背景已刪除', color: 'green' });
      loadEducations();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除教育背景',
        color: 'red',
      });
    }
  };

  const openEditWork = (work: WorkExperience) => {
    setEditingWork(work);
    workForm.setValues({
      company: work.company,
      position: work.position,
      department: work.department || '',
      location: work.location || '',
      start_date: work.start_date ? new Date(work.start_date) : null,
      end_date: work.end_date ? new Date(work.end_date) : null,
      is_current: work.is_current,
      description: work.description || '',
    });
    openWorkModal();
  };

  const openEditEdu = (edu: Education) => {
    setEditingEdu(edu);
    eduForm.setValues({
      school: edu.school,
      degree: edu.degree,
      major: edu.major || '',
      start_year: edu.start_year,
      end_year: edu.end_year || new Date().getFullYear(),
      is_current: edu.is_current,
      description: edu.description || '',
      advisor_1: edu.advisor_1 || '',
      advisor_2: edu.advisor_2 || '',
    });
    openEduModal();
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

  // 生成屆數選項 (第1屆到第30屆)
  const classYears = Array.from({ length: 30 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `第 ${i + 1} 屆`,
  }));

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  const degreeOptions = [
    { value: 'bachelor', label: '學士' },
    { value: 'master', label: '碩士' },
    { value: 'phd', label: '博士' },
  ];

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
                  管理您的學籍資訊、職涯資料與個人檔案
                </Text>
              </div>
            </Group>

            {/* 個人資訊卡片 */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
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
                    {form.values.class_year && (
                      <Badge variant="outline" color="teal">
                        第 {form.values.class_year} 屆
                      </Badge>
                    )}
                  </Group>
                  {form.values.current_position && (
                    <Text size="lg" c="dimmed">
                      {form.values.current_position}
                      {form.values.current_company && ` @ ${form.values.current_company}`}
                    </Text>
                  )}
                  {form.values.advisor_1 && (
                    <Text size="sm" c="dimmed" mt={4}>
                      指導教授：{form.values.advisor_1}
                      {form.values.advisor_2 && `、${form.values.advisor_2}`}
                    </Text>
                  )}
                </div>
              </Group>
            </Paper>

            {/* 分頁內容 */}
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="basic" leftSection={<IconUser size={16} />}>
                  基本資料
                </Tabs.Tab>
                <Tabs.Tab value="academic" leftSection={<IconSchool size={16} />}>
                  學籍資料
                </Tabs.Tab>
                <Tabs.Tab value="career" leftSection={<IconBriefcase size={16} />}>
                  職涯經歷
                </Tabs.Tab>
                <Tabs.Tab value="education" leftSection={<IconCertificate size={16} />}>
                  教育背景
                </Tabs.Tab>
              </Tabs.List>

              {/* 基本資料 */}
              <Tabs.Panel value="basic" pt="xl">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Group justify="space-between" mb="lg">
                    <Title order={3} size="h4">基本資訊</Title>
                    {!editing ? (
                      <Button leftSection={<IconEdit size={16} />} onClick={() => setEditing(true)}>
                        編輯資料
                      </Button>
                    ) : (
                      <Group>
                        <Button variant="light" leftSection={<IconX size={16} />} onClick={handleCancel} disabled={saving}>
                          取消
                        </Button>
                        <Button leftSection={<IconCheck size={16} />} onClick={() => form.onSubmit(handleSave)()} loading={saving}>
                          儲存
                        </Button>
                      </Group>
                    )}
                  </Group>

                  <form onSubmit={form.onSubmit(handleSave)}>
                    <Stack gap="md">
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="全名"
                            placeholder="您的全名"
                            disabled={!editing}
                            {...form.getInputProps('full_name')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="顯示名稱"
                            placeholder="您想要顯示的名稱"
                            disabled={!editing}
                            {...form.getInputProps('display_name')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="電子郵件"
                            placeholder="your@email.com"
                            disabled
                            leftSection={<IconMail size={16} />}
                            {...form.getInputProps('email')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="電話"
                            placeholder="+886 912 345 678"
                            disabled={!editing}
                            leftSection={<IconPhone size={16} />}
                            {...form.getInputProps('phone')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="所在地"
                            placeholder="台北市"
                            disabled={!editing}
                            leftSection={<IconMapPin size={16} />}
                            {...form.getInputProps('location')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Divider mt="md" label="個人簡介" labelPosition="left" />

                      <Textarea
                        label="自我介紹"
                        placeholder="簡單介紹一下您自己..."
                        minRows={4}
                        disabled={!editing}
                        {...form.getInputProps('bio')}
                      />

                      <Divider mt="md" label="社交連結" labelPosition="left" />

                      <Grid>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            label="LinkedIn"
                            placeholder="https://linkedin.com/in/..."
                            disabled={!editing}
                            leftSection={<IconBrandLinkedin size={16} />}
                            {...form.getInputProps('linkedin_url')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            label="GitHub"
                            placeholder="https://github.com/..."
                            disabled={!editing}
                            leftSection={<IconBrandGithub size={16} />}
                            {...form.getInputProps('github_url')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            label="個人網站"
                            placeholder="https://..."
                            disabled={!editing}
                            leftSection={<IconWorld size={16} />}
                            {...form.getInputProps('personal_website')}
                          />
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  </form>
                </Paper>
              </Tabs.Panel>

              {/* 學籍資料 */}
              <Tabs.Panel value="academic" pt="xl">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Group justify="space-between" mb="lg">
                    <Title order={3} size="h4">學籍資料</Title>
                    {!editing ? (
                      <Button leftSection={<IconEdit size={16} />} onClick={() => setEditing(true)}>
                        編輯資料
                      </Button>
                    ) : (
                      <Group>
                        <Button variant="light" leftSection={<IconX size={16} />} onClick={handleCancel} disabled={saving}>
                          取消
                        </Button>
                        <Button leftSection={<IconCheck size={16} />} onClick={() => form.onSubmit(handleSave)()} loading={saving}>
                          儲存
                        </Button>
                      </Group>
                    )}
                  </Group>

                  <form onSubmit={form.onSubmit(handleSave)}>
                    <Stack gap="md">
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Select
                            label="屆數"
                            placeholder="選擇您的屆數"
                            data={classYears}
                            disabled={!editing}
                            leftSection={<IconSchool size={16} />}
                            value={form.values.class_year?.toString()}
                            onChange={(value) => form.setFieldValue('class_year', value ? parseInt(value) : undefined)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Select
                            label="畢業年份"
                            placeholder="選擇畢業年份"
                            data={graduationYears}
                            disabled={!editing}
                            value={form.values.graduation_year?.toString()}
                            onChange={(value) => form.setFieldValue('graduation_year', value ? parseInt(value) : undefined)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Select
                            label="學位"
                            placeholder="選擇學位"
                            data={degreeOptions}
                            disabled={!editing}
                            {...form.getInputProps('degree')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="主修"
                            placeholder="色彩與照明科技研究所"
                            disabled={!editing}
                            {...form.getInputProps('major')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="學號"
                            placeholder="M11012345"
                            disabled={!editing}
                            {...form.getInputProps('student_id')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Divider mt="md" label="指導教授" labelPosition="left" />

                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="指導教授（一）"
                            placeholder="教授姓名"
                            disabled={!editing}
                            {...form.getInputProps('advisor_1')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="指導教授（二）"
                            placeholder="共同指導教授（選填）"
                            disabled={!editing}
                            {...form.getInputProps('advisor_2')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Divider mt="md" label="論文資訊" labelPosition="left" />

                      <TextInput
                        label="論文題目"
                        placeholder="您的碩/博士論文題目"
                        disabled={!editing}
                        {...form.getInputProps('thesis_title')}
                      />
                    </Stack>
                  </form>
                </Paper>
              </Tabs.Panel>

              {/* 職涯經歷 */}
              <Tabs.Panel value="career" pt="xl">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Group justify="space-between" mb="lg">
                    <Title order={3} size="h4">職涯經歷</Title>
                    <Button leftSection={<IconPlus size={16} />} onClick={() => {
                      setEditingWork(null);
                      workForm.reset();
                      openWorkModal();
                    }}>
                      新增工作經歷
                    </Button>
                  </Group>

                  {/* 目前職位 */}
                  <Card withBorder p="lg" radius="md" mb="lg" bg="blue.0">
                    <Group justify="space-between" mb="xs">
                      <Text fw={600}>目前職位</Text>
                      <Button variant="subtle" size="xs" leftSection={<IconEdit size={14} />} onClick={() => setEditing(true)}>
                        編輯
                      </Button>
                    </Group>
                    <Group gap="xs">
                      <IconBuilding size={18} />
                      <Text>
                        {form.values.current_position || '未設定'}
                        {form.values.current_company && ` @ ${form.values.current_company}`}
                      </Text>
                    </Group>
                  </Card>

                  <Divider label="工作經歷" labelPosition="left" mb="md" />

                  {workExperiences.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                      尚無工作經歷記錄，點擊上方按鈕新增
                    </Text>
                  ) : (
                    <Stack gap="md">
                      {workExperiences.map((work) => (
                        <Card key={work.id} withBorder p="lg" radius="md">
                          <Group justify="space-between" mb="xs">
                            <div>
                              <Group gap="xs">
                                <Text fw={600}>{work.position}</Text>
                                {work.is_current && <Badge color="green" size="sm">目前</Badge>}
                              </Group>
                              <Text c="dimmed" size="sm">{work.company}</Text>
                            </div>
                            <Group gap="xs">
                              <ActionIcon variant="subtle" onClick={() => openEditWork(work)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteWork(work.id)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>
                          <Text size="sm" c="dimmed">
                            {work.start_date?.substring(0, 7)} - {work.is_current ? '至今' : work.end_date?.substring(0, 7)}
                            {work.location && ` · ${work.location}`}
                          </Text>
                          {work.description && (
                            <Text size="sm" mt="xs">{work.description}</Text>
                          )}
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Tabs.Panel>

              {/* 教育背景 */}
              <Tabs.Panel value="education" pt="xl">
                <Paper shadow="sm" p="xl" radius="md" withBorder>
                  <Group justify="space-between" mb="lg">
                    <Title order={3} size="h4">教育背景</Title>
                    <Button leftSection={<IconPlus size={16} />} onClick={() => {
                      setEditingEdu(null);
                      eduForm.reset();
                      openEduModal();
                    }}>
                      新增教育背景
                    </Button>
                  </Group>

                  {educations.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                      尚無教育背景記錄，點擊上方按鈕新增
                    </Text>
                  ) : (
                    <Stack gap="md">
                      {educations.map((edu) => (
                        <Card key={edu.id} withBorder p="lg" radius="md">
                          <Group justify="space-between" mb="xs">
                            <div>
                              <Group gap="xs">
                                <Text fw={600}>{edu.school}</Text>
                                {edu.is_current && <Badge color="green" size="sm">在學中</Badge>}
                              </Group>
                              <Text c="dimmed" size="sm">
                                {degreeOptions.find(d => d.value === edu.degree)?.label || edu.degree}
                                {edu.major && ` · ${edu.major}`}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <ActionIcon variant="subtle" onClick={() => openEditEdu(edu)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteEdu(edu.id)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>
                          <Text size="sm" c="dimmed">
                            {edu.start_year} - {edu.is_current ? '至今' : edu.end_year}
                          </Text>
                          {(edu.advisor_1 || edu.advisor_2) && (
                            <Text size="sm" c="dimmed" mt="xs">
                              指導教授：{edu.advisor_1}{edu.advisor_2 && `、${edu.advisor_2}`}
                            </Text>
                          )}
                          {edu.description && (
                            <Text size="sm" mt="xs">{edu.description}</Text>
                          )}
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 工作經歷 Modal */}
        <Modal opened={workModalOpened} onClose={closeWorkModal} title={editingWork ? '編輯工作經歷' : '新增工作經歷'} size="lg">
          <form onSubmit={workForm.onSubmit(handleSaveWork)}>
            <Stack gap="md">
              <TextInput
                label="公司名稱"
                placeholder="公司名稱"
                required
                {...workForm.getInputProps('company')}
              />
              <TextInput
                label="職位"
                placeholder="職位名稱"
                required
                {...workForm.getInputProps('position')}
              />
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="部門"
                    placeholder="部門名稱"
                    {...workForm.getInputProps('department')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="地點"
                    placeholder="工作地點"
                    {...workForm.getInputProps('location')}
                  />
                </Grid.Col>
              </Grid>
              <Grid>
                <Grid.Col span={6}>
                  <DateInput
                    label="開始日期"
                    placeholder="選擇日期"
                    required
                    {...workForm.getInputProps('start_date')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DateInput
                    label="結束日期"
                    placeholder="選擇日期"
                    disabled={workForm.values.is_current}
                    {...workForm.getInputProps('end_date')}
                  />
                </Grid.Col>
              </Grid>
              <Switch
                label="目前在職"
                {...workForm.getInputProps('is_current', { type: 'checkbox' })}
              />
              <Textarea
                label="工作描述"
                placeholder="描述您的工作內容..."
                minRows={3}
                {...workForm.getInputProps('description')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={closeWorkModal}>取消</Button>
                <Button type="submit">儲存</Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* 教育背景 Modal */}
        <Modal opened={eduModalOpened} onClose={closeEduModal} title={editingEdu ? '編輯教育背景' : '新增教育背景'} size="lg">
          <form onSubmit={eduForm.onSubmit(handleSaveEdu)}>
            <Stack gap="md">
              <TextInput
                label="學校名稱"
                placeholder="學校名稱"
                required
                {...eduForm.getInputProps('school')}
              />
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="學位"
                    placeholder="選擇學位"
                    data={degreeOptions}
                    required
                    {...eduForm.getInputProps('degree')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="主修"
                    placeholder="主修科系"
                    {...eduForm.getInputProps('major')}
                  />
                </Grid.Col>
              </Grid>
              <Grid>
                <Grid.Col span={6}>
                  <NumberInput
                    label="入學年份"
                    placeholder="入學年份"
                    required
                    min={1990}
                    max={currentYear}
                    {...eduForm.getInputProps('start_year')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput
                    label="畢業年份"
                    placeholder="畢業年份"
                    min={1990}
                    max={currentYear + 10}
                    disabled={eduForm.values.is_current}
                    {...eduForm.getInputProps('end_year')}
                  />
                </Grid.Col>
              </Grid>
              <Switch
                label="在學中"
                {...eduForm.getInputProps('is_current', { type: 'checkbox' })}
              />
              <Divider label="指導教授（選填）" labelPosition="left" />
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="指導教授（一）"
                    placeholder="教授姓名"
                    {...eduForm.getInputProps('advisor_1')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="指導教授（二）"
                    placeholder="共同指導教授"
                    {...eduForm.getInputProps('advisor_2')}
                  />
                </Grid.Col>
              </Grid>
              <Textarea
                label="論文題目 / 備註"
                placeholder="論文題目或其他備註..."
                minRows={2}
                {...eduForm.getInputProps('description')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={closeEduModal}>取消</Button>
                <Button type="submit">儲存</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
