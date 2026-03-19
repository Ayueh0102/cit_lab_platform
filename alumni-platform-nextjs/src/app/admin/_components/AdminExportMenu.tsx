'use client';

import { useState } from 'react';
import {
  Button,
  Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUsers,
  IconBriefcase,
  IconCalendarEvent,
  IconBell,
  IconDownload,
  IconChevronDown,
  IconCheck,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

export function AdminExportMenu() {
  const [exportingType, setExportingType] = useState<string | null>(null);

  const handleExportCSV = async (type: string) => {
    try {
      setExportingType(type);
      const token = getToken();
      if (!token) return;

      let blob: Blob;
      let typeName: string;
      switch (type) {
        case 'users':
          blob = await api.csv.exportUsers(token);
          typeName = '使用者';
          break;
        case 'jobs':
          blob = await api.csv.exportJobs(token);
          typeName = '職缺';
          break;
        case 'events':
          blob = await api.csv.exportEvents(token);
          typeName = '活動';
          break;
        case 'bulletins':
          blob = await api.csv.exportBulletins(token);
          typeName = '公告';
          break;
        default:
          throw new Error('不支援的匯出類型');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: '匯出成功',
        message: `${typeName}資料已成功匯出為 CSV 檔案`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: '匯出失敗',
        message: error instanceof Error ? error.message : '無法匯出資料',
        color: 'red',
      });
    } finally {
      setExportingType(null);
    }
  };

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <Button
          variant="gradient"
          gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
          leftSection={<IconDownload size={16} />}
          rightSection={<IconChevronDown size={14} />}
          radius="xl"
          loading={exportingType !== null}
        >
          匯出資料
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>選擇匯出類型</Menu.Label>
        <Menu.Item
          leftSection={<IconUsers size={16} />}
          onClick={() => handleExportCSV('users')}
          disabled={exportingType !== null}
        >
          匯出使用者
        </Menu.Item>
        <Menu.Item
          leftSection={<IconBriefcase size={16} />}
          onClick={() => handleExportCSV('jobs')}
          disabled={exportingType !== null}
        >
          匯出職缺
        </Menu.Item>
        <Menu.Item
          leftSection={<IconCalendarEvent size={16} />}
          onClick={() => handleExportCSV('events')}
          disabled={exportingType !== null}
        >
          匯出活動
        </Menu.Item>
        <Menu.Item
          leftSection={<IconBell size={16} />}
          onClick={() => handleExportCSV('bulletins')}
          disabled={exportingType !== null}
        >
          匯出公告
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
