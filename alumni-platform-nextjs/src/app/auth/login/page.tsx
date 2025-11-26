'use client';

import { useState, useEffect } from 'react';
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
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import classes from './login.module.css';

const LOGIN_BACKGROUNDS = [
  '/1pUKi5OAcIzv.jpg',
  '/qkeRU7UuJgUz.jpg',
  '/V5NuOmCGmG2t.jpg',
  '/sRO91qLdH1e7.jpg',
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (LOGIN_BACKGROUNDS.length <= 1) {
      return;
    }

    const slideshow = setInterval(() => {
      setActiveSlide((index) => (index + 1) % LOGIN_BACKGROUNDS.length);
    }, 7000);

    return () => clearInterval(slideshow);
  }, []);

  const form = useForm({
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
      
      console.log('Login response:', response); // Debug log

      // V2 API 返回 access_token
      if (response && typeof response === 'object' && response.access_token && response.user) {
        setAuth(response.access_token, response.user);
        
        const userName = response.user?.profile?.display_name || 
                        response.user?.profile?.full_name || 
                        response.user?.email ||
                        '用戶';
        
        notifications.show({
          title: '登入成功',
          message: `歡迎回來，${userName}！`,
          color: 'green',
        });

        // 跳轉到首頁
        router.push('/');
        router.refresh();
      } else {
        throw new Error('登入響應格式錯誤，請稍後再試');
      }
    } catch (error) {
      notifications.show({
        title: '登入失敗',
        message: error instanceof Error ? error.message : '請檢查您的電子郵件和密碼',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className={classes.loginContainer}>
        {/* 背景輪播 */}
        <div className={classes.loginBackground}>
          {LOGIN_BACKGROUNDS.map((src, index) => (
            <div
              key={src}
              className={`${classes.loginSlide} ${index === activeSlide ? classes.isActive : ''}`}
            >
              <Image
                src={src}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
                priority={index === 0}
                unoptimized
              />
            </div>
          ))}
          <div className={classes.loginOverlay} />
        </div>

        {/* 登入內容 */}
        <div className={classes.loginContent}>
          <Container size={420}>
            <Paper className={classes.loginCard} shadow="xl" p={40} radius="xl">
              {/* Logo */}
              <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <Image
                  src="/logo-cit.png"
                  alt="NTUST-CIT Alumni Association"
                  width={180}
                  height={80}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Box>
              <Title
                ta="center"
                fw={700}
                mb="xs"
                className={classes.loginTitle}
              >
                色彩與照明科技研究所系友會
              </Title>
              <Text c="dimmed" size="sm" ta="center" mb="xl">
                NTUST-CIT Alumni Association
              </Text>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="電子郵件"
                    placeholder="請輸入您的電子郵件"
                    required
                    size="md"
                    {...form.getInputProps('email')}
                    classNames={{
                      input: classes.input,
                    }}
                  />

                  <PasswordInput
                    label="密碼"
                    placeholder="請輸入您的密碼"
                    required
                    size="md"
                    {...form.getInputProps('password')}
                    classNames={{
                      input: classes.input,
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    size="md"
                    loading={loading}
                    className={classes.loginBtn}
                  >
                    🚪 登入系友會
                  </Button>

                  <Text c="dimmed" size="sm" ta="center" mt="md">
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

              <Box className={classes.loginHelp} mt="lg">
                <Text size="xs" c="dimmed">
                  測試帳號：
                </Text>
                <Text size="xs" c="dimmed">
                  管理員：admin@example.com / admin123
                </Text>
                <Text size="xs" c="dimmed">
                  一般用戶：wang@example.com / password123
                </Text>
              </Box>
            </Paper>
          </Container>
        </div>
      </div>
    </ProtectedRoute>
  );
}


