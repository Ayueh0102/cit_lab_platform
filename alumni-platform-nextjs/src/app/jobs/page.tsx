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
  Tooltip,
  Skeleton,
} from '@mantine/core';
import { IconEye, IconCalendar, IconSearch, IconMapPin, IconBriefcase } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
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
  contact_info?: string;
  contact_email?: string;
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
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 防抖處理搜索詞
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 重置到第一頁
    }, 500); // 500ms 延遲

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 當搜索條件改變時，重新載入數據
  useEffect(() => {
    loadJobs();
  }, [debouncedSearchTerm, filterType, filterLocation, currentPage]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params: Record<string, string | number> = {
        status: 'ACTIVE',
        page: currentPage,
        per_page: 20,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (filterType) {
        params.job_type = filterType;
      }
      if (filterLocation) {
        params.location = filterLocation;
      }

      const response = await api.jobs.getAll(token || undefined, params);
      setJobs(response.jobs || []);
      setTotal(response.total || 0);
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

  const jobTypes = [
    { value: 'full_time', label: '全職' },
    { value: 'part_time', label: '兼職' },
    { value: 'contract', label: '約聘' },
    { value: 'internship', label: '實習' },
    { value: 'freelance', label: '自由接案' },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Container size="lg" py="xl">
            <Stack gap="xl">
              {/* 標題骨架 */}
              <Group justify="space-between" align="center">
                <div>
                  <Skeleton height={32} width={200} radius="md" mb="xs" />
                  <Skeleton height={18} width={300} radius="md" />
                </div>
                <Skeleton height={40} width={120} radius="xl" />
              </Group>

              {/* 搜尋/篩選骨架 */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Skeleton height={42} radius="md" />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Skeleton height={42} radius="md" />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Skeleton height={42} radius="md" />
                </Grid.Col>
              </Grid>

              {/* 卡片列表骨架 */}
              <Stack gap="md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} shadow="sm" padding="lg" radius="md" className="glass-card-soft">
                    <Stack gap="md">
                      <Skeleton height={22} width="60%" radius="md" />
                      <Skeleton height={16} width="40%" radius="md" />
                      <Group gap="md">
                        <Skeleton height={14} width={80} radius="md" />
                        <Skeleton height={14} width={100} radius="md" />
                        <Skeleton height={14} width={80} radius="md" />
                      </Group>
                      <Skeleton height={14} width="90%" radius="md" />
                      <Skeleton height={14} width="70%" radius="md" />
                      <Group gap="xs">
                        <Skeleton height={22} width={60} radius="xl" />
                        <Skeleton height={22} width={50} radius="xl" />
                      </Group>
                    </Stack>
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
                職缺媒合
              </Title>
              <Text c="dimmed">找到您理想的工作機會</Text>
            </div>
            {isAuthenticated() && (
              <Group gap="sm">
                <Button variant="light" onClick={() => router.push('/jobs/applications')}>
                  管理交流申請
                </Button>
                <Button onClick={() => router.push('/jobs/create')}>
                  發布職缺
                </Button>
              </Group>
            )}
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                placeholder="搜尋職缺、公司或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                size="md"
                leftSection={<IconSearch size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                placeholder="工作類型"
                data={jobTypes.map(t => ({ value: t.value, label: t.label }))}
                value={filterType}
                onChange={(value) => {
                  setFilterType(value);
                  setCurrentPage(1);
                }}
                clearable
                size="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                placeholder="地點（例如：新竹）"
                value={filterLocation || ''}
                onChange={(e) => {
                  const value = e.currentTarget.value.trim() || null;
                  setFilterLocation(value);
                  setCurrentPage(1);
                }}
                size="md"
                leftSection={<IconMapPin size={16} />}
              />
            </Grid.Col>
          </Grid>

          {jobs.length === 0 ? (
            <Card shadow="sm" padding="xl" radius="md" className="glass-card-soft" style={{ border: 'none' }}>
              <Stack align="center" gap="md" py="xl">
                <IconBriefcase size={56} color="var(--mantine-color-teal-3)" stroke={1.5} />
                <Text size="lg" fw={600} c="dimmed">目前沒有職缺</Text>
                <Text size="sm" c="dimmed" ta="center" maw={360}>
                  {debouncedSearchTerm || filterType || filterLocation
                    ? '試試調整搜尋條件或篩選條件'
                    : '成為第一個發布職缺的人，幫助校友找到理想工作'}
                </Text>
                {isAuthenticated() && !debouncedSearchTerm && !filterType && !filterLocation && (
                  <Button
                    variant="light"
                    color="teal"
                    radius="xl"
                    leftSection={<IconBriefcase size={16} />}
                    onClick={() => router.push('/jobs/create')}
                    mt="xs"
                  >
                    發布第一個職缺
                  </Button>
                )}
              </Stack>
            </Card>
          ) : (
            <Stack gap="md">
              {total > 0 && (
                <Text size="sm" c="dimmed">
                  找到 {total} 個職缺
                </Text>
              )}
              {jobs.map((job, index) => {
                const companyName = job.company || job.company_name || '未知公司';
                const salaryText = job.salary_text || job.salary_range;
                const jobTypeLabel = jobTypes.find(t => t.value === job.job_type)?.label || job.job_type;
                const posterName = job.poster_name || job.user?.profile?.display_name || job.user?.profile?.full_name;

                return (
                  <Card
                    key={job.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    className="hover-translate-y gradient-border-top glass-card-soft animate-list-item cursor-glow"
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      animationDelay: `${Math.min(index, 9) * 0.05}s`,
                    }}
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--glow-x', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--glow-y', `${e.clientY - r.top}px`); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/jobs/${job.id}`); } }}
                  >
                    <Stack gap="md">
                      <div>
                        <Text fw={700} size="lg" mb="xs">
                          {job.title}
                        </Text>
                        <Text c="blue" fw={600} mb="md">
                          🏢 {companyName}
                        </Text>
                      </div>

                      <Group gap="md" wrap="wrap">
                        <Group gap={4}>
                          <IconMapPin size={16} color="var(--mantine-color-gray-6)" />
                          <Text size="sm" c="dimmed">{job.location}</Text>
                        </Group>
                        {salaryText && (
                          <Group gap={4}>
                            <Text size="sm" c="dimmed">💰</Text>
                            <Text size="sm" c="dimmed">{salaryText}</Text>
                          </Group>
                        )}
                        <Group gap={4}>
                          <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
                          <Text size="sm" c="dimmed">
                            {new Date(job.created_at).toLocaleDateString('zh-TW')}
                          </Text>
                        </Group>
                      </Group>

                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {job.description}
                      </Text>

                      <Group gap="xs" wrap="wrap">
                        {job.category && (
                          <Badge variant="light" color="blue">
                            {job.category.name}
                          </Badge>
                        )}
                        <Badge variant="light" color="teal">
                          {jobTypeLabel}
                        </Badge>
                      </Group>

                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                          👤 發布者：{posterName || '未提供'}
                        </Text>
                        {job.views !== undefined && (
                          <Group gap={4}>
                            <IconEye size={14} />
                            <Text size="xs" c="dimmed">{job.views}</Text>
                          </Group>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

