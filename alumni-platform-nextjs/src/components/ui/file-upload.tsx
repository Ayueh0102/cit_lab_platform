'use client';

import { useState, useRef } from 'react';
import {
  Button,
  Group,
  Text,
  Stack,
  Avatar,
  Progress,
  ActionIcon,
  Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconX,
  IconFile,
  IconPhoto,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileId: number) => void;
  accept?: string;
  maxSize?: number; // in MB
  relatedType?: string;
  relatedId?: number;
  label?: string;
  multiple?: boolean;
}

export function FileUpload({
  onUploadComplete,
  accept = 'image/*,application/pdf,.doc,.docx',
  maxSize = 5,
  relatedType,
  relatedId,
  label = '上傳檔案',
  multiple = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: number;
    name: string;
    url: string;
    type: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 檢查檔案大小
    if (file.size > maxSize * 1024 * 1024) {
      notifications.show({
        title: '檔案過大',
        message: `檔案大小不能超過 ${maxSize}MB`,
        color: 'red',
      });
      return;
    }

    await uploadFile(file);
    
    // 清除 input 值，允許重新選擇相同檔案
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const token = getToken();
      if (!token) {
        notifications.show({
          title: '未授權',
          message: '請先登入',
          color: 'red',
        });
        return;
      }

      // 模擬進度（實際應該使用 XMLHttpRequest 來追蹤真實進度）
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.files.upload(file, relatedType, relatedId, token);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedFile = {
        id: response.file.id,
        name: response.file.file_name,
        url: response.url,
        type: response.file.file_type,
      };

      setUploadedFiles((prev) => [...prev, uploadedFile]);
      
      if (onUploadComplete) {
        onUploadComplete(response.url, response.file.id);
      }

      notifications.show({
        title: '上傳成功',
        message: '檔案已成功上傳',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '上傳失敗',
        message: error instanceof Error ? error.message : '無法上傳檔案',
        color: 'red',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async (fileId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.files.deleteFile(fileId, token);
      
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      
      notifications.show({
        title: '已刪除',
        message: '檔案已成功刪除',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除檔案',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="sm">
      <Group>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          multiple={multiple}
        />
        <Button
          leftSection={<IconUpload size={16} />}
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          disabled={uploading}
        >
          {label}
        </Button>
      </Group>

      {uploading && (
        <Progress value={uploadProgress} size="sm" />
      )}

      {uploadedFiles.length > 0 && (
        <Stack gap="xs">
          {uploadedFiles.map((file) => (
            <Paper key={file.id} p="sm" withBorder>
              <Group justify="space-between">
                <Group gap="sm">
                  {file.type === 'image' ? (
                    <Avatar src={file.url} size={40} radius="md">
                      <IconPhoto size={20} />
                    </Avatar>
                  ) : (
                    <Avatar size={40} radius="md" color="blue">
                      <IconFile size={20} />
                    </Avatar>
                  )}
                  <div>
                    <Text size="sm" fw={500}>
                      {file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {file.type === 'image' ? '圖片' : '文件'}
                    </Text>
                  </div>
                </Group>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => handleRemove(file.id)}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

