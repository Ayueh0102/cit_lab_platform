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
  Modal,
  Textarea,
  Button,
  Title,
  Tooltip,
  Skeleton,
  Center,
  Grid,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUserCheck,
  IconUser,
  IconEye,
  IconCheck,
  IconX,
  IconMail,
  IconPhone,
  IconSchool,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { PendingUser } from './types';

interface AdminPendingUsersTabProps {
  onDataChanged: () => void;
}

export function AdminPendingUsersTab({ onDataChanged }: AdminPendingUsersTabProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingUsersLoading, setPendingUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [userDetailModalOpened, setUserDetailModalOpened] = useState(false);
  const [rejectModalOpened, setRejectModalOpened] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPendingUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPendingUsers = async () => {
    try {
      setPendingUsersLoading(true);
      const token = getToken();
      if (!token) return;

      const data = await api.admin.getPendingUsers(token, { page: 1, per_page: 50 });
      setPendingUsers(data.users || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入待審核用戶列表',
        color: 'red',
      });
    } finally {
      setPendingUsersLoading(false);
    }
  };

  const handleViewUserDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setUserDetailModalOpened(true);
  };

  const handleApproveUser = async (userId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.admin.approveUser(userId, token);

      notifications.show({
        title: '審核成功',
        message: '用戶已通過審核，系統已發送通知郵件',
        color: 'green',
      });

      setUserDetailModalOpened(false);
      setSelectedUser(null);
      await loadPendingUsers();
      onDataChanged();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法審核用戶',
        color: 'red',
      });
    }
  };

  const handleOpenRejectModal = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectReason('');
    setRejectModalOpened(true);
  };

  const handleRejectUser = async () => {
    if (!selectedUser) return;

    try {
      const token = getToken();
      if (!token) return;

      await api.admin.rejectUser(selectedUser.id, rejectReason, token);

      notifications.show({
        title: '已拒絕',
        message: '用戶申請已拒絕，系統已發送通知郵件',
        color: 'orange',
      });

      setRejectModalOpened(false);
      setUserDetailModalOpened(false);
      setSelectedUser(null);
      setRejectReason('');
      await loadPendingUsers();
      onDataChanged();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '無法拒絕用戶',
        color: 'red',
      });
    }
  };

  return (
    <>
      <Paper className="glass-card-soft" p="xl" radius="lg">
        <Group justify="space-between" mb="lg">
          <Title order={3} size="h4">
            <Group gap="xs">
              <IconUserCheck size={24} />
              待審核會員申請
            </Group>
          </Title>
          {pendingUsers.length > 0 && (
            <Badge size="lg" variant="light" color="orange">
              {pendingUsers.length} 筆待審核
            </Badge>
          )}
        </Group>

        {pendingUsersLoading ? (
          <Stack gap="sm">
            {[1, 2, 3].map((i) => (
              <Group key={i} gap="md" p="sm">
                <Skeleton height={16} width="15%" radius="xl" />
                <Skeleton height={16} width="25%" radius="xl" />
                <Skeleton height={16} width="10%" radius="xl" />
                <Skeleton height={16} width="10%" radius="xl" />
                <Skeleton height={16} width="15%" radius="xl" />
                <Skeleton height={16} width="12%" radius="xl" />
                <Skeleton height={24} width={80} radius="xl" />
              </Group>
            ))}
          </Stack>
        ) : pendingUsers.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="xs">
              <IconCheck size={48} color="gray" />
              <Text c="dimmed">目前沒有待審核的會員申請</Text>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>姓名</Table.Th>
                <Table.Th>電子郵件</Table.Th>
                <Table.Th>畢業年份</Table.Th>
                <Table.Th>學位</Table.Th>
                <Table.Th>指導教授</Table.Th>
                <Table.Th>申請時間</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pendingUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Text fw={500}>{user.profile?.full_name || '-'}</Text>
                  </Table.Td>
                  <Table.Td>{user.email}</Table.Td>
                  <Table.Td>{user.profile?.graduation_year || '-'}</Table.Td>
                  <Table.Td>
                    {user.profile?.degree === 'master' ? '碩士' :
                     user.profile?.degree === 'phd' ? '博士' : '-'}
                  </Table.Td>
                  <Table.Td>{user.profile?.advisor_1 || '-'}</Table.Td>
                  <Table.Td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-TW') : '-'}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="查看詳情">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleViewUserDetails(user)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="通過">
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handleApproveUser(user.id)}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="拒絕">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleOpenRejectModal(user)}
                        >
                          <IconX size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* 用戶詳情審核 Modal */}
      <Modal
        opened={userDetailModalOpened}
        onClose={() => {
          setUserDetailModalOpened(false);
          setSelectedUser(null);
        }}
        title="會員申請詳情"
        size="lg"
        centered
      >
        {selectedUser && (
          <Stack gap="md">
            <Paper p="md" withBorder radius="md">
              <Group gap="xs" mb="sm">
                <IconMail size={18} color="gray" />
                <Text size="sm" c="dimmed">電子郵件</Text>
              </Group>
              <Text fw={500}>{selectedUser.email}</Text>
            </Paper>

            <Grid>
              <Grid.Col span={6}>
                <Paper p="md" withBorder radius="md">
                  <Group gap="xs" mb="sm">
                    <IconUser size={18} color="gray" />
                    <Text size="sm" c="dimmed">姓名</Text>
                  </Group>
                  <Text fw={500}>{selectedUser.profile?.full_name || '-'}</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" withBorder radius="md">
                  <Group gap="xs" mb="sm">
                    <IconPhone size={18} color="gray" />
                    <Text size="sm" c="dimmed">聯絡電話</Text>
                  </Group>
                  <Text fw={500}>{selectedUser.profile?.phone || '-'}</Text>
                </Paper>
              </Grid.Col>
            </Grid>

            <Paper p="md" withBorder bg="blue.0" radius="md">
              <Group gap="xs" mb="sm">
                <IconSchool size={18} color="blue" />
                <Text size="sm" fw={600} c="blue">學籍資料</Text>
              </Group>
              <Grid>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed">畢業年份</Text>
                  <Text fw={500}>{selectedUser.profile?.graduation_year || '-'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed">屆數</Text>
                  <Text fw={500}>{selectedUser.profile?.class_year ? `第 ${selectedUser.profile.class_year} 屆` : '-'}</Text>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Text size="xs" c="dimmed">學位</Text>
                  <Text fw={500}>
                    {selectedUser.profile?.degree === 'master' ? '碩士' :
                     selectedUser.profile?.degree === 'phd' ? '博士' : '-'}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">學號</Text>
                  <Text fw={500}>{selectedUser.profile?.student_id || '-'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">主修</Text>
                  <Text fw={500}>{selectedUser.profile?.major || '-'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper p="md" withBorder radius="md">
              <Text size="sm" c="dimmed" mb="xs">指導教授</Text>
              <Text fw={500}>
                {selectedUser.profile?.advisor_1 || '-'}
                {selectedUser.profile?.advisor_2 && ` / ${selectedUser.profile.advisor_2}`}
              </Text>
            </Paper>

            {selectedUser.profile?.thesis_title && (
              <Paper p="md" withBorder radius="md">
                <Text size="sm" c="dimmed" mb="xs">論文題目</Text>
                <Text fw={500}>{selectedUser.profile.thesis_title}</Text>
              </Paper>
            )}

            <Paper p="md" withBorder bg="gray.0" radius="md">
              <Text size="sm" c="dimmed" mb="xs">申請時間</Text>
              <Text fw={500}>
                {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('zh-TW') : '-'}
              </Text>
            </Paper>

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                color="red"
                leftSection={<IconX size={16} />}
                onClick={() => handleOpenRejectModal(selectedUser)}
                radius="xl"
              >
                拒絕申請
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={() => handleApproveUser(selectedUser.id)}
                radius="xl"
              >
                通過審核
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* 拒絕原因 Modal */}
      <Modal
        opened={rejectModalOpened}
        onClose={() => {
          setRejectModalOpened(false);
          setRejectReason('');
        }}
        title="拒絕會員申請"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            請輸入拒絕原因（將發送給申請人）：
          </Text>
          <Textarea
            placeholder="例如：無法驗證您的系友身份，請提供更多證明..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setRejectModalOpened(false)} radius="xl">
              取消
            </Button>
            <Button color="red" onClick={handleRejectUser} radius="xl">
              確認拒絕
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
