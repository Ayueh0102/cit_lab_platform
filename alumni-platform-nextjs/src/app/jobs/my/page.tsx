'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Button,
  ActionIcon,
  Skeleton,
  Tabs,
  Modal,
  TextInput,
  Textarea,
  Grid,
  Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCheck,
  IconX,
  IconBriefcase,
  IconPlus,
  IconCalendar,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Job {
  id: number;
  title: string;
  company: string;
  location?: string;
  job_type: string;
  status: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  application_email?: string;
  contact_email?: string;
  views_count?: number;
  requests_count?: number;
  created_at: string;
  published_at?: string;
  expires_at?: string;
  category_id?: number;
}

export default function MyJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: '',
      company: '',
      location: '',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      contact_email: '',
    },
  });

  useEffect(() => {
    loadMyJobs();
  }, [activeTab]);

  const loadMyJobs = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let status: string | undefined;
      if (activeTab === 'active') {
        status = 'ACTIVE';
      } else if (activeTab === 'closed') {
        status = 'CLOSED';
      }

      const data = await api.jobs.getMyJobs(token, status);
      setJobs(data.jobs || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入職缺列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (job: Job) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // 載入完整的職缺數據
      const fullJob = await api.jobs.getById(job.id, token);
      const jobData = fullJob.job || fullJob;

      setSelectedJob(jobData);
      form.setValues({
        title: jobData.title || '',
        company: jobData.company || '',
        location: jobData.location || '',
        description: jobData.description || '',
        requirements: jobData.requirements || '',
        responsibilities: jobData.responsibilities || '',
        benefits: jobData.benefits || '',
        contact_email: jobData.application_email || jobData.contact_email || '',
      });
      openEditModal();
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入職缺詳情',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedJob) return;

    try {
      setEditing(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // 準備更新數據
      const updateData: any = {
        title: values.title,
        company: values.company,
        location: values.location || undefined,
        description: values.description || undefined,
        requirements: values.requirements || undefined,
        responsibilities: values.responsibilities || undefined,
        benefits: values.benefits || undefined,
        contact_email: values.contact_email || undefined,
      };

      await api.jobs.update(selectedJob.id, updateData, token);

      notifications.show({
        title: '更新成功',
        message: '職缺已成功更新',
        color: 'green',
      });

      closeEditModal();
      loadMyJobs();
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = (job: Job) => {
    setSelectedJob(job);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;

    try {
      setDeleting(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.jobs.delete(selectedJob.id, token);

      notifications.show({
        title: '刪除成功',
        message: '職缺已成功刪除',
        color: 'green',
      });

      closeDeleteModal();
      loadMyJobs();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = async (job: Job) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.jobs.update(job.id, { status: 'CLOSED' }, token);

      notifications.show({
        title: '關閉成功',
        message: '職缺已成功關閉',
        color: 'green',
      });

      loadMyJobs();
    } catch (error) {
      notifications.show({
        title: '關閉失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return job.status === 'active' || job.status === 'ACTIVE';
    if (activeTab === 'closed') return job.status === 'closed' || job.status === 'CLOSED';
    return true;
  });

  const jobTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      full_time: '全職',
      part_time: '兼職',
      contract: '約聘',
      internship: '實習',
      freelance: '自由接案',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Container size="lg" py="xl">
            <Stack gap="xl">
              <Group justify="space-between" align="center">
                <div>
                  <Skeleton height={32} width={180} radius="md" mb="xs" />
                  <Skeleton height={18} width={240} radius="md" />
                </div>
                <Skeleton height={40} width={120} radius="xl" />
              </Group>
              <Group gap="md">
                <Skeleton height={36} width={100} radius="md" />
                <Skeleton height={36} width={80} radius="md" />
                <Skeleton height={36} width={80} radius="md" />
              </Group>
              <Stack gap="md">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} shadow="sm" padding="lg" radius="md" className="glass-card-soft">
                    <Group justify="space-between" mb="md">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <Skeleton height={20} width="45%" radius="md" />
                          <Skeleton height={22} width={60} radius="xl" />
                          <Skeleton height={22} width={50} radius="xl" />
                        </Group>
                        <Skeleton height={14} width="30%" radius="md" mb="sm" />
                        <Group gap="md">
                          <Skeleton height={12} width={80} radius="md" />
                          <Skeleton height={12} width={60} radius="md" />
                          <Skeleton height={12} width={100} radius="md" />
                        </Group>
                      </div>
                      <Skeleton height={28} width={28} radius="md" />
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Container>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} mb="xs">
                  我的職缺
                </Title>
                <Text c="dimmed">
                  管理您發布的職缺
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => router.push('/jobs/create')}
              >
                發布新職缺
              </Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all">全部 ({jobs.length})</Tabs.Tab>
                <Tabs.Tab value="active">
                  開放中 ({jobs.filter(j => j.status === 'active' || j.status === 'ACTIVE').length})
                </Tabs.Tab>
                <Tabs.Tab value="closed">
                  已關閉 ({jobs.filter(j => j.status === 'closed' || j.status === 'CLOSED').length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value={activeTab || 'all'} pt="xl">
                {filteredJobs.length === 0 ? (
                  <Card shadow="sm" padding="xl" radius="md" className="glass-card-soft" style={{ border: 'none' }}>
                    <Stack align="center" gap="md" py="xl">
                      <IconBriefcase size={56} color="var(--mantine-color-teal-3)" stroke={1.5} />
                      <Text size="lg" fw={600} c="dimmed">目前沒有職缺</Text>
                      <Text size="sm" c="dimmed" ta="center" maw={360}>
                        {activeTab === 'closed' ? '沒有已關閉的職缺' : '發布您的第一個職缺，幫助系友找到機會'}
                      </Text>
                      <Button
                        variant="light"
                        color="teal"
                        radius="xl"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => router.push('/jobs/create')}
                        mt="xs"
                      >
                        發布第一個職缺
                      </Button>
                    </Stack>
                  </Card>
                ) : (
                  <Stack gap="md">
                    {filteredJobs.map((job) => (
                      <Card key={job.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <Text fw={600} size="lg">
                                {job.title}
                              </Text>
                              <Badge color={job.status === 'active' || job.status === 'ACTIVE' ? 'green' : 'gray'}>
                                {job.status === 'active' || job.status === 'ACTIVE' ? '開放中' : '已關閉'}
                              </Badge>
                              <Badge variant="light">{jobTypeLabel(job.job_type)}</Badge>
                            </Group>
                            <Group gap="xs" c="dimmed" mb="sm">
                              <Text size="sm">{job.company}</Text>
                              {job.location && (
                                <>
                                  <Text size="sm">•</Text>
                                  <Text size="sm">{job.location}</Text>
                                </>
                              )}
                            </Group>
                            <Group gap="md" c="dimmed">
                              {job.views_count !== undefined && (
                                <Group gap={4}>
                                  <IconEye size={14} />
                                  <Text size="xs">{job.views_count} 次瀏覽</Text>
                                </Group>
                              )}
                              {job.requests_count !== undefined && (
                                <Group gap={4}>
                                  <IconBriefcase size={14} />
                                  <Text size="xs">{job.requests_count} 個申請</Text>
                                </Group>
                              )}
                              {job.published_at && (
                                <Group gap={4}>
                                  <IconCalendar size={14} />
                                  <Text size="xs">
                                    發布於 {new Date(job.published_at).toLocaleDateString('zh-TW')}
                                  </Text>
                                </Group>
                              )}
                            </Group>
                          </div>
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <ActionIcon variant="subtle">
                                <IconEdit size={18} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEye size={14} />}
                                onClick={() => router.push(`/jobs/${job.id}`)}
                              >
                                查看詳情
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => handleEdit(job)}
                              >
                                編輯
                              </Menu.Item>
                              {(job.status === 'active' || job.status === 'ACTIVE') && (
                                <Menu.Item
                                  leftSection={<IconX size={14} />}
                                  color="orange"
                                  onClick={() => handleClose(job)}
                                >
                                  關閉職缺
                                </Menu.Item>
                              )}
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleDelete(job)}
                              >
                                刪除
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 編輯職缺 Modal */}
        <Modal
          opened={editModalOpened}
          onClose={closeEditModal}
          title="編輯職缺"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleUpdate)}>
            <Stack gap="md">
              <TextInput
                label="職缺標題"
                required
                {...form.getInputProps('title')}
                key={form.key('title')}
              />
              <TextInput
                label="公司名稱"
                required
                {...form.getInputProps('company')}
                key={form.key('company')}
              />
              <TextInput
                label="工作地點"
                {...form.getInputProps('location')}
                key={form.key('location')}
              />
              <Textarea
                label="職缺描述"
                minRows={4}
                {...form.getInputProps('description')}
                key={form.key('description')}
              />
              <Textarea
                label="職缺要求"
                minRows={3}
                {...form.getInputProps('requirements')}
                key={form.key('requirements')}
              />
              <Textarea
                label="工作職責"
                minRows={3}
                {...form.getInputProps('responsibilities')}
                key={form.key('responsibilities')}
              />
              <Textarea
                label="福利待遇"
                minRows={3}
                {...form.getInputProps('benefits')}
                key={form.key('benefits')}
              />
              <TextInput
                label="聯絡信箱"
                type="email"
                {...form.getInputProps('contact_email')}
                key={form.key('contact_email')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeEditModal}>
                  取消
                </Button>
                <Button type="submit" loading={editing}>
                  儲存
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* 刪除確認 Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          title="確認刪除"
          centered
        >
          <Stack gap="md">
            <Text>確定要刪除此職缺嗎？此操作無法復原。</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={closeDeleteModal}>
                取消
              </Button>
              <Button color="red" onClick={confirmDelete} loading={deleting}>
                刪除
              </Button>
            </Group>
          </Stack>
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

