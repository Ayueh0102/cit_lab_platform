'use client';

import {
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Title,
  Alert,
  Center,
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import {
  IconMessageCircle,
  IconInfoCircle,
} from '@tabler/icons-react';

export function AdminCommentsTab() {
  const router = useRouter();

  return (
    <Paper className="glass-card-soft" p="xl" radius="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={3} size="h4">
            <Group gap="xs">
              <IconMessageCircle size={24} />
              評論審核
            </Group>
          </Title>
        </Group>

        <Alert
          variant="light"
          color="blue"
          title="評論審核說明"
          icon={<IconInfoCircle size={16} />}
          radius="md"
        >
          <Text size="sm">
            目前評論審核功能整合在各文章詳情頁中。管理員可在文章頁面直接審核、回覆或刪除評論。
            請前往 CMS 文章管理頁面查看文章列表，點擊文章即可進入詳情頁審核評論。
          </Text>
        </Alert>

        <Center>
          <Button
            variant="gradient"
            gradient={{ from: '#a18cd1', to: '#fbc2eb', deg: 135 }}
            size="lg"
            radius="xl"
            leftSection={<IconMessageCircle size={20} />}
            onClick={() => router.push('/cms')}
          >
            前往 CMS 文章管理
          </Button>
        </Center>
      </Stack>
    </Paper>
  );
}
