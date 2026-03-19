'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Center, Container, Stack, Text, Button, ThemeIcon } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { isAuthenticated } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 確保只在客戶端執行
    setMounted(true);
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      
      if (requireAuth && !authenticated) {
        router.push('/auth/login');
      } else if (!requireAuth && authenticated) {
        router.push('/');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router, requireAuth]);

  // 服務端渲染時返回 null，避免 hydration 錯誤
  if (!mounted) {
    return null;
  }

  // 客戶端掛載後，顯示 loading 狀態
  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  // 權限檢查失敗：顯示友善的無權限提示
  if (requireAuth && !isAuth) {
    return (
      <Center h="100vh">
        <Container size={420}>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius="xl" variant="light" color="red">
              <IconLock size={40} />
            </ThemeIcon>
            <Text size="xl" fw={700} ta="center">
              您沒有權限存取此頁面
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              請先登入或確認您擁有足夠的權限
            </Text>
            <Button
              variant="light"
              radius="xl"
              size="md"
              onClick={() => router.push('/')}
            >
              返回首頁
            </Button>
          </Stack>
        </Container>
      </Center>
    );
  }

  if (!requireAuth && isAuth) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  return <>{children}</>;
}



