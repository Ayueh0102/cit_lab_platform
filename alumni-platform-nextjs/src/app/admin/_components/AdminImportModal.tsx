'use client';

import { useState, useCallback } from 'react';
import {
  Text,
  Stack,
  Group,
  Button,
  Modal,
  Select,
  FileInput,
  Alert,
  Divider,
  List,
  Code,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconFileTypeCsv,
  IconFileDownload,
} from '@tabler/icons-react';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { ImportResult, CSV_FIELD_DESCRIPTIONS } from './types';

interface AdminImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export function AdminImportModal({ opened, onClose, onImportSuccess }: AdminImportModalProps) {
  const [importType, setImportType] = useState<string>('users');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleCloseImport = useCallback(() => {
    onClose();
    setImportFile(null);
    setImportResult(null);
  }, [onClose]);

  const handleDownloadTemplate = (type: string) => {
    const fieldInfo = CSV_FIELD_DESCRIPTIONS[type];
    if (!fieldInfo) return;

    // 產生 CSV 範本（只有標題行 + 一行範例）
    const header = fieldInfo.fields.join(',');
    let exampleRow = '';
    switch (type) {
      case 'users':
        exampleRow = 'alumni@example.com,王小明,小明,0912345678,2020,108,master,資訊工程,,,,';
        break;
      case 'jobs':
        exampleRow = '軟體工程師,台積電,新竹市,負責系統開發,3年以上經驗,80K-120K,full_time,hr@example.com';
        break;
      case 'events':
        exampleRow = '校友聚餐,年度校友聚餐活動,2026-06-15 18:00,2026-06-15 21:00,台北市信義區,50,false,reunion';
        break;
      case 'bulletins':
        exampleRow = '系統公告,這是一則系統公告的內容,announcement,一般,false';
        break;
    }

    const csvContent = `\uFEFF${header}\n${exampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notifications.show({
      title: '範本已下載',
      message: '請依照範本格式填寫資料後匯入',
      color: 'blue',
    });
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      notifications.show({
        title: '請選擇檔案',
        message: '請選擇要匯入的 CSV 檔案',
        color: 'orange',
      });
      return;
    }

    // 驗證檔案類型
    if (!importFile.name.toLowerCase().endsWith('.csv')) {
      notifications.show({
        title: '檔案格式錯誤',
        message: '請選擇 .csv 格式的檔案',
        color: 'red',
      });
      return;
    }

    try {
      setUploading(true);
      setImportResult(null);
      const token = getToken();
      if (!token) return;

      let result: any;
      switch (importType) {
        case 'users':
          result = await api.csv.importUsers(importFile, token);
          break;
        case 'jobs':
          result = await api.csv.importJobs(importFile, token);
          break;
        case 'events':
          result = await api.csv.importEvents(importFile, token);
          break;
        case 'bulletins':
          result = await api.csv.importBulletins(importFile, token);
          break;
        default:
          throw new Error('不支援的匯入類型');
      }

      // 解析匯入結果
      const importResultData: ImportResult = {
        imported: result.imported || result.count || result.total || 0,
        created: result.created || 0,
        updated: result.updated || 0,
        failed: result.failed || result.errors?.length || 0,
        errors: result.errors || [],
      };

      setImportResult(importResultData);

      const totalSuccess = importResultData.imported || (importResultData.created || 0) + (importResultData.updated || 0);

      if (importResultData.failed && importResultData.failed > 0) {
        notifications.show({
          title: '匯入完成（部分失敗）',
          message: `成功 ${totalSuccess} 筆，失敗 ${importResultData.failed} 筆`,
          color: 'orange',
          icon: <IconAlertCircle size={16} />,
        });
      } else {
        notifications.show({
          title: '匯入成功',
          message: `成功匯入 ${totalSuccess} 筆資料`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
      }

      setImportFile(null);
      onImportSuccess();
    } catch (error) {
      notifications.show({
        title: '匯入失敗',
        message: error instanceof Error ? error.message : '無法匯入資料',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCloseImport}
      title={
        <Group gap="xs">
          <IconUpload size={20} />
          <Text fw={600}>匯入資料</Text>
        </Group>
      }
      centered
      size="lg"
    >
      <Stack gap="md">
        <Select
          label="資料類型"
          placeholder="選擇要匯入的資料類型"
          data={[
            { value: 'users', label: '使用者資料' },
            { value: 'jobs', label: '職缺資料' },
            { value: 'events', label: '活動資料' },
            { value: 'bulletins', label: '公告資料' },
          ]}
          value={importType}
          onChange={(value) => {
            setImportType(value || 'users');
            setImportResult(null);
          }}
        />

        {/* CSV 欄位說明 */}
        <Alert
          variant="light"
          color="blue"
          title="CSV 格式說明"
          icon={<IconInfoCircle size={16} />}
          radius="md"
        >
          <Text size="sm" mb="xs">
            {CSV_FIELD_DESCRIPTIONS[importType]?.description}
          </Text>
          <Divider my="xs" />
          <Text size="xs" fw={600} mb={4}>欄位清單：</Text>
          <Group gap={4} wrap="wrap">
            {CSV_FIELD_DESCRIPTIONS[importType]?.fields.map((field) => (
              <Code
                key={field}
                color={CSV_FIELD_DESCRIPTIONS[importType]?.required.includes(field) ? 'red' : undefined}
              >
                {field}{CSV_FIELD_DESCRIPTIONS[importType]?.required.includes(field) ? '*' : ''}
              </Code>
            ))}
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            標示 * 的為必填欄位
          </Text>
        </Alert>

        {/* 下載範本按鈕 */}
        <Button
          variant="subtle"
          color="blue"
          leftSection={<IconFileDownload size={16} />}
          onClick={() => handleDownloadTemplate(importType)}
          size="sm"
        >
          下載 CSV 範本（{importType === 'users' ? '使用者' : importType === 'jobs' ? '職缺' : importType === 'events' ? '活動' : '公告'}）
        </Button>

        <FileInput
          label="選擇 CSV 檔案"
          placeholder="點擊選擇 .csv 檔案"
          accept=".csv"
          value={importFile}
          onChange={(file) => {
            setImportFile(file);
            setImportResult(null);
          }}
          leftSection={<IconFileTypeCsv size={16} />}
          description="僅支援 .csv 格式，建議使用 UTF-8 編碼"
        />

        {/* 匯入結果摘要 */}
        {importResult && (
          <Alert
            variant="light"
            color={importResult.failed && importResult.failed > 0 ? 'orange' : 'green'}
            title="匯入結果"
            icon={importResult.failed && importResult.failed > 0 ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
            radius="md"
          >
            <Stack gap="xs">
              <Group gap="xl">
                {(importResult.created !== undefined && importResult.created > 0) && (
                  <div>
                    <Text size="xs" c="dimmed">新增</Text>
                    <Text fw={700} c="green">{importResult.created} 筆</Text>
                  </div>
                )}
                {(importResult.updated !== undefined && importResult.updated > 0) && (
                  <div>
                    <Text size="xs" c="dimmed">更新</Text>
                    <Text fw={700} c="blue">{importResult.updated} 筆</Text>
                  </div>
                )}
                {importResult.imported !== undefined && importResult.imported > 0 && !importResult.created && !importResult.updated && (
                  <div>
                    <Text size="xs" c="dimmed">成功匯入</Text>
                    <Text fw={700} c="green">{importResult.imported} 筆</Text>
                  </div>
                )}
                {(importResult.failed !== undefined && importResult.failed > 0) && (
                  <div>
                    <Text size="xs" c="dimmed">失敗</Text>
                    <Text fw={700} c="red">{importResult.failed} 筆</Text>
                  </div>
                )}
              </Group>
              {importResult.errors && importResult.errors.length > 0 && (
                <>
                  <Divider />
                  <Text size="xs" fw={600} c="red">錯誤詳情：</Text>
                  <List size="xs" spacing={2}>
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <List.Item key={idx}>
                        <Text size="xs" c="red">{err}</Text>
                      </List.Item>
                    ))}
                    {importResult.errors.length > 5 && (
                      <List.Item>
                        <Text size="xs" c="dimmed">
                          ... 還有 {importResult.errors.length - 5} 項錯誤
                        </Text>
                      </List.Item>
                    )}
                  </List>
                </>
              )}
            </Stack>
          </Alert>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button variant="light" onClick={handleCloseImport}>
            {importResult ? '關閉' : '取消'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImportCSV}
              loading={uploading}
              disabled={!importFile}
              leftSection={<IconUpload size={16} />}
              variant="gradient"
              gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
              radius="xl"
            >
              開始匯入
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
