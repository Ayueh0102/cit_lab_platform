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
  NumberInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      student_id: '',
      graduation_year: new Date().getFullYear(),
    },
    validate: {
      name: (value) =>
        value.length >= 2 ? null : '姓名至少需要 2 個字符',
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : '請輸入有效的電子郵件地址',
      password: (value) =>
        value.length >= 6 ? null : '密碼至少需要 6 個字符',
      confirmPassword: (value, values) =>
        value === values.password ? null : '密碼不一致',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = values;
      const response = await api.auth.register(registerData);

      notifications.show({
        title: '註冊成功',
        message: '請使用您的電子郵件和密碼登入',
        color: 'green',
      });

      router.push('/auth/login');
    } catch (error: any) {
      notifications.show({
        title: '註冊失敗',
        message: error.message || '請稍後再試',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Title ta="center" fw={700} mb="md">
        建立新帳號
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        加入校友平台
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="姓名"
              placeholder="您的姓名"
              required
              {...form.getInputProps('name')}
              key={form.key('name')}
            />

            <TextInput
              label="電子郵件"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
              key={form.key('email')}
            />

            <TextInput
              label="學號"
              placeholder="學號（選填）"
              {...form.getInputProps('student_id')}
              key={form.key('student_id')}
            />

            <NumberInput
              label="畢業年份"
              placeholder="畢業年份（選填）"
              min={1900}
              max={2100}
              {...form.getInputProps('graduation_year')}
              key={form.key('graduation_year')}
            />

            <PasswordInput
              label="密碼"
              placeholder="至少 6 個字符"
              required
              {...form.getInputProps('password')}
              key={form.key('password')}
            />

            <PasswordInput
              label="確認密碼"
              placeholder="再次輸入密碼"
              required
              {...form.getInputProps('confirmPassword')}
              key={form.key('confirmPassword')}
            />

            <Button type="submit" fullWidth loading={loading}>
              註冊
            </Button>

            <Text c="dimmed" size="sm" ta="center">
              已經有帳號了？{' '}
              <Anchor
                size="sm"
                component="button"
                type="button"
                onClick={() => router.push('/auth/login')}
              >
                立即登入
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

