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
  Divider,
  Loader,
  Center,
  Modal,
  Textarea,
  Grid,
  Anchor,
} from '@mantine/core';
import { IconMail, IconPhone, IconWorld, IconCalendar, IconEye, IconMapPin, IconBriefcase } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Job {
  id: number;
  title: string;
  company: string;
  company_name?: string; // 兼容舊字段名
  location: string;
  job_type: string;
  salary_text?: string;
  salary_range?: string; // 兼容舊字段名
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  contact_info?: string;
  contact_email?: string;
  contact_phone?: string;
  application_url?: string;
  created_at: string;
  poster_name?: string;
  user?: {
    profile?: {
      display_name?: string;
      full_name?: string;
    };
  };
  category?: {
    name: string;
  };
  views?: number;
  work_mode?: string;
  experience_required?: string;
  education_required?: string;
  deadline?: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = parseInt(params.id as string);
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpened, setApplyModalOpened] = useState(false);
  const [applying, setApplying] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      message: '',
    },
    validate: {
      message: (value) =>
        value.length >= 10 ? null : '請至少輸入 10 個字符的申請訊息',
    },
  });

  useEffect(() => {
    loadJobDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.jobs.getById(jobId, token || undefined);
      setJob(response.job || response);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入職缺詳情',
        color: 'red',
      });
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (values: typeof form.values) => {
    if (!isAuthenticated()) {
      notifications.show({
        title: '請先登入',
        message: '您需要登入才能申請職缺',
        color: 'orange',
      });
      router.push('/auth/login');
      return;
    }

    try {
      setApplying(true);
      const token = getToken();
      await api.jobs.apply(jobId, values, token!);

      notifications.show({
        title: '申請成功',
        message: '您的申請已送出，請等待回覆',
        color: 'green',
      });

      setApplyModalOpened(false);
      form.reset();
    } catch (error) {
      notifications.show({
        title: '申請失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute><SidebarLayout>
        <Center style={{ minHeight: '60vh' }}>
          <Loader size="xl" />
        </Center>
      </SidebarLayout></ProtectedRoute>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <ProtectedRoute><SidebarLayout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Button variant="subtle" onClick={() => router.back()}>
            ← 返回職缺列表
          </Button>

          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="lg">
              {/* 標題和基本資訊 */}
              <div>
                <Group justify="space-between" mb="sm" wrap="wrap">
                  <Title order={1}>{job.title}</Title>
                  <Group gap="xs">
                    {job.category && (
                      <Badge size="lg" variant="light" color="blue">
                        {job.category.name}
                      </Badge>
                    )}
                    <Badge size="lg" color="blue">
                      {job.job_type === 'full_time' ? '全職' :
                       job.job_type === 'part_time' ? '兼職' :
                       job.job_type === 'contract' ? '約聘' :
                       job.job_type === 'internship' ? '實習' :
                       job.job_type === 'freelance' ? '自由接案' : job.job_type}
                    </Badge>
                    {job.work_mode && (
                      <Badge size="lg" variant="light" color="green">
                        {job.work_mode === 'on_site' ? '辦公室' :
                         job.work_mode === 'remote' ? '遠端' :
                         job.work_mode === 'hybrid' ? '混合' : job.work_mode}
                      </Badge>
                    )}
                  </Group>
                </Group>

                <Group gap="md" mt="md" wrap="wrap">
                  <Group gap={4}>
                    <IconBriefcase size={18} />
                    <Text size="lg" fw={500}>{job.company || job.company_name}</Text>
                  </Group>
                  {job.location && (
                    <>
                      <Text c="dimmed">•</Text>
                      <Group gap={4}>
                        <IconMapPin size={18} />
                        <Text size="lg" c="dimmed">{job.location}</Text>
                      </Group>
                    </>
                  )}
                </Group>

                {(job.salary_text || job.salary_range) && (
                  <Text size="lg" c="green" mt="sm" fw={500}>
                    💰 {job.salary_text || job.salary_range}
                  </Text>
                )}

                <Group gap="md" mt="md" c="dimmed">
                  {job.views !== undefined && (
                    <Group gap={4}>
                      <IconEye size={16} />
                      <Text size="sm">{job.views} 次瀏覽</Text>
                    </Group>
                  )}
                  {job.created_at && (
                    <Group gap={4}>
                      <IconCalendar size={16} />
                      <Text size="sm">
                        發布於 {new Date(job.created_at).toLocaleDateString('zh-TW')}
                      </Text>
                    </Group>
                  )}
                </Group>
              </div>

              <Divider />

              {/* 職缺描述 */}
              {job.description && (
                <div>
                  <Title order={3} mb="sm">
                    職缺描述
                  </Title>
                  <Text style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                    {job.description}
                  </Text>
                </div>
              )}

              {/* 工作職責 */}
              {job.responsibilities && (
                <div>
                  <Title order={3} mb="sm">
                    工作職責
                  </Title>
                  <Text style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                    {job.responsibilities}
                  </Text>
                </div>
              )}

              {/* 職缺要求 */}
              {job.requirements && (
                <div>
                  <Title order={3} mb="sm">
                    職缺要求
                  </Title>
                  <Text style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                    {job.requirements}
                  </Text>
                </div>
              )}

              {/* 經驗和學歷要求 */}
              {(job.experience_required || job.education_required) && (
                <Grid>
                  {job.experience_required && (
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={600} mb="xs">經驗要求</Text>
                      <Text c="dimmed">{job.experience_required}</Text>
                    </Grid.Col>
                  )}
                  {job.education_required && (
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text fw={600} mb="xs">學歷要求</Text>
                      <Text c="dimmed">{job.education_required}</Text>
                    </Grid.Col>
                  )}
                </Grid>
              )}

              {/* 福利待遇 */}
              {job.benefits && (
                <div>
                  <Title order={3} mb="sm">
                    福利待遇
                  </Title>
                  <Text style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                    {job.benefits}
                  </Text>
                </div>
              )}

              {/* 申請截止日期 */}
              {job.deadline && (
                <div>
                  <Title order={3} mb="sm">
                    申請截止日期
                  </Title>
                  <Text c="dimmed">
                    {new Date(job.deadline).toLocaleDateString('zh-TW')}
                  </Text>
                </div>
              )}

              <Divider />

              {/* 聯絡方式 */}
              {(job.contact_email || job.contact_phone || job.application_url || job.contact_info) && (
                <div>
                  <Title order={3} mb="sm">
                    聯絡方式
                  </Title>
                  <Stack gap="xs">
                    {job.contact_email && (
                      <Group gap={8}>
                        <IconMail size={18} />
                        <Anchor href={`mailto:${job.contact_email}`}>
                          {job.contact_email}
                        </Anchor>
                      </Group>
                    )}
                    {job.contact_phone && (
                      <Group gap={8}>
                        <IconPhone size={18} />
                        <Anchor href={`tel:${job.contact_phone}`}>
                          {job.contact_phone}
                        </Anchor>
                      </Group>
                    )}
                    {job.application_url && (
                      <Group gap={8}>
                        <IconWorld size={18} />
                        <Anchor href={job.application_url} target="_blank" rel="noopener noreferrer">
                          線上申請連結
                        </Anchor>
                      </Group>
                    )}
                    {job.contact_info && !job.contact_email && !job.contact_phone && (
                      <Text>{job.contact_info}</Text>
                    )}
                  </Stack>
                </div>
              )}

              <Divider />

              {/* 發布者資訊和申請按鈕 */}
              <Group justify="space-between" wrap="wrap">
                <div>
                  {(job.poster_name || job.user) && (
                    <Text size="sm" c="dimmed">
                      發布者: {job.poster_name || job.user?.profile?.display_name || job.user?.profile?.full_name || '未知'}
                    </Text>
                  )}
                </div>

                {isAuthenticated() && (
                  <Button size="lg" onClick={() => setApplyModalOpened(true)}>
                    申請此職缺
                  </Button>
                )}
                {!isAuthenticated() && (
                  <Button size="lg" variant="light" onClick={() => router.push('/auth/login')}>
                    登入以申請
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Container>

      <Modal
        opened={applyModalOpened}
        onClose={() => setApplyModalOpened(false)}
        title="申請職缺"
        size="md"
      >
        <form onSubmit={form.onSubmit(handleApply)}>
          <Stack gap="md">
            <Text size="sm">
              請簡述您為什麼適合這個職位，以及您的相關經驗。
            </Text>

            <Textarea
              label="申請訊息"
              placeholder="請輸入您的申請訊息..."
              minRows={6}
              required
              {...form.getInputProps('message')}
              key={form.key('message')}
            />

            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => setApplyModalOpened(false)}
              >
                取消
              </Button>
              <Button type="submit" loading={applying}>
                送出申請
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </SidebarLayout></ProtectedRoute>
  );
}



