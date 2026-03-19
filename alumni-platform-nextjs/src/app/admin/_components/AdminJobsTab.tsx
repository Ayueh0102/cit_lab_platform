'use client';

import { useEffect, useState } from 'react';
import {
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Table,
  ActionIcon,
  Select,
  TextInput,
  Button,
  Loader,
  Center,
  Tooltip,
  Pagination,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconCheck,
  IconEye,
  IconTrash,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface AdminJobsTabProps {
  onDataChanged: () => void;
}

export function AdminJobsTab({ onDataChanged }: AdminJobsTabProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatusFilter, setJobsStatusFilter] = useState<string | null>(null);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotal, setJobsTotal] = useState(0);

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsPage, jobsStatusFilter]);

  // 搜尋防抖處理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (jobsPage === 1) {
        loadJobs();
      } else {
        setJobsPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsSearch]);

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const token = getToken();
      if (!token) return;

      const params: any = {
        page: jobsPage,
        per_page: 20,
      };

      if (jobsSearch.trim()) {
        params.search = jobsSearch.trim();
      }
      if (jobsStatusFilter) {
        params.status = jobsStatusFilter;
      }

      const data = await api.jobs.getAll(token, params);
      setJobs(data.jobs || []);
      setJobsTotal(data.total || 0);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入職缺列表',
        color: 'red',
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const handleApproveJob = async (jobId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveJob(jobId, token);
      await loadJobs();
      onDataChanged();

      notifications.show({
        title: '審核成功',
        message: '職缺已通過審核',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核職缺',
        color: 'red',
      });
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('確定要刪除此職缺嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.jobs.delete(jobId, token);
      await loadJobs();
      onDataChanged();

      notifications.show({
        title: '刪除成功',
        message: '職缺已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除職缺',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="搜尋職缺..."
          leftSection={<IconSearch size={16} />}
          value={jobsSearch}
          onChange={(e) => setJobsSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="狀態篩選"
          data={[
            { value: 'ACTIVE', label: '已發布' },
            { value: 'PENDING', label: '待審核' },
            { value: 'CLOSED', label: '已關閉' },
          ]}
          value={jobsStatusFilter}
          onChange={setJobsStatusFilter}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      {jobsLoading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : (
        <>
          <Paper className="glass-card-soft" p="md" radius="lg">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>標題</Table.Th>
                  <Table.Th>公司</Table.Th>
                  <Table.Th>地點</Table.Th>
                  <Table.Th>類型</Table.Th>
                  <Table.Th>狀態</Table.Th>
                  <Table.Th>發布者</Table.Th>
                  <Table.Th>發布日期</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {jobs.map((job) => (
                  <Table.Tr key={job.id}>
                    <Table.Td>{job.id}</Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        {job.title}
                      </Button>
                    </Table.Td>
                    <Table.Td>{job.company || job.company_name || '未提供'}</Table.Td>
                    <Table.Td>{job.location || '未提供'}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="light">
                        {job.job_type === 'full_time' ? '全職' :
                         job.job_type === 'part_time' ? '兼職' :
                         job.job_type === 'internship' ? '實習' : job.job_type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          job.status === 'ACTIVE' ? 'green' :
                          job.status === 'PENDING' ? 'orange' : 'gray'
                        }
                        variant="light"
                      >
                        {job.status === 'ACTIVE' ? '已發布' :
                         job.status === 'PENDING' ? '待審核' : '已關閉'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {job.user?.profile?.display_name ||
                       job.user?.profile?.full_name ||
                       job.poster_name || '未知'}
                    </Table.Td>
                    <Table.Td>
                      {job.created_at ? new Date(job.created_at).toLocaleDateString('zh-TW') : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {job.status === 'PENDING' && (
                          <Tooltip label="審核通過">
                            <ActionIcon
                              variant="light"
                              color="green"
                              onClick={() => handleApproveJob(job.id)}
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="查看詳情">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="刪除">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          {jobsTotal > 20 && (
            <Group justify="center">
              <Pagination
                value={jobsPage}
                onChange={setJobsPage}
                total={Math.ceil(jobsTotal / 20)}
              />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
