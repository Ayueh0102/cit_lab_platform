'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : '請輸入有效的電子郵件地址',
      password: (value) =>
        value.length >= 6 ? null : '密碼至少需要 6 個字符',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    try {
      const response = await api.auth.login(values.email, values.password);

      if (response.token && response.user) {
        setAuth(response.token, response.user);
        
        notifications.show({
          title: '登入成功',
          message: `歡迎回來，${response.user.name}！`,
          color: 'green',
        });

        router.push('/jobs');
        router.refresh();
      }
    } catch (error: any) {
      notifications.show({
        title: '登入失敗',
        message: error.message || '請檢查您的電子郵件和密碼',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Title ta="center" fw={700} mb="md">
        歡迎回來！
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        登入您的校友帳號
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="電子郵件"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
              key={form.key('email')}
            />

            <PasswordInput
              label="密碼"
              placeholder="您的密碼"
              required
              {...form.getInputProps('password')}
              key={form.key('password')}
            />

            <Button type="submit" fullWidth loading={loading}>
              登入
            </Button>

            <Text c="dimmed" size="sm" ta="center">
              還沒有帳號？{' '}
              <Anchor
                size="sm"
                component="button"
                type="button"
                onClick={() => router.push('/auth/register')}
              >
                立即註冊
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

