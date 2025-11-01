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
  Loader,
  Center,
  Tabs,
  Divider,
  Modal,
  Textarea,
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
    };
  };
}

export default function JobApplicationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('all');
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let status: string | undefined;
      if (activeTab === 'pending') {
        status = 'PENDING';
      } else if (activeTab === 'accepted') {
        status = 'APPROVED';
      } else if (activeTab === 'rejected') {
        status = 'REJECTED';
      }

      const url = status
        ? `/api/v2/job-requests/received?status=${status}`
        : '/api/v2/job-requests/received';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${url}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('無法載入申請列表');
      }

      const data = await response.json();
      const requests = (data.requests || []).map((req: any) => ({
        ...req,
        job: req.job || {
          id: req.job_id,
          title: req.job_title || `職缺 #${req.job_id}`,
          company: req.company || '未知公司',
        },
        requester: req.requester || {
          id: req.requester_id,
          email: req.requester_email || '',
          profile: {
            display_name: req.requester_name,
            full_name: req.requester_name,
          },
        },
        status: req.status || 'PENDING',
      }));
      setRequests(requests);
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v2/job-requests/${request.id}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '無法接受申請');
      }

      notifications.show({
        title: '接受成功',
        message: '申請已接受',
        color: 'green',
      });

      loadRequests();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: JobRequest) => {
    try {
      setProcessing(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v2/job-requests/${request.id}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '無法拒絕申請');
      }

      notifications.show({
        title: '拒絕成功',
        message: '申請已拒絕',
        color: 'orange',
      });

      loadRequests();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDetailModal = (request: JobRequest) => {
    setSelectedRequest(request);
    setDetailModalOpened(true);
  };

  const statusMap: { [key: string]: { label: string; color: string } } = {
    PENDING: { label: '待審核', color: 'yellow' },
    ACCEPTED: { label: '已接受', color: 'green' },
    APPROVED: { label: '已接受', color: 'green' },
    REJECTED: { label: '已拒絕', color: 'red' },
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Center style={{ minHeight: '60vh' }}>
            <Loader size="xl" />
          </Center>
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
                  職缺申請管理
                </Title>
                <Text c="dimmed">管理您發布的職缺收到的申請</Text>
              </div>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="all">全部申請</Tabs.Tab>
                <Tabs.Tab value="pending">待審核</Tabs.Tab>
                <Tabs.Tab value="accepted">已接受</Tabs.Tab>
                <Tabs.Tab value="rejected">已拒絕</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="all" pt="xl">
                {requests.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有申請記錄</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {requests.map((req) => (
                      <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="sm">
                          <div>
                            <Group gap="xs" mb="xs">
                              <Text fw={500} size="lg">
                                {req.job?.title || `職缺 #${req.job_id}`}
                              </Text>
                              <Badge color={statusMap[req.status]?.color || 'gray'}>
                                {statusMap[req.status]?.label || req.status}
                              </Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                              {req.job?.company || '未知公司'}
                            </Text>
                          </div>
                          <Group gap="xs">
                            <Button
                              variant="subtle"
                              size="sm"
                              leftSection={<IconEye size={16} />}
                              onClick={() => openDetailModal(req)}
                            >
                              查看詳情
                            </Button>
                            {(req.status === 'PENDING' || req.status === 'pending' || req.status?.toUpperCase() === 'PENDING') && (
                              <>
                                <Button
                                  color="green"
                                  size="sm"
                                  leftSection={<IconCheck size={16} />}
                                  onClick={() => handleAccept(req)}
                                  loading={processing}
                                >
                                  接受
                                </Button>
                                <Button
                                  color="red"
                                  size="sm"
                                  variant="light"
                                  leftSection={<IconX size={16} />}
                                  onClick={() => handleReject(req)}
                                  loading={processing}
                                >
                                  拒絕
                                </Button>
                              </>
                            )}
                          </Group>
                        </Group>

                        <Divider my="sm" />

                        <Group gap="md">
                          <Group gap={4}>
                            <IconUser size={16} />
                            <Text size="sm">
                              {req.requester?.profile?.display_name ||
                                req.requester?.profile?.full_name ||
                                req.requester?.email ||
                                `用戶 #${req.requester_id}`}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <IconCalendar size={16} />
                            <Text size="sm" c="dimmed">
                              {new Date(req.created_at).toLocaleDateString('zh-TW')}
                            </Text>
                          </Group>
                        </Group>

                        {req.message && (
                          <>
                            <Divider my="sm" />
                            <Text size="sm" lineClamp={2} c="dimmed">
                              {req.message}
                            </Text>
                          </>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="pending" pt="xl">
                {requests.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有待審核的申請</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {requests.map((req) => (
                      <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="sm">
                          <div>
                            <Group gap="xs" mb="xs">
                              <Text fw={500} size="lg">
                                {req.job?.title || `職缺 #${req.job_id}`}
                              </Text>
                              <Badge color="yellow">待審核</Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                              {req.job?.company || '未知公司'}
                            </Text>
                          </div>
                          <Group gap="xs">
                            <Button
                              variant="subtle"
                              size="sm"
                              leftSection={<IconEye size={16} />}
                              onClick={() => openDetailModal(req)}
                            >
                              查看詳情
                            </Button>
                            <Button
                              color="green"
                              size="sm"
                              leftSection={<IconCheck size={16} />}
                              onClick={() => handleAccept(req)}
                              loading={processing}
                            >
                              接受
                            </Button>
                            <Button
                              color="red"
                              size="sm"
                              variant="light"
                              leftSection={<IconX size={16} />}
                              onClick={() => handleReject(req)}
                              loading={processing}
                            >
                              拒絕
                            </Button>
                          </Group>
                        </Group>

                        <Divider my="sm" />

                        <Group gap="md">
                          <Group gap={4}>
                            <IconUser size={16} />
                            <Text size="sm">
                              {req.requester?.profile?.display_name ||
                                req.requester?.profile?.full_name ||
                                req.requester?.email ||
                                `用戶 #${req.requester_id}`}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <IconCalendar size={16} />
                            <Text size="sm" c="dimmed">
                              {new Date(req.created_at).toLocaleDateString('zh-TW')}
                            </Text>
                          </Group>
                        </Group>

                        {req.message && (
                          <>
                            <Divider my="sm" />
                            <Text size="sm" lineClamp={2} c="dimmed">
                              {req.message}
                            </Text>
                          </>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="accepted" pt="xl">
                {requests.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有已接受的申請</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {requests.map((req) => (
                      <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="sm">
                          <div>
                            <Group gap="xs" mb="xs">
                              <Text fw={500} size="lg">
                                {req.job?.title || `職缺 #${req.job_id}`}
                              </Text>
                              <Badge color="green">已接受</Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                              {req.job?.company || '未知公司'}
                            </Text>
                          </div>
                          <Button
                            variant="subtle"
                            size="sm"
                            leftSection={<IconEye size={16} />}
                            onClick={() => openDetailModal(req)}
                          >
                            查看詳情
                          </Button>
                        </Group>

                        <Divider my="sm" />

                        <Group gap="md">
                          <Group gap={4}>
                            <IconUser size={16} />
                            <Text size="sm">
                              {req.requester?.profile?.display_name ||
                                req.requester?.profile?.full_name ||
                                req.requester?.email ||
                                `用戶 #${req.requester_id}`}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <IconCalendar size={16} />
                            <Text size="sm" c="dimmed">
                              {new Date(req.created_at).toLocaleDateString('zh-TW')}
                            </Text>
                          </Group>
                        </Group>

                        {req.message && (
                          <>
                            <Divider my="sm" />
                            <Text size="sm" lineClamp={2} c="dimmed">
                              {req.message}
                            </Text>
                          </>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="rejected" pt="xl">
                {requests.length === 0 ? (
                  <Center py="xl">
                    <Text c="dimmed">目前沒有已拒絕的申請</Text>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {requests.map((req) => (
                      <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="sm">
                          <div>
                            <Group gap="xs" mb="xs">
                              <Text fw={500} size="lg">
                                {req.job?.title || `職缺 #${req.job_id}`}
                              </Text>
                              <Badge color="red">已拒絕</Badge>
                            </Group>
                            <Text size="sm" c="dimmed">
                              {req.job?.company || '未知公司'}
                            </Text>
                          </div>
                          <Button
                            variant="subtle"
                            size="sm"
                            leftSection={<IconEye size={16} />}
                            onClick={() => openDetailModal(req)}
                          >
                            查看詳情
                          </Button>
                        </Group>

                        <Divider my="sm" />

                        <Group gap="md">
                          <Group gap={4}>
                            <IconUser size={16} />
                            <Text size="sm">
                              {req.requester?.profile?.display_name ||
                                req.requester?.profile?.full_name ||
                                req.requester?.email ||
                                `用戶 #${req.requester_id}`}
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <IconCalendar size={16} />
                            <Text size="sm" c="dimmed">
                              {new Date(req.created_at).toLocaleDateString('zh-TW')}
                            </Text>
                          </Group>
                        </Group>

                        {req.message && (
                          <>
                            <Divider my="sm" />
                            <Text size="sm" lineClamp={2} c="dimmed">
                              {req.message}
                            </Text>
                          </>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 申請詳情 Modal */}
        <Modal
          opened={detailModalOpened}
          onClose={() => setDetailModalOpened(false)}
          title="申請詳情"
          size="lg"
        >
          {selectedRequest && (
            <Stack gap="md">
              <div>
                <Text fw={600} mb="xs">
                  職缺資訊
                </Text>
                <Group gap="xs" mb="sm">
                  <IconBriefcase size={16} />
                  <Text>{selectedRequest.job?.title || `職缺 #${selectedRequest.job_id}`}</Text>
                </Group>
                <Text size="sm" c="dimmed" ml={24}>
                  {selectedRequest.job?.company || '未知公司'}
                </Text>
              </div>

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  申請人資訊
                </Text>
                <Group gap="xs" mb="xs">
                  <IconUser size={16} />
                  <Text>
                    {selectedRequest.requester?.profile?.display_name ||
                      selectedRequest.requester?.profile?.full_name ||
                      selectedRequest.requester?.email ||
                      `用戶 #${selectedRequest.requester_id}`}
                  </Text>
                </Group>
                {selectedRequest.requester?.email && (
                  <Group gap="xs" mb="xs">
                    <IconMail size={16} />
                    <Text size="sm">{selectedRequest.requester.email}</Text>
                  </Group>
                )}
                {selectedRequest.requester?.profile?.phone && (
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text size="sm">{selectedRequest.requester.profile.phone}</Text>
                  </Group>
                )}
              </div>

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  申請訊息
                </Text>
                <Textarea
                  value={selectedRequest.message || '無'}
                  readOnly
                  minRows={4}
                  styles={{ input: { backgroundColor: '#f5f5f5' } }}
                />
              </div>

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  申請狀態
                </Text>
                <Badge color={statusMap[selectedRequest.status]?.color || 'gray'} size="lg">
                  {statusMap[selectedRequest.status]?.label || selectedRequest.status}
                </Badge>
              </div>

              <Group gap="xs">
                <IconCalendar size={16} />
                <Text size="sm" c="dimmed">
                  申請時間: {new Date(selectedRequest.created_at).toLocaleString('zh-TW')}
                </Text>
              </Group>

              {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'pending' || selectedRequest.status?.toUpperCase() === 'PENDING') && (
                <>
                  <Divider />
                  <Group justify="flex-end" gap="sm">
                    <Button
                      color="green"
                      leftSection={<IconCheck size={16} />}
                      onClick={() => {
                        handleAccept(selectedRequest);
                        setDetailModalOpened(false);
                      }}
                      loading={processing}
                    >
                      接受申請
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      leftSection={<IconX size={16} />}
                      onClick={() => {
                        handleReject(selectedRequest);
                        setDetailModalOpened(false);
                      }}
                      loading={processing}
                    >
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
