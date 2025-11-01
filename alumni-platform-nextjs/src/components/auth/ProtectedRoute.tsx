'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { isAuthenticated } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
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

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (requireAuth && !isAuth) {
    return null;
  }

  if (!requireAuth && isAuth) {
    return null;
  }

  return <>{children}</>;
}



