'use client';

import { useState } from 'react';
import {
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Button,
  Tooltip,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { getUser, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from './types';

interface AdminUsersTabProps {
  users: User[];
  onUsersChanged: (users: User[]) => void;
  onDataChanged: () => void;
}

export function AdminUsersTab({ users, onUsersChanged, onDataChanged }: AdminUsersTabProps) {
  const router = useRouter();
  const [usersSearch, setUsersSearch] = useState('');
  const [editUserModalOpened, setEditUserModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserRole, setEditUserRole] = useState<string>('');
  const [editUserStatus, setEditUserStatus] = useState<string>('');

  const filteredUsers = usersSearch.trim()
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(usersSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(usersSearch.toLowerCase())
      )
    : users;

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserRole(user.role);
    setEditUserStatus(user.is_active ? 'active' : 'inactive');
    setEditUserModalOpened(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const currentUser = getUser();

    // 檢查是否在修改自己的權限
    if (editingUser.id === currentUser?.id) {
      if (currentUser.role === 'admin' && editUserRole === 'user') {
        if (!confirm('警告：您即將移除自己的管理員權限，這將導致您無法再訪問管理後台。確定要繼續嗎？')) {
          return;
        }
      }

      if (editUserStatus === 'inactive' || editUserStatus === 'suspended') {
        if (!confirm('警告：您即將停用自己的帳號，這將導致您無法登入。確定要繼續嗎？')) {
          return;
        }
      }
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.admin.updateUser(editingUser.id, {
        role: editUserRole,
        status: editUserStatus,
      }, token);

      notifications.show({
        title: '更新成功',
        message: '用戶權限已成功更新',
        color: 'green',
      });

      // 如果修改的是自己的權限，需要重新登入
      if (editingUser.id === currentUser?.id) {
        if (editUserRole === 'user' || editUserStatus !== 'active') {
          notifications.show({
            title: '權限已變更',
            message: '您的權限已變更，請重新登入',
            color: 'orange',
          });
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
          return;
        }
      }

      // 重新載入用戶列表
      const usersData = await api.admin.getUsers(token, { page: 1, per_page: 50 });
      onUsersChanged(usersData.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.display_name || u.email.split('@')[0],
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
      })));

      onDataChanged();

      setEditUserModalOpened(false);
      setEditingUser(null);
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '無法更新用戶權限',
        color: 'red',
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('確定要刪除此用戶嗎？')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.admin.deleteUser(userId, token);
      onUsersChanged(users.filter((u) => u.id !== userId));
      onDataChanged();

      notifications.show({
        title: '刪除成功',
        message: '用戶已刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除用戶',
        color: 'red',
      });
    }
  };

  return (
    <>
      <Stack gap="md">
        <Group>
          <TextInput
            placeholder="搜尋用戶（姓名或 Email）..."
            leftSection={<IconSearch size={16} />}
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Text size="sm" c="dimmed">
            共 {filteredUsers.length} 筆
          </Text>
        </Group>
        <Paper className="glass-card-soft" p="md" radius="lg">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>姓名</Table.Th>
                <Table.Th>電子郵件</Table.Th>
                <Table.Th>角色</Table.Th>
                <Table.Th>狀態</Table.Th>
                <Table.Th>註冊日期</Table.Th>
                <Table.Th>操作</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>{user.id}</Table.Td>
                  <Table.Td>
                    <Text fw={500}>{user.full_name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={user.role === 'admin' ? 'grape' : 'blue'}
                      variant="light"
                    >
                      {user.role === 'admin' ? '管理員' : '系友'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={user.is_active ? 'green' : 'gray'}
                      variant="light"
                    >
                      {user.is_active ? '活躍' : '停用'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {new Date(user.created_at).toLocaleDateString('zh-TW')}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="編輯權限">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEditUser(user)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="刪除用戶">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filteredUsers.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Text c="dimmed">
                        {usersSearch.trim() ? '找不到符合條件的用戶' : '尚無用戶資料'}
                      </Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>

      {/* 編輯用戶權限 Modal */}
      <Modal
        opened={editUserModalOpened}
        onClose={() => {
          setEditUserModalOpened(false);
          setEditingUser(null);
        }}
        title="編輯用戶權限"
        centered
      >
        {editingUser && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">用戶</Text>
              <Text fw={500}>{editingUser.full_name} ({editingUser.email})</Text>
            </div>

            <Select
              label="角色"
              data={[
                { value: 'user', label: '系友' },
                { value: 'admin', label: '管理員' },
              ]}
              value={editUserRole}
              onChange={(value) => value && setEditUserRole(value)}
            />

            <Select
              label="狀態"
              data={[
                { value: 'active', label: '活躍' },
                { value: 'inactive', label: '停用' },
                { value: 'suspended', label: '暫停' },
              ]}
              value={editUserStatus}
              onChange={(value) => value && setEditUserStatus(value)}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setEditUserModalOpened(false);
                  setEditingUser(null);
                }}
                radius="xl"
              >
                取消
              </Button>
              <Button onClick={handleUpdateUser} radius="xl">
                儲存
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
