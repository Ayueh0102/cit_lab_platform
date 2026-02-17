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
  Tabs,
  Divider,
  Modal,
  Textarea,
  Skeleton,
  Select,
  Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconX,
  IconEye,
  IconCalendar,
  IconUser,
  IconBriefcase,
  IconMail,
  IconSend,
  IconInbox,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface JobRequest {
  id: number;
  job_id: number;
  requester_id: number;
  message?: string;
  response_message?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  job?: {
    id: number;
    title: string;
    company: string;
  };
  requester?: {
    id: number;
    email: string;
    profile?: {
      display_name?: string;
      full_name?: string;
      phone?: string;
      avatar_url?: string;
    };
  };
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待審核', color: 'yellow' },
  APPROVED: { label: '已接受', color: 'green' },
  REJECTED: { label: '已拒絕', color: 'red' },
};

function getStatusInfo(status: string) {
  const key = status.toUpperCase();
  return statusMap[key] || { label: status, color: 'gray' };
}

export default function JobApplicationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<string | null>('received');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setStatusFilter(null);
  }, [mainTab]);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params: { status?: string; per_page?: number } = { per_page: 50 };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = mainTab === 'sent'
        ? await api.jobs.getSentRequests(token, params)
        : await api.jobs.getReceivedRequests(token, params);

      const rawRequests = response.requests || [];
      setRequests(rawRequests.map((req: any) => ({
        ...req,
        job: req.job || { id: req.job_id, title: req.job_title || `職缺 #${req.job_id}`, company: req.company || '' },
        requester: req.requester || { id: req.requester_id, email: req.requester_email || '' },
        status: req.status || 'PENDING',
      })));
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入申請列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: JobRequest) => {
    try {
      setProcessing(true);
      const token = getToken();
      if (!token) return;
      await api.jobs.acceptRequest(request.id, token);
      notifications.show({ title: '已接受', message: '交流申請已接受，對話已建立', color: 'green' });
      loadRequests();
    } catch (error) {
      notifications.show({ title: '操作失敗', message: error instanceof Error ? error.message : '請稍後再試', color: 'red' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: JobRequest) => {
    try {
      setProcessing(true);
      const token = getToken();
      if (!token) return;
      await api.jobs.rejectRequest(request.id, {}, token);
      notifications.show({ title: '已拒絕', message: '交流申請已拒絕', color: 'orange' });
      loadRequests();
    } catch (error) {
      notifications.show({ title: '操作失敗', message: error instanceof Error ? error.message : '請稍後再試', color: 'red' });
    } finally {
      setProcessing(false);
    }
  };

  const isReceived = mainTab === 'received';

  const renderSkeleton = () => (
    <Stack gap="md">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} shadow="sm" padding="lg" radius="md" className="glass-card-soft">
          <Group justify="space-between" mb="sm">
            <div style={{ flex: 1 }}>
              <Skeleton height={20} width="50%" radius="md" mb="xs" />
              <Skeleton height={14} width="30%" radius="md" />
            </div>
            <Skeleton height={24} width={60} radius="xl" />
          </Group>
          <Divider my="sm" />
          <Group gap="md">
            <Skeleton height={14} width={100} radius="md" />
            <Skeleton height={14} width={80} radius="md" />
          </Group>
          <Skeleton height={14} width="70%" radius="md" mt="sm" />
        </Card>
      ))}
    </Stack>
  );

  const renderEmptyState = () => (
    <Card shadow="sm" padding="xl" radius="md" className="glass-card-soft" style={{ border: 'none' }}>
      <Stack align="center" gap="md" py="xl">
        {isReceived
          ? <IconInbox size={56} color="var(--mantine-color-blue-3)" stroke={1.5} />
          : <IconSend size={56} color="var(--mantine-color-teal-3)" stroke={1.5} />
        }
        <Text size="lg" fw={600} c="dimmed">
          {isReceived ? '目前沒有收到的交流申請' : '您還沒有發送過交流申請'}
        </Text>
        <Text size="sm" c="dimmed" ta="center" maw={360}>
          {isReceived
            ? '當有人對您發布的職缺感興趣時，會在這裡顯示'
            : '瀏覽職缺列表，對感興趣的職缺發送交流申請'}
        </Text>
        {!isReceived && (
          <Button
            variant="light"
            color="teal"
            radius="xl"
            leftSection={<IconBriefcase size={16} />}
            onClick={() => router.push('/jobs')}
            mt="xs"
          >
            瀏覽職缺
          </Button>
        )}
      </Stack>
    </Card>
  );

  const renderRequestCard = (req: JobRequest, index: number) => {
    const statusInfo = getStatusInfo(req.status);
    const isPending = req.status.toUpperCase() === 'PENDING';

    return (
      <Card
        key={req.id}
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        className="glass-card-soft animate-list-item"
        style={{ animationDelay: `${Math.min(index, 9) * 0.05}s` }}
      >
        <Group justify="space-between" mb="sm" wrap="wrap">
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <Text fw={600} size="lg">{req.job?.title || `職缺 #${req.job_id}`}</Text>
              <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
            </Group>
            <Text size="sm" c="dimmed">{req.job?.company || ''}</Text>
          </div>
          <Group gap="xs">
            <Button variant="subtle" size="sm" leftSection={<IconEye size={16} />}
              onClick={() => { setSelectedRequest(req); setDetailModalOpened(true); }}>
              查看詳情
            </Button>
            {isReceived && isPending && (
              <>
                <Button color="green" size="sm" radius="xl" leftSection={<IconCheck size={16} />}
                  onClick={() => handleAccept(req)} loading={processing}>
                  接受
                </Button>
                <Button color="red" size="sm" radius="xl" variant="light" leftSection={<IconX size={16} />}
                  onClick={() => handleReject(req)} loading={processing}>
                  拒絕
                </Button>
              </>
            )}
          </Group>
        </Group>

        <Divider my="sm" />

        <Group gap="md" wrap="wrap">
          {isReceived && (
            <Group gap={4}>
              <IconUser size={16} />
              <Text size="sm">
                {req.requester?.profile?.display_name || req.requester?.profile?.full_name || req.requester?.email || `用戶 #${req.requester_id}`}
              </Text>
            </Group>
          )}
          <Group gap={4}>
            <IconCalendar size={16} />
            <Text size="sm" c="dimmed">{new Date(req.created_at).toLocaleDateString('zh-TW')}</Text>
          </Group>
        </Group>

        {req.message && (
          <>
            <Divider my="sm" />
            <Text size="sm" lineClamp={2} c="dimmed">{req.message}</Text>
          </>
        )}
      </Card>
    );
  };

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} mb="xs">職缺交流管理</Title>
                <Text c="dimmed">管理職缺交流申請</Text>
              </div>
              <Button variant="subtle" onClick={() => router.push('/jobs')}>
                ← 回到職缺列表
              </Button>
            </Group>

            <Tabs value={mainTab} onChange={setMainTab}>
              <Tabs.List>
                <Tabs.Tab value="received" leftSection={<IconInbox size={16} />}>
                  收到的申請
                </Tabs.Tab>
                <Tabs.Tab value="sent" leftSection={<IconSend size={16} />}>
                  我發出的申請
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <Group>
              <Select
                placeholder="篩選狀態"
                value={statusFilter}
                onChange={setStatusFilter}
                clearable
                data={[
                  { value: 'PENDING', label: '待審核' },
                  { value: 'APPROVED', label: '已接受' },
                  { value: 'REJECTED', label: '已拒絕' },
                ]}
                style={{ width: 150 }}
              />
            </Group>

            {loading ? renderSkeleton() : requests.length === 0 ? renderEmptyState() : (
              <Stack gap="md">
                <Text size="sm" c="dimmed">共 {requests.length} 筆申請</Text>
                {requests.map((req, index) => renderRequestCard(req, index))}
              </Stack>
            )}
          </Stack>
        </Container>

        {/* 申請詳情 Modal */}
        <Modal
          opened={detailModalOpened}
          onClose={() => setDetailModalOpened(false)}
          title="交流申請詳情"
          size="lg"
        >
          {selectedRequest && (
            <Stack gap="md">
              <div>
                <Text fw={600} mb="xs">職缺資訊</Text>
                <Group gap="xs" mb="sm">
                  <IconBriefcase size={16} />
                  <Text>{selectedRequest.job?.title || `職缺 #${selectedRequest.job_id}`}</Text>
                </Group>
                <Text size="sm" c="dimmed" ml={24}>{selectedRequest.job?.company || ''}</Text>
              </div>

              <Divider />

              {isReceived && (
                <>
                  <div>
                    <Text fw={600} mb="xs">申請人資訊</Text>
                    <Group gap="xs" mb="xs">
                      <IconUser size={16} />
                      <Text>
                        {selectedRequest.requester?.profile?.display_name || selectedRequest.requester?.profile?.full_name || selectedRequest.requester?.email || `用戶 #${selectedRequest.requester_id}`}
                      </Text>
                    </Group>
                    {selectedRequest.requester?.email && (
                      <Group gap="xs" mb="xs">
                        <IconMail size={16} />
                        <Text size="sm">{selectedRequest.requester.email}</Text>
                      </Group>
                    )}
                  </div>
                  <Divider />
                </>
              )}

              <div>
                <Text fw={600} mb="xs">申請訊息</Text>
                <Textarea
                  value={selectedRequest.message || '（無附言）'}
                  readOnly
                  minRows={3}
                  styles={{ input: { backgroundColor: 'var(--mantine-color-gray-0)' } }}
                />
              </div>

              {selectedRequest.response_message && (
                <>
                  <Divider />
                  <div>
                    <Text fw={600} mb="xs">回覆訊息</Text>
                    <Text size="sm" c="dimmed">{selectedRequest.response_message}</Text>
                  </div>
                </>
              )}

              <Divider />

              <Group justify="space-between">
                <div>
                  <Text fw={600} mb="xs">申請狀態</Text>
                  <Badge color={getStatusInfo(selectedRequest.status).color} size="lg">
                    {getStatusInfo(selectedRequest.status).label}
                  </Badge>
                </div>
                <Group gap="xs">
                  <IconCalendar size={16} />
                  <Text size="sm" c="dimmed">
                    {new Date(selectedRequest.created_at).toLocaleString('zh-TW')}
                  </Text>
                </Group>
              </Group>

              {isReceived && selectedRequest.status.toUpperCase() === 'PENDING' && (
                <>
                  <Divider />
                  <Group justify="flex-end" gap="sm">
                    <Button color="green" radius="xl" leftSection={<IconCheck size={16} />}
                      onClick={() => { handleAccept(selectedRequest); setDetailModalOpened(false); }}
                      loading={processing}>
                      接受申請
                    </Button>
                    <Button color="red" radius="xl" variant="light" leftSection={<IconX size={16} />}
                      onClick={() => { handleReject(selectedRequest); setDetailModalOpened(false); }}
                      loading={processing}>
                      拒絕申請
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
