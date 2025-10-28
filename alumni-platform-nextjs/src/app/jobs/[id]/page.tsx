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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';

interface Job {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_range?: string;
  description: string;
  requirements?: string;
  contact_info?: string;
  created_at: string;
  poster_name?: string;
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
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.jobs.getById(jobId, token || undefined);
      setJob(response.job || response);
    } catch (error: any) {
      notifications.show({
        title: '載入失敗',
        message: error.message || '無法載入職缺詳情',
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
    } catch (error: any) {
      notifications.show({
        title: '申請失敗',
        message: error.message || '請稍後再試',
        color: 'red',
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <Center style={{ minHeight: '60vh' }}>
          <Loader size="xl" />
        </Center>
      </AppLayout>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <AppLayout>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Button variant="subtle" onClick={() => router.back()}>
            ← 返回職缺列表
          </Button>

          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="lg">
              <div>
                <Group justify="space-between" mb="sm">
                  <Title order={1}>{job.title}</Title>
                  <Badge size="lg" color="blue">
                    {job.job_type}
                  </Badge>
                </Group>

                <Group gap="xs" c="dimmed">
                  <Text size="lg">{job.company_name}</Text>
                  <Text>•</Text>
                  <Text size="lg">{job.location}</Text>
                </Group>

                {job.salary_range && (
                  <Text size="lg" c="green" mt="sm" fw={500}>
                    💰 {job.salary_range}
                  </Text>
                )}
              </div>

              <Divider />

              <div>
                <Title order={3} mb="sm">
                  職缺描述
                </Title>
                <Text style={{ whiteSpace: 'pre-line' }}>
                  {job.description}
                </Text>
              </div>

              {job.requirements && (
                <div>
                  <Title order={3} mb="sm">
                    職缺要求
                  </Title>
                  <Text style={{ whiteSpace: 'pre-line' }}>
                    {job.requirements}
                  </Text>
                </div>
              )}

              {job.contact_info && (
                <div>
                  <Title order={3} mb="sm">
                    聯絡方式
                  </Title>
                  <Text>{job.contact_info}</Text>
                </div>
              )}

              <Divider />

              <Group justify="space-between">
                <div>
                  {job.poster_name && (
                    <Text size="sm" c="dimmed">
                      發布者: {job.poster_name}
                    </Text>
                  )}
                  <Text size="sm" c="dimmed">
                    發布時間:{' '}
                    {new Date(job.created_at).toLocaleDateString('zh-TW')}
                  </Text>
                </div>

                <Button size="lg" onClick={() => setApplyModalOpened(true)}>
                  申請此職缺
                </Button>
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
    </AppLayout>
  );
}

