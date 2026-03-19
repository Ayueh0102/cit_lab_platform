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
  TextInput,
  Textarea,
  Select,
  Button,
  Loader,
  Center,
  Tooltip,
  Divider,
  Title,
  Code,
  NumberInput,
  Switch,
  Grid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSettings,
  IconPlus,
  IconCheck,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { SystemSetting } from './types';

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Map<string, string>>(new Map());
  const [savingSettingKey, setSavingSettingKey] = useState<string | null>(null);
  const [newSettingModalOpened, setNewSettingModalOpened] = useState(false);
  const [newSetting, setNewSetting] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'string',
    category: '',
    name: '',
    description: '',
    is_public: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const token = getToken();
      if (!token) return;

      const data = await api.systemSettings.getAll(token);
      setSettings(data.settings || data.data || []);
      setEditingSettings(new Map());
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入系統設定',
        color: 'red',
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string) => {
    const newValue = editingSettings.get(key);
    if (newValue === undefined) return;

    try {
      setSavingSettingKey(key);
      const token = getToken();
      if (!token) return;

      await api.systemSettings.update(key, { setting_value: newValue }, token);

      notifications.show({
        title: '更新成功',
        message: `設定「${key}」已成功更新`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // 更新本地狀態
      setSettings((prev) =>
        prev.map((s) =>
          s.setting_key === key ? { ...s, setting_value: newValue } : s
        )
      );
      setEditingSettings((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    } catch (error) {
      notifications.show({
        title: '更新失敗',
        message: error instanceof Error ? error.message : '無法更新設定',
        color: 'red',
      });
    } finally {
      setSavingSettingKey(null);
    }
  };

  const handleCreateSetting = async () => {
    if (!newSetting.setting_key.trim() || !newSetting.name.trim()) {
      notifications.show({
        title: '欄位不完整',
        message: '請填寫設定鍵值和名稱',
        color: 'orange',
      });
      return;
    }

    try {
      const token = getToken();
      if (!token) return;

      await api.systemSettings.create({
        setting_key: newSetting.setting_key,
        setting_value: newSetting.setting_value,
        setting_type: newSetting.setting_type,
        category: newSetting.category,
        name: newSetting.name,
        description: newSetting.description,
        is_public: newSetting.is_public,
      }, token);

      notifications.show({
        title: '新增成功',
        message: `設定「${newSetting.name}」已成功建立`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      setNewSettingModalOpened(false);
      setNewSetting({
        setting_key: '',
        setting_value: '',
        setting_type: 'string',
        category: '',
        name: '',
        description: '',
        is_public: false,
      });
      await loadSettings();
    } catch (error) {
      notifications.show({
        title: '新增失敗',
        message: error instanceof Error ? error.message : '無法新增設定',
        color: 'red',
      });
    }
  };

  const resetNewSetting = () => {
    setNewSettingModalOpened(false);
    setNewSetting({
      setting_key: '',
      setting_value: '',
      setting_type: 'string',
      category: '',
      name: '',
      description: '',
      is_public: false,
    });
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3} size="h4">
            <Group gap="xs">
              <IconSettings size={24} />
              系統設定管理
            </Group>
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="gradient"
            gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
            radius="xl"
            onClick={() => setNewSettingModalOpened(true)}
          >
            新增設定
          </Button>
        </Group>

        {settingsLoading ? (
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        ) : settings.length === 0 ? (
          <Center h={200}>
            <Stack align="center" gap="xs">
              <IconSettings size={48} color="gray" />
              <Text c="dimmed">尚無系統設定</Text>
            </Stack>
          </Center>
        ) : (
          <Paper className="glass-card-soft" p="md" radius="lg">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>設定名稱</Table.Th>
                  <Table.Th>分類</Table.Th>
                  <Table.Th>值</Table.Th>
                  <Table.Th>類型</Table.Th>
                  <Table.Th>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {settings.map((setting) => (
                  <Table.Tr
                    key={setting.setting_key}
                    style={!setting.is_editable ? { opacity: 0.6 } : undefined}
                  >
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={500} size="sm">{setting.name || setting.setting_key}</Text>
                        {setting.description && (
                          <Text size="xs" c="dimmed">{setting.description}</Text>
                        )}
                        <Group gap={4}>
                          <Code>{setting.setting_key}</Code>
                          {setting.is_public && (
                            <Badge size="xs" variant="light" color="blue">公開</Badge>
                          )}
                          {!setting.is_editable && (
                            <Badge size="xs" variant="light" color="gray">唯讀</Badge>
                          )}
                        </Group>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {setting.category || '未分類'}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ minWidth: 200 }}>
                      {!setting.is_editable ? (
                        <Text size="sm" c="dimmed">{setting.setting_value}</Text>
                      ) : setting.setting_type === 'bool' ? (
                        <Switch
                          checked={
                            editingSettings.has(setting.setting_key)
                              ? editingSettings.get(setting.setting_key) === 'true'
                              : setting.setting_value === 'true'
                          }
                          onChange={(e) => {
                            const val = e.currentTarget.checked ? 'true' : 'false';
                            setEditingSettings((prev) => {
                              const next = new Map(prev);
                              next.set(setting.setting_key, val);
                              return next;
                            });
                          }}
                          size="sm"
                        />
                      ) : setting.setting_type === 'int' ? (
                        <NumberInput
                          size="xs"
                          value={
                            editingSettings.has(setting.setting_key)
                              ? Number(editingSettings.get(setting.setting_key))
                              : Number(setting.setting_value) || 0
                          }
                          onChange={(val) => {
                            setEditingSettings((prev) => {
                              const next = new Map(prev);
                              next.set(setting.setting_key, String(val));
                              return next;
                            });
                          }}
                          style={{ maxWidth: 150 }}
                        />
                      ) : setting.setting_type === 'json' ? (
                        <Textarea
                          size="xs"
                          value={
                            editingSettings.has(setting.setting_key)
                              ? editingSettings.get(setting.setting_key)
                              : setting.setting_value
                          }
                          onChange={(e) => {
                            setEditingSettings((prev) => {
                              const next = new Map(prev);
                              next.set(setting.setting_key, e.currentTarget.value);
                              return next;
                            });
                          }}
                          minRows={2}
                          autosize
                          maxRows={4}
                          style={{ maxWidth: 300 }}
                        />
                      ) : (
                        <TextInput
                          size="xs"
                          value={
                            editingSettings.has(setting.setting_key)
                              ? editingSettings.get(setting.setting_key)
                              : setting.setting_value
                          }
                          onChange={(e) => {
                            setEditingSettings((prev) => {
                              const next = new Map(prev);
                              next.set(setting.setting_key, e.currentTarget.value);
                              return next;
                            });
                          }}
                        />
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        variant="outline"
                        color={
                          setting.setting_type === 'bool' ? 'teal' :
                          setting.setting_type === 'int' ? 'blue' :
                          setting.setting_type === 'json' ? 'grape' : 'gray'
                        }
                      >
                        {setting.setting_type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {setting.is_editable && editingSettings.has(setting.setting_key) && (
                        <Tooltip label="儲存變更">
                          <ActionIcon
                            variant="light"
                            color="green"
                            onClick={() => handleUpdateSetting(setting.setting_key)}
                            loading={savingSettingKey === setting.setting_key}
                          >
                            <IconDeviceFloppy size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>

      {/* 新增系統設定 Modal */}
      <Modal
        opened={newSettingModalOpened}
        onClose={resetNewSetting}
        title={
          <Group gap="xs">
            <IconSettings size={20} />
            <Text fw={600}>新增系統設定</Text>
          </Group>
        }
        centered
        size="lg"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="設定鍵值 (Key)"
                placeholder="例如：site_name"
                value={newSetting.setting_key}
                onChange={(e) => setNewSetting({ ...newSetting, setting_key: e.currentTarget.value })}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="設定名稱"
                placeholder="例如：網站名稱"
                value={newSetting.name}
                onChange={(e) => setNewSetting({ ...newSetting, name: e.currentTarget.value })}
                required
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="值類型"
                data={[
                  { value: 'string', label: '字串 (string)' },
                  { value: 'int', label: '整數 (int)' },
                  { value: 'bool', label: '布林 (bool)' },
                  { value: 'json', label: 'JSON' },
                ]}
                value={newSetting.setting_type}
                onChange={(value) => setNewSetting({ ...newSetting, setting_type: value || 'string' })}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="分類"
                placeholder="例如：general, email, notification"
                value={newSetting.category}
                onChange={(e) => setNewSetting({ ...newSetting, category: e.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>

          {newSetting.setting_type === 'bool' ? (
            <Switch
              label="設定值"
              checked={newSetting.setting_value === 'true'}
              onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.currentTarget.checked ? 'true' : 'false' })}
            />
          ) : newSetting.setting_type === 'json' ? (
            <Textarea
              label="設定值"
              placeholder='例如：{"key": "value"}'
              value={newSetting.setting_value}
              onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.currentTarget.value })}
              minRows={3}
              autosize
            />
          ) : newSetting.setting_type === 'int' ? (
            <NumberInput
              label="設定值"
              placeholder="請輸入整數值"
              value={newSetting.setting_value ? Number(newSetting.setting_value) : ''}
              onChange={(val) => setNewSetting({ ...newSetting, setting_value: String(val) })}
            />
          ) : (
            <TextInput
              label="設定值"
              placeholder="請輸入設定值"
              value={newSetting.setting_value}
              onChange={(e) => setNewSetting({ ...newSetting, setting_value: e.currentTarget.value })}
            />
          )}

          <Textarea
            label="說明"
            placeholder="描述這個設定的用途..."
            value={newSetting.description}
            onChange={(e) => setNewSetting({ ...newSetting, description: e.currentTarget.value })}
            minRows={2}
          />

          <Switch
            label="是否為公開設定（不需要登入即可讀取）"
            checked={newSetting.is_public}
            onChange={(e) => setNewSetting({ ...newSetting, is_public: e.currentTarget.checked })}
          />

          <Divider />

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={resetNewSetting}
              radius="xl"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateSetting}
              leftSection={<IconPlus size={16} />}
              variant="gradient"
              gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
              radius="xl"
            >
              建立設定
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
