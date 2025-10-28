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
  TextInput,
  Select,
  Grid,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
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

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await api.jobs.getAll(token || undefined);
      setJobs(response.jobs || response);
    } catch (error: any) {
      notifications.show({
        title: '載入失敗',
        message: error.message || '無法載入職缺列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || job.job_type === filterType;
    return matchesSearch && matchesType;
  });

  const jobTypes = ['全職', '兼職', '實習', '約聘'];

  if (loading) {
    return (
      <AppLayout>
        <Center style={{ minHeight: '60vh' }}>
          <Loader size="xl" />
        </Center>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} mb="xs">
                職缺媒合
              </Title>
              <Text c="dimmed">找到您理想的工作機會</Text>
            </div>
            {isAuthenticated() && (
              <Button onClick={() => router.push('/jobs/create')}>
                發布職缺
              </Button>
            )}
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                placeholder="搜尋職缺或公司..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                size="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                placeholder="工作類型"
                data={jobTypes}
                value={filterType}
                onChange={setFilterType}
                clearable
                size="md"
              />
            </Grid.Col>
          </Grid>

          {filteredJobs.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">目前沒有職缺</Text>
            </Center>
          ) : (
            <Stack gap="md">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={500} size="lg">
                      {job.title}
                    </Text>
                    <Badge color="blue">{job.job_type}</Badge>
                  </Group>

                  <Group gap="xs" mb="sm">
                    <Text size="sm" c="dimmed">
                      {job.company_name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      •
                    </Text>
                    <Text size="sm" c="dimmed">
                      {job.location}
                    </Text>
                  </Group>

                  {job.salary_range && (
                    <Text size="sm" c="green" mb="sm">
                      💰 {job.salary_range}
                    </Text>
                  )}

                  <Text size="sm" lineClamp={2} c="dimmed">
                    {job.description}
                  </Text>

                  {job.poster_name && (
                    <Text size="xs" c="dimmed" mt="sm">
                      發布者: {job.poster_name}
                    </Text>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
}

