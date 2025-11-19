'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Center } from '@mantine/core';
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

  // 權限檢查失敗時返回 null
  if (requireAuth && !isAuth) {
    return null;
  }

  if (!requireAuth && isAuth) {
    return null;
  }

  return <>{children}</>;
}



